'use client'

import { useEffect, useState } from 'react'
import { getGapsData } from '../actions'
import { 
  LineChart, 
  Loader2, 
  AlertCircle,
  TrendingDown,
  BookOpen,
  Award
} from 'lucide-react'

interface GapsChartProps {
  ensayoSeleccionado: any
}

export default function GapsChart({ ensayoSeleccionado }: GapsChartProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ensayoSeleccionado) {
      setData(null)
      return
    }

    const fetchGaps = async () => {
      setLoading(true)
      setError(null)
      const res = await getGapsData(ensayoSeleccionado.id)
      
      if (res.success) {
        setData(res)
      } else {
        setError(res.error || 'Error al cargar brechas pedagógicas.')
      }
      setLoading(false)
    }

    fetchGaps()
  }, [ensayoSeleccionado])

  if (!ensayoSeleccionado) {
    return (
      <div className="w-full h-96 flex flex-col justify-center items-center rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-xl p-8 text-center space-y-4">
        <LineChart className="w-12 h-12 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-300">No hay Ensayos Seleccionados</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Aún no se ha aplicado o procesado ningún ensayo SIMCE en este curso. Ve a la pestaña de **Carga & Gestión de Datos** para subir pautas y procesar respuestas.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-96 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="w-full h-96 flex flex-col justify-center items-center text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-xs text-slate-400">{error || 'No se pudieron calcular las brechas'}</p>
      </div>
    )
  }

  // Clases CSS para colorear las barras según rendimiento
  const getBarColor = (pct: number) => {
    if (pct >= 67) return 'from-emerald-600 to-emerald-400'
    if (pct >= 50) return 'from-amber-600 to-amber-400'
    return 'from-rose-600 to-rose-400'
  }

  const getPercentageColor = (pct: number) => {
    if (pct >= 67) return 'text-emerald-400'
    if (pct >= 50) return 'text-amber-400'
    return 'text-rose-400'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 font-display">Análisis de Brechas Pedagógicas</h1>
        <p className="text-xs text-slate-400">Desempeño del curso por Objetivos de Aprendizaje (OA) y habilidades evaluadas para: <span className="font-semibold text-slate-300">{ensayoSeleccionado.nombre}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Columna 1: Rendimiento por Objetivo de Aprendizaje (OA) */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-4">
            <div className="p-2 rounded-xl bg-violet-950/40 text-violet-400 border border-violet-800/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Objetivos de Aprendizaje (OA)</h3>
              <p className="text-[10px] text-slate-500">Ordenados de mayor a menor dificultad para el curso.</p>
            </div>
          </div>

          {data.oas.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No se encontraron Objetivos de Aprendizaje cargados para este ensayo.</p>
          ) : (
            <div className="space-y-6">
              {data.oas.map((oa: any) => (
                <div key={oa.codigo} className="space-y-2 group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold text-violet-400 uppercase">
                        {oa.codigo}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                        {oa.descripcion}
                      </p>
                    </div>
                    <span className={`text-sm font-black whitespace-nowrap ${getPercentageColor(oa.porcentaje)}`}>
                      {oa.porcentaje}% <span className="text-[10px] text-slate-600 font-semibold">Logro</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getBarColor(oa.porcentaje)} transition-all duration-500`}
                      style={{ width: `${oa.porcentaje}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Preguntas correctas: {oa.correctas} de {oa.total}</span>
                    {oa.porcentaje < 50 && (
                      <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> Requiere Reforzamiento
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna 2: Rendimiento por Habilidad Cognitiva */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-4">
            <div className="p-2 rounded-xl bg-indigo-950/40 text-indigo-400 border border-indigo-800/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Habilidades Cognitivas</h3>
              <p className="text-[10px] text-slate-500">Desempeño del curso según habilidades de razonamiento SIMCE.</p>
            </div>
          </div>

          {data.habilidades.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No se encontraron Habilidades registradas para este ensayo.</p>
          ) : (
            <div className="space-y-6">
              {data.habilidades.map((hab: any) => (
                <div key={hab.nombre} className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{hab.nombre}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        {hab.descripcion}
                      </p>
                    </div>
                    <span className={`text-sm font-black whitespace-nowrap ${getPercentageColor(hab.porcentaje)}`}>
                      {hab.porcentaje}% <span className="text-[10px] text-slate-600 font-semibold">Logro</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getBarColor(hab.porcentaje)} transition-all duration-500`}
                      style={{ width: `${hab.porcentaje}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>Preguntas correctas: {hab.correctas} de {hab.total}</span>
                    {hab.porcentaje < 50 && (
                      <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                        <TrendingDown className="w-3 h-3" /> Requiere Reforzamiento
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
