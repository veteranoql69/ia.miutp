'use client'

import { useEffect, useState } from 'react'
import { BarChart2, Users, ClipboardList, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getEnsayosSimce } from '../actions'
import NivelCard from './NivelCard'

interface ToolsHubProps {
  colegioId: string
  userId: string
}

export default function ToolsHub({ colegioId, userId }: ToolsHubProps) {
  const [ensayos, setEnsayos] = useState<any[]>([])
  const [expandedEnsayoId, setExpandedEnsayoId] = useState<string | null>(null)
  const [cardWidths, setCardWidths] = useState<Record<string, 'compact' | 'normal' | 'wide'>>({})
  const [loading, setLoading] = useState(true)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchEnsayos = async (silent = false) => {
    if (!silent) setLoading(true)
    else setIsRefreshing(true)
    const res = await getEnsayosSimce(colegioId)
    if (res.success) {
      setEnsayos(res.data ?? [])
      // Inicializar anchos por defecto si no existen
      const defaultWidths: Record<string, 'compact' | 'normal' | 'wide'> = {}
      ;(res.data ?? []).forEach((e: any) => {
        defaultWidths[e.id] = cardWidths[e.id] || 'normal'
      })
      setCardWidths(prev => ({ ...defaultWidths, ...prev }))
    }
    setLoading(false)
    setIsRefreshing(false)
  }

  useEffect(() => {
    fetchEnsayos()
  }, [])

  const handleWidthChange = (ensayoId: string, width: 'compact' | 'normal' | 'wide') => {
    setCardWidths(prev => ({
      ...prev,
      [ensayoId]: width
    }))
  }

  // Si hay una tarjeta expandida, renderizamos el modo expandido exclusivo
  if (expandedEnsayoId) {
    const ensayoExpandido = ensayos.find(e => e.id === expandedEnsayoId)
    if (ensayoExpandido) {
      return (
        <NivelCard
          ensayo={ensayoExpandido}
          isExpanded={true}
          onExpand={() => {}}
          onCollapse={() => setExpandedEnsayoId(null)}
          width={cardWidths[ensayoExpandido.id] || 'normal'}
          onChangeWidth={(w) => handleWidthChange(ensayoExpandido.id, w)}
          onRefresh={() => fetchEnsayos(true)}
          isRefreshing={isRefreshing}
        />
      )
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Centro de Herramientas</h1>
        <p className="text-xs text-slate-500 mt-1">Gestión centralizada de programas y procesos académicos por nivel y cursos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        
        {/* SECCIÓN SIMCE */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-950/60 border border-indigo-900/40 text-indigo-400 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest">Ensayos SIMCE</h3>
            </div>
            
            <Link
              href="/dashboard/herramientas/simce"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-900/30"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Ensayo SIMCE
            </Link>
          </div>

          {loading ? (
            <div className="h-48 border border-slate-900 rounded-2xl flex items-center justify-center bg-slate-950/20">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Cargando ensayos...</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ensayos.map(e => (
                <NivelCard
                  key={e.id}
                  ensayo={e}
                  isExpanded={false}
                  onExpand={() => setExpandedEnsayoId(e.id)}
                  onCollapse={() => setExpandedEnsayoId(null)}
                  width={cardWidths[e.id] || 'normal'}
                  onChangeWidth={(w) => handleWidthChange(e.id, w)}
                  onRefresh={() => fetchEnsayos(true)}
                />
              ))}

              {ensayos.length === 0 && (
                <div className="col-span-full border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-950/10">
                  <BarChart2 className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-xs font-bold text-slate-400">No hay ensayos configurados</h4>
                  <p className="text-[10px] text-slate-650 mt-1 max-w-xs mx-auto">
                    Comienza configurando tu primer ensayo SIMCE cargando habilidades, nómina de alumnos y la clave de respuestas correctas.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/dashboard/herramientas/simce"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-300 transition-all"
                    >
                      <Plus className="w-3 h-3" /> Configurar Ensayo
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PIE — disabled */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col backdrop-blur-xl shadow-xl opacity-40 space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 text-slate-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full uppercase tracking-wider">Pronto</span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Programa PIE</h3>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">Gestión de Programas de Integración Escolar y seguimiento de especialistas.</p>
          </div>
          <div className="w-full py-2 text-[10px] font-bold text-center rounded-xl bg-slate-900 border border-slate-850 text-slate-600 cursor-not-allowed">Disponible próximamente</div>
        </div>

        {/* PME — disabled */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col backdrop-blur-xl shadow-xl opacity-40 space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-850 text-slate-500 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-full uppercase tracking-wider">Pronto</span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Planificaciones PME</h3>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">Elaboración y monitoreo del Plan de Mejoramiento Educativo institucional.</p>
          </div>
          <div className="w-full py-2 text-[10px] font-bold text-center rounded-xl bg-slate-900 border border-slate-850 text-slate-600 cursor-not-allowed">Disponible próximamente</div>
        </div>

      </div>
    </div>
  )
}
