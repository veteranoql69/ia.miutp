'use client'

import { useEffect, useState } from 'react'
import { getCursoStats } from '../actions'
import { getEnsayosSimce, getEnsayoDetail } from '@/modules/herramientas/actions'
import {
  TrendingUp, Award, Users, HelpCircle, Loader2, AlertCircle,
  FileText, BookOpen, ListChecks, ClipboardCheck, UserCheck,
  ChevronDown, X, CheckCircle2, Clock
} from 'lucide-react'

interface BentoGridKPIsProps {
  ensayoSeleccionado: any
}

// ── Mini-dashboard de detalle de un ensayo ────────────────────────────────────

function EnsayoDetailPanel({ ensayoId, onClose }: { ensayoId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<any>(null)

  useEffect(() => {
    getEnsayoDetail(ensayoId).then(res => {
      if (res.success) setDetail(res.data)
      setLoading(false)
    })
  }, [ensayoId])

  return (
    <div className="mt-4 rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl overflow-hidden">
      {/* Header panel */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60">
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Detalle del Ensayo</p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      ) : !detail ? (
        <p className="text-xs text-slate-500 text-center py-8">No se pudo cargar el detalle.</p>
      ) : (
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-5">

          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'OAs', count: detail.objetivos.length, icon: BookOpen, color: 'indigo' },
              { label: 'Preguntas', count: detail.preguntas.length, icon: ListChecks, color: 'violet' },
              { label: 'Clave', count: detail.pautas.length, icon: ClipboardCheck, color: 'emerald' },
              { label: 'Alumnos', count: detail.alumnos.length, icon: UserCheck, color: 'cyan' },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} className={`p-3 rounded-xl bg-${color}-950/30 border border-${color}-900/40 text-center`}>
                <Icon className={`w-4 h-4 text-${color}-400 mx-auto mb-1`} />
                <p className={`text-xl font-black text-${color}-300`}>{count}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* OAs */}
          {detail.objetivos.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Objetivos de Aprendizaje</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {detail.objetivos.map((o: any, i: number) => (
                  <div key={i} className="flex gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800/40">
                    <span className="text-[10px] font-bold text-indigo-400 shrink-0 min-w-[36px]">{o.codigo}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{o.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preguntas */}
          {detail.preguntas.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Preguntas del Ensayo</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {detail.preguntas.map((p: any) => (
                  <div key={p.numero} className="flex gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800/40">
                    <span className="text-[10px] font-bold text-violet-400 shrink-0 min-w-[28px]">P{p.numero}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{p.enunciado}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clave de respuestas */}
          {detail.pautas.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Clave de Respuestas</p>
              <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {detail.pautas.map((p: any) => (
                  <div key={p.numero_pregunta} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
                    <span className="text-[9px] text-slate-500">P{p.numero_pregunta}</span>
                    <span className="text-xs font-black text-emerald-400">{p.alternativa_correcta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alumnos */}
          {detail.alumnos.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Nómina de Alumnos ({detail.alumnos.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {detail.alumnos.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/50 border border-slate-800/40">
                    <span className="text-[9px] text-slate-600 shrink-0 w-4 text-right">{i + 1}</span>
                    <p className="text-[11px] text-slate-400 truncate">{a.nombre_completo}</p>
                    {a.rut && <span className="text-[9px] text-slate-600 shrink-0 ml-auto">{a.rut}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Respuestas */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            detail.n_respuestas > 0
              ? 'bg-emerald-950/30 border-emerald-900/40'
              : 'bg-amber-950/20 border-amber-900/30'
          }`}>
            {detail.n_respuestas > 0
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              : <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            }
            <p className="text-xs text-slate-300">
              {detail.n_respuestas > 0
                ? `${detail.n_respuestas} respuestas de alumnos procesadas`
                : 'Hojas de respuesta de alumnos pendientes de carga'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de ensayo SIMCE ───────────────────────────────────────────────────

function EnsayoSimceCard({ ensayo }: { ensayo: any }) {
  const [expandido, setExpandido] = useState(false)

  const pasos = [ensayo.n_objetivos > 0, ensayo.n_alumnos > 0, ensayo.n_preguntas > 0, ensayo.n_pautas > 0]
  const completados = pasos.filter(Boolean).length
  const pct = Math.round((completados / 4) * 100)
  const faltaHojas = ensayo.n_respuestas === 0

  return (
    <div
      className="rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-xl shadow-xl overflow-hidden"
    >
      <div
        className="p-5 cursor-pointer select-none"
        onDoubleClick={() => setExpandido(v => !v)}
        title="Doble clic para ver detalle"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">
              {ensayo.nombre || `Ensayo ${ensayo.nivel} ${ensayo.letra}`}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {ensayo.nivel} — Letra {ensayo.letra} · {ensayo.asignatura}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {faltaHojas && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-900/40 text-amber-400 uppercase tracking-wider">
                Pendiente hojas
              </span>
            )}
            <button
              onClick={() => setExpandido(v => !v)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
            <span>{completados} / 4 elementos cargados</span>
            <span className={pct === 100 ? 'text-emerald-400' : 'text-indigo-400'}>{pct}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Chips de estado */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            { label: 'OAs', ok: ensayo.n_objetivos > 0, count: ensayo.n_objetivos },
            { label: 'Alumnos', ok: ensayo.n_alumnos > 0, count: ensayo.n_alumnos },
            { label: 'Preguntas', ok: ensayo.n_preguntas > 0, count: ensayo.n_preguntas },
            { label: 'Clave', ok: ensayo.n_pautas > 0, count: ensayo.n_pautas },
          ].map(({ label, ok, count }) => (
            <span key={label} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              ok
                ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
                : 'bg-slate-900/40 border-slate-800/40 text-slate-600'
            }`}>
              {ok ? `✓ ${label} (${count})` : `· ${label}`}
            </span>
          ))}
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
            ensayo.n_respuestas > 0
              ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
              : 'bg-amber-950/20 border-amber-900/30 text-amber-500'
          }`}>
            {ensayo.n_respuestas > 0 ? `✓ Hojas (${ensayo.n_respuestas})` : '⏳ Hojas pendientes'}
          </span>
        </div>
      </div>

      {/* Panel expandido */}
      {expandido && (
        <div className="px-5 pb-5">
          <EnsayoDetailPanel ensayoId={ensayo.id} onClose={() => setExpandido(false)} />
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function BentoGridKPIs({ ensayoSeleccionado }: BentoGridKPIsProps) {
  const [loadingStats, setLoadingStats] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [ensayos, setEnsayos] = useState<any[]>([])
  const [loadingEnsayos, setLoadingEnsayos] = useState(true)

  // Cargar ensayos SIMCE configurados
  useEffect(() => {
    getEnsayosSimce().then(res => {
      if (res.success) setEnsayos(res.data ?? [])
      setLoadingEnsayos(false)
    })
  }, [])

  // Cargar stats del ensayo seleccionado en el dropdown
  useEffect(() => {
    if (!ensayoSeleccionado) { setStats(null); return }
    const fetch = async () => {
      setLoadingStats(true); setStatsError(null)
      const res = await getCursoStats(ensayoSeleccionado.id)
      if (res.success) setStats(res.stats)
      else setStatsError(res.error || 'Error al cargar estadísticas.')
      setLoadingStats(false)
    }
    fetch()
  }, [ensayoSeleccionado])

  const getLogroBadgeColor = (level: string) => {
    switch (level) {
      case 'Adecuado': return 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
      case 'Elemental': return 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-400'
      default: return 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400'
    }
  }

  return (
    <div className="space-y-8">

      {/* ── Sección: Ensayos SIMCE configurados ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-200 tracking-tight">Ensayos SIMCE Configurados</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Doble clic en una tarjeta para ver el detalle completo.</p>
          </div>
        </div>

        {loadingEnsayos ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : ensayos.length === 0 ? (
          <div className="py-10 text-center rounded-2xl border border-slate-800/60 bg-slate-950/20">
            <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-xs text-slate-600">No hay ensayos configurados aún.</p>
            <p className="text-[11px] text-slate-700 mt-1">Ve a <span className="text-indigo-400">Herramientas → Nuevo Ensayo SIMCE</span> para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ensayos.map(e => <EnsayoSimceCard key={e.id} ensayo={e} />)}
          </div>
        )}
      </div>

      {/* ── Sección: KPIs del ensayo seleccionado en dropdown ── */}
      {ensayoSeleccionado && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-display">Resumen del Ensayo</h2>
              <p className="text-xs text-slate-400">Resultados para: <span className="font-semibold text-slate-300">{ensayoSeleccionado.nombre}</span></p>
            </div>
          </div>

          {loadingStats ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : statsError || !stats ? (
            <div className="flex flex-col items-center py-10 space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-xs text-slate-400">{statsError || 'No se pudieron calcular las estadísticas.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* KPI 1 */}
              <div className="relative md:col-span-2 overflow-hidden p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between h-48 group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/20 transition-all duration-500" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-400" /> Puntaje SIMCE Estimado
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-violet-950 border border-violet-800/30 text-violet-400 rounded-full uppercase">Estadístico</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-50 to-violet-300 font-display">
                      {stats.puntajePromedio || 250}
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">puntos</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Promedio proyectado sobre la escala SIMCE nacional (Mineduc).</p>
                </div>
              </div>

              {/* KPI 2 */}
              <div className="relative p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between h-48 group">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" /> Nivel de Logro
                </span>
                <div className="space-y-2">
                  <div className={`w-fit px-3 py-1.5 rounded-xl border bg-gradient-to-r font-extrabold text-sm tracking-wide ${getLogroBadgeColor(stats.nivelLogroPromedio)}`}>
                    {stats.nivelLogroPromedio}
                  </div>
                  <p className="text-[10px] text-slate-500">Nivel de desempeño mayoritario del curso.</p>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="relative p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between h-48 group">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" /> Cobertura
                </span>
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-extrabold tracking-tight text-slate-100 font-display">
                      {stats.totalAlumnos > 0 ? Math.round((stats.evaluados / stats.totalAlumnos) * 100) : 0}%
                    </h3>
                    <span className="text-[10px] text-slate-500">({stats.evaluados}/{stats.totalAlumnos})</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Alumnos evaluados sobre nómina total.</p>
                </div>
              </div>

              {/* Distribución */}
              <div className="md:col-span-3 p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-300">Distribución por Niveles</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Adecuado', count: stats.distribucion.adecuado, color: 'from-emerald-500 to-teal-400', textColor: 'text-emerald-400' },
                    { label: 'Elemental', count: stats.distribucion.elemental, color: 'from-amber-500 to-yellow-400', textColor: 'text-amber-400' },
                    { label: 'Insuficiente', count: stats.distribucion.insuficiente, color: 'from-rose-500 to-red-400', textColor: 'text-rose-400' },
                  ].map(({ label, count, color, textColor }) => (
                    <div key={label} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className={textColor}>{label}</span>
                        <span className="text-slate-400">{count} {count === 1 ? 'Alumno' : 'Alumnos'}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
                          style={{ width: `${stats.evaluados > 0 ? (count / stats.evaluados) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPI 4 */}
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between h-48 group">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" /> Omitidas
                </span>
                <div>
                  <h3 className="text-4xl font-extrabold tracking-tight text-slate-100 font-display">{stats.totalOmitidas}</h3>
                  <p className="text-[10px] text-slate-500 mt-2">Marcas vacías en las burbujas escaneadas.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
