'use client'

import { useState } from 'react'
import { BarChart2, Users, ClipboardList, CheckCircle2, Plus, Minimize2, Eye, ShieldCheck, Activity, TrendingUp, BookOpen, Download, Award, Layers, Loader2 } from 'lucide-react'
import AddCursoModal from './AddCursoModal'
import QueueConsole from './QueueConsole'

interface Curso {
  letra: string
  n_alumnos: number
  n_respuestas: number
}

interface Ensayo {
  id: string
  nombre: string
  nivel: string
  letra: string
  asignatura: string
  estado: string
  n_objetivos: number
  n_alumnos: number
  n_preguntas: number
  n_pautas: number
  cursos: Curso[]
}

interface NivelCardProps {
  ensayo: Ensayo
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
  width: 'compact' | 'normal' | 'wide'
  onChangeWidth: (w: 'compact' | 'normal' | 'wide') => void
  onRefresh: () => void
  isRefreshing?: boolean
}

export default function NivelCard({
  ensayo,
  isExpanded,
  onExpand,
  onCollapse,
  width,
  onChangeWidth,
  onRefresh,
  isRefreshing = false
}: NivelCardProps) {
  const [activeTab, setActiveTab] = useState<string>('consolidado')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isQueueOpen, setIsQueueOpen] = useState(false)

  // Encontrar datos del curso activo (para tabs de cursos individuales)
  const cursoActivo = ensayo.cursos.find(c => c.letra === activeTab) || ensayo.cursos[0] || {
    letra: ensayo.letra || 'A',
    n_alumnos: 0,
    n_respuestas: 0
  }

  // Clases de ancho para el modo minimizado
  const widthClasses = {
    compact: 'col-span-1 md:col-span-1 lg:col-span-1',
    normal: 'col-span-1 md:col-span-2 lg:col-span-1',
    wide: 'col-span-1 md:col-span-2 lg:col-span-2'
  }

  const stepsCompleted = [
    ensayo.n_objetivos > 0,
    ensayo.n_alumnos > 0,
    ensayo.n_preguntas > 0,
    ensayo.n_pautas > 0
  ].filter(Boolean).length

  const configProgress = Math.round((stepsCompleted / 4) * 100)

  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar que haga expand si se hace click en controles interactivos
    const target = e.target as HTMLElement
    if (target.closest('.no-expand')) return
    if (!isExpanded) {
      onExpand()
    }
  }

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in">
        <div className="w-full max-w-5xl h-[85vh] rounded-3xl bg-slate-900/90 border border-indigo-500/20 shadow-2xl flex flex-col backdrop-blur-2xl overflow-hidden nivel-card-expanding">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-800/80 bg-slate-950/30 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-950/60 border border-indigo-900/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/35">
                <BarChart2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-full">
                  NIVEL: {ensayo.nivel.replace('-', '° ').toUpperCase()}
                </span>
                <h2 className="text-xl font-bold text-slate-100 mt-1">{ensayo.nombre}</h2>
                <p className="text-xs text-slate-500 font-medium">Asignatura: {ensayo.asignatura} · Configuración: {configProgress}% completa</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isRefreshing && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold bg-indigo-950/40 border border-indigo-900/30 px-3 py-1.5 rounded-xl">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Actualizando...
                </div>
              )}
              <button
                onClick={onCollapse}
                className="h-10 w-10 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-md"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader: Tabs de Consolidado + Cursos */}
          <div className="flex items-center justify-between px-6 md:px-8 py-3 border-b border-slate-800/60 bg-slate-950/15">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-hide">
              {/* Tab Consolidado — siempre primero */}
              <button
                onClick={() => setActiveTab('consolidado')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'consolidado'
                    ? 'bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-900/30'
                    : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Resumen del Nivel
              </button>

              {/* Tab por cada curso */}
              {ensayo.cursos.map(c => (
                <button
                  key={c.letra}
                  onClick={() => setActiveTab(c.letra)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    activeTab === c.letra
                      ? 'bg-slate-700 border border-slate-600 text-white shadow-md'
                      : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Curso {c.letra}
                </button>
              ))}

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-950/80 border border-dashed border-indigo-500/30 text-indigo-400 hover:text-indigo-300 hover:border-indigo-500/60 flex items-center gap-1 transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Curso
              </button>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0 ml-4">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Pauta, OAs y Preguntas validadas con IA</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

            {/* ===== TAB: CONSOLIDADO DEL NIVEL ===== */}
            {activeTab === 'consolidado' && (() => {
              const totalAlumnos = ensayo.cursos.reduce((acc, c) => acc + c.n_alumnos, 0)
              const totalRespuestas = ensayo.cursos.reduce((acc, c) => acc + c.n_respuestas, 0)
              const progresoGlobal = totalAlumnos > 0 ? Math.round((totalRespuestas / totalAlumnos) * 100) : 0
              const totalCursos = ensayo.cursos.length

              return (
                <div className="space-y-8">

                  {/* ── KPIs Consolidados ── */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Matrícula */}
                    <div className="bg-gradient-to-br from-indigo-950/60 to-slate-950/40 border border-indigo-900/30 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-y-8 translate-x-8" />
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">Matrícula Total</span>
                        <div className="h-8 w-8 rounded-xl bg-indigo-950/80 border border-indigo-900/50 text-indigo-400 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-4xl font-extrabold text-slate-100 tracking-tight">{totalAlumnos}</h4>
                        <p className="text-xs text-indigo-300/60 mt-1.5 font-medium">Alumnos en {totalCursos} curso{totalCursos !== 1 ? 's' : ''} del nivel</p>
                      </div>
                    </div>

                    {/* Total Hojas Procesadas */}
                    <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950/40 border border-emerald-900/30 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8" />
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Hojas Procesadas</span>
                        <div className="h-8 w-8 rounded-xl bg-emerald-950/80 border border-emerald-900/50 text-emerald-400 flex items-center justify-center">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-4xl font-extrabold text-slate-100 tracking-tight">
                          {totalRespuestas}
                          <span className="text-sm font-semibold text-slate-500 ml-1">/ {totalAlumnos}</span>
                        </h4>
                        <p className="text-xs text-emerald-300/60 mt-1.5 font-medium">Digitación a nivel institucional</p>
                      </div>
                    </div>

                    {/* Progreso Global con anillo visual */}
                    <div className="bg-gradient-to-br from-slate-900/80 to-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Avance Global</span>
                        <div className="h-8 w-8 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-end gap-4">
                        <div>
                          <h4 className={`text-4xl font-extrabold tracking-tight ${
                            progresoGlobal >= 80 ? 'text-emerald-400' :
                            progresoGlobal >= 40 ? 'text-amber-400' : 'text-indigo-400'
                          }`}>{progresoGlobal}%</h4>
                          <p className="text-xs text-slate-500 mt-1.5 font-medium">Carga total del nivel completada</p>
                        </div>
                        {/* Mini barra circular SVG */}
                        <div className="ml-auto shrink-0">
                          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="15" fill="none"
                              stroke={progresoGlobal >= 80 ? '#34d399' : progresoGlobal >= 40 ? '#f59e0b' : '#818cf8'}
                              strokeWidth="3"
                              strokeDasharray={`${(progresoGlobal / 100) * 94.2} 94.2`}
                              strokeLinecap="round"
                              className="transition-all duration-700"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Comparador Visual de Cursos ── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        Comparador de Avance por Curso
                      </h4>
                      <span className="text-[10px] text-slate-600 font-medium">Hojas procesadas / matrícula</span>
                    </div>

                    <div className="bg-slate-950/30 border border-slate-900/80 rounded-2xl p-5 space-y-4">
                      {ensayo.cursos.length > 0 ? ensayo.cursos.map((c, idx) => {
                        const pct = c.n_alumnos > 0 ? Math.round((c.n_respuestas / c.n_alumnos) * 100) : 0
                        const colors = [
                          { bar: 'from-indigo-500 to-indigo-400', label: 'text-indigo-400', bg: 'bg-indigo-950/30 border-indigo-900/30' },
                          { bar: 'from-violet-500 to-violet-400', label: 'text-violet-400', bg: 'bg-violet-950/30 border-violet-900/30' },
                          { bar: 'from-cyan-500 to-cyan-400', label: 'text-cyan-400', bg: 'bg-cyan-950/30 border-cyan-900/30' },
                          { bar: 'from-fuchsia-500 to-fuchsia-400', label: 'text-fuchsia-400', bg: 'bg-fuchsia-950/30 border-fuchsia-900/30' },
                        ]
                        const color = colors[idx % colors.length]
                        return (
                          <div key={c.letra} className="space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className={`h-5 w-5 rounded-lg text-[9px] font-extrabold flex items-center justify-center border ${color.bg} ${color.label}`}>{c.letra}</span>
                                <span className="font-bold text-slate-300">Curso {c.letra}</span>
                                <span className="text-slate-600 font-medium">· {c.n_alumnos} alumnos</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`font-extrabold ${color.label}`}>{pct}%</span>
                                <span className="text-slate-600">{c.n_respuestas}/{c.n_alumnos}</span>
                              </div>
                            </div>
                            {/* Barra de progreso con degrade */}
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-900/80">
                              <div
                                className={`h-full bg-gradient-to-r ${color.bar} rounded-full transition-all duration-700`}
                                style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
                              />
                            </div>

                            {/* Indicadores de configuración del curso */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {[
                                { label: 'OAs', ok: ensayo.n_objetivos > 0, count: ensayo.n_objetivos },
                                { label: 'Alumnos', ok: c.n_alumnos > 0, count: c.n_alumnos },
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
                                c.n_respuestas > 0
                                  ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
                                  : 'bg-amber-950/20 border-amber-900/30 text-amber-500'
                              }`}>
                                {c.n_respuestas > 0 ? `✓ Hojas (${c.n_respuestas})` : '⌛ Hojas pendientes'}
                              </span>
                            </div>
                          </div>
                        )
                      }) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-slate-600 font-medium">No hay cursos registrados aún.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Resumen Curricular Compartido ── */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      Configuración Curricular del Nivel
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Datos técnicos */}
                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 space-y-3">
                        <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Contenidos del Ensayo</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="space-y-0.5">
                            <p className="text-slate-500">Objetivos Evaluados</p>
                            <p className="text-2xl font-extrabold text-indigo-400">{ensayo.n_objetivos}</p>
                            <p className="text-[10px] text-slate-600">OAs del nivel</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-slate-500">Preguntas</p>
                            <p className="text-2xl font-extrabold text-slate-200">{ensayo.n_preguntas}</p>
                            <p className="text-[10px] text-slate-600">ítems del cuadernillo</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-slate-500">Claves de Respuesta</p>
                            <p className="text-2xl font-extrabold text-emerald-400">{ensayo.n_pautas}</p>
                            <p className="text-[10px] text-slate-600">ítems en pauta</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-slate-500">Asignatura</p>
                            <p className="text-sm font-extrabold text-slate-200 mt-1">{ensayo.asignatura}</p>
                            <p className="text-[10px] text-slate-600">área evaluada</p>
                          </div>
                        </div>
                      </div>

                      {/* Estado diagnóstico + nota analítica */}
                      <div className="bg-gradient-to-br from-indigo-950/20 to-slate-950/40 border border-indigo-900/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/3 rounded-2xl" />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-indigo-400" />
                            <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest">Nota Diagnóstica</p>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Los OAs, habilidades, preguntas del cuadernillo y la pauta de corrección son <span className="text-slate-200 font-semibold">comunes a todos los cursos</span> del nivel {ensayo.nivel.replace('-', '° ')}. El análisis comparativo de brechas curriculares entre cursos se generará automáticamente al procesar las hojas de respuesta.
                          </p>
                          <div className="mt-4 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-emerald-400 font-bold">Configuración validada por IA · Lista para carga</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Acciones Globales ── */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-900/60">
                    <button
                      disabled
                      title="Disponible cuando se carguen hojas de respuesta"
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/60 border border-slate-800/60 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed opacity-60"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar Consolidado Excel (Sprint 3)
                    </button>
                    <button
                      disabled
                      title="Disponible cuando se carguen hojas de respuesta"
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/60 border border-slate-800/60 text-slate-500 text-xs font-bold rounded-xl cursor-not-allowed opacity-60"
                    >
                      <Download className="w-3.5 h-3.5" /> Imprimir Informes por Alumno (Sprint 3)
                    </button>
                  </div>

                </div>
              )
            })()}

            {/* ===== TAB: CURSO INDIVIDUAL ===== */}
            {activeTab !== 'consolidado' && (() => {
              return (
                <div className="space-y-8">
                  {/* Grid de Resumen del Curso */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Alumnos */}
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matrícula Curso {cursoActivo.letra}</span>
                        <Users className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-3xl font-extrabold text-slate-100">{cursoActivo.n_alumnos}</h4>
                        <p className="text-xs text-slate-500 mt-1">Estudiantes inscritos en nómina.</p>
                      </div>
                    </div>

                    {/* Hojas Procesadas */}
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hojas Procesadas</span>
                        <ClipboardList className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-3xl font-extrabold text-slate-100">
                          {cursoActivo.n_respuestas} <span className="text-xs font-semibold text-slate-500">/ {cursoActivo.n_alumnos}</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Hojas de respuestas escaneadas e indexadas.</p>
                      </div>
                    </div>

                    {/* Progreso del Curso */}
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Digitación</span>
                        <Activity className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-3xl font-extrabold text-indigo-400">
                          {cursoActivo.n_alumnos > 0 ? Math.round((cursoActivo.n_respuestas / cursoActivo.n_alumnos) * 100) : 0}%
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Progreso total de carga y validación.</p>
                      </div>
                    </div>
                  </div>

                  {/* Panel de carga de hojas */}
                  <div className="border border-slate-800/80 bg-slate-950/20 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-indigo-400 flex items-center justify-center shadow-md">
                      <ClipboardList className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-sm font-bold text-slate-200">Analítica y Carga de Hojas de Respuesta</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-2">
                        El panel estadístico, la matriz de respuestas por OA y el gráfico de brechas curriculares se activarán al procesar y subir las hojas de respuesta del <strong className="text-slate-300">Curso {cursoActivo.letra}</strong>.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setIsQueueOpen(true)}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-900/30"
                      >
                        <Plus className="w-3.5 h-3.5" /> Cargar Hojas de Respuesta
                      </button>
                    </div>
                  </div>

                  {/* Resumen Técnico Compartido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-850">
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Información del Ensayo (Común al Nivel)</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/40 border border-slate-900 rounded-xl p-4">
                        <div>
                          <p className="text-slate-500">Objetivos Evaluados</p>
                          <p className="text-slate-200 font-bold mt-0.5">{ensayo.n_objetivos} OAs</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Total Preguntas</p>
                          <p className="text-slate-200 font-bold mt-0.5">{ensayo.n_preguntas} ítems</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Pauta de Claves</p>
                          <p className="text-slate-200 font-bold mt-0.5">{ensayo.n_pautas} cargadas</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Asignatura</p>
                          <p className="text-slate-200 font-bold mt-0.5">{ensayo.asignatura}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Estado del Diagnóstico</h4>
                      <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-900 rounded-xl p-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">Configuración completa y validada</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">El ensayo está listo para recibir el escaneo de respuestas.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isQueueOpen && (
                    <QueueConsole
                      ensayoId={ensayo.id}
                      cursoLetra={cursoActivo.letra}
                      onClose={() => setIsQueueOpen(false)}
                      onSuccess={onRefresh}
                    />
                  )}
                </div>
              )
            })()}
          </div>
        </div>

        {/* Modal de Carga de Cursos */}
        <AddCursoModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          ensayoId={ensayo.id}
          existingLetras={ensayo.cursos.map(c => c.letra)}
          onSuccess={() => {
            onRefresh()
            setIsAddModalOpen(false)
          }}
        />
      </div>
    )
  }

  // RENDER MODO MINIMIZADO
  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between backdrop-blur-xl shadow-xl hover:border-indigo-500/30 hover:shadow-indigo-950/15 cursor-pointer transition-all duration-300 ${
        widthClasses[width]
      }`}
    >
      <div className="space-y-4">
        {/* Header de Tarjeta */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/50 border border-indigo-900/30 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded-md border border-indigo-900/40">
                {ensayo.nivel.replace('-', '° ')}
              </span>
              <h3 className="text-xs font-bold text-slate-200 truncate max-w-[130px] mt-1" title={ensayo.nombre}>
                {ensayo.nombre}
              </h3>
            </div>
          </div>

          {/* Botones de Ancho (no-expand) */}
          <div className="no-expand flex items-center bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onChangeWidth('compact')}
              title="Compacto"
              className={`p-1 rounded text-[10px] font-bold ${
                width === 'compact' ? 'bg-slate-850 text-indigo-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              C
            </button>
            <button
              onClick={() => onChangeWidth('normal')}
              title="Normal"
              className={`p-1 rounded text-[10px] font-bold ${
                width === 'normal' ? 'bg-slate-850 text-indigo-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              N
            </button>
            <button
              onClick={() => onChangeWidth('wide')}
              title="Ancho"
              className={`p-1 rounded text-[10px] font-bold ${
                width === 'wide' ? 'bg-slate-850 text-indigo-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              A
            </button>
          </div>
        </div>

        {/* Resumen por Cursos (Nóminas cargadas) */}
        <div className="space-y-2.5 pt-1.5">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-600">Cursos asociados</p>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {ensayo.cursos.map(c => {
              const digitadasPct = c.n_alumnos > 0 ? Math.round((c.n_respuestas / c.n_alumnos) * 100) : 0
              return (
                <div key={c.letra} className="space-y-1 bg-slate-900/30 border border-slate-900/40 rounded-xl p-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-slate-300">Curso {c.letra}</span>
                    <span className="text-slate-500 font-medium">{c.n_alumnos} alumnos</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        c.n_respuestas > 0 ? 'bg-indigo-500' : 'bg-slate-800'
                      }`}
                      style={{ width: `${Math.max(c.n_alumnos > 0 ? (c.n_respuestas / c.n_alumnos) * 100 : 0, 5)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-600 font-medium">
                    <span>Carga: {digitadasPct}%</span>
                    <span>{c.n_respuestas} de {c.n_alumnos} hojas</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer Tarjeta */}
      <div className="no-expand flex items-center justify-between pt-4 mt-4 border-t border-slate-900/60">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Agregar curso
        </button>
        
        <button
          onClick={onExpand}
          className="text-[10px] font-bold text-slate-400 hover:text-slate-200 flex items-center gap-0.5 transition-colors"
        >
          <Eye className="w-3 h-3" /> Ver detalle
        </button>
      </div>

      {/* Modal de Carga de Cursos */}
      <AddCursoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        ensayoId={ensayo.id}
        existingLetras={ensayo.cursos.map(c => c.letra)}
        onSuccess={() => {
          onRefresh()
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}
