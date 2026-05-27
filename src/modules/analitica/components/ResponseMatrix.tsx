'use client'

import { useEffect, useState } from 'react'
import { getMatrixData } from '../actions'
import { 
  Grid3X3, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  Search
} from 'lucide-react'

interface ResponseMatrixProps {
  ensayoSeleccionado: any
}

export default function ResponseMatrix({ ensayoSeleccionado }: ResponseMatrixProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Filtro de búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'nombre' | 'porcentaje'>('nombre')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (!ensayoSeleccionado) {
      setData(null)
      return
    }

    const fetchMatrix = async () => {
      setLoading(true)
      setError(null)
      const res = await getMatrixData(ensayoSeleccionado.id)
      
      if (res.success) {
        setData(res)
      } else {
        setError(res.error || 'Error al cargar matriz térmica.')
      }
      setLoading(false)
    }

    fetchMatrix()
  }, [ensayoSeleccionado])

  if (!ensayoSeleccionado) {
    return (
      <div className="w-full h-96 flex flex-col justify-center items-center rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-xl p-8 text-center space-y-4">
        <Grid3X3 className="w-12 h-12 text-slate-700" />
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
        <p className="text-xs text-slate-400">{error || 'No se pudo cargar la matriz'}</p>
      </div>
    )
  }

  // Manejo de ordenamiento
  const handleSort = (field: 'nombre' | 'porcentaje') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // Filtrado y Ordenamiento de estudiantes
  const filteredEstudiantes = (data.estudiantes || [])
    .filter((e: any) => e.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a: any, b: any) => {
      let comparison = 0
      if (sortBy === 'nombre') {
        comparison = a.nombre.localeCompare(b.nombre)
      } else {
        comparison = a.porcentajeLogro - b.porcentajeLogro
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Estilo térmico de la celda de respuestas
  const getCellClassName = (marcada: string, correcta: boolean) => {
    if (marcada === '') {
      return 'bg-slate-900/80 text-slate-600 border-slate-950 font-bold hover:bg-slate-900 transition-colors' // Omitida
    }
    if (correcta) {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold hover:bg-emerald-500/30 transition-colors'
    }
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold hover:bg-rose-500/30 transition-colors'
  }

  // Color del porcentaje de logro general
  const getLogroColor = (pct: number) => {
    if (pct >= 67) return 'text-emerald-400 font-extrabold'
    if (pct >= 33) return 'text-amber-400 font-semibold'
    return 'text-rose-400 font-bold'
  }

  // Color de logro de pregunta curso
  const getPreguntaLogroColor = (pct: number) => {
    if (pct >= 70) return 'text-emerald-400'
    if (pct >= 50) return 'text-amber-400'
    return 'text-rose-400 font-extrabold bg-rose-950/20 rounded-md border border-rose-500/20'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-display">Matriz de Logros (Mapa Térmico)</h1>
          <p className="text-xs text-slate-400">Resultados por alumno e ítem evaluado para: <span className="font-semibold text-slate-300">{ensayoSeleccionado.nombre}</span></p>
        </div>

        {/* Buscador */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar estudiante..."
              className="pl-9 pr-4 py-2 w-64 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"
            />
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-6 text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/30 border border-slate-900 p-4 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-emerald-500/30 bg-emerald-500/20" />
          <span>Respuesta Correcta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-rose-500/30 bg-rose-500/20" />
          <span>Respuesta Incorrecta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-slate-800 bg-slate-900" />
          <span>Omitida / En Blanco</span>
        </div>
      </div>

      {/* Contenedor Scrollable */}
      <div className="w-full rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/80">
                {/* Estudiante Header */}
                <th 
                  onClick={() => handleSort('nombre')}
                  className="p-4 font-semibold text-slate-400 cursor-pointer hover:text-slate-200 select-none min-w-[200px]"
                >
                  <div className="flex items-center gap-2">
                    Estudiante <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                
                {/* Porcentaje de Logro Header */}
                <th 
                  onClick={() => handleSort('porcentaje')}
                  className="p-4 font-semibold text-slate-400 cursor-pointer hover:text-slate-200 text-center select-none w-28 border-r border-slate-900"
                >
                  <div className="flex items-center justify-center gap-2">
                    % Logro <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>

                {/* Columnas de Preguntas */}
                {(data.preguntas || []).map((p: any) => (
                  <th 
                    key={p.id}
                    title={`P${p.numero_pregunta} | Correcta: ${p.alternativa_correcta} | OA: ${p.oa_codigo} | Habilidad: ${p.habilidad_nombre}`}
                    className="p-2 font-semibold text-slate-400 text-center select-none w-10 border-r border-slate-900/60 hover:bg-slate-900 cursor-help"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-[10px]">P{p.numero_pregunta}</span>
                      <span className="text-[8px] text-slate-500 font-bold bg-slate-900 px-1 rounded-sm mt-0.5 border border-slate-800">{p.alternativa_correcta}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-900">
              {filteredEstudiantes.map((est: any) => (
                <tr key={est.matricula_id} className="hover:bg-slate-900/20">
                  {/* Nombre Alumno */}
                  <td className="p-4 font-medium text-slate-200">
                    <div>
                      <p className="truncate max-w-[220px]">{est.nombre}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">{est.rut}</p>
                    </div>
                  </td>
                  
                  {/* Porcentaje Alumno */}
                  <td className={`p-4 text-center border-r border-slate-900 ${getLogroColor(est.porcentajeLogro)}`}>
                    {est.porcentajeLogro}%
                    <span className="text-[9px] text-slate-500 block">({est.correctas}/{est.total})</span>
                  </td>

                  {/* Respuestas de cada celda */}
                  {est.respuestas.map((r: any, idx: number) => {
                    const preguntaInfo = data.preguntas[idx]
                    return (
                      <td 
                        key={r.pregunta_id}
                        title={`${est.nombre}\nPregunta ${r.numero_pregunta}\nRespuesta marcada: ${r.respuesta_marcada || 'Omitida'}\nCorrecta: ${preguntaInfo?.alternativa_correcta}\nOA: ${preguntaInfo?.oa_codigo}\nHabilidad: ${preguntaInfo?.habilidad_nombre}`}
                        className="p-1.5 text-center border-r border-slate-900/40"
                      >
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs ${getCellClassName(r.respuesta_marcada, r.es_correcta)}`}>
                          {r.respuesta_marcada || '-'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Fila agregada: Logro del Curso por Pregunta */}
              <tr className="bg-slate-950/60 font-bold border-t-2 border-slate-900">
                <td className="p-4 text-slate-400 uppercase text-[10px] tracking-wider">Logro del Curso</td>
                <td className="p-4 text-center border-r border-slate-900 text-slate-500">-</td>
                
                {/* Porcentajes por pregunta */}
                {(data.preguntas || []).map((p: any) => (
                  <td 
                    key={p.id}
                    title={`Pregunta ${p.numero_pregunta} | Porcentaje de Logro del Curso: ${p.porcentajeLogro}%`}
                    className="p-1.5 text-center border-r border-slate-900/60"
                  >
                    <div className={`w-8 py-1 rounded flex items-center justify-center text-[10px] ${getPreguntaLogroColor(p.porcentajeLogro)}`}>
                      {p.porcentajeLogro}%
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
