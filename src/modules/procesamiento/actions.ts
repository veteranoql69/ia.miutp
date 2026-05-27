'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { registrarGeneracionIA } from '@/lib/langfuse'

// ── Constantes ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB
const BUCKET_NAME = 'evidencias_mineduc'

const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})

// ── Schema Zod para extracción semántica ─────────────────────────────────────

const curriculumExtractionSchema = z.object({
  curso: z
    .string()
    .describe('Nivel o curso, ej: "1 Medio", "7 Básico"'),
  asignatura: z
    .string()
    .describe('Asignatura, ej: "Matemática", "Lenguaje y Comunicación"'),
  objetivos: z
    .array(
      z.object({
        codigo_oa: z
          .string()
          .describe('Código del OA, ej: "OA 1". Si no existe, asignar correlativo.'),
        descripcion: z
          .string()
          .describe('Descripción completa del Objetivo de Aprendizaje.'),
      })
    )
    .describe('Todos los Objetivos de Aprendizaje del documento.'),
})

type CurriculumExtraction = z.infer<typeof curriculumExtractionSchema>

// ── Tipo de retorno ───────────────────────────────────────────────────────────

type ActionResult =
  | { success: true; data: CurriculumExtraction & { url_pdf_original: string; id: string } }
  | { success: false; error: string }

// ── Server Action principal ───────────────────────────────────────────────────

export async function processCurriculumPdfAction(
  formData: FormData
): Promise<ActionResult> {

  // ── FASE 1: Recepción y validación ────────────────────────────────────────
  const file = formData.get('pdf') as File | null

  if (!file) {
    return { success: false, error: 'No se recibió ningún archivo PDF.' }
  }
  if (file.type !== 'application/pdf') {
    return { success: false, error: `El archivo debe ser PDF. Tipo recibido: ${file.type}` }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `El archivo excede 20 MB. Tamaño recibido: ${(file.size / 1024 / 1024).toFixed(2)} MB`,
    }
  }

  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(arrayBuffer)
  const fileName = `curriculum_${Date.now()}.pdf`

  // ── FASE 2: Almacenamiento en Supabase Storage (Evidencia) ────────────────
  // Garantiza que el bucket exista antes del upload (fallback si la migración SQL falló)
  try {
    await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: true })
  } catch {
    // Ignorar: el bucket ya existe
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    console.error('[processCurriculumPdf] Error Storage:', uploadError)
    return { success: false, error: `Error al subir el PDF al storage: ${uploadError.message}` }
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(fileName)
  const urlPdfOriginal: string = urlData?.publicUrl ?? ''

  // ── FASE 3: Extracción semántica directa con Gemini Vision ──────────────
  let extractedData: CurriculumExtraction

  try {
    const { object, usage } = await generateObject({
      model: googleAI('gemini-2.5-flash'),
      schema: curriculumExtractionSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analiza el siguiente documento PDF oficial del Ministerio de Educación de Chile (Mineduc).
Extrae de forma estructurada el curso o nivel educativo, la asignatura y todos los Objetivos de Aprendizaje (OAs) con su código y descripción completa.
Si el documento no indica códigos de OA, asígnalos correlativamente (OA 1, OA 2, ...).`,
            },
            {
              type: 'file',
              data: fileBuffer,
              mediaType: 'application/pdf',
            },
          ],
        },
      ],
    })

    extractedData = object

    await registrarGeneracionIA({
      traceName: 'procesar-curriculum-pdf',
      generationName: 'extract-curriculum-objectives',
      model: 'gemini-2.5-flash',
      input: { fileName, fileSize: fileBuffer.length },
      output: extractedData,
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    })
  } catch (err: any) {
    console.error('[processCurriculumPdf] Error Gemini:', err)
    return { success: false, error: `Error al extraer datos con IA: ${err.message}` }
  }

  // ── FASE 5: Persistencia en Supabase DB ───────────────────────────────────
  const { data: insertedRow, error: dbError } = await supabaseAdmin
    .from('miutp_programas_curriculares')
    .insert({
      url_pdf_original: urlPdfOriginal,
      contenido_markdown: '',
      metadata_json: {
        curso: extractedData.curso,
        asignatura: extractedData.asignatura,
        total_objetivos: extractedData.objetivos.length,
        objetivos: extractedData.objetivos,
        archivo_original: file.name,
        procesado_en: new Date().toISOString(),
      },
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('[processCurriculumPdf] Error DB:', dbError)
    return { success: false, error: `Error al guardar el programa curricular: ${dbError.message}` }
  }

  // ── FASE 6: Retorno para actualizar Dashboard UTP ─────────────────────────
  return {
    success: true,
    data: {
      ...extractedData,
      url_pdf_original: urlPdfOriginal,
      id: insertedRow.id,
    },
  }
}

// ── Listar programas curriculares ─────────────────────────────────────────────

export async function getProgramasCurriculares(): Promise<
  | { success: true; data: any[] }
  | { success: false; error: string }
> {
  const { data, error } = await supabaseAdmin
    .from('miutp_programas_curriculares')
    .select('id, url_pdf_original, metadata_json, creado_en')
    .order('creado_en', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data ?? [] }
}
