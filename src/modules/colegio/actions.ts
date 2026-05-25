'use server'

import { supabase, supabaseAdmin } from '@/lib/supabase'
import { colegioSchema, cursoSchema, estudianteSchema } from './schema'
import { revalidatePath } from 'next/cache'

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

    // 2. Asociar el colegio al perfil del usuario actual y actualizar su rol a 'utp'
    const { error: profileError } = await supabaseAdmin
      .from('miutp_perfiles')
      .update({
        colegio_id: colegio.id,
        rol: 'utp',
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', userId)

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
