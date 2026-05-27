'use server'

import { supabase, supabaseAdmin } from '@/lib/supabase'
import { colegioSchema, cursoSchema, estudianteSchema } from './schema'
import { revalidatePath } from 'next/cache'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { registrarGeneracionIA } from '@/lib/langfuse'

// Inicializar instancia de Google Generative AI para Gemini
const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})

// Helper para formatear y sanitizar el RUT chileno (ej: "23.696.651 - 8" -> "23696651-8")
function formatRut(rutRaw: string): string {
  const clean = rutRaw.replace(/[^0-9kK]/g, '')
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1).toUpperCase()
  return `${body}-${dv}`
}

// Helper para separar Nombre Completo (ApellidoPaterno ApellidoMaterno Nombres) a Nombre y Apellido
function splitFullName(fullName: string): { nombre: string; apellido: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length >= 3) {
    // Patrón chileno común: ApellidoPaterno ApellidoMaterno Nombres...
    const apellido = parts.slice(0, 2).join(' ')
    const nombre = parts.slice(2).join(' ')
    return { nombre, apellido }
  } else if (parts.length === 2) {
    return { nombre: parts[1], apellido: parts[0] }
  } else {
    return { nombre: fullName, apellido: '' }
  }
}

// 1. Guardar Onboarding de Colegio
export async function saveOnboarding(userId: string, data: {
  nombre: string
  rbd: string
  tipo: 'TP' | 'HC'
  dependencia: string
  comuna: string
}) {
  try {
    // Validar datos de entrada con Zod
    const validated = colegioSchema.parse(data)

    // 1. Insertar el colegio usando el rol de administrador para garantizar creación
    const { data: colegio, error: colError } = await supabaseAdmin
      .from('miutp_colegios')
      .insert({
        nombre: validated.nombre,
        rbd: validated.rbd,
        tipo: validated.tipo,
        dependencia: validated.dependencia,
        comuna: validated.comuna,
      })
      .select()
      .single()

    if (colError || !colegio) {
      throw new Error(`Error al registrar el colegio: ${colError?.message}`)
    }

    // Fetch user details from Auth to ensure we have a name if the profile doesn't exist
    const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(userId)
    const nombre = userAuth?.user?.user_metadata?.nombre || userAuth?.user?.user_metadata?.full_name || userAuth?.user?.email || 'Usuario'

    // 2. Asociar el colegio al perfil del usuario actual (usando upsert para asegurar su creación si no existe)
    const { error: profileError } = await supabaseAdmin
      .from('miutp_perfiles')
      .upsert({
        id: userId,
        nombre: nombre,
        colegio_id: colegio.id,
        rol: 'utp',
        actualizado_en: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      throw new Error(`Error al actualizar perfil de usuario: ${profileError.message}`)
    }

    revalidatePath('/')
    return { success: true, colegio }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido en el servidor' }
  }
}

// 2. Obtener Colegio del usuario actual
export async function getColegio(colegioId: string) {
  try {
    const { data, error } = await supabase
      .from('miutp_colegios')
      .select('*')
      .eq('id', colegioId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 3. Crear nuevo Curso
export async function createCurso(colegioId: string, data: {
  nivel: string
  letra: string
  ano_academico: number
}) {
  try {
    const validated = cursoSchema.parse(data)

    const { data: curso, error } = await supabaseAdmin
      .from('miutp_cursos')
      .insert({
        colegio_id: colegioId,
        nivel: validated.nivel,
        letra: validated.letra,
        ano_academico: validated.ano_academico,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, curso }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 4. Obtener Cursos de un Colegio
export async function getCursos(colegioId: string) {
  try {
    const { data, error } = await supabase
      .from('miutp_cursos')
      .select('*')
      .eq('colegio_id', colegioId)
      .order('nivel', { ascending: true })
      .order('letra', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// 5. Importación masiva de Alumnos desde CSV (SIGE)
export async function importarAlumnos(cursoId: string, anoAcademico: number, csvContent: string) {
  try {
    const lines = csvContent.split(/\r?\n/)
    const estudiantesParaInsertar: any[] = []

    let headerFound = false
    let lineIndex = 0

    for (const line of lines) {
      lineIndex++
      const row = line.split(',')
      
      // Saltar líneas vacías
      if (row.length === 0 || row.every(cell => cell.trim() === '')) {
        continue
      }

      // Buscar cabecera de datos
      if (!headerFound) {
        // La cabecera tiene columnas como "N°", "Nombre", "Rut", "Género"
        const hasRut = row.some(cell => cell.toLowerCase().includes('rut'))
        const hasNombre = row.some(cell => cell.toLowerCase().includes('nombre'))
        if (hasRut && hasNombre) {
          headerFound = true
        }
        continue
      }

      // Procesar línea de estudiante
      // Estructura esperada en base a: N°,N° Mat,Nombre,Rut,Género,Ingeso,Retiro
      // ej: 1,120,Alfaro Barraza Monserrat Joaquina,23.696.651 - 8,F,,
      if (row.length >= 5) {
        const nombreCompleto = row[2]?.trim()
        const rutRaw = row[3]?.trim()
        const generoRaw = row[4]?.trim()?.toUpperCase()

        if (!nombreCompleto || !rutRaw) {
          continue // Saltar si no hay datos esenciales
        }

        const rutClean = formatRut(rutRaw)
        const { nombre, apellido } = splitFullName(nombreCompleto)
        
        let genero: 'M' | 'F' | 'O' | null = null
        if (generoRaw === 'M' || generoRaw === 'F') {
          genero = generoRaw
        } else if (generoRaw) {
          genero = 'O'
        }

        // Validar registro con Zod
        const studentValidated = estudianteSchema.parse({
          rut: rutClean,
          nombre,
          apellido,
          genero
        })

        estudiantesParaInsertar.push(studentValidated)
      }
    }

    if (estudiantesParaInsertar.length === 0) {
      throw new Error('No se encontraron estudiantes válidos en el archivo. Verifica el formato del CSV.')
    }

    let insertadosCount = 0
    let matriculadosCount = 0

    // Ejecutamos transacciones lógicas en lote usando supabaseAdmin
    for (const est of estudiantesParaInsertar) {
      // 1. Upsert estudiante (si ya existe por RUT, se actualiza nombre/apellido)
      const { data: estudiante, error: estError } = await supabaseAdmin
        .from('miutp_estudiantes')
        .upsert(
          { rut: est.rut, nombre: est.nombre, apellido: est.apellido, genero: est.genero },
          { onConflict: 'rut' }
        )
        .select()
        .single()

      if (estError || !estudiante) {
        console.error(`Error al insertar estudiante con RUT ${est.rut}:`, estError?.message)
        continue
      }

      insertadosCount++

      // 2. Matricular estudiante en el curso asignado
      const { error: matError } = await supabaseAdmin
        .from('miutp_matriculas')
        .upsert(
          {
            estudiante_id: estudiante.id,
            curso_id: cursoId,
            ano_academico: anoAcademico,
            activo: true
          },
          { onConflict: 'estudiante_id,curso_id,ano_academico' }
        )

      if (matError) {
        console.error(`Error al matricular estudiante ${estudiante.id} en curso ${cursoId}:`, matError.message)
        continue
      }

      matriculadosCount++
    }

    revalidatePath('/dashboard')
    return {
      success: true,
      totalProcesados: estudiantesParaInsertar.length,
      insertados: insertadosCount,
      matriculados: matriculadosCount
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido al importar estudiantes' }
  }
}

// 6. Obtener lista de todos los colegios registrados
export async function getColegiosList() {
  try {
    const { data, error } = await supabaseAdmin
      .from('miutp_colegios')
      .select('id, nombre, rbd, comuna, tipo')
      .order('nombre', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener listado de colegios' }
  }
}

// 7. Guardar Onboarding para Profesores
export async function saveOnboardingProfesorColegio(userId: string, colegioId: string) {
  try {
    // Fetch user details from Auth to ensure we have a name if the profile doesn't exist
    const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(userId)
    const nombre = userAuth?.user?.user_metadata?.nombre || userAuth?.user?.user_metadata?.full_name || userAuth?.user?.email || 'Usuario'

    // 2. Asociar el colegio y el rol 'profesor' al perfil del usuario (usando upsert)
    const { error: profileError } = await supabaseAdmin
      .from('miutp_perfiles')
      .upsert({
        id: userId,
        nombre: nombre,
        colegio_id: colegioId,
        rol: 'profesor',
        actualizado_en: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      throw new Error(`Error al actualizar el perfil del profesor: ${profileError.message}`)
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error desconocido al registrar profesor' }
  }
}

// 8. Cargar estándares de aprendizaje predeterminados (Mineduc SIMCE 2 Medio)
export async function cargarEstandaresPredeterminados() {
  try {
    // 8.1 Listado oficial de Objetivos de Aprendizaje (Lectura y Matemática)
    const objetivos = [
      // Lectura
      { codigo: 'OA 2 (Lectura)', descripcion: 'Reflexionar sobre el efecto de imágenes, gráficos, tablas y otros recursos gráficos e iconográficos en los textos leídos.', eje_tematico: 'Lectura' },
      { codigo: 'OA 8 (Lectura)', descripcion: 'Formular una interpretación de los textos literarios leídos o vistos, analizando conflictos, personajes, símbolos, prejuicios y creencias.', eje_tematico: 'Lectura' },
      { codigo: 'OA 10 (Lectura)', descripcion: 'Analizar y evaluar críticamente textos de medios de comunicación (noticias, reportajes, cartas, columnas) evaluando veracidad y sesgo.', eje_tematico: 'Lectura' },
      { codigo: 'OA 25 (Lectura)', descripcion: 'Evaluar textos escritos de carácter argumentativo (ensayos, columnas) para fundamentar opiniones de manera crítica y autónoma.', eje_tematico: 'Lectura' },
      // Matemática
      { codigo: 'OA 1 (Matemática)', descripcion: 'Realizar cálculos y estimaciones que involucren operaciones con números reales, aproximaciones y propiedades de potencias.', eje_tematico: 'Números' },
      { codigo: 'OA 2 (Matemática)', descripcion: 'Mostrar que comprenden las relaciones entre potencias de exponente racional, raíces enésimas y logaritmos, y resolver problemas.', eje_tematico: 'Álgebra y Funciones' },
      { codigo: 'OA 3 (Matemática)', descripcion: 'Resolver problemas lineales y modelar situaciones utilizando sistemas de ecuaciones lineales de 2x2 en diversos contextos.', eje_tematico: 'Álgebra y Funciones' },
      { codigo: 'OA 8 (Matemática)', descripcion: 'Comprender el concepto de variable aleatoria y aplicar el cálculo de probabilidades mediante modelos teóricos y simulaciones.', eje_tematico: 'Probabilidad y Estadística' }
    ]

    // 8.2 Listado de Habilidades Cognitivas SIMCE
    const habilidades = [
      // Lectura
      { nombre: 'Localizar (Lectura)', descripcion: 'Identificar y extraer información explícita, datos aislados o fragmentos textuales específicos.' },
      { nombre: 'Interpretar (Lectura)', descripcion: 'Integrar y relacionar partes de un texto, sintetizar ideas globales y realizar inferencias sobre intenciones o sentidos implícitos.' },
      { nombre: 'Reflexionar (Lectura)', descripcion: 'Evaluar críticamente la forma o contenido del texto en relación con la experiencia y conocimientos propios del lector.' },
      // Matemática
      { nombre: 'Conocer (Matemática)', descripcion: 'Reconocer y recordar conceptos, definiciones básicas, propiedades, simbología y algoritmos conocidos.' },
      { nombre: 'Aplicar (Matemática)', descripcion: 'Utilizar conceptos, fórmulas y procedimientos matemáticos para resolver problemas rutinarios.' },
      { nombre: 'Argumentar (Matemática)', descripcion: 'Justificar conclusiones, validar procedimientos, conjeturar soluciones y analizar casos en problemas complejos o no rutinarios.' }
    ]

    // Cargar en la base de datos de manera atómica
    // Objetivos de aprendizaje
    for (const obj of objetivos) {
      const { error: objError } = await supabaseAdmin
        .from('miutp_objetivos_aprendizaje')
        .upsert(obj, { onConflict: 'codigo' })

      if (objError) {
        throw new Error(`Error cargando Objetivo ${obj.codigo}: ${objError.message}`)
      }
    }

    // Habilidades
    for (const hab of habilidades) {
      const { error: habError } = await supabaseAdmin
        .from('miutp_habilidades')
        .upsert(hab, { onConflict: 'nombre' })

      if (habError) {
        throw new Error(`Error cargando Habilidad ${hab.nombre}: ${habError.message}`)
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al cargar los estándares Mineduc' }
  }
}

// 9. Obtener los estándares de aprendizaje cargados (OAs y habilidades)
export async function getEstandaresCargados() {
  try {
    const { data: objetivos, error: objError } = await supabaseAdmin
      .from('miutp_objetivos_aprendizaje')
      .select('*')
      .order('codigo', { ascending: true })

    if (objError) throw objError

    const { data: habilidades, error: habError } = await supabaseAdmin
      .from('miutp_habilidades')
      .select('*')
      .order('nombre', { ascending: true })

    if (habError) throw habError

    return {
      success: true,
      objetivos: objetivos || [],
      habilidades: habilidades || []
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener los estándares cargados' }
  }
}

// 10. Estructurar programa de estudio libre con IA (Gemini)
export async function estructurarProgramaConIA(textoPrograma: string) {
  try {
    if (!textoPrograma || textoPrograma.trim().length === 0) {
      return { success: false, error: 'El texto del programa de estudio está vacío.' }
    }

    const { object, usage } = await generateObject({
      model: googleAI('gemini-2.5-flash'),
      schema: z.object({
        objetivos: z.array(z.object({
          codigo: z.string().describe('Código abreviado único del objetivo, ejemplo: OA 1, OA 8 (Lectura), etc. Si no tiene código, invéntalo correlativamente o según el tema (ej: OA 10).'),
          descripcion: z.string().describe('La descripción clara y completa del Objetivo de Aprendizaje.'),
          eje_tematico: z.string().describe('El eje temático o asignatura a la que pertenece, ejemplo: Lectura, Matemática, Álgebra, Geometría, Reflexión, etc.')
        })),
        habilidades: z.array(z.object({
          nombre: z.string().describe('Nombre de la habilidad cognitiva evaluada, ejemplo: Localizar, Interpretar, Reflexionar, Argumentar, Resolver Problemas.'),
          descripcion: z.string().describe('Explicación detallada de lo que significa esta habilidad y cómo se demuestra.')
        }))
      }),
      prompt: `Analiza el siguiente texto de un programa de estudio o currículum académico chileno y extrae de manera estructurada todos los Objetivos de Aprendizaje (OAs) y las Habilidades Cognitivas asociadas. 
      Intenta agruparlos según los ejes temáticos correspondientes. Si en el texto no se mencionan explícitamente códigos de OAs, asígnale códigos descriptivos razonables (por ejemplo OA 1, OA 2...).
      
      Texto del programa a estructurar:
      """
      ${textoPrograma}
      """`
    })

    // Registrar en Langfuse
    await registrarGeneracionIA({
      traceName: 'estructurar-programa-texto',
      generationName: 'parse-curriculum-text',
      model: 'gemini-2.5-flash',
      input: textoPrograma,
      output: object,
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    })

    return { 
      success: true, 
      objetivos: object.objetivos, 
      habilidades: object.habilidades 
    }
  } catch (error: any) {
    console.error('Error al estructurar programa con IA:', error)
    return { success: false, error: error.message || 'Error interno al procesar con IA Gemini.' }
  }
}

// 10.5 Estructurar documento (PDF/Imagen) con IA (Gemini)
export async function estructurarDocumentoConIA(fileBase64: string, mimeType: string) {
  try {
    if (!fileBase64) {
      return { success: false, error: 'El archivo está vacío o es inválido.' }
    }

    // Limpiar el prefijo dataUrl si existe (ej: "data:application/pdf;base64,")
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '')
    const fileBuffer = Buffer.from(cleanBase64, 'base64')

    // 1. Intentar crear el bucket si no existe
    try {
      await supabaseAdmin.storage.createBucket('documentos', { public: true })
    } catch (bucketErr) {
      // Ignorar error si ya existe el bucket
    }

    // 2. Subir el archivo a Supabase Storage
    const fileExt = mimeType.split('/')[1] || 'pdf'
    const fileName = `estandares_${Date.now()}.${fileExt}`
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('documentos')
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true
      })

    if (uploadErr) {
      console.error('Error al subir a Supabase Storage:', uploadErr)
    }

    let publicUrl = ''
    if (uploadData) {
      const { data: urlData } = supabaseAdmin.storage
        .from('documentos')
        .getPublicUrl(fileName)
      if (urlData) {
        publicUrl = urlData.publicUrl
      }
    }

    // 3. Procesar y estructurar con IA Gemini
    const { object, usage } = await generateObject({
      model: googleAI('gemini-2.5-flash'),
      schema: z.object({
        nivel_educativo: z.string().describe('Nivel educativo del programa, ej: 2 Medio, 1 Medio, 8 Basico...'),
        asignatura: z.string().describe('Asignatura del programa, ej: Lectura, Matemática, Ciencias Naturales...'),
        objetivos: z.array(z.object({
          codigo: z.string().describe('Código abreviado único del objetivo, ejemplo: OA 1, OA 8 (Lectura), etc. Si no tiene código, invéntalo correlativamente o según el tema (ej: OA 10).'),
          descripcion: z.string().describe('La descripción clara y completa del Objetivo de Aprendizaje.'),
          eje_tematico: z.string().describe('El eje temático o asignatura a la que pertenece, ejemplo: Lectura, Matemática, Álgebra, Geometría, Reflexión, etc.')
        })),
        habilidades: z.array(z.object({
          nombre: z.string().describe('Nombre de la habilidad cognitiva evaluada, ejemplo: Localizar, Interpretar, Reflexionar, Argumentar, Resolver Problemas.'),
          descripcion: z.string().describe('Explicación detallada de lo que significa esta habilidad y cómo se demuestra.')
        }))
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analiza el siguiente documento adjunto (que es un programa de estudios, bases curriculares o estándares de aprendizaje del ministerio Mineduc). 
              Extrae de manera estructurada el nivel educativo, la asignatura, todos los Objetivos de Aprendizaje (OAs) y las Habilidades Cognitivas asociadas. 
              Intenta agruparlos según los ejes temáticos correspondientes. Si en el texto no se mencionan explícitamente códigos de OAs, asígnale códigos descriptivos de manera lógica (por ejemplo OA 1, OA 2...).`
            },
            {
              type: 'file',
              data: fileBuffer,
              mediaType: mimeType
            }
          ]
        }
      ]
    })

    // Registrar en Langfuse
    await registrarGeneracionIA({
      traceName: 'estructurar-programa-pdf',
      generationName: 'parse-curriculum-pdf',
      model: 'gemini-2.5-flash',
      input: { mimeType, fileName, fileSize: fileBuffer.length },
      output: object,
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    })

    // 4. Guardar metadatos en la tabla miutp_estandares_aprendizaje
    const { error: dbErr } = await supabaseAdmin
      .from('miutp_estandares_aprendizaje')
      .insert({
        nivel_educativo: object.nivel_educativo || '2 Medio',
        asignatura: object.asignatura || 'Lectura',
        descripcion: `Estándares cargados mediante archivo PDF con IA. URL persistente: ${publicUrl || 'N/A'}`
      })

    if (dbErr) {
      console.error('Error al registrar estándar en base de datos:', dbErr)
    }

    return { 
      success: true, 
      objetivos: object.objetivos, 
      habilidades: object.habilidades,
      publicUrl,
      nivel: object.nivel_educativo,
      asignatura: object.asignatura
    }
  } catch (error: any) {
    console.error('Error al estructurar documento con IA:', error)
    return { success: false, error: error.message || 'Error interno al procesar el documento con IA Gemini.' }
  }
}

// 11. Guardar estándares personalizados en lote (upsert)
export async function guardarEstandaresPersonalizados(objetivos: any[], habilidades: any[]) {
  try {
    // 1. Guardar Objetivos
    if (objetivos.length > 0) {
      const objetivosSanitizados = objetivos.map(obj => ({
        codigo: obj.codigo,
        descripcion: obj.descripcion,
        eje_tematico: obj.eje_tematico
      }))

      const { error: objError } = await supabaseAdmin
        .from('miutp_objetivos_aprendizaje')
        .upsert(objetivosSanitizados, { onConflict: 'codigo' })

      if (objError) throw objError
    }

    // 2. Guardar Habilidades
    if (habilidades.length > 0) {
      const habilidadesSanitizadas = habilidades.map(hab => ({
        nombre: hab.nombre,
        descripcion: hab.descripcion
      }))

      const { error: habError } = await supabaseAdmin
        .from('miutp_habilidades')
        .upsert(habilidadesSanitizadas, { onConflict: 'nombre' })

      if (habError) throw habError
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error('Error al guardar estándares personalizados:', error)
    return { success: false, error: error.message || 'Error al guardar los estándares' }
  }
}

// 12. Guardar un estándar individual (crear o editar manual)
export async function guardarEstandarIndividual(tipo: 'objetivo' | 'habilidad', data: any) {
  try {
    if (tipo === 'objetivo') {
      const row: any = {
        codigo: data.codigo,
        descripcion: data.descripcion,
        eje_tematico: data.eje_tematico
      }
      if (data.id) {
        row.id = data.id
      }
      
      const { error } = await supabaseAdmin
        .from('miutp_objetivos_aprendizaje')
        .upsert(row, { onConflict: 'codigo' })

      if (error) throw error
    } else {
      const row: any = {
        nombre: data.nombre,
        descripcion: data.descripcion
      }
      if (data.id) {
        row.id = data.id
      }

      const { error } = await supabaseAdmin
        .from('miutp_habilidades')
        .upsert(row, { onConflict: 'nombre' })

      if (error) throw error
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error(`Error al guardar estándar individual (${tipo}):`, error)
    return { success: false, error: error.message || 'Error al guardar el registro' }
  }
}

// 13. Eliminar estándar (Objetivo o Habilidad) por ID
export async function eliminarEstandar(tipo: 'objetivo' | 'habilidad', id: string) {
  try {
    if (tipo === 'objetivo') {
      const { error } = await supabaseAdmin
        .from('miutp_objetivos_aprendizaje')
        .delete()
        .eq('id', id)

      if (error) throw error
    } else {
      const { error } = await supabaseAdmin
        .from('miutp_habilidades')
        .delete()
        .eq('id', id)

      if (error) throw error
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: any) {
    console.error(`Error al eliminar estándar (${tipo}):`, error)
    return { success: false, error: error.message || 'Error al eliminar el registro. Podría estar vinculado a preguntas de pruebas existentes.' }
  }
}


