export interface StudentResult {
  alumnoId: string
  nombre: string
  rut: string
  cursoLetra: string
  correctas: number
  total: number
  porcentajeLogro: number
  nivel: 'Adecuado' | 'Elemental' | 'Insuficiente'
  byOA: { codigo: string; correctas: number; total: number }[]
  byHabilidad: { habilidad: string; correctas: number; total: number }[]
}

interface ReportData {
  colegio: { nombre: string; rbd: string; comuna: string }
  ensayo: { nivel: string; asignatura: string; fecha: string; nombre?: string }
  estudiantes: StudentResult[]
}

function nivelColor(nivel: string): string {
  if (nivel === 'Adecuado') return '#065f46'
  if (nivel === 'Elemental') return '#78350f'
  return '#7f1d1d'
}

function nivelBg(nivel: string): string {
  if (nivel === 'Adecuado') return '#d1fae5'
  if (nivel === 'Elemental') return '#fef3c7'
  return '#fee2e2'
}

function pctBar(pct: number): string {
  const color = pct >= 67 ? '#10b981' : pct >= 33 ? '#f59e0b' : '#ef4444'
  return `<div style="display:inline-block;width:${Math.round(pct * 0.8)}px;height:6px;background:${color};border-radius:3px;vertical-align:middle;"></div>`
}

export function buildSimceResultsHtml(data: ReportData): string {
  const { colegio, ensayo, estudiantes } = data

  const totalAlumnos = estudiantes.length
  const evaluados = estudiantes.filter(e => e.total > 0).length
  const adecuado = estudiantes.filter(e => e.nivel === 'Adecuado').length
  const elemental = estudiantes.filter(e => e.nivel === 'Elemental').length
  const insuficiente = estudiantes.filter(e => e.nivel === 'Insuficiente').length
  const promedio = evaluados > 0
    ? Math.round(estudiantes.filter(e => e.total > 0).reduce((s, e) => s + e.porcentajeLogro, 0) / evaluados)
    : 0

  // Agrupación por OA (promedio curso)
  const oaMap: Record<string, { correctas: number; total: number }> = {}
  estudiantes.forEach(e => {
    e.byOA.forEach(o => {
      if (!oaMap[o.codigo]) oaMap[o.codigo] = { correctas: 0, total: 0 }
      oaMap[o.codigo].correctas += o.correctas
      oaMap[o.codigo].total += o.total
    })
  })
  const oaStats = Object.entries(oaMap)
    .map(([codigo, v]) => ({ codigo, pct: v.total > 0 ? Math.round((v.correctas / v.total) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct)

  const estudiantesRows = estudiantes
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map(e => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:5px 8px;font-size:8pt;color:#1e293b;">${e.nombre}</td>
        <td style="padding:5px 8px;font-size:7.5pt;color:#64748b;text-align:center;">${e.rut}</td>
        <td style="padding:5px 8px;font-size:8pt;text-align:center;">${e.cursoLetra}</td>
        <td style="padding:5px 8px;font-size:8pt;text-align:center;">${e.correctas}/${e.total}</td>
        <td style="padding:5px 8px;font-size:8pt;text-align:center;">${e.total > 0 ? e.porcentajeLogro : '—'}${e.total > 0 ? '%' : ''} ${e.total > 0 ? pctBar(e.porcentajeLogro) : ''}</td>
        <td style="padding:5px 8px;text-align:center;">
          <span style="font-size:7.5pt;font-weight:700;color:${nivelColor(e.nivel)};background:${nivelBg(e.nivel)};padding:2px 8px;border-radius:4px;">${e.nivel}</span>
        </td>
      </tr>
    `).join('')

  const oaRows = oaStats.map(o => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:4px 8px;font-size:8pt;font-weight:700;color:#3730a3;">${o.codigo}</td>
      <td style="padding:4px 8px;font-size:8pt;text-align:center;">${o.pct}% ${pctBar(o.pct)}</td>
      <td style="padding:4px 8px;font-size:7.5pt;text-align:center;color:${o.pct >= 67 ? '#065f46' : o.pct >= 33 ? '#78350f' : '#7f1d1d'};">
        ${o.pct >= 67 ? 'Logrado' : o.pct >= 33 ? 'En proceso' : 'Por lograr'}
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm 20mm 20mm 20mm; }
    body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; }
    h1 { font-size: 14pt; font-weight: 700; color: #1e3a8a; margin: 0 0 2mm 0; }
    h2 { font-size: 11pt; font-weight: 700; color: #1e3a8a; margin: 6mm 0 2mm 0; border-bottom: 1.5px solid #3730a3; padding-bottom: 2mm; }
    table { border-collapse: collapse; width: 100%; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4mm; margin-bottom: 4mm; }
    .stat-cell { text-align: center; padding: 0 8mm; border-right: 1px solid #e2e8f0; }
    .stat-cell:last-child { border-right: none; }
    .stat-num { font-size: 18pt; font-weight: 700; color: #1e3a8a; }
    .stat-label { font-size: 7.5pt; color: #64748b; margin-top: 1mm; }
    .data-table th { background: #1e3a8a; color: white; padding: 5px 8px; font-size: 8pt; text-align: left; }
    .data-table td { vertical-align: middle; }
    .footer { margin-top: 8mm; font-size: 7pt; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 3mm; }
  </style>
</head>
<body>

  <!-- Header: celda vacía para logo overlay + info colegio -->
  <table style="width:100%;border:none;border-collapse:collapse;">
    <tr>
      <td style="width:70px;height:55px;padding:0;border:none;"></td>
      <td style="padding:0;border:none;text-align:right;vertical-align:middle;font-size:8pt;color:#64748b;line-height:1.4;">
        <strong style="color:#1e293b;">${colegio.nombre}</strong><br>
        RBD: ${colegio.rbd} &nbsp;|&nbsp; ${colegio.comuna}
      </td>
    </tr>
  </table>

  <div style="margin-top:3mm;">
    <h1>${ensayo.nombre || 'Ensayo SIMCE'} — ${ensayo.asignatura}</h1>
    <span style="font-size:8pt;color:#64748b;">Nivel: ${ensayo.nivel} &nbsp;|&nbsp; Fecha: ${ensayo.fecha}</span>
  </div>

  <div style="margin-top:4mm;" class="summary-box">
    <table style="width:100%;border:none;border-collapse:collapse;">
      <tr>
        <td class="stat-cell">
          <div class="stat-num">${totalAlumnos}</div>
          <div class="stat-label">Total alumnos</div>
        </td>
        <td class="stat-cell">
          <div class="stat-num">${evaluados}</div>
          <div class="stat-label">Evaluados</div>
        </td>
        <td class="stat-cell">
          <div class="stat-num" style="color:#065f46;">${adecuado}</div>
          <div class="stat-label">Adecuado</div>
        </td>
        <td class="stat-cell">
          <div class="stat-num" style="color:#78350f;">${elemental}</div>
          <div class="stat-label">Elemental</div>
        </td>
        <td class="stat-cell">
          <div class="stat-num" style="color:#7f1d1d;">${insuficiente}</div>
          <div class="stat-label">Insuficiente</div>
        </td>
        <td class="stat-cell">
          <div class="stat-num" style="color:#3730a3;">${promedio}%</div>
          <div class="stat-label">Promedio logro</div>
        </td>
      </tr>
    </table>
  </div>

  <h2>Resultados por alumno</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Nombre</th>
        <th style="text-align:center;">RUT</th>
        <th style="text-align:center;">Curso</th>
        <th style="text-align:center;">Correctas</th>
        <th style="text-align:center;">% Logro</th>
        <th style="text-align:center;">Nivel</th>
      </tr>
    </thead>
    <tbody>
      ${estudiantesRows}
    </tbody>
  </table>

  ${oaStats.length > 0 ? `
  <h2>Brechas por Objetivo de Aprendizaje</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>OA</th>
        <th style="text-align:center;">Logro promedio curso</th>
        <th style="text-align:center;">Estado</th>
      </tr>
    </thead>
    <tbody>${oaRows}</tbody>
  </table>
  ` : ''}

  <div class="footer">
    Generado por miUTP &nbsp;|&nbsp; ${new Date().toLocaleDateString('es-CL')} &nbsp;|&nbsp; Plataforma de Gestión de Unidad Técnica Pedagógica
  </div>

</body>
</html>`
}
