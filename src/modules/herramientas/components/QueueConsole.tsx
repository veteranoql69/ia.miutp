'use client'

import { useState, useEffect } from 'react'
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle2, X, AlertTriangle, Eye, ArrowRight, ShieldAlert, Sparkles, Check } from 'lucide-react'
import { processSingleAnswerSheetAction, getAlumnosCursoLetraAction, resolveConflictAction, getEnsayoPautasAction } from '@/modules/procesamiento/visionActions'

interface QueueConsoleProps {
  ensayoId: string
  cursoLetra: string
  onClose: () => void
  onSuccess: () => void
}

interface QueueItem {
  id: string
  file: File
  previewUrl: string
  status: 'pending' | 'processing' | 'success' | 'conflict' | 'error'
  error?: string
  result?: {
    matched: boolean
    studentName?: string
    alumnoId?: string
    conflictoId?: string
    localConflict?: boolean
    nombreDetectado?: string
    cursoDetectado?: string
    correctas?: number
    total?: number
    porcentajeLogro?: number
    reason?: string
    urlImagenEvidencia?: string
    respuestasExtraidas?: any[]
  }
}

export default function QueueConsole({ ensayoId, cursoLetra, onClose, onSuccess }: QueueConsoleProps) {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [alumnosList, setAlumnosList] = useState<any[]>([])
  const [loadingAlumnos, setLoadingAlumnos] = useState(true)
  const [activeReviewItem, setActiveReviewItem] = useState<QueueItem | null>(null)
  const [pautas, setPautas] = useState<{ numero_pregunta: number; alternativa_correcta: string }[]>([])
  const [editedAnswers, setEditedAnswers] = useState<{ numero_pregunta: number; alternativa_marcada: string | null }[]>([])
  const [zoom, setZoom] = useState(1.2)
  
  // Conflict / Correction state
  const [selectedAlumnoId, setSelectedAlumnoId] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolveError, setResolveError] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  // Resizing state
  const [drawerWidth, setDrawerWidth] = useState(550)
  const [isDragging, setIsDragging] = useState(false)

  // Resizing effect
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('.nivel-card-expanding')
      if (container) {
        const containerRect = container.getBoundingClientRect()
        const containerWidth = containerRect.width
        const newWidth = containerRect.right - e.clientX
        // Constrain width between 340px and maximum container width
        setDrawerWidth(Math.max(340, Math.min(newWidth, containerWidth)))
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Panning state for zoomed image
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Panning effect
  useEffect(() => {
    if (!isPanning) return

    const handleMouseMove = (e: MouseEvent) => {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isPanning, panStart])

  // Reset pan offset on active sheet or zoom changes
  useEffect(() => {
    setPanPosition({ x: 0, y: 0 })
  }, [activeReviewItem, zoom])

  // Cargar nómina del curso y la pauta de corrección
  useEffect(() => {
    getAlumnosCursoLetraAction(ensayoId, cursoLetra).then(res => {
      if (res.success) {
        setAlumnosList(res.data || [])
      }
      setLoadingAlumnos(false)
    })
    getEnsayoPautasAction(ensayoId).then(res => {
      if (res.success) {
        setPautas(res.data || [])
      }
    })
  }, [ensayoId, cursoLetra])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    addFilesToQueue(filesArray)
  }

  const addFilesToQueue = (files: File[]) => {
    const newItems = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending' as const
    }))
    setQueue(prev => [...prev, ...newItems])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
      addFilesToQueue(filesArray)
    }
  }

  const startProcessing = async () => {
    if (isProcessing) return
    setIsProcessing(true)

    // Procesamos de forma secuencial una a una
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      if (item.status !== 'pending' && item.status !== 'error') continue

      // Actualizar a procesando
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing' } : q))

      const formData = new FormData()
      formData.append('file', item.file)

      try {
        const res = await processSingleAnswerSheetAction(formData, ensayoId, cursoLetra)
        if (res.success) {
          if (res.matched) {
            setQueue(prev => prev.map(q => q.id === item.id ? { 
              ...q, 
              status: 'success', 
              result: res as any 
            } : q))
          } else {
            setQueue(prev => prev.map(q => q.id === item.id ? { 
              ...q, 
              status: 'conflict', 
              result: res as any 
            } : q))
          }
        } else {
          setQueue(prev => prev.map(q => q.id === item.id ? { 
            ...q, 
            status: 'error', 
            error: res.error || 'Error desconocido' 
          } : q))
        }
      } catch (err: any) {
        setQueue(prev => prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'error', 
          error: err.message || 'Error de conexión' 
        } : q))
      }
      
      // Gatillar actualización del dashboard
      onSuccess()
    }
    
    setIsProcessing(false)
  }

  const handleSaveCorrection = async () => {
    if (!activeReviewItem || !selectedAlumnoId) return
    setIsResolving(true)
    setResolveError('')

    try {
      const res = await resolveConflictAction({
        conflictoId: activeReviewItem.result?.conflictoId,
        ensayoId,
        alumnoId: selectedAlumnoId,
        respuestas: editedAnswers,
        originalAlumnoId: activeReviewItem.result?.alumnoId
      })

      if (res.success) {
        const alumnoObj = alumnosList.find(a => a.id === selectedAlumnoId)
        
        // Calcular porcentaje de logro en caliente en base a la pauta
        const correctas = editedAnswers.filter(r => {
          const p = pautas.find((pauta: any) => pauta.numero_pregunta === r.numero_pregunta)
          return p && r.alternativa_marcada === p.alternativa_correcta
        }).length
        const total = pautas.length > 0 ? pautas.length : editedAnswers.length
        const porcentajeLogro = total > 0 ? Math.round((correctas / total) * 100) : 0

        // Actualizar item de la cola
        setQueue(prev => prev.map(q => q.id === activeReviewItem.id ? {
          ...q,
          status: 'success',
          result: {
            ...q.result,
            matched: true,
            studentName: alumnoObj?.nombre_completo || 'Revisado',
            alumnoId: selectedAlumnoId,
            correctas,
            total,
            porcentajeLogro,
            respuestasExtraidas: editedAnswers
          }
        } : q))

        setActiveReviewItem(null)
        setSelectedAlumnoId('')
        onSuccess()
      } else {
        setResolveError(res.error || 'Fallo al guardar la corrección.')
      }
    } catch (err: any) {
      setResolveError(err.message || 'Error inesperado.')
    } finally {
      setIsResolving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-800 text-slate-400 uppercase">En cola</span>
      case 'processing':
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-indigo-950/60 border border-indigo-900/35 text-indigo-400 uppercase flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Escaneando
          </span>
        )
      case 'success':
        return <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 uppercase flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Listo</span>
      case 'conflict':
        return <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-950/40 border border-amber-900/40 text-amber-400 uppercase flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Conflicto</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-rose-950/40 border border-rose-900/40 text-rose-400 uppercase">Error</span>
    }
  }

  const processedCount = queue.filter(q => q.status === 'success' || q.status === 'conflict' || q.status === 'error').length
  const totalCount = queue.length
  const progressPct = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0

  const filteredAlumnos = alumnosList.filter(a => 
    a.nombre_completo.toLowerCase().includes(filterSearch.toLowerCase()) || 
    (a.rut && a.rut.includes(filterSearch))
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-4xl h-[85vh] overflow-hidden rounded-3xl bg-slate-900/90 border border-indigo-500/20 shadow-2xl backdrop-blur-2xl flex flex-col nivel-card-expanding">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-950/60 border border-indigo-900/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-950/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Carga Activa de Respuestas — Curso {cursoLetra}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sube imágenes de las hojas para procesamiento IA de marcas y autocalificación.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left panel: Upload dropzone & progress */}
          <div className="w-full md:w-2/5 p-6 border-r border-slate-800/60 flex flex-col justify-between bg-slate-950/15 overflow-y-auto">
            <div className="space-y-6">
              {/* Dropzone */}
              <label 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-950/20 hover:bg-slate-950/40 hover:border-indigo-500/40 transition-all cursor-pointer group"
              >
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 mb-3 transition-colors" />
                <p className="text-xs text-slate-300 font-bold">Arrastra imágenes o Haz Clic</p>
                <p className="text-[10px] text-slate-550 mt-1 max-w-[200px]">Carga fotos de hojas de respuestas (JPG, PNG)</p>
              </label>

              {/* Roster Match Warning Banner */}
              {queue.length > 0 && (
                <div className={`p-3 rounded-xl border text-[10px] font-bold flex items-center gap-2 ${
                  queue.length === alumnosList.length
                    ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                    : 'bg-amber-950/25 border-amber-900/30 text-amber-400'
                }`}>
                  {queue.length === alumnosList.length ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-450" />
                      <span>Coincide con la nómina ({alumnosList.length} alumnos).</span>
                    </>
                  ) : queue.length < alumnosList.length ? (
                    <>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-450 animate-pulse" />
                      <span>Faltan hojas (Cargadas: {queue.length} / Nómina: {alumnosList.length}).</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-450 animate-pulse" />
                      <span>Exceso de hojas (Cargadas: {queue.length} / Nómina: {alumnosList.length}).</span>
                    </>
                  )}
                </div>
              )}

              {/* Progress metrics */}
              {queue.length > 0 && (
                <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400">Progreso de digitalización</span>
                    <span className="font-extrabold text-indigo-400">{processedCount} / {totalCount}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-900/60">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="bg-slate-900/40 rounded-xl p-2 border border-slate-850">
                      <p className="text-xs font-black text-slate-200">{queue.filter(q => q.status === 'pending').length}</p>
                      <p className="text-[8px] text-slate-500 uppercase font-bold">Cola</p>
                    </div>
                    <div className="bg-emerald-950/10 rounded-xl p-2 border border-emerald-900/10">
                      <p className="text-xs font-black text-emerald-400">{queue.filter(q => q.status === 'success').length}</p>
                      <p className="text-[8px] text-emerald-500 uppercase font-bold">Listos</p>
                    </div>
                    <div className="bg-amber-950/10 rounded-xl p-2 border border-amber-900/10">
                      <p className="text-xs font-black text-amber-400">{queue.filter(q => q.status === 'conflict').length}</p>
                      <p className="text-[8px] text-emerald-500 uppercase font-bold">Conflictos</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Launch button */}
            <div className="pt-6 border-t border-slate-850">
              <button
                onClick={startProcessing}
                disabled={queue.length === 0 || isProcessing || queue.every(q => q.status === 'success')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-600 disabled:opacity-50 text-xs font-extrabold text-white rounded-xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando Hojas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Iniciar Lectura por IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Active processing queue list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Cola de Hojas ({queue.length})</h4>
              {queue.length > 0 && (
                <span className="text-[9px] text-slate-500 font-bold">Haz clic en una tarjeta para revisar/corregir</span>
              )}
            </div>
            
            {queue.length === 0 ? (
              <div className="h-60 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-slate-950/5">
                <FileText className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Sube imágenes para ver la cola de procesamiento activo aquí.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      if (item.status === 'success' || item.status === 'conflict' || item.status === 'error') {
                        setActiveReviewItem(item)
                        setFilterSearch(item.result?.studentName || item.result?.nombreDetectado || '')
                        setSelectedAlumnoId(item.result?.alumnoId || '')
                        
                        const rawRespuestas = item.result?.respuestasExtraidas || []
                        setEditedAnswers(
                          rawRespuestas.map((r: any) => ({
                            numero_pregunta: r.numero_pregunta,
                            alternativa_marcada: r.alternativa_marcada
                          }))
                        )
                        setZoom(1.2)
                        setResolveError('')
                      }
                    }}
                    className={`p-4 border rounded-2xl flex items-start gap-4 transition-all ${
                      item.status === 'success' ? 'bg-emerald-950/10 border-emerald-900/20 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-950/20' :
                      item.status === 'conflict' ? 'bg-amber-950/10 border-amber-900/25 shadow-md shadow-amber-950/5 cursor-pointer hover:border-amber-500/50 hover:bg-amber-950/20' :
                      item.status === 'processing' ? 'bg-indigo-950/10 border-indigo-900/30' :
                      item.status === 'error' ? 'bg-rose-950/10 border-rose-900/20 cursor-pointer hover:border-rose-500/50 hover:bg-rose-950/20' : 'bg-slate-950/30 border-slate-850'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-200 truncate">{item.file.name}</p>
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Display parsing results */}
                      {item.status === 'success' && item.result && (
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                          <p className="truncate pr-2">
                            Alumno: <span className="font-extrabold text-slate-200">{item.result.studentName}</span>
                          </p>
                          <p className="text-emerald-400 font-extrabold bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded-md shrink-0">
                            Logro: {item.result.porcentajeLogro}% ({item.result.correctas}/{item.result.total})
                          </p>
                        </div>
                      )}

                      {item.status === 'conflict' && item.result && (
                        <div className="mt-2 space-y-2">
                          <p className="text-[10px] text-amber-400 leading-relaxed font-semibold">
                            {item.result.reason}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 underline">
                            <ShieldAlert className="w-3.5 h-3.5" /> Resolver discrepancia
                          </span>
                        </div>
                      )}

                      {item.status === 'error' && (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[10px] text-rose-400 font-semibold">{item.error}</p>
                          <span className="text-[10px] font-bold text-indigo-400 underline">
                            Corregir manualmente
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Panel for reviewing & correcting answers (Slides from right, leaves upload/progress panel visible) */}
          {activeReviewItem && (
            <div 
              style={{ width: `${drawerWidth}px`, maxWidth: '100%' }}
              className="absolute inset-y-0 right-0 bg-slate-900 border-l border-slate-800 shadow-2xl z-30 flex flex-col animate-slide-in-right"
            >
              {/* Drag handle to resize panel */}
              <div 
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                className={`absolute top-0 bottom-0 left-0 w-2 -translate-x-1/2 cursor-col-resize hover:bg-indigo-500/40 active:bg-indigo-500 transition-colors z-40 ${
                  isDragging ? 'bg-indigo-500' : 'bg-transparent'
                }`}
                title="Arrastra para ajustar el ancho"
              />
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/40">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4.5 h-4.5 text-indigo-400" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">Visualizador y Corrección Manual</h3>
                    <p className="text-[9px] text-slate-500 mt-0.5">Archivo: {activeReviewItem.file.name}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setActiveReviewItem(null)
                    setSelectedAlumnoId('')
                    setResolveError('')
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Split panel inside Drawer */}
              <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
                {/* Left: Image scan with Zoom */}
                <div className="w-full sm:w-[45%] p-4 border-r border-slate-800/60 bg-slate-950/30 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hoja Escaneada</p>
                    
                    {/* Zoom and Pan controllers */}
                    <div className="flex items-center gap-2">
                      {(panPosition.x !== 0 || panPosition.y !== 0) && (
                        <button
                          type="button"
                          onClick={() => setPanPosition({ x: 0, y: 0 })}
                          className="px-2 py-0.5 rounded bg-indigo-950/65 border border-indigo-900/40 text-indigo-400 text-[8px] font-black uppercase hover:bg-indigo-900/45 transition-colors"
                        >
                          Restaurar Vista
                        </button>
                      )}
                      <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded-lg">
                        <span className="text-[9px] text-slate-400 font-bold">{zoom.toFixed(1)}x</span>
                        <input 
                          type="range" 
                          min="1" 
                          max="3" 
                          step="0.1" 
                          value={zoom} 
                          onChange={e => setZoom(parseFloat(e.target.value))}
                          className="w-16 accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div 
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setIsPanning(true)
                      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y })
                    }}
                    style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                    className="flex-1 rounded-xl border border-slate-800 overflow-hidden bg-slate-950 flex justify-center items-center p-2 relative select-none"
                  >
                    <div 
                      className="transition-transform duration-75 ease-out origin-center"
                      style={{ transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={activeReviewItem.previewUrl} 
                        alt="Hoja Escaneada" 
                        className="max-w-full h-auto max-h-[60vh] object-contain rounded-lg pointer-events-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Resolve & Edit answers */}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-between bg-slate-900/10">
                  <div className="space-y-4">
                    
                    {/* Metadata and AI read status */}
                    <div 
                      onClick={() => {
                        setFilterSearch('')
                        const inputEl = document.querySelector('input[placeholder="Buscar alumno en nómina..."]') as HTMLInputElement
                        if (inputEl) inputEl.focus()
                      }}
                      className="bg-slate-950/40 border border-slate-850 rounded-xl p-3 space-y-1.5 cursor-pointer hover:bg-slate-950/70 hover:border-indigo-500/30 transition-all select-none group"
                      title="Haz clic para limpiar el filtro y ver la lista completa de alumnos"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest group-hover:text-indigo-300 transition-colors">
                          Información Leída por IA
                        </span>
                        {activeReviewItem.status === 'conflict' && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-950/60 border border-amber-900/40 text-amber-400 uppercase">
                            Discrepancia
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] space-y-0.5 text-slate-350">
                        <p>Nombre: <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{activeReviewItem.result?.nombreDetectado || 'No detectado'}</span></p>
                        <p>Curso: <span className="font-bold text-slate-200">{activeReviewItem.result?.cursoDetectado || 'No detectado'}</span></p>
                        {activeReviewItem.result?.reason && (
                          <p className="text-[9px] text-amber-450 font-semibold mt-1">{activeReviewItem.result.reason}</p>
                        )}
                        <p className="text-[8px] text-slate-500 font-medium pt-1 group-hover:text-indigo-400 transition-colors">
                          💡 Haz clic en esta tarjeta para ver toda la nómina del curso.
                        </p>
                      </div>
                    </div>

                    {/* Dropdown student picker */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Vincular con Alumno</label>
                      <input 
                        type="text"
                        placeholder="Buscar alumno en nómina..."
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                        className="w-full text-[11px] text-slate-200 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                      />

                      {loadingAlumnos ? (
                        <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /></div>
                      ) : (
                        <div className="max-h-24 overflow-y-auto border border-slate-850 rounded-lg divide-y divide-slate-850 bg-slate-950/30">
                          {filteredAlumnos.length > 0 ? filteredAlumnos.map(a => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => setSelectedAlumnoId(a.id)}
                              className={`w-full px-3 py-1.5 text-left text-[11px] flex items-center justify-between transition-colors ${
                                selectedAlumnoId === a.id 
                                  ? 'bg-indigo-600/20 text-indigo-400 font-bold' 
                                  : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                              }`}
                            >
                              <span className="truncate pr-2">{a.nombre_completo}</span>
                              {a.rut && <span className="text-[9px] text-slate-600 font-medium shrink-0">{a.rut}</span>}
                            </button>
                          )) : (
                            <p className="text-[10px] text-slate-650 p-2 text-center">No se encontraron alumnos.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Answers Editor Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Corrección de Respuestas</label>
                        <span className="text-[9px] text-slate-550 font-bold">Total: {pautas.length > 0 ? pautas.length : 30}</span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 max-h-[35vh] overflow-y-auto p-0.5 pr-1.5">
                        {Array.from({ length: pautas.length > 0 ? pautas.length : 30 }).map((_, index) => {
                          const numPregunta = index + 1
                          const pauta = pautas.find((p: any) => p.numero_pregunta === numPregunta)
                          const rawAns = editedAnswers.find(r => r.numero_pregunta === numPregunta)
                          const currentVal = rawAns ? rawAns.alternativa_marcada : null
                          const claveCorrecta = pauta ? pauta.alternativa_correcta : null

                          return (
                            <div 
                              key={numPregunta} 
                              className={`p-1.5 rounded-lg border flex items-center justify-between text-[11px] transition-all ${
                                currentVal === null 
                                  ? 'bg-slate-950/20 border-slate-850'
                                  : currentVal === claveCorrecta
                                  ? 'bg-emerald-950/10 border-emerald-900/20 text-slate-350'
                                  : 'bg-rose-950/10 border-rose-900/20 text-slate-350'
                              }`}
                            >
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="font-bold text-slate-400">Pregunta {numPregunta}:</span>
                                {claveCorrecta && (
                                  <span className="text-[8px] font-black text-indigo-400 uppercase bg-indigo-950/40 border border-indigo-900/35 px-1 rounded shrink-0">
                                    Clave: {claveCorrecta}
                                  </span>
                                )}
                              </div>

                              {/* Alternativa pills */}
                              <div className="flex items-center gap-1 shrink-0">
                                {['A', 'B', 'C', 'D'].map(opt => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                      setEditedAnswers(prev => {
                                        const exist = prev.some(r => r.numero_pregunta === numPregunta)
                                        if (exist) {
                                          return prev.map(r => r.numero_pregunta === numPregunta ? { ...r, alternativa_marcada: opt } : r)
                                        } else {
                                          return [...prev, { numero_pregunta: numPregunta, alternativa_marcada: opt }]
                                        }
                                      })
                                    }}
                                    className={`h-5 w-5 rounded text-[8px] font-black transition-all ${
                                      currentVal === opt
                                        ? opt === claveCorrecta
                                          ? 'bg-emerald-500 text-slate-950 shadow shadow-emerald-500/20'
                                          : 'bg-rose-500 text-slate-950 shadow shadow-rose-500/20'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                                
                                {/* Clear pill */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditedAnswers(prev => {
                                      const exist = prev.some(r => r.numero_pregunta === numPregunta)
                                      if (exist) {
                                        return prev.map(r => r.numero_pregunta === numPregunta ? { ...r, alternativa_marcada: null } : r)
                                      } else {
                                        return [...prev, { numero_pregunta: numPregunta, alternativa_marcada: null }]
                                      }
                                    })
                                  }}
                                  className="h-5 px-1 rounded text-[8px] font-bold bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300"
                                >
                                  Borrar
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                  </div>

                  {resolveError && (
                    <div className="p-2 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-[10px] rounded-lg flex items-center gap-1.5 mt-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{resolveError}</span>
                    </div>
                  )}

                  {/* Footer buttons */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-850 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReviewItem(null)
                        setSelectedAlumnoId('')
                        setResolveError('')
                      }}
                      className="px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCorrection}
                      disabled={!selectedAlumnoId || isResolving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-600 text-[10px] font-extrabold text-white rounded-lg shadow shadow-indigo-900/20 flex items-center gap-1.5 transition-all"
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" /> Guardar y Calificar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
