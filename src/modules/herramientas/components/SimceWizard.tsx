'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, UploadCloud, Loader2, FileText, AlertCircle, Pencil, BookOpen } from 'lucide-react'
import WizardCard from './WizardCard'
import { validateStudentListAction, extractPautaAction, extractPreguntasEnsayoAction } from '../actions'
import { getAsignaturas, getOA, buildOaResult, type OAItem } from '@/data/oa-curriculum'

const STEPS = [
  { id: 'nivel',       label: 'Nivel' },
  { id: 'habilidades', label: 'Habilidades/OA' },
  { id: 'alumnos',     label: 'Alumnos' },
  { id: 'preguntas',   label: 'Preguntas' },
  { id: 'pauta',       label: 'Hoja Respuestas' },
  { id: 'hojas',       label: 'Finalizar' },
]

interface SimceWizardProps {
  colegioId: string
  userId: string
}

export default function SimceWizard({ colegioId, userId }: SimceWizardProps) {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = STEPS[currentStepIndex]

  // Step 1
  const [nivel, setNivel] = useState('4-basico')
  const [letra, setLetra] = useState('A')

  // Step 2 — Habilidades/OA (desde Bases Curriculares)
  const [asignatura, setAsignatura] = useState<string>(() => getAsignaturas('4-basico')[0]?.key ?? '')
  const [selectedCodigos, setSelectedCodigos] = useState<string[]>([])
  const [oaResult, setOaResult] = useState<any>(null)

  // Inicializar selección cuando cambia nivel o asignatura
  useEffect(() => {
    const asigs = getAsignaturas(nivel)
    if (asigs.length > 0 && !asigs.find(a => a.key === asignatura)) {
      setAsignatura(asigs[0].key)
    }
  }, [nivel])

  useEffect(() => {
    const oas = getOA(nivel, asignatura)
    setSelectedCodigos(oas.map(o => o.codigo))
    setOaResult(null)
  }, [nivel, asignatura])

  // Step 3 — Alumnos
  const [studentFile, setStudentFile] = useState<File | null>(null)
  const [isProcessingStudents, setIsProcessingStudents] = useState(false)
  const [studentResult, setStudentResult] = useState<any>(null)
  const [studentError, setStudentError] = useState('')

  // Step 4 — Preguntas del Ensayo
  const [preguntasFile, setPreguntasFile] = useState<File | null>(null)
  const [isProcessingPreguntas, setIsProcessingPreguntas] = useState(false)
  const [preguntasResult, setPreguntasResult] = useState<any>(null)
  const [preguntasError, setPreguntasError] = useState('')
  const [tituloEnsayo, setTituloEnsayo] = useState('')
  const [editandoTitulo, setEditandoTitulo] = useState(false)

  // Step 5 — Pauta / Hoja de Respuestas
  const [pautaFile, setPautaFile] = useState<File | null>(null)
  const [isProcessingPauta, setIsProcessingPauta] = useState(false)
  const [pautaResult, setPautaResult] = useState<any>(null)
  const [pautaError, setPautaError] = useState('')

  // Step 6 — Finalizar
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleNext = () => {
    if (currentStep.id === 'habilidades') {
      const result = buildOaResult(nivel, asignatura, selectedCodigos)
      setOaResult(result)
    }
    if (currentStepIndex < STEPS.length - 1) setCurrentStepIndex(c => c + 1)
    else router.push('/dashboard?tab=herramientas')
  }

  const handleBack = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(c => c - 1)
    else router.push('/dashboard?tab=herramientas')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError('')
    const res = await import('../actions').then(m => m.setupSimceToolAction({
      nombre: tituloEnsayo || `Ensayo ${nivel} ${letra}`,
      nivel,
      letra,
      asignatura: oaResult?.asignatura || 'General',
      oasRaw: oaResult,
      studentsRaw: studentResult?.parsedStudents || [],
      preguntasEnsayoRaw: preguntasResult?.preguntas || [],
      pautaRaw: pautaResult?.preguntas || [],
      colegioId,
      creadoPor: userId,
    }))
    if (res.success) {
      router.push('/dashboard')
    } else {
      setSaveError(res.error || 'Error al guardar el ensayo')
      setIsSaving(false)
    }
  }

  const handleStudentUpload = async (file: File) => {
    setStudentFile(file); setIsProcessingStudents(true); setStudentError(''); setStudentResult(null)
    const fd = new FormData(); fd.append('file', file)
    const res = await validateStudentListAction(fd, letra)
    if (res.success) setStudentResult(res.data)
    else setStudentError(res.error || 'Error procesando lista')
    setIsProcessingStudents(false)
  }

  const handlePreguntasUpload = async (file: File) => {
    setPreguntasFile(file); setIsProcessingPreguntas(true); setPreguntasError(''); setPreguntasResult(null)
    const fd = new FormData(); fd.append('file', file)
    const res = await extractPreguntasEnsayoAction(fd)
    if (res.success && res.data) {
      setPreguntasResult(res.data)
      setTituloEnsayo(res.data.titulo || '')
    } else {
      setPreguntasError(res.error || 'Error procesando preguntas')
    }
    setIsProcessingPreguntas(false)
  }

  const handlePautaUpload = async (file: File) => {
    setPautaFile(file); setIsProcessingPauta(true); setPautaError(''); setPautaResult(null)
    const fd = new FormData(); fd.append('file', file)
    const res = await extractPautaAction(fd)
    if (res.success) setPautaResult(res.data)
    else setPautaError(res.error || 'Error procesando pauta')
    setIsProcessingPauta(false)
  }

  const toggleOA = (codigo: string) => {
    setSelectedCodigos(prev =>
      prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]
    )
  }

  const allOAsForStep = getOA(nivel, asignatura)
  const areaGroups = allOAsForStep.reduce<Record<string, OAItem[]>>((acc, oa) => {
    if (!acc[oa.area]) acc[oa.area] = []
    acc[oa.area].push(oa)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col">

      {/* Luces decorativas */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-violet-950/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-indigo-950/15 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/70 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all outline-none focus:outline-none"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm font-bold text-slate-200">Configuración: Ensayos SIMCE</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Asistente paso a paso</p>
        </div>
      </header>

      {/* Progress steps */}
      <div className="bg-slate-950/50 backdrop-blur-xl border-b border-slate-800/50 py-5 px-6 overflow-x-auto z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between min-w-[680px]">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent   = index === currentStepIndex
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isCompleted
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-900/40'
                      : isCurrent
                      ? 'border-indigo-500 text-indigo-400 bg-indigo-950/40'
                      : 'border-slate-800 text-slate-600 bg-slate-950'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider absolute top-10 whitespace-nowrap ${
                    isCurrent ? 'text-indigo-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-3 transition-colors ${isCompleted ? 'bg-indigo-700' : 'bg-slate-800'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 flex items-start justify-center relative z-10">

        {/* PASO 1: Nivel */}
        {currentStep.id === 'nivel' && (
          <WizardCard
            title="Seleccionar Nivel"
            description="Define el nivel académico para este ensayo SIMCE."
            footer={
              <>
                <button onClick={handleBack} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors outline-none focus:outline-none">Cancelar</button>
                <button onClick={handleNext} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 flex items-center gap-2 outline-none focus:outline-none">
                  Siguiente <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nivel del Curso</label>
              <select
                value={nivel}
                onChange={e => setNivel(e.target.value)}
                className="w-full appearance-none bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-slate-100 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/60 font-semibold text-sm transition-colors cursor-pointer"
              >
                <option value="4-basico">4° Básico</option>
                <option value="6-basico">6° Básico</option>
                <option value="8-basico">8° Básico</option>
                <option value="2-medio">2° Medio</option>
              </select>
            </div>
          </WizardCard>
        )}

        {/* PASO 2: Habilidades/OA — Selector desde Bases Curriculares */}
        {currentStep.id === 'habilidades' && (
          <WizardCard
            title="Asignatura y Objetivos de Aprendizaje"
            description="Selecciona la asignatura del ensayo. Los OA se cargan automáticamente desde las Bases Curriculares Mineduc. Desmarca los que no apliquen."
            footer={
              <>
                <button onClick={handleBack} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors outline-none focus:outline-none">Volver</button>
                <button
                  onClick={handleNext}
                  disabled={selectedCodigos.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 disabled:opacity-40 flex items-center gap-2 outline-none focus:outline-none"
                >
                  Siguiente <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            }
          >
            <div className="space-y-5">

              {/* Selector de asignatura */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asignatura</label>
                <div className="flex flex-wrap gap-2">
                  {getAsignaturas(nivel).map(a => (
                    <button
                      key={a.key}
                      onClick={() => setAsignatura(a.key)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none focus:outline-none border ${
                        asignatura === a.key
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/30'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Header de OA con fuente y controles */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-300">Objetivos de Aprendizaje</span>
                  <span className="text-[10px] text-slate-600 font-medium">Bases Curriculares Mineduc</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-indigo-400">{selectedCodigos.length} / {allOAsForStep.length} seleccionados</span>
                  <button
                    onClick={() => setSelectedCodigos(allOAsForStep.map(o => o.codigo))}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors underline"
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setSelectedCodigos([])}
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors underline"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              {/* Lista de OA agrupada por área */}
              <div className="max-h-72 overflow-y-auto border border-slate-800/70 rounded-xl bg-slate-900/30 divide-y divide-slate-800/40">
                {Object.entries(areaGroups).map(([area, oas]) => (
                  <div key={area}>
                    <div className="px-4 py-2 bg-slate-900/60 sticky top-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{area}</span>
                    </div>
                    {oas.map(oa => (
                      <label
                        key={oa.codigo}
                        className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-800/30 transition-colors group"
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${
                          selectedCodigos.includes(oa.codigo)
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-slate-700 bg-slate-900 group-hover:border-slate-600'
                        }`}>
                          {selectedCodigos.includes(oa.codigo) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedCodigos.includes(oa.codigo)}
                          onChange={() => toggleOA(oa.codigo)}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-indigo-400 mr-2">{oa.codigo}</span>
                          <span className="text-xs text-slate-400">{oa.descripcion}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>

            </div>
          </WizardCard>
        )}

        {/* PASO 3: Alumnos */}
        {currentStep.id === 'alumnos' && (
          <WizardCard
            title="Lista de Alumnos"
            description="Selecciona la letra del curso y sube la nómina en Excel (formato SIGE)."
            footer={
              <>
                <button onClick={handleBack} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors outline-none focus:outline-none">Volver</button>
                <button onClick={handleNext} disabled={!studentResult?.isValid} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 disabled:opacity-40 flex items-center gap-2 outline-none focus:outline-none">
                  Siguiente <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            }
          >
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Letra del Curso</label>
                <select
                  value={letra}
                  onChange={e => setLetra(e.target.value)}
                  className="w-full md:w-1/2 appearance-none bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 text-slate-100 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/60 font-semibold text-sm transition-colors cursor-pointer"
                >
                  <option value="A">Letra A</option>
                  <option value="B">Letra B</option>
                  <option value="C">Letra C</option>
                  <option value="D">Letra D</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nómina SIGE (Excel)</label>
                {!studentFile ? (
                  <label className="border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-950/30 hover:bg-slate-900/30 hover:border-indigo-600/50 transition-all cursor-pointer group block">
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && handleStudentUpload(e.target.files[0])} />
                    <UploadCloud className="w-6 h-6 text-slate-600 group-hover:text-indigo-500 mb-3 transition-colors" />
                    <p className="text-sm font-semibold text-slate-300">Subir archivo Excel (.xlsx)</p>
                    <p className="text-xs text-slate-600 mt-1">La IA validará que los alumnos correspondan a la letra {letra}</p>
                  </label>
                ) : (
                  <div className={`p-4 border rounded-xl flex items-start gap-4 ${
                    studentResult?.isValid === false
                      ? 'bg-red-950/20 border-red-800/40'
                      : 'bg-slate-900/40 border-slate-800/60'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{studentFile.name}</p>
                      {isProcessingStudents ? (
                        <div className="flex items-center text-xs text-indigo-400 mt-1 gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Analizando con IA...</div>
                      ) : studentResult ? (
                        <div className="mt-2 space-y-2">
                          <div className={`text-xs font-semibold flex items-center gap-1.5 ${studentResult.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                            {studentResult.isValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            {studentResult.isValid ? 'Validación exitosa' : 'Inconsistencia detectada'}
                          </div>
                          <p className="text-xs text-slate-500">{studentResult.reason}</p>
                          {studentResult.parsedStudents && (
                            <p className="text-[10px] text-slate-600">Total alumnos detectados: {studentResult.parsedStudents.length}</p>
                          )}
                          {studentResult?.detectedLetra && studentResult.detectedLetra.toUpperCase() !== letra.toUpperCase() && (
                            <div className="p-3 bg-amber-950/20 border border-amber-700/40 rounded-xl flex items-center gap-2 text-xs text-amber-300">
                              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                              <span>
                                La IA detectó curso <strong>{studentResult.detectedLetra}</strong>, pero seleccionaste <strong>{letra}</strong>.
                              </span>
                              <button
                                type="button"
                                className="ml-auto underline font-bold text-amber-400 hover:text-amber-200 whitespace-nowrap transition-colors"
                                onClick={() => setLetra(studentResult.detectedLetra)}
                              >
                                Usar detectada
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-red-400 mt-1">{studentError}</p>
                      )}
                    </div>
                    <button onClick={() => { setStudentFile(null); setStudentResult(null) }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0">Cambiar</button>
                  </div>
                )}
              </div>
            </div>
          </WizardCard>
        )}

        {/* PASO 4: Preguntas del Ensayo */}
        {currentStep.id === 'preguntas' && (
          <WizardCard
            title="Preguntas del Ensayo"
            description="Sube el PDF con el texto completo del ensayo. La IA extraerá el título y cada pregunta para análisis estadístico."
            footer={
              <>
                <button onClick={handleBack} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors outline-none focus:outline-none">Volver</button>
                <button onClick={handleNext} disabled={!preguntasResult} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 disabled:opacity-40 flex items-center gap-2 outline-none focus:outline-none">
                  Siguiente <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {!preguntasFile ? (
                <label className="border-2 border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-950/30 hover:bg-slate-900/30 hover:border-indigo-600/50 transition-all cursor-pointer group block">
                  <input type="file" className="hidden" accept=".pdf" onChange={e => e.target.files?.[0] && handlePreguntasUpload(e.target.files[0])} />
                  <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:border-indigo-700/50 group-hover:scale-105 transition-all">
                    <UploadCloud className="w-7 h-7 text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mb-1">Cuadernillo de Preguntas</h3>
                  <p className="text-xs text-slate-500 mb-6">Solo PDF — El ensayo con todas las preguntas</p>
                  <span className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 group-hover:border-indigo-700/50 transition-colors">Seleccionar Archivo</span>
                </label>
              ) : (
                <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-800/50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{preguntasFile.name}</p>
                    {isProcessingPreguntas ? (
                      <div className="flex items-center text-xs text-indigo-400 mt-1 gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Extrayendo preguntas y título...</div>
                    ) : preguntasResult ? (
                      <p className="text-xs text-emerald-400 font-medium mt-1">{preguntasResult.preguntas?.length} preguntas extraídas</p>
                    ) : (
                      <p className="text-xs text-red-400 mt-1">{preguntasError}</p>
                    )}
                  </div>
                  <button onClick={() => { setPreguntasFile(null); setPreguntasResult(null); setTituloEnsayo('') }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0">Cambiar</button>
                </div>
              )}

              {preguntasResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Título extraído por IA</p>
                      {editandoTitulo ? (
                        <input
                          autoFocus
                          value={tituloEnsayo}
                          onChange={e => setTituloEnsayo(e.target.value)}
                          onBlur={() => setEditandoTitulo(false)}
                          className="w-full text-sm font-semibold text-slate-100 bg-slate-900 border border-indigo-700/50 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500/70 transition-all"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-100 truncate">{tituloEnsayo}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setEditandoTitulo(true)}
                      className="p-1.5 rounded-lg hover:bg-indigo-900/40 text-indigo-500 hover:text-indigo-300 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-4 border border-slate-800/60 rounded-xl bg-slate-900/40 max-h-48 overflow-y-auto text-xs space-y-2">
                    {preguntasResult.preguntas?.map((p: any, i: number) => (
                      <div key={i} className="flex gap-2 border-b border-slate-800/40 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-bold text-indigo-400 shrink-0 min-w-[28px]">P{p.numero}</span>
                        <span className="text-slate-400 line-clamp-2">{p.enunciado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </WizardCard>
        )}

        {/* PASO 5: Pauta / Hoja de Respuestas */}
        {currentStep.id === 'pauta' && (
          <WizardCard
            title="Hoja de Respuestas Correctas"
            description="Sube la clave oficial. La IA mapeará cada respuesta correcta con su habilidad y OA."
            footer={
              <>
                <button onClick={handleBack} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors outline-none focus:outline-none">Volver</button>
                <button onClick={handleNext} disabled={!pautaResult} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-900/30 disabled:opacity-40 flex items-center gap-2 outline-none focus:outline-none">
                  Siguiente <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {!pautaFile ? (
                <label className="border-2 border-dashed border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-950/30 hover:bg-slate-900/30 hover:border-indigo-600/50 transition-all cursor-pointer group block">
                  <input type="file" className="hidden" accept=".pdf" onChange={e => e.target.files?.[0] && handlePautaUpload(e.target.files[0])} />
                  <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:border-indigo-700/50 group-hover:scale-105 transition-all">
                    <UploadCloud className="w-7 h-7 text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 mb-1">Cargar Clave de Respuestas</h3>
                  <p className="text-xs text-slate-500 mb-6">Solo PDF con las alternativas correctas</p>
                  <span className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 group-hover:border-indigo-700/50 transition-colors">Seleccionar Archivo</span>
                </label>
              ) : (
                <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-800/50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{pautaFile.name}</p>
                    {isProcessingPauta ? (
                      <div className="flex items-center text-xs text-indigo-400 mt-1 gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Extrayendo con IA...</div>
                    ) : pautaResult ? (
                      <p className="text-xs text-emerald-400 font-medium mt-1">Extraídas {pautaResult.preguntas?.length} respuestas correctas</p>
                    ) : (
                      <p className="text-xs text-red-400 mt-1">{pautaError}</p>
                    )}
                  </div>
                  <button onClick={() => { setPautaFile(null); setPautaResult(null) }} className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0">Cambiar</button>
                </div>
              )}
              {pautaResult && (
                <div className="p-4 border border-slate-800/60 rounded-xl bg-slate-900/40 max-h-48 overflow-y-auto text-xs">
                  <div className="grid grid-cols-4 gap-2 font-bold border-b border-slate-800/60 pb-2 mb-2 text-slate-400">
                    <div>Pregunta</div><div>Correcta</div><div className="col-span-2">Habilidad / OA</div>
                  </div>
                  {pautaResult.preguntas?.map((p: any, i: number) => (
                    <div key={i} className="grid grid-cols-4 gap-2 border-b border-slate-800/30 pb-1 mb-1 last:border-0">
                      <div className="font-semibold text-slate-300">{p.numero}</div>
                      <div className="text-emerald-400 font-bold">{p.alternativaCorrecta}</div>
                      <div className="col-span-2 text-slate-500 truncate">{p.habilidad} {p.objetivo && `(${p.objetivo})`}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </WizardCard>
        )}

        {/* PASO 6: Finalizar */}
        {currentStep.id === 'hojas' && (
          <WizardCard
            title="Finalizar Configuración"
            description="Las hojas de respuesta de los alumnos se pueden cargar en cualquier momento desde el dashboard."
            footer={
              <>
                <button onClick={handleBack} disabled={isSaving} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-200 transition-colors disabled:opacity-40 outline-none focus:outline-none">Volver</button>
                <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-900/30 disabled:opacity-60 flex items-center gap-2 outline-none focus:outline-none">
                  {isSaving
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                    : <><CheckCircle2 className="w-3.5 h-3.5" /> Finalizar y Guardar</>
                  }
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {saveError && (
                <div className="p-3 bg-red-950/30 border border-red-800/40 text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />{saveError}
                </div>
              )}
              {preguntasResult && pautaResult && preguntasResult.preguntas?.length !== pautaResult.preguntas?.length && (
                <div className="p-3 bg-amber-950/20 border border-amber-700/40 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <strong>Advertencia:</strong> El cuadernillo tiene <strong>{preguntasResult.preguntas?.length}</strong> preguntas, pero la pauta tiene <strong>{pautaResult.preguntas?.length}</strong> respuestas. Verifica que los archivos correspondan al mismo ensayo.
                  </div>
                </div>
              )}
              <div className="p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Resumen de configuración</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-500">
                  <div><span className="font-semibold text-slate-400">Título:</span> {tituloEnsayo || `Ensayo ${nivel} ${letra}`}</div>
                  <div><span className="font-semibold text-slate-400">Nivel:</span> {nivel} — Letra {letra}</div>
                  <div><span className="font-semibold text-slate-400">Asignatura:</span> {oaResult?.asignatura || '—'}</div>
                  <div><span className="font-semibold text-slate-400">OAs seleccionados:</span> {oaResult?.objetivos?.length ?? 0}</div>
                  <div><span className="font-semibold text-slate-400">Alumnos:</span> {studentResult?.parsedStudents?.length ?? 0}</div>
                  <div><span className="font-semibold text-slate-400">Preguntas:</span> {preguntasResult?.preguntas?.length ?? 0}</div>
                  <div><span className="font-semibold text-slate-400">Clave:</span> {pautaResult?.preguntas?.length ?? 0} ítems</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 text-center">
                Las hojas de respuesta se cargarán desde el panel principal una vez guardado el ensayo.
              </p>
            </div>
          </WizardCard>
        )}
      </main>
    </div>
  )
}
