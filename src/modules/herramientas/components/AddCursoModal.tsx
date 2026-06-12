'use client'

import { useState } from 'react'
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle2, X, PartyPopper } from 'lucide-react'
import { addCursoToEnsayoAction } from '../actions'

interface AddCursoModalProps {
  isOpen: boolean
  onClose: () => void
  ensayoId: string
  existingLetras: string[]
  onSuccess: () => void
}

const DISPONIBLES = ['A', 'B', 'C', 'D', 'E', 'F']

export default function AddCursoModal({ isOpen, onClose, ensayoId, existingLetras, onSuccess }: AddCursoModalProps) {
  const [letra, setLetra] = useState(() => {
    const disponible = DISPONIBLES.find(l => !existingLetras.includes(l))
    return disponible || 'A'
  })
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [savedData, setSavedData] = useState<{ letra: string; n: number } | null>(null)

  if (!isOpen) return null

  // Filtrar letras disponibles que no existan ya
  const letrasDisponibles = DISPONIBLES.filter(l => !existingLetras.includes(l))

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile)
    setIsProcessing(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      
      const res = await import('../actions').then(m => m.validateStudentListAction(formData, letra))
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error || 'Error al procesar la lista de alumnos.')
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRegister = async () => {
    if (!file || !result?.alumnos?.length) return
    setIsSaving(true)
    setError('')

    try {
      // Pasamos directamente los alumnos ya validados por IA (sin re-procesar el archivo)
      const res = await addCursoToEnsayoAction(ensayoId, letra, result.alumnos)
      
      if (res.success) {
        setSavedData({ letra, n: result.alumnos.length })
        setSavedOk(true)
        // Llamar onSuccess para refrescar datos, luego cerrar tras 1.5s
        onSuccess()
        setTimeout(() => {
          setSavedOk(false)
          onClose()
        }, 1800)
      } else {
        setError(res.error || 'Error al guardar el nuevo curso.')
        setIsSaving(false)
      }
    } catch (err: any) {
      setError(err.message || 'Error al intentar registrar el curso.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900/90 border border-indigo-500/20 shadow-2xl backdrop-blur-2xl flex flex-col nivel-card-expanding">
        
        {/* ===== PANTALLA DE ÉXITO ===== */}
        {savedOk && savedData && (
          <div className="flex flex-col items-center justify-center p-12 gap-5 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-950/60 border border-emerald-900/40 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-950/30 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-100">¡Curso {savedData.letra} registrado!</h3>
              <p className="text-sm text-slate-400 mt-2">
                <span className="text-emerald-400 font-bold">{savedData.n} alumnos</span> inscritos correctamente.
              </p>
              <p className="text-xs text-slate-600 mt-3 font-medium">La tarjeta se está actualizando...</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse delay-150" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse delay-300" />
            </div>
          </div>
        )}

        {/* ===== CONTENIDO NORMAL ===== */}
        {!savedOk && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-slate-100">Agregar Nuevo Curso</h3>
                <p className="text-xs text-slate-500 mt-1">Registra un curso adicional que comparta los OAs y pauta del ensayo.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Letra selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Letra del Curso</label>
                {letrasDisponibles.length > 0 ? (
                  <div className="flex gap-2">
                    {letrasDisponibles.map(l => (
                      <button
                        key={l}
                        onClick={() => {
                          setLetra(l)
                          setFile(null)
                          setResult(null)
                          setError('')
                        }}
                        className={`h-10 w-10 text-xs font-bold rounded-xl border transition-all ${
                          letra === l
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/30 scale-105'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-500">Ya has configurado todas las letras del curso posibles.</p>
                )}
              </div>

              {/* File Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Nómina del Curso (Excel / SIGE)
                </label>
                
                {!file ? (
                  <label className="border border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-950/20 hover:bg-slate-950/40 hover:border-indigo-500/40 transition-all cursor-pointer group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".xlsx,.xls,.csv" 
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
                    />
                    <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-3 transition-colors" />
                    <p className="text-xs text-slate-300 font-semibold">Subir archivo Excel (.xlsx)</p>
                    <p className="text-[10px] text-slate-500 mt-1">La IA validará que los alumnos correspondan a la letra {letra}</p>
                  </label>
                ) : (
                  <div className={`p-4 border rounded-xl flex items-start gap-4 ${
                    result?.isValid === false ? 'bg-red-950/20 border-red-900/40' : 'bg-slate-950/40 border-slate-800/80'
                  }`}>
                    <FileText className="w-7 h-7 text-slate-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{file.name}</p>
                      
                      {isProcessing ? (
                        <div className="flex items-center text-[10px] text-indigo-400 mt-1.5 font-semibold">
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Procesando con IA...
                        </div>
                      ) : result ? (
                        <div className="mt-2 space-y-1.5">
                          <div className={`text-[10px] font-bold flex items-center ${
                            result.isValid ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {result.isValid ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
                            {result.isValid ? 'VALIDACIÓN EXITOSA' : 'ERROR DE CONSISTENCIA'}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{result.reason}</p>
                          
                          {result.parsedStudents && (
                            <p className="text-[10px] font-medium text-slate-500">
                              Total alumnos detectados: {result.parsedStudents.length}
                            </p>
                          )}

                          {result.detectedLetra && result.detectedLetra.toUpperCase() !== letra.toUpperCase() && (
                            <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-lg flex items-center gap-2 text-[10px] text-amber-400 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>IA detectó curso {result.detectedLetra}, seleccionaste {letra}.</span>
                              <button
                                type="button"
                                className="ml-auto underline font-bold"
                                onClick={() => setLetra(result.detectedLetra)}
                              >
                                Usar detectada
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-rose-400 mt-1.5 font-semibold">{error}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => { setFile(null); setResult(null); setError('') }} 
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-300 underline shrink-0"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-950/20 border border-rose-900/40 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800/80 bg-slate-950/20">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegister}
                disabled={!file || !result?.alumnos?.length || isSaving || isProcessing}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:opacity-50 text-xs font-bold text-white rounded-xl shadow-md shadow-indigo-900/30 flex items-center gap-2 transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registrando...
                  </>
                ) : (
                  'Confirmar e Inscribir Curso'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
