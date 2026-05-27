'use client'

import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react'
import {
  CloudUpload, FileText, CheckCircle2, Loader2,
  ChevronRight, BookOpen, X, ExternalLink, RotateCcw
} from 'lucide-react'
import { processCurriculumPdfAction, getProgramasCurriculares } from '../actions'

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface ObjetivoOA {
  codigo_oa: string
  descripcion: string
}

interface ProgramaCurricular {
  id: string
  url_pdf_original: string
  creado_en: string
  metadata_json: {
    curso: string
    asignatura: string
    total_objetivos: number
    objetivos: ObjetivoOA[]
    archivo_original: string
    procesado_en: string
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CurriculumManager() {
  const [programas, setProgramas] = useState<ProgramaCurricular[]>([])
  const [loadingLista, setLoadingLista] = useState(true)
  const [seleccionado, setSeleccionado] = useState<ProgramaCurricular | null>(null)

  // Upload state
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const cargarProgramas = async () => {
    setLoadingLista(true)
    const res = await getProgramasCurriculares()
    if (res.success) setProgramas(res.data as ProgramaCurricular[])
    setLoadingLista(false)
  }

  useEffect(() => { cargarProgramas() }, [])

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) validarYSetFile(dropped)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (picked) validarYSetFile(picked)
  }

  const validarYSetFile = (f: File) => {
    setUploadError(null)
    setUploadSuccess(false)
    if (f.type !== 'application/pdf') {
      setUploadError('Solo se admiten archivos PDF.')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setUploadError('El archivo excede el límite de 20 MB.')
      return
    }
    setFile(f)
  }

  const resetUpload = () => {
    setFile(null)
    setUploadError(null)
    setUploadSuccess(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Procesar PDF ────────────────────────────────────────────────────────────

  const handleProcesar = async () => {
    if (!file) return
    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('pdf', file)

    const res = await processCurriculumPdfAction(formData)

    if (res.success) {
      setUploadSuccess(true)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await cargarProgramas()
    } else {
      setUploadError(res.error)
    }
    setUploading(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Programas Curriculares</h1>
        <p className="text-xs text-slate-500 mt-1">
          Sube los programas oficiales del Mineduc en PDF para extraer automáticamente los Objetivos de Aprendizaje.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 transition-all duration-200 cursor-pointer
          ${dragActive
            ? 'border-indigo-500 bg-indigo-950/20 scale-[1.01]'
            : file
              ? 'border-violet-700/60 bg-violet-950/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/20 hover:bg-slate-900/30'
          }`}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileInput}
          className="hidden"
        />

        {!file ? (
          <>
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/60">
              <CloudUpload className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300">
                Arrastra el PDF o <span className="text-indigo-400">haz clic para seleccionar</span>
              </p>
              <p className="text-xs text-slate-600 mt-1">Programas Mineduc oficiales • PDF • Máx. 20 MB</p>
            </div>
          </>
        ) : (
          <div className="w-full max-w-md flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/40 shrink-0">
              <FileText className="w-6 h-6 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); resetUpload() }}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Error / Success */}
      {uploadError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-400 text-xs font-medium">
          <X className="w-4 h-4 shrink-0" /> {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Programa procesado e indexado correctamente.
        </div>
      )}

      {/* Botón procesar */}
      {file && (
        <button
          onClick={handleProcesar}
          disabled={uploading}
          className="w-full py-3.5 px-5 rounded-xl text-slate-100 font-semibold flex items-center justify-center gap-2
            bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
            active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-900/30 transition-all duration-200 cursor-pointer"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando con IA…</>
            : <><BookOpen className="w-4 h-4" /> Procesar y extraer OAs</>
          }
        </button>
      )}

      {/* Lista + Detalle */}
      <div className={`grid gap-6 ${seleccionado ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Lista de programas */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Programas Indexados ({programas.length})
          </h2>

          {loadingLista ? (
            <div className="flex items-center gap-3 py-8 justify-center text-slate-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Cargando programas…</span>
            </div>
          ) : programas.length === 0 ? (
            <div className="py-10 text-center rounded-2xl border border-slate-800/60 bg-slate-900/10">
              <BookOpen className="w-8 h-8 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-600">Aún no hay programas cargados.</p>
            </div>
          ) : (
            programas.map((p) => (
              <button
                key={p.id}
                onClick={() => setSeleccionado(prev => prev?.id === p.id ? null : p)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 active:scale-[0.99]
                  ${seleccionado?.id === p.id
                    ? 'bg-indigo-950/40 border-indigo-500/40 shadow-md shadow-indigo-950/30'
                    : 'bg-slate-900/30 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-violet-950/40 border border-violet-900/40 shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-200">
                        {p.metadata_json.curso} — {p.metadata_json.asignatura}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
                        Procesado con IA
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {p.metadata_json.total_objetivos} Objetivos de Aprendizaje • {formatDate(p.creado_en)}
                    </p>
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">{p.metadata_json.archivo_original}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-600 shrink-0 mt-1 transition-transform duration-200 ${seleccionado?.id === p.id ? 'rotate-90 text-indigo-400' : ''}`} />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Panel de detalle */}
        {seleccionado && (
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {seleccionado.metadata_json.curso} — {seleccionado.metadata_json.asignatura}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {seleccionado.metadata_json.total_objetivos} OAs • Procesado el {formatDate(seleccionado.metadata_json.procesado_en)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={seleccionado.url_pdf_original}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-500 hover:text-indigo-400 transition-all"
                  title="Ver PDF original"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setSeleccionado(null)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {seleccionado.metadata_json.objetivos.map((oa, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 flex gap-3"
                >
                  <span className="text-[10px] font-bold text-indigo-400 shrink-0 pt-0.5 min-w-[40px]">
                    {oa.codigo_oa}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{oa.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
