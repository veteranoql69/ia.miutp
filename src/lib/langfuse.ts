import { Langfuse } from 'langfuse-node'

const DEPRECATED_MODELS: Record<string, string> = {
  'gemini-1.5-pro-latest': 'gemini-2.5-flash',
  'gemini-1.5-pro': 'gemini-2.5-flash',
  'gemini-1.5-flash': 'gemini-2.5-flash',
  'gemini-1.5-flash-latest': 'gemini-2.5-flash',
  'gemini-pro': 'gemini-2.5-flash',
}

function normalizarModelo(model: string): string {
  return DEPRECATED_MODELS[model] ?? model
}

const hasLangfuseKeys =
  !!process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY && 
  !!process.env.LANGFUSE_SECRET_KEY

export const langfuse = hasLangfuseKeys
  ? new Langfuse({
      publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || 'https://lfuse.manmec.cl',
    })
  : null

/**
 * Helper para registrar una traza de generación en Langfuse
 */
export async function registrarGeneracionIA(params: {
  traceName: string
  generationName: string
  model: string
  input: any
  output: any
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  userId?: string
}) {
  if (!langfuse) {
    console.log(`[Langfuse] No configurado o faltan credenciales en .env. Omitiendo traza para: ${params.traceName}`)
    return
  }

  try {
    const trace = langfuse.trace({
      name: params.traceName,
      userId: params.userId || 'sistema',
    })

    const generation = trace.generation({
      name: params.generationName,
      model: params.model,
      input: params.input,
    })

    generation.update({
      output: typeof params.output === 'object' ? JSON.stringify(params.output) : params.output,
      usage: {
        input: params.promptTokens,
        output: params.completionTokens,
        total: params.totalTokens,
      }
    })

    // Asegurar que los eventos se envíen de inmediato en entornos serverless/actions
    await langfuse.flushAsync()
  } catch (err) {
    console.error('Error al registrar traza en Langfuse:', err)
  }
}

/**
 * Helper para obtener un prompt gestionado desde Langfuse
 * Retorna el texto compilado del prompt y el modelo asociado si existe
 */
export async function obtenerPromptLangfuse(promptName: string, variables?: Record<string, any>) {
  if (!langfuse) {
    throw new Error('Langfuse no está configurado. No se puede obtener el prompt.')
  }

  try {
    const prompt = await langfuse.getPrompt(promptName)
    const promptText = prompt.compile(variables || {})
    
    // extraemos el modelo de la config de langfuse si existe
    const rawModel = (prompt.config as any)?.model || 'gemini-2.5-flash'
    const model = normalizarModelo(rawModel)
    
    return {
      promptText,
      model,
      promptObj: prompt
    }
  } catch (err) {
    console.error(`Error al obtener prompt \${promptName} desde Langfuse:`, err)
    throw err
  }
}
