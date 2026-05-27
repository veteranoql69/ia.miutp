'use server'

import { generateText, generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
})
import { z } from 'zod'
import { obtenerPromptLangfuse, registrarGeneracionIA } from '@/lib/langfuse'

const ACCEPTED_MIME = 'application/pdf'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function validarPdf(file: File): string | null {
  if (file.type === DOCX_MIME) {
    return 'El archivo es un documento Word (.docx). Por favor expórtalo como PDF desde Word o Google Docs (Archivo → Guardar como PDF) y vuelve a intentarlo.'
  }
  if (file.type !== ACCEPTED_MIME) {
    return `Solo se aceptan archivos PDF. Tipo recibido: ${file.type}`
  }
  return null
}

// 1. Extraer Objetivos de Aprendizaje de un PDF
export async function extractObjectivesAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null
    if (!file) return { success: false, error: 'No se recibió ningún archivo.' }

    const validationError = validarPdf(file)
    if (validationError) return { success: false, error: validationError }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // 1. Obtener prompt desde Langfuse
    const { promptText, model } = await obtenerPromptLangfuse('extract-objectives-prompt')

    // 2. Ejecutar LLM con Vision API
    const { object, usage } = await generateObject({
      model: google(model),
      system: promptText,
      schema: z.object({
        asignatura: z.string().describe('Nombre de la asignatura (ej. Lenguaje, Matemática)'),
        nivel: z.string().describe('Nivel escolar (ej. 4° Básico, 2° Medio)'),
        objetivos: z.array(z.object({
          codigo: z.string().describe('Código del OA (ej. OA1, OA 12)'),
          descripcion: z.string().describe('Descripción del Objetivo de Aprendizaje'),
          habilidades: z.array(z.string()).describe('Lista de habilidades asociadas (si aplica)')
        }))
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: fileBuffer.toString('base64'),
              mediaType: 'application/pdf',
            }
          ]
        }
      ]
    })

    // 3. Registrar en Langfuse
    await registrarGeneracionIA({
      traceName: 'Extraccion_Objetivos',
      generationName: 'Gemini_Extraction',
      model,
      input: { fileName: file.name, fileSize: file.size },
      output: object,
      promptTokens: (usage as any).inputTokens ?? (usage as any).promptTokens,
      completionTokens: (usage as any).outputTokens ?? (usage as any).completionTokens,
      totalTokens: (usage as any).totalTokens
    })

    return { success: true, data: object }
  } catch (error: any) {
    console.error('Error in extractObjectivesAction:', error)
    return { success: false, error: error.message }
  }
}

import * as xlsx from 'xlsx'

// 2. Validar lista de alumnos (Excel) con la Letra seleccionada
export async function validateStudentListAction(formData: FormData, expectedLetra: string) {
  try {
    const file = formData.get('file') as File | null
    if (!file) return { success: false, error: 'No se recibió ningún archivo.' }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Parse Excel
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const studentsJson = xlsx.utils.sheet_to_json(worksheet)

    const { promptText, model } = await obtenerPromptLangfuse('validate-students-prompt', {
      expectedLetra,
      studentsJson: JSON.stringify(studentsJson).substring(0, 12000),
    })

    const { object, usage } = await generateObject({
      model: google(model),
      prompt: promptText,
      schema: z.object({
        isValid: z.boolean().describe('¿Corresponden estos alumnos al curso con la letra indicada?'),
        detectedLetra: z.string().nullable().describe('Letra detectada en el documento, si hay alguna.'),
        reason: z.string().describe('Explicación breve de la validación'),
        alumnos: z.array(z.object({
          rut: z.string().nullable().describe('RUT en formato XX.XXX.XXX-X, null si no aparece'),
          nombre_completo: z.string().describe('Nombre y apellido completo del alumno'),
        })).describe('Lista de alumnos extraídos del documento, ignorando encabezados y filas vacías'),
      })
    })

    await registrarGeneracionIA({
      traceName: 'Validacion_Alumnos',
      generationName: 'Gemini_Validation',
      model,
      input: { fileName: file.name, fileSize: file.size, firstRecords: studentsJson.slice(0, 5) },
      output: object,
      promptTokens: (usage as any).inputTokens ?? (usage as any).promptTokens,
      completionTokens: (usage as any).outputTokens ?? (usage as any).completionTokens,
      totalTokens: (usage as any).totalTokens
    })

    return { success: true, data: { ...object, parsedStudents: object.alumnos } }
  } catch (error: any) {
    console.error('Error in validateStudentListAction:', error)
    return { success: false, error: error.message }
  }
}

// 3. Extraer Pauta de Corrección
export async function extractPautaAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null
    if (!file) return { success: false, error: 'No se recibió ningún archivo.' }

    const validationError = validarPdf(file)
    if (validationError) return { success: false, error: validationError }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { promptText, model } = await obtenerPromptLangfuse('extract-pauta-prompt')

    const { object, usage } = await generateObject({
      model: google(model),
      system: promptText,
      schema: z.object({
        preguntas: z.array(z.object({
          numero: z.number().describe('Número de la pregunta'),
          alternativaCorrecta: z.string().describe('Alternativa correcta (A, B, C, D, E)'),
          habilidad: z.string().nullable().describe('Habilidad evaluada'),
          objetivo: z.string().nullable().describe('Objetivo de aprendizaje asociado')
        }))
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: fileBuffer.toString('base64'),
              mediaType: 'application/pdf',
            }
          ]
        }
      ]
    })

    await registrarGeneracionIA({
      traceName: 'Extraccion_Pauta',
      generationName: 'Gemini_Pauta',
      model,
      input: { fileName: file.name, fileSize: file.size },
      output: object,
      promptTokens: (usage as any).inputTokens ?? (usage as any).promptTokens,
      completionTokens: (usage as any).outputTokens ?? (usage as any).completionTokens,
      totalTokens: (usage as any).totalTokens
    })

    return { success: true, data: object }
  } catch (error: any) {
    console.error('Error in extractPautaAction:', error)
    return { success: false, error: error.message }
  }
}

import { supabaseAdmin } from '@/lib/supabase'

// 4. Guardar toda la configuración finalizada en Supabase
export async function setupSimceToolAction(data: {
  nombre: string;
  nivel: string;
  letra: string;
  asignatura: string;
  oasRaw: any;
  studentsRaw: any[];
  preguntasEnsayoRaw: any[];
  pautaRaw: any[];
}) {
  try {
    // 1. Insertar el Ensayo
    const { data: ensayo, error: ensayoError } = await supabaseAdmin
      .from('miutp_simce_ensayos')
      .insert({
        nombre: data.nombre,
        nivel: data.nivel,
        letra: data.letra,
        asignatura: data.asignatura,
        catalogo_ia: data.oasRaw,
        estado: 'configurado'
      })
      .select('id')
      .single()

    if (ensayoError) throw new Error(`Error al crear ensayo: ${ensayoError.message}`)
    const ensayoId = ensayo.id

    // 2. Insertar Objetivos extraídos
    if (data.oasRaw?.objetivos && data.oasRaw.objetivos.length > 0) {
      const objetivosToInsert = data.oasRaw.objetivos.map((o: any) => ({
        ensayo_id: ensayoId,
        codigo: o.codigo,
        descripcion: o.descripcion
      }))
      const { error: objError } = await supabaseAdmin.from('miutp_simce_objetivos').insert(objetivosToInsert)
      if (objError) console.error('Error insertando objetivos:', objError)
    }

    // 3. Insertar Nómina de Alumnos (Intentar extraer rut y nombre dinámicamente)
    if (data.studentsRaw && data.studentsRaw.length > 0) {
      const alumnosToInsert = data.studentsRaw.map((s: any) => {
        // Buscar claves comunes para rut y nombre
        const rutKey = Object.keys(s).find(k => k.toLowerCase().includes('rut'))
        const nombreKey = Object.keys(s).find(k => k.toLowerCase().includes('nombre') || k.toLowerCase().includes('alumno'))
        return {
          ensayo_id: ensayoId,
          rut: rutKey ? String(s[rutKey]) : null,
          nombre_completo: nombreKey ? String(s[nombreKey]) : (Object.values(s)[0] || 'Desconocido')
        }
      })
      const { error: alumError } = await supabaseAdmin.from('miutp_simce_alumnos').insert(alumnosToInsert)
      if (alumError) console.error('Error insertando alumnos:', alumError)
    }

    // 3b. Insertar Preguntas del Ensayo (texto de cada pregunta)
    if (data.preguntasEnsayoRaw && data.preguntasEnsayoRaw.length > 0) {
      const preguntasToInsert = data.preguntasEnsayoRaw.map((p: any) => ({
        ensayo_id: ensayoId,
        numero: p.numero,
        enunciado: p.enunciado,
      }))
      const { error: pregError } = await supabaseAdmin.from('miutp_simce_preguntas_ensayo').insert(preguntasToInsert)
      if (pregError) console.error('Error insertando preguntas del ensayo:', pregError)
    }

    // 4. Insertar Pauta de Corrección
    if (data.pautaRaw && data.pautaRaw.length > 0) {
      const pautasToInsert = data.pautaRaw.map((p: any) => ({
        ensayo_id: ensayoId,
        numero_pregunta: p.numero,
        alternativa_correcta: p.alternativaCorrecta,
        habilidad_evaluada: p.habilidad,
        oa_codigo: p.objetivo
      }))
      const { error: pautaError } = await supabaseAdmin.from('miutp_simce_pautas').insert(pautasToInsert)
      if (pautaError) console.error('Error insertando pauta:', pautaError)
    }

    return { success: true, ensayoId }
  } catch (error: any) {
    console.error('Error in setupSimceToolAction:', error)
    return { success: false, error: error.message }
  }
}

// 5. Extraer preguntas del ensayo + título desde PDF
export async function extractPreguntasEnsayoAction(formData: FormData) {
  try {
    const file = formData.get('file') as File | null
    if (!file) return { success: false, error: 'No se recibió ningún archivo.' }

    const validationError = validarPdf(file)
    if (validationError) return { success: false, error: validationError }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { object, usage } = await generateObject({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analiza este documento de ensayo SIMCE chileno.
Extrae:
1. El título oficial del ensayo (ej: "Ensayo SIMCE Lectura 2° Medio 2025").
2. Todas las preguntas con su número y enunciado completo (incluyendo el texto de cada alternativa si corresponde).
Si el título no es explícito, genera uno descriptivo basado en el contenido (nivel, asignatura, año si aparece).`,
            },
            {
              type: 'file',
              data: fileBuffer,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
      schema: z.object({
        titulo: z.string().describe('Título oficial o descriptivo del ensayo'),
        preguntas: z.array(
          z.object({
            numero: z.number().describe('Número de la pregunta'),
            enunciado: z.string().describe('Texto completo de la pregunta con sus alternativas'),
          })
        ),
      }),
    })

    await registrarGeneracionIA({
      traceName: 'Extraccion_Preguntas_Ensayo',
      generationName: 'Gemini_Preguntas',
      model: 'gemini-2.5-flash',
      input: { fileName: file.name, fileSize: file.size },
      output: object,
      promptTokens: (usage as any).inputTokens ?? (usage as any).promptTokens,
      completionTokens: (usage as any).outputTokens ?? (usage as any).completionTokens,
      totalTokens: (usage as any).totalTokens,
    })

    return { success: true, data: object }
  } catch (error: any) {
    console.error('Error in extractPreguntasEnsayoAction:', error)
    return { success: false, error: error.message }
  }
}

// 6. Listar ensayos SIMCE con conteo de elementos configurados
export async function getEnsayosSimce() {
  try {
    const { data: ensayos, error } = await supabaseAdmin
      .from('miutp_simce_ensayos')
      .select('id, nombre, nivel, letra, asignatura, estado, fecha_creacion')
      .order('fecha_creacion', { ascending: false })

    if (error) throw error

    // Contar elementos relacionados para cada ensayo
    const ensayosConConteo = await Promise.all(
      (ensayos || []).map(async (e: any) => {
        const [{ count: nObjetivos }, { count: nAlumnos }, { count: nPreguntas }, { count: nPautas }, { count: nRespuestas }] =
          await Promise.all([
            supabaseAdmin.from('miutp_simce_objetivos').select('*', { count: 'exact', head: true }).eq('ensayo_id', e.id),
            supabaseAdmin.from('miutp_simce_alumnos').select('*', { count: 'exact', head: true }).eq('ensayo_id', e.id),
            supabaseAdmin.from('miutp_simce_preguntas_ensayo').select('*', { count: 'exact', head: true }).eq('ensayo_id', e.id),
            supabaseAdmin.from('miutp_simce_pautas').select('*', { count: 'exact', head: true }).eq('ensayo_id', e.id),
            supabaseAdmin.from('miutp_simce_respuestas').select('*', { count: 'exact', head: true }).eq('ensayo_id', e.id),
          ])
        return {
          ...e,
          n_objetivos: nObjetivos ?? 0,
          n_alumnos: nAlumnos ?? 0,
          n_preguntas: nPreguntas ?? 0,
          n_pautas: nPautas ?? 0,
          n_respuestas: nRespuestas ?? 0,
        }
      })
    )

    return { success: true, data: ensayosConConteo }
  } catch (error: any) {
    console.error('Error in getEnsayosSimce:', error)
    return { success: false, error: error.message }
  }
}

// 7. Obtener detalle completo de un ensayo (para mini-dashboard)
export async function getEnsayoDetail(ensayoId: string) {
  try {
    const [
      { data: ensayo },
      { data: objetivos },
      { data: preguntas },
      { data: pautas },
      { data: alumnos },
      { count: nRespuestas },
    ] = await Promise.all([
      supabaseAdmin.from('miutp_simce_ensayos').select('*').eq('id', ensayoId).single(),
      supabaseAdmin.from('miutp_simce_objetivos').select('codigo, descripcion').eq('ensayo_id', ensayoId).order('codigo'),
      supabaseAdmin.from('miutp_simce_preguntas_ensayo').select('numero, enunciado').eq('ensayo_id', ensayoId).order('numero'),
      supabaseAdmin.from('miutp_simce_pautas').select('numero_pregunta, alternativa_correcta, habilidad_evaluada, oa_codigo').eq('ensayo_id', ensayoId).order('numero_pregunta'),
      supabaseAdmin.from('miutp_simce_alumnos').select('rut, nombre_completo').eq('ensayo_id', ensayoId).order('nombre_completo'),
      supabaseAdmin.from('miutp_simce_respuestas').select('*', { count: 'exact', head: true }).eq('ensayo_id', ensayoId),
    ])

    return {
      success: true,
      data: {
        ensayo,
        objetivos: objetivos ?? [],
        preguntas: preguntas ?? [],
        pautas: pautas ?? [],
        alumnos: alumnos ?? [],
        n_respuestas: nRespuestas ?? 0,
      },
    }
  } catch (error: any) {
    console.error('Error in getEnsayoDetail:', error)
    return { success: false, error: error.message }
  }
}
