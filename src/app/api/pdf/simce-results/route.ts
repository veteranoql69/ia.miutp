import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSimceStudentResults } from '@/modules/analitica/actions'
import { buildSimceResultsHtml } from '@/lib/templates/simce-results-html'
import { generatePdfWithLogo } from '@/lib/stirling'
import sharp from 'sharp'

export async function GET(req: NextRequest) {
  const ensayoId = req.nextUrl.searchParams.get('ensayoId')
  if (!ensayoId) {
    return NextResponse.json({ error: 'ensayoId requerido' }, { status: 400 })
  }

  // Verificar sesión
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Obtener datos (valida aislamiento por colegio internamente)
  const result = await getSimceStudentResults(ensayoId, user.id)
  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error || 'Error al obtener datos' }, { status: 403 })
  }

  if (!result.ensayo || !result.colegio) {
    return NextResponse.json({ error: 'Datos del ensayo incompletos' }, { status: 500 })
  }

  // Preparar logo 55×55px si existe
  let logoBuffer: Buffer | null = null
  if (result.colegio.logo_url) {
    try {
      const logoRes = await fetch(result.colegio.logo_url)
      if (logoRes.ok) {
        const logoRaw = Buffer.from(await logoRes.arrayBuffer())
        logoBuffer = await sharp(logoRaw)
          .resize(55, 55, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer()
      }
    } catch {
      // Logo no disponible — se genera el PDF sin él
    }
  }

  // Generar HTML
  const html = buildSimceResultsHtml({
    colegio: result.colegio,
    ensayo: result.ensayo,
    estudiantes: result.data,
  })

  // Generar PDF con Stirling
  let pdfBuffer: ArrayBuffer
  try {
    pdfBuffer = await generatePdfWithLogo(html, logoBuffer)
  } catch (err: any) {
    return NextResponse.json({ error: `Error generando PDF: ${err.message}` }, { status: 502 })
  }

  const nombre = `resultados-simce-${result.ensayo.nivel.replace(/\s+/g, '-')}.pdf`

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Cache-Control': 'no-store',
    },
  })
}
