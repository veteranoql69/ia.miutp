'use client'

import { useEffect, useState } from 'react'
import { BarChart2, Users, ClipboardList, Plus, CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getEnsayosSimce } from '../actions'

export default function ToolsHub() {
  const [ensayos, setEnsayos] = useState<any[]>([])

  useEffect(() => {
    getEnsayosSimce().then(res => {
      if (res.success) setEnsayos(res.data ?? [])
    })
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Centro de Herramientas</h1>
        <p className="text-xs text-slate-500 mt-1">Gestión centralizada de programas y procesos académicos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* SIMCE */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col backdrop-blur-xl shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-indigo-950/60 border border-indigo-900/40 text-indigo-400 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="flex items-center text-[10px] font-bold text-indigo-400 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Activo
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-200">Ensayos SIMCE</h3>
            <p className="text-xs text-slate-500 mt-1">Configuración, simulación y seguimiento de resultados para la evaluación nacional.</p>
          </div>

          <Link
            href="/dashboard/herramientas/simce"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-900/30"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Ensayo SIMCE
          </Link>

          {/* Lista compacta de ensayos configurados */}
          {ensayos.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Configurados ({ensayos.length})</p>
              {ensayos.slice(0, 3).map(e => {
                const pasos = [e.n_objetivos > 0, e.n_alumnos > 0, e.n_preguntas > 0, e.n_pautas > 0]
                const completados = pasos.filter(Boolean).length
                const pct = Math.round((completados / 4) * 100)
                return (
                  <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-800/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-300 truncate">{e.nombre || `${e.nivel} ${e.letra}`}</p>
                      <p className="text-[10px] text-slate-500">{e.asignatura} · {pct}% configurado</p>
                    </div>
                    {e.n_respuestas > 0
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    }
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PIE — disabled */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col backdrop-blur-xl shadow-xl opacity-50 space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Pronto</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-400">Programa PIE</h3>
            <p className="text-xs text-slate-600 mt-1">Gestión de Programas de Integración Escolar y seguimiento de especialistas.</p>
          </div>
          <div className="w-full py-2.5 text-xs font-semibold text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed">Disponible próximamente</div>
        </div>

        {/* PME — disabled */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col backdrop-blur-xl shadow-xl opacity-50 space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-11 w-11 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Pronto</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-400">Planificaciones PME</h3>
            <p className="text-xs text-slate-600 mt-1">Elaboración y monitoreo del Plan de Mejoramiento Educativo institucional.</p>
          </div>
          <div className="w-full py-2.5 text-xs font-semibold text-center rounded-xl bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed">Disponible próximamente</div>
        </div>

      </div>
    </div>
  )
}
