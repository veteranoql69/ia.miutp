'use client'

import { useEffect, useState } from 'react'
import { getSimceStudentResults, StudentResult } from '../actions'
import { ChevronDown, ChevronRight, FileDown, Loader2, Users } from 'lucide-react'

interface Props {
  ensayoId: string
  userId: string
}

function nivelChip(nivel: StudentResult['nivel']) {
  if (nivel === 'Adecuado') return 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50'
  if (nivel === 'Elemental') return 'bg-amber-950/40 text-amber-400 border border-amber-800/50'
  return 'bg-red-950/40 text-red-400 border border-red-800/50'
}

function PctBar({ pct }: { pct: number }) {
  const color = pct >= 67 ? 'bg-emerald-500' : pct >= 33 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-300 w-8 text-right">{pct}%</span>
    </div>
  )
}

function OABreakdown({ byOA }: { byOA: StudentResult['byOA'] }) {
  if (!byOA.length) return <p className="text-xs text-slate-600 py-2">Sin datos de OA</p>
  return (
    <div className="grid grid-cols-2 gap-1.5 py-2">
      {byOA.map(o => {
        const pct = o.total > 0 ? Math.round((o.correctas / o.total) * 100) : 0
        const color = pct >= 67 ? 'text-emerald-400' : pct >= 33 ? 'text-amber-400' : 'text-red-400'
        return (
          <div key={o.codigo} className="flex items-center gap-2 text-xs">
            <span className="font-bold text-indigo-400 w-14 shrink-0">{o.codigo}</span>
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pct >= 67 ? 'bg-emerald-500' : pct >= 33 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`w-8 text-right font-semibold ${color}`}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default function SimceResultsTable({ ensayoId, userId }: Props) {
  const [results, setResults] = useState<StudentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setLoading(true)
    getSimceStudentResults(ensayoId, userId).then(res => {
      if (res.success && res.data) {
        setResults(res.data)
      } else {
        setError(res.error || 'Error al cargar resultados')
      }
      setLoading(false)
    })
  }, [ensayoId, userId])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleExport = () => {
    setExporting(true)
    window.open(`/api/pdf/simce-results?ensayoId=${ensayoId}`, '_blank')
    setTimeout(() => setExporting(false), 2000)
  }

  const evaluados = results.filter(r => r.total > 0).length
  const adecuado = results.filter(r => r.nivel === 'Adecuado').length
  const elemental = results.filter(r => r.nivel === 'Elemental').length
  const insuficiente = results.filter(r => r.nivel === 'Insuficiente').length

  return (
    <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-950/50 border border-indigo-800/40">
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Resultados por alumno</h3>
            <p className="text-xs text-slate-500">Cruce pauta vs hojas de respuesta</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || loading || results.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
          Exportar PDF
        </button>
      </div>

      {/* Summary strip */}
      {!loading && results.length > 0 && (
        <div className="px-6 py-3 border-b border-slate-800/40 flex items-center gap-6 bg-slate-900/30">
          <span className="text-xs text-slate-500">{results.length} alumnos · {evaluados} evaluados</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">{adecuado} Adecuado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-400">{elemental} Elemental</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-slate-400">{insuficiente} Insuficiente</span>
          </div>
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Calculando resultados...</span>
        </div>
      )}

      {!loading && error && (
        <div className="px-6 py-8 text-center text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Aún no hay hojas de respuesta procesadas para este ensayo.</p>
        </div>
      )}

      {/* Table */}
      {!loading && results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 w-8" />
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">Alumno</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Curso</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Correctas</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 min-w-[140px]">% Logro</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">Nivel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {results.map(r => (
                <>
                  <tr
                    key={r.alumnoId}
                    className="hover:bg-slate-900/40 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(r.alumnoId)}
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {expanded.has(r.alumnoId)
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200 text-xs">{r.nombre}</div>
                      <div className="text-[10px] text-slate-600">{r.rut}</div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-bold text-slate-400">{r.cursoLetra || '—'}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-400">
                      {r.total > 0 ? <><span className="font-bold text-slate-200">{r.correctas}</span>/{r.total}</> : <span className="text-slate-700">Sin hoja</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.total > 0 ? <PctBar pct={r.porcentajeLogro} /> : <span className="text-xs text-slate-700">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.total > 0
                        ? <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${nivelChip(r.nivel)}`}>{r.nivel}</span>
                        : <span className="text-xs text-slate-700">—</span>
                      }
                    </td>
                  </tr>

                  {expanded.has(r.alumnoId) && (
                    <tr key={`${r.alumnoId}-detail`} className="bg-slate-900/20">
                      <td />
                      <td colSpan={5} className="px-4 pb-4 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                          Desglose por OA
                        </div>
                        <OABreakdown byOA={r.byOA} />
                        {r.byHabilidad.length > 0 && (
                          <>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 mt-3">
                              Desglose por habilidad
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {r.byHabilidad.map(h => {
                                const pct = h.total > 0 ? Math.round((h.correctas / h.total) * 100) : 0
                                const color = pct >= 67 ? 'text-emerald-400' : pct >= 33 ? 'text-amber-400' : 'text-red-400'
                                return (
                                  <div key={h.habilidad} className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-400 truncate max-w-[100px]" title={h.habilidad}>{h.habilidad}</span>
                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${pct >= 67 ? 'bg-emerald-500' : pct >= 33 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className={`w-8 text-right font-semibold ${color}`}>{pct}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
