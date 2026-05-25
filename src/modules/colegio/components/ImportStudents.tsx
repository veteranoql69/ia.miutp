'use client'

import { useState, useTransition, DragEvent, ChangeEvent } from 'react'
import { importarAlumnos } from '../actions'
import { FileUp, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

interface ImportStudentsProps {
  cursoId: string
  cursoNombre: string
  anoAcademico: number
  onImportComplete: (results: any) => void
}

export default function ImportStudents({ cursoId, cursoNombre, anoAcademico, onImportComplete }: ImportStudentsProps) {
  const [isPending, startTransition] = useTransition()
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Solo se admiten archivos en formato CSV plano.')
      }
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError('Solo se admiten archivos en formato CSV plano.')
      }
    }
  }

  const handleUpload = () => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      if (!text) {
        setError('No se pudo leer el contenido del archivo.')
        return
      }

      startTransition(async () => {
        const res = await importarAlumnos(cursoId, anoAcademico, text)
        if (res.success) {
          setResult(res)
          setTimeout(() => {
            onImportComplete(res)
          }, 2000)
        } else {
          setError(res.error || 'Ocurrió un error al importar los alumnos.')
        }
      })
    }
    
    reader.readAsText(file, 'UTF-8')
  }

  const resetState = () => {
    setFile(null)
    setError(null)
    setResult(null)
  }

  return (
    <div className="w-full max-w-lg mx-auto p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500" />
      
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-slate-100 font-display">Carga de Estudiantes</h3>
          <p className="text-xs text-slate-400">
            Importa la nómina del curso <span className="text-indigo-400 font-semibold">{cursoNombre}</span> ({anoAcademico}) en formato CSV.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error al cargar</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {result ? (
          <div className="p-6 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 space-y-3 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <div>
              <h4 className="font-bold text-slate-100">¡Nómina Importada con Éxito!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Se detectaron {result.totalProcesados} estudiantes y se matricularon {result.matriculados} en {cursoNombre}.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01]' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
                }`}
              >
                <input
                  type="file"
                  id="csv-file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="p-4 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400">
                  <FileUp className="w-8 h-8" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-200">Arrastra tu archivo CSV aquí</p>
                  <p className="text-xs text-slate-500">o haz clic para explorar en tu equipo</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 rounded-lg bg-indigo-950/50 border border-indigo-900/50 text-indigo-400">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                {!isPending && (
                  <button 
                    onClick={resetState} 
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {file && (
              <button
                onClick={handleUpload}
                disabled={isPending}
                className="w-full py-3.5 px-5 rounded-xl text-slate-100 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-indigo-950/30"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Matriculando estudiantes...
                  </>
                ) : (
                  'Iniciar Importación de Alumnos'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
