'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { obtenerPromptLangfuse, registrarGeneracionIA } from '@/lib/langfuse'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
})

const BUCKET_NAME = 'evidencias_simce'

// ── Dynamic Zod Schema for Gemini extraction ──
function getSheetExtractionSchema(totalPreguntas: number) {
  return z.object({
    nombre_alumno: z
      .string()
      .describe('Nombre completo del alumno escrito en la cabecera (ALUMNO)'),
    curso_escrito: z
      .string()
      .describe('Curso escrito en la cabecera (CURSO), ej: "2° Media A" o "2 Medio A"'),
    respuestas: z
      .array(
        z.object({
          numero_pregunta: z
            .number()
            .int()
            .describe(`Número de pregunta de la hoja (ej: 1 a ${totalPreguntas})`),
          alternativa_marcada: z
            .string()
            .toUpperCase()
            .nullable()
            .describe('Alternativa marcada (A, B, C, D). Si está en blanco o es ambigua, retornar null.'),
        })
      )
      .length(totalPreguntas)
      .describe(`Lista completa de respuestas detectadas en la hoja. DEBE contener exactamente ${totalPreguntas} elementos ordenados secuencialmente de la pregunta 1 a la ${totalPreguntas}.`),
  })
}

// ── Sørensen–Dice Coefficient for Fuzzy matching names ──
function calculateStringSimilarity(s1: string, s2: string): number {
  const norm1 = s1.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
  const norm2 = s2.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
  
  if (norm1 === norm2) return 1.0
  if (norm1.length < 2 || norm2.length < 2) return 0.0

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>()
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2))
    }
    return bigrams
  }

  const b1 = getBigrams(norm1)
  const b2 = getBigrams(norm2)
  
  let intersection = 0
  b1.forEach(b => {
    if (b2.has(b)) intersection++
  })

  return (2.0 * intersection) / (b1.size + b2.size)
}

export async function processSingleAnswerSheetAction(
  formData: FormData,
  ensayoId: string,
  cursoLetra: string
) {
  try {
    const file = formData.get('file') as File | null
    if (!file) {
      return { success: false, error: 'No se recibió ningún archivo de imagen.' }
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${ensayoId}_${cursoLetra}_sheet_${Date.now()}.${fileExtension}`

    // 1. Subir evidencia a Supabase Storage
    try {
      await supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: true })
    } catch {
      // Ignorar si ya existe
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      throw new Error(`Error de almacenamiento: ${uploadError.message}`)
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(fileName)
    const urlImagenEvidencia = urlData?.publicUrl ?? ''

    // 2. Obtener pauta del ensayo primero para saber cuántas preguntas son
    const { data: pautas, error: pautaError } = await supabaseAdmin
      .from('miutp_simce_pautas')
      .select('id, numero_pregunta, alternativa_correcta')
      .eq('ensayo_id', ensayoId)

    if (pautaError) throw pautaError

    const totalPreguntas = pautas && pautas.length > 0 ? pautas.length : 30

    // 2b. Obtener prompt y modelo de IA desde Langfuse
    let promptText = ''
    let model = 'gemini-2.5-flash'
    try {
      const resLangfuse = await obtenerPromptLangfuse('process-sheet-prompt')
      promptText = resLangfuse.promptText
      model = resLangfuse.model
    } catch {
      console.warn('Fallo al obtener process-sheet-prompt desde Langfuse, usando fallback local.')
      promptText = `Analiza la imagen de la hoja de respuestas SIMCE adjunta.
Extrae de manera sumamente precisa:
1. El nombre del alumno escrito en la cabecera (ALUMNO).
2. El curso indicado en la cabecera.
3. Las alternativas seleccionadas por el alumno rellenando los círculos.
Retorna null en la alternativa si la marca está en blanco o es ambigua.`
    }

    const finalSystemPrompt = `${promptText}

IMPORTANTE:
- El examen contiene exactamente ${totalPreguntas} preguntas.
- DEBES retornar en el JSON un array 'respuestas' con exactamente ${totalPreguntas} elementos, numerados del 1 al ${totalPreguntas} de forma secuencial y ordenada.
- Si una pregunta está en blanco (el alumno no contestó) o la marca es ambigua, debes incluirla de todas formas en el array, indicando su número de pregunta y asignando null a 'alternativa_marcada'.
- BAJO NINGUNA CIRCUNSTANCIA omitas ninguna pregunta en el array respuestas. Deben haber exactamente ${totalPreguntas} elementos.`

    // 3. Invocar Gemini Vision API con esquema y prompt dinámicos
    const { object, usage } = await generateObject({
      model: google(model),
      system: finalSystemPrompt,
      schema: getSheetExtractionSchema(totalPreguntas),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: fileBuffer.toString('base64'),
              mediaType: file.type,
            }
          ]
        }
      ]
    })

    // Registrar en Langfuse
    await registrarGeneracionIA({
      traceName: 'Procesamiento_Hoja_Respuestas',
      generationName: 'Gemini_Vision_Sheet_Parsing',
      model,
      input: { fileName: file.name, fileSize: file.size, ensayoId, cursoLetra },
      output: object,
      promptTokens: (usage as any).inputTokens ?? (usage as any).promptTokens,
      completionTokens: (usage as any).outputTokens ?? (usage as any).completionTokens,
      totalTokens: (usage as any).totalTokens,
    })

    const { nombre_alumno, curso_escrito, respuestas } = object

    // 4. Buscar alumnos oficiales inscritos en este ensayo y curso
    const { data: alumnos, error: alumError } = await supabaseAdmin
      .from('miutp_simce_alumnos')
      .select('id, nombre_completo, curso_letra')
      .eq('ensayo_id', ensayoId)
      .eq('curso_letra', cursoLetra)

    if (alumError) throw alumError

    // Realizar fuzzy matching
    let bestMatch: any = null
    let highestScore = 0

    ;(alumnos || []).forEach((a: any) => {
      const score = calculateStringSimilarity(nombre_alumno, a.nombre_completo)
      if (score > highestScore) {
        highestScore = score
        bestMatch = a
      }
    })

    // Validar coincidencia de curso básica
    // e.g. si cursoLetra es "A", y la IA detectó "B", esto podría ser una alerta.
    const cursoCoincide = curso_escrito.toLowerCase().includes(cursoLetra.toLowerCase())

    // Umbral de coincidencia aceptable: 85% y que el curso/letra coincida en contexto
    const isMatched = highestScore >= 0.85 && cursoCoincide

    if (isMatched && bestMatch) {
      // Calcular porcentaje de logro utilizando la pauta obtenida previamente

      // Calcular porcentaje de logro
      const correctas = respuestas.filter((r) => {
        const p = (pautas || []).find((pauta: any) => pauta.numero_pregunta === r.numero_pregunta)
        return p && r.alternativa_marcada === p.alternativa_correcta
      }).length
      const total = pautas.length > 0 ? pautas.length : respuestas.length
      const pctLogro = total > 0 ? Math.round((correctas / total) * 100) : 0

      // 5.1 Intentar registrar/actualizar la cabecera en miutp_simce_hojas
      let hojaId: string | null = null
      try {
        const { data: hojaRow, error: hojaError } = await supabaseAdmin
          .from('miutp_simce_hojas')
          .upsert({
            ensayo_id: ensayoId,
            alumno_id: bestMatch.id,
            url_imagen_evidencia: urlImagenEvidencia,
            porcentaje_logro: pctLogro
          }, { onConflict: 'ensayo_id,alumno_id' })
          .select('id')
          .single()
        
        if (!hojaError && hojaRow) {
          hojaId = hojaRow.id
        }
      } catch (e) {
        console.warn('Fallo al registrar cabecera miutp_simce_hojas (tabla podría no existir aún):', e)
      }

      const respuestasToInsert = respuestas
        .map((r) => {
          const pauta = (pautas || []).find((p: any) => p.numero_pregunta === r.numero_pregunta)
          if (!pauta) return null

          const item: any = {
            ensayo_id: ensayoId,
            alumno_id: bestMatch.id,
            pauta_id: pauta.id,
            alternativa_marcada: r.alternativa_marcada || '',
            es_correcta: r.alternativa_marcada === pauta.alternativa_correcta,
          }
          if (hojaId) {
            item.hoja_id = hojaId
          }
          return item
        })
        .filter(Boolean) as any[]

      // Eliminar respuestas previas del alumno para este ensayo (evitar duplicados en insert)
      if (respuestasToInsert.length > 0) {
        const pautaIds = respuestasToInsert.map(r => r.pauta_id)
        await supabaseAdmin
          .from('miutp_simce_respuestas')
          .delete()
          .eq('ensayo_id', ensayoId)
          .eq('alumno_id', bestMatch.id)
          .in('pauta_id', pautaIds)

        // Intentar guardar con hoja_id
        let insertSuccess = false
        try {
          const { error: insertError } = await supabaseAdmin
            .from('miutp_simce_respuestas')
            .insert(respuestasToInsert)

          if (!insertError) {
            insertSuccess = true
          }
        } catch (e) {
          console.warn('Fallo al insertar respuestas con hoja_id:', e)
        }

        // Fallback: si falló con hoja_id, intentar insertar sin hoja_id
        if (!insertSuccess) {
          const fallbackRespuestas = respuestasToInsert.map(r => {
            const copy = { ...r }
            delete copy.hoja_id
            return copy
          })
          const { error: fallbackError } = await supabaseAdmin
            .from('miutp_simce_respuestas')
            .insert(fallbackRespuestas)
          
          if (fallbackError) throw fallbackError
        }
      }

      return {
        success: true,
        matched: true,
        studentName: bestMatch.nombre_completo,
        alumnoId: bestMatch.id,
        nombreDetectado: nombre_alumno,
        cursoDetectado: curso_escrito,
        correctas,
        total,
        porcentajeLogro: pctLogro,
        respuestasExtraidas: respuestas,
      }
    } else {
      // 6. Si no coincide o curso es discrepante, registrar en la tabla de conflictos
      const { data: conflictoRow, error: conflictoError } = await supabaseAdmin
        .from('miutp_simce_conflictos')
        .insert({
          ensayo_id: ensayoId,
          curso_letra: cursoLetra,
          nombre_detectado: nombre_alumno,
          curso_detectado: curso_escrito,
          url_imagen_evidencia: urlImagenEvidencia,
          respuestas_extraidas: respuestas,
          resuelto: false
        })
        .select('id')
        .single()

      if (conflictoError) {
        // Fallback: si la tabla miutp_simce_conflictos no existe físicamente en el Supabase remoto aún,
        // retornamos la información para manejo local en el state del cliente sin abortar.
        console.warn('Fallo al insertar en miutp_simce_conflictos (tabla podría no estar creada):', conflictoError.message)
        return {
          success: true,
          matched: false,
          localConflict: true,
          nombreDetectado: nombre_alumno,
          cursoDetectado: curso_escrito,
          urlImagenEvidencia,
          respuestasExtraidas: respuestas,
          reason: highestScore < 0.85 
            ? `Nombre extraído "${nombre_alumno}" no coincide suficientemente con la nómina (${Math.round(highestScore*100)}% similitud).`
            : `Curso extraído "${curso_escrito}" no coincide con el curso seleccionado (${cursoLetra}).`
        }
      }

      return {
        success: true,
        matched: false,
        conflictoId: conflictoRow.id,
        nombreDetectado: nombre_alumno,
        cursoDetectado: curso_escrito,
        urlImagenEvidencia,
        respuestasExtraidas: respuestas,
        reason: highestScore < 0.85 
          ? `Nombre extraído "${nombre_alumno}" no coincide suficientemente con la nómina (${Math.round(highestScore*100)}% similitud).`
          : `Curso extraído "${curso_escrito}" no coincide con el curso seleccionado (${cursoLetra}).`
      }
    }
  } catch (error: any) {
    console.error('Error in processSingleAnswerSheetAction:', error)
    return { success: false, error: error.message }
  }
}

// ── Resolver un conflicto manualmente desde la UI ──
export async function resolveConflictAction(data: {
  conflictoId?: string
  ensayoId: string
  alumnoId: string
  respuestas: { numero_pregunta: number; alternativa_marcada: string | null }[]
  originalAlumnoId?: string
  urlImagenEvidencia?: string
}) {
  try {
    const { conflictoId, ensayoId, alumnoId, respuestas, originalAlumnoId } = data
    let urlImagenEvidencia = data.urlImagenEvidencia || ''

    // Recuperar URL de imagen desde conflictos si existe conflictoId y no se proporcionó
    if (!urlImagenEvidencia && conflictoId) {
      try {
        const { data: conflictRow } = await supabaseAdmin
          .from('miutp_simce_conflictos')
          .select('url_imagen_evidencia')
          .eq('id', conflictoId)
          .single()
        if (conflictRow) {
          urlImagenEvidencia = conflictRow.url_imagen_evidencia
        }
      } catch (e) {
        console.warn('No se pudo recuperar url_imagen_evidencia para conflicto:', e)
      }
    }

    // 1. Obtener la pauta de respuestas del ensayo
    const { data: pautas, error: pautaError } = await supabaseAdmin
      .from('miutp_simce_pautas')
      .select('id, numero_pregunta, alternativa_correcta')
      .eq('ensayo_id', ensayoId)

    if (pautaError) throw pautaError

    // Calcular porcentaje de logro
    const correctas = respuestas.filter(r => {
      const p = pautas.find((pauta: any) => pauta.numero_pregunta === r.numero_pregunta)
      return p && r.alternativa_marcada === p.alternativa_correcta
    }).length
    const total = pautas.length > 0 ? pautas.length : respuestas.length
    const pctLogro = total > 0 ? Math.round((correctas / total) * 100) : 0

    // 1.1 Intentar registrar/actualizar la cabecera en miutp_simce_hojas
    let hojaId: string | null = null
    if (urlImagenEvidencia) {
      try {
        const { data: hojaRow, error: hojaError } = await supabaseAdmin
          .from('miutp_simce_hojas')
          .upsert({
            ensayo_id: ensayoId,
            alumno_id: alumnoId,
            url_imagen_evidencia: urlImagenEvidencia,
            porcentaje_logro: pctLogro
          }, { onConflict: 'ensayo_id,alumno_id' })
          .select('id')
          .single()
        
        if (!hojaError && hojaRow) {
          hojaId = hojaRow.id
        }
      } catch (e) {
        console.warn('Fallo al registrar cabecera miutp_simce_hojas en resolveConflictAction:', e)
      }
    }

    // 2. Mapear y registrar las respuestas del alumno
    const respuestasToInsert = respuestas
      .map((r) => {
        const pauta = (pautas || []).find((p: any) => p.numero_pregunta === r.numero_pregunta)
        if (!pauta) return null

        const item: any = {
          ensayo_id: ensayoId,
          alumno_id: alumnoId,
          pauta_id: pauta.id,
          alternativa_marcada: r.alternativa_marcada || '',
          es_correcta: r.alternativa_marcada === pauta.alternativa_correcta,
        }
        if (hojaId) {
          item.hoja_id = hojaId
        }
        return item
      })
      .filter(Boolean) as any[]

    if (respuestasToInsert.length > 0) {
      const pautaIds = respuestasToInsert.map(r => r.pauta_id)
      
      // Si el alumno cambió, borrar respuestas asociadas al alumno original y su cabecera
      if (originalAlumnoId && originalAlumnoId !== alumnoId) {
        await supabaseAdmin
          .from('miutp_simce_respuestas')
          .delete()
          .eq('ensayo_id', ensayoId)
          .eq('alumno_id', originalAlumnoId)
        
        try {
          await supabaseAdmin
            .from('miutp_simce_hojas')
            .delete()
            .eq('ensayo_id', ensayoId)
            .eq('alumno_id', originalAlumnoId)
        } catch {}
      }

      // Limpiar registros antiguos del nuevo alumno
      await supabaseAdmin
        .from('miutp_simce_respuestas')
        .delete()
        .eq('ensayo_id', ensayoId)
        .eq('alumno_id', alumnoId)
        .in('pauta_id', pautaIds)

      // Guardar con hoja_id
      let insertSuccess = false
      try {
        const { error: insertError } = await supabaseAdmin
          .from('miutp_simce_respuestas')
          .insert(respuestasToInsert)

        if (!insertError) {
          insertSuccess = true
        }
      } catch (e) {
        console.warn('Fallo al insertar respuestas con hoja_id en resolveConflictAction:', e)
      }

      // Fallback
      if (!insertSuccess) {
        const fallbackRespuestas = respuestasToInsert.map(r => {
          const copy = { ...r }
          delete copy.hoja_id
          return copy
        })
        const { error: fallbackError } = await supabaseAdmin
          .from('miutp_simce_respuestas')
          .insert(fallbackRespuestas)
        
        if (fallbackError) throw fallbackError
      }
    }

    // 3. Si hay un ID de conflicto registrado en DB, marcarlo como resuelto
    if (conflictoId) {
      await supabaseAdmin
        .from('miutp_simce_conflictos')
        .update({ resuelto: true })
        .eq('id', conflictoId)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in resolveConflictAction:', error)
    return { success: false, error: error.message }
  }
}

export async function getAlumnosCursoLetraAction(ensayoId: string, cursoLetra: string) {
  try {
    const { data: alumnos, error } = await supabaseAdmin
      .from('miutp_simce_alumnos')
      .select('id, nombre_completo, rut')
      .eq('ensayo_id', ensayoId)
      .eq('curso_letra', cursoLetra)
      .order('nombre_completo')

    if (error) throw error
    return { success: true, data: alumnos ?? [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getEnsayoPautasAction(ensayoId: string) {
  try {
    const { data: pautas, error } = await supabaseAdmin
      .from('miutp_simce_pautas')
      .select('numero_pregunta, alternativa_correcta')
      .eq('ensayo_id', ensayoId)
      .order('numero_pregunta')

    if (error) throw error
    return { success: true, data: pautas ?? [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

