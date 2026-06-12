const STIRLING_URL = process.env.STIRLING_PDF_API_URL || ''
const STIRLING_KEY = process.env.STIRLING_PDF_API_KEY || ''

/**
 * Pipeline A4 de Stirling:
 * 1. HTML → PDF base
 * 2. Overlay del logo (x=57, y=744) — se omite si logoBuffer es null
 */
export async function generatePdfWithLogo(
  htmlContent: string,
  logoBuffer: Buffer | null
): Promise<ArrayBuffer> {
  if (!STIRLING_URL || !STIRLING_KEY) {
    throw new Error('STIRLING_PDF_API_URL o STIRLING_PDF_API_KEY no configurados')
  }

  // Paso 1: HTML → PDF
  const step1Form = new FormData()
  step1Form.append('fileInput', new Blob([htmlContent], { type: 'text/html' }), 'document.html')
  step1Form.append('zoom', '1')

  const step1Res = await fetch(`${STIRLING_URL}/api/v1/convert/html/pdf`, {
    method: 'POST',
    headers: { 'X-API-KEY': STIRLING_KEY },
    body: step1Form,
  })

  if (!step1Res.ok) {
    const text = await step1Res.text().catch(() => '')
    throw new Error(`Stirling paso 1 falló: ${step1Res.status} ${text}`)
  }

  const pdfBuffer = await step1Res.arrayBuffer()

  if (!logoBuffer) {
    return pdfBuffer
  }

  // Paso 2: Overlay del logo
  const step2Form = new FormData()
  step2Form.append('fileInput', new Blob([pdfBuffer]), 'base.pdf')
  step2Form.append('imageFile', new Blob([new Uint8Array(logoBuffer)], { type: 'image/png' }), 'logo.png')
  step2Form.append('x', '57')
  step2Form.append('y', '744')
  step2Form.append('everyPage', 'false')

  const step2Res = await fetch(`${STIRLING_URL}/api/v1/misc/add-image`, {
    method: 'POST',
    headers: { 'X-API-KEY': STIRLING_KEY },
    body: step2Form,
  })

  if (!step2Res.ok) {
    const text = await step2Res.text().catch(() => '')
    throw new Error(`Stirling paso 2 falló: ${step2Res.status} ${text}`)
  }

  return step2Res.arrayBuffer()
}
