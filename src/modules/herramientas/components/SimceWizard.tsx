'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, UploadCloud, Loader2, FileText, AlertCircle, Pencil } from 'lucide-react'
import WizardCard from './WizardCard'
import { extractObjectivesAction, validateStudentListAction, extractPautaAction, extractPreguntasEnsayoAction } from '../actions'

const STEPS = [
  { id: 'nivel',      label: 'Nivel' },
  { id: 'habilidades', label: 'Habilidades/OA' },
  { id: 'alumnos',   label: 'Alumnos' },
  { id: 'preguntas', label: 'Preguntas' },
  { id: 'pauta',     label: 'Hoja Respuestas' },
  { id: 'hojas',     label: 'Finalizar' },
]

export default function SimceWizard() {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = STEPS[currentStepIndex]

  // Step 1
  const [nivel, setNivel] = useState('4-basico')
  const [letra, setLetra] = useState('A')

  // Step 2 — OA/Habilidades
  const [oaFile, setOaFile] = useState<File | null>(null)
  const [isProcessingOa, setIsProcessingOa] = useState(false)
  const [oaResult, setOaResult] = useState<any>(null)
  const [oaError, setOaError] = useState('')

  // Step 3 — Alumnos
  const [studentFile, setStudentFile] = useState<File | null>(null)
  const [isProcessingStudents, setIsProcessingStudents] = useState(false)
  const [studentResult, setStudentResult] = useState<any>(null)
  const [studentError, setStudentError] = useState('')

  // Step 4 — Preguntas del Ensayo (NEW)
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
  const [hojasFile, setHojasFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleNext = () => {
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
    }))
    if (res.success) {
      router.push('/dashboard')
    } else {
      setSaveError(res.error || 'Error al guardar el ensayo')
      setIsSaving(false)
    }
  }

  // Handlers OA
  const handleOaUpload = async (file: File) => {
    setOaFile(file); setIsProcessingOa(true); setOaError(''); setOaResult(null)
    const fd = new FormData(); fd.append('file', file)
    const res = await extractObjectivesAction(fd)
    if (res.success) setOaResult(res.data)
    else setOaError(res.error || 'Error procesando documento')
    setIsProcessingOa(false)
  }

  // Handlers Alumnos
  const handleStudentUpload = async (file: File) => {
    setStudentFile(file); setIsProcessingStudents(true); setStudentError(''); setStudentResult(null)
    const fd = new FormData(); fd.append('file', file)
    const res = await validateStudentListAction(fd, letra)
    if (res.success) setStudentResult(res.data)
    else setStudentError(res.error || 'Error procesando lista')
    setIsProcessingStudents(false)
  }

  // Handlers Preguntas (NEW)
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

  // Handlers Pauta
  const handlePautaUpload = async (file: File) => {
    setPautaFile(file); setIsProcessingPauta(true); setPautaError(''); setPautaResult(null)
    const fd = new FormData(); fd.append('file', file)
    const res = await extractPautaAction(fd)
    if (res.success) setPautaResult(res.data)
    else setPautaError(res.error || 'Error procesando pauta')
    setIsProcessingPauta(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={handleBack} className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Configuración: Ensayos SIMCE</h1>
          <p className="text-xs text-slate-500 font-medium">Asistente paso a paso</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full bg-white border-b border-slate-200 py-4 px-6 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex items-center justify-between min-w-[700px]">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    isCompleted ? 'bg-blue-600 border-blue-600 text-white'
                      : isCurrent ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-slate-200 text-slate-400 bg-white'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider absolute top-10 whitespace-nowrap ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-colors ${isCompleted ? 'bg-blue-600' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 flex items-start justify-center">

        {/* PASO 1: Nivel */}
        {currentStep.id === 'nivel' && (
          <WizardCard
            title="Seleccionar Nivel"
            description="Define el nivel académico para este ensayo SIMCE."
            footer={
              <>
                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Cancelar</button>
                <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm flex items-center">
                  Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nivel del Curso</label>
              <select value={nivel} onChange={e => setNivel(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium">
                <option value="4-basico">4° Básico</option>
                <option value="6-basico">6° Básico</option>
                <option value="8-basico">8° Básico</option>
                <option value="2-medio">2° Medio</option>
              </select>
            </div>
          </WizardCard>
        )}

        {/* PASO 2: Habilidades/OA */}
        {currentStep.id === 'habilidades' && (
          <WizardCard
            title="Cargar Habilidades y OA"
            description="Sube el documento oficial (PDF). La IA extraerá automáticamente los Objetivos de Aprendizaje."
            footer={
              <>
                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Volver</button>
                <button onClick={handleNext} disabled={!oaResult} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm flex items-center">
                  Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {!oaFile ? (
                <label className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group block">
                  <input type="file" className="hidden" accept=".pdf" onChange={e => e.target.files?.[0] && handleOaUpload(e.target.files[0])} />
                  <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Arrastra tu documento aquí</h3>
                  <p className="text-sm text-slate-500 mb-6">Solo PDF — Programa oficial Mineduc</p>
                  <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm">Seleccionar Archivo</span>
                </label>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{oaFile.name}</p>
                    {isProcessingOa ? (
                      <div className="flex items-center text-xs text-blue-600 mt-1"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Procesando con Gemini...</div>
                    ) : oaResult ? (
                      <p className="text-xs text-emerald-600 font-medium mt-1">Extraídos {oaResult.objetivos?.length} objetivos de {oaResult.asignatura}</p>
                    ) : (
                      <p className="text-xs text-red-600 mt-1">{oaError}</p>
                    )}
                  </div>
                  <button onClick={() => { setOaFile(null); setOaResult(null) }} className="text-xs text-slate-500 hover:text-slate-900 underline">Cambiar</button>
                </div>
              )}
              {oaResult && (
                <div className="p-4 border border-slate-100 rounded-xl bg-white max-h-48 overflow-y-auto text-xs space-y-2">
                  {oaResult.objetivos?.map((o: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-bold text-blue-600 shrink-0">{o.codigo}</span>
                      <span className="text-slate-600">{o.descripcion}</span>
                    </div>
                  ))}
                </div>
              )}
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
                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Volver</button>
                <button onClick={handleNext} disabled={!studentResult?.isValid} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm flex items-center">
                  Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </>
            }
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Letra del Curso</label>
                <select value={letra} onChange={e => setLetra(e.target.value)}
                  className="w-full md:w-1/2 appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium">
                  <option value="A">Letra A</option>
                  <option value="B">Letra B</option>
                  <option value="C">Letra C</option>
                  <option value="D">Letra D</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nómina SIGE (Excel)</label>
                {!studentFile ? (
                  <label className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group block">
                    <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={e => e.target.files?.[0] && handleStudentUpload(e.target.files[0])} />
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-3" />
                    <p className="text-sm text-slate-600 font-medium">Subir archivo Excel (.xlsx)</p>
                    <p className="text-xs text-slate-400 mt-1">La IA validará que los alumnos correspondan a la letra {letra}</p>
                  </label>
                ) : (
                  <div className={`p-4 border rounded-xl flex items-start gap-4 ${studentResult?.isValid === false ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                    <FileText className="w-6 h-6 text-slate-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{studentFile.name}</p>
                      {isProcessingStudents ? (
                        <div className="flex items-center text-xs text-blue-600 mt-1"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Analizando con IA...</div>
                      ) : studentResult ? (
                        <div className="mt-2">
                          <div className={`text-xs font-semibold flex items-center ${studentResult.isValid ? 'text-emerald-600' : 'text-red-600'}`}>
                            {studentResult.isValid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                            {studentResult.isValid ? 'Validación exitosa' : 'Inconsistencia detectada'}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{studentResult.reason}</p>
                          {studentResult.parsedStudents && (
                            <p className="text-[10px] text-slate-400 mt-2">Total alumnos detectados: {studentResult.parsedStudents.length}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-red-600 mt-1">{studentError}</p>
                      )}
                    </div>
                    <button onClick={() => { setStudentFile(null); setStudentResult(null) }} className="text-xs text-slate-500 hover:text-slate-900 underline">Cambiar</button>
                  </div>
                )}
              </div>
            </div>
          </WizardCard>
        )}

        {/* PASO 4: Preguntas del Ensayo (NEW) */}
        {currentStep.id === 'preguntas' && (
          <WizardCard
            title="Preguntas del Ensayo"
            description="Sube el PDF con el texto completo del ensayo. La IA extraerá el título y cada pregunta para análisis estadístico."
            footer={
              <>
                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Volver</button>
                <button onClick={handleNext} disabled={!preguntasResult} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm flex items-center">
                  Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {!preguntasFile ? (
                <label className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group block">
                  <input type="file" className="hidden" accept=".pdf" onChange={e => e.target.files?.[0] && handlePreguntasUpload(e.target.files[0])} />
                  <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Cuadernillo de Preguntas</h3>
                  <p className="text-sm text-slate-500 mb-6">Solo PDF — El ensayo con todas las preguntas</p>
                  <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm">Seleccionar Archivo</span>
                </label>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{preguntasFile.name}</p>
                    {isProcessingPreguntas ? (
                      <div className="flex items-center text-xs text-blue-600 mt-1"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Extrayendo preguntas y título...</div>
                    ) : preguntasResult ? (
                      <p className="text-xs text-emerald-600 font-medium mt-1">{preguntasResult.preguntas?.length} preguntas extraídas</p>
                    ) : (
                      <p className="text-xs text-red-600 mt-1">{preguntasError}</p>
                    )}
                  </div>
                  <button onClick={() => { setPreguntasFile(null); setPreguntasResult(null); setTituloEnsayo('') }} className="text-xs text-slate-500 hover:text-slate-900 underline">Cambiar</button>
                </div>
              )}

              {/* Título extraído — editable */}
              {preguntasResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Título extraído por IA</p>
                      {editandoTitulo ? (
                        <input
                          autoFocus
                          value={tituloEnsayo}
                          onChange={e => setTituloEnsayo(e.target.value)}
                          onBlur={() => setEditandoTitulo(false)}
                          className="w-full text-sm font-semibold text-slate-900 bg-white border border-indigo-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400/30"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{tituloEnsayo}</p>
                      )}
                    </div>
                    <button onClick={() => setEditandoTitulo(true)} className="p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-400 transition-colors" title="Editar título">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 border border-slate-100 rounded-xl bg-white max-h-48 overflow-y-auto text-xs space-y-2">
                    {preguntasResult.preguntas?.map((p: any, i: number) => (
                      <div key={i} className="flex gap-2 border-b border-slate-50 pb-1.5">
                        <span className="font-bold text-blue-600 shrink-0 min-w-[28px]">P{p.numero}</span>
                        <span className="text-slate-600 line-clamp-2">{p.enunciado}</span>
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
                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">Volver</button>
                <button onClick={handleNext} disabled={!pautaResult} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm flex items-center">
                  Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {!pautaFile ? (
                <label className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group block">
                  <input type="file" className="hidden" accept=".pdf" onChange={e => e.target.files?.[0] && handlePautaUpload(e.target.files[0])} />
                  <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">Cargar Clave de Respuestas</h3>
                  <p className="text-sm text-slate-500 mb-6">Solo PDF con las alternativas correctas</p>
                  <span className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm">Seleccionar Archivo</span>
                </label>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-4">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{pautaFile.name}</p>
                    {isProcessingPauta ? (
                      <div className="flex items-center text-xs text-blue-600 mt-1"><Loader2 className="w-3 h-3 animate-spin mr-1" /> Extrayendo con IA...</div>
                    ) : pautaResult ? (
                      <p className="text-xs text-emerald-600 font-medium mt-1">Extraídas {pautaResult.preguntas?.length} respuestas correctas</p>
                    ) : (
                      <p className="text-xs text-red-600 mt-1">{pautaError}</p>
                    )}
                  </div>
                  <button onClick={() => { setPautaFile(null); setPautaResult(null) }} className="text-xs text-slate-500 hover:text-slate-900 underline">Cambiar</button>
                </div>
              )}
              {pautaResult && (
                <div className="p-4 border border-slate-100 rounded-xl bg-white max-h-48 overflow-y-auto text-xs">
                  <div className="grid grid-cols-4 gap-2 font-bold border-b pb-2 mb-2 text-slate-700">
                    <div>Pregunta</div><div>Correcta</div><div className="col-span-2">Habilidad / OA</div>
                  </div>
                  {pautaResult.preguntas?.map((p: any, i: number) => (
                    <div key={i} className="grid grid-cols-4 gap-2 border-b border-slate-50 pb-1 mb-1">
                      <div className="font-semibold">{p.numero}</div>
                      <div className="text-emerald-600 font-bold">{p.alternativaCorrecta}</div>
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
                <button onClick={handleBack} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50">Volver</button>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-75 shadow-sm flex items-center">
                  {isSaving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                    : <><CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar y Guardar</>
                  }
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {saveError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />{saveError}
                </div>
              )}
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                <p className="text-sm font-bold text-emerald-900">Resumen de configuración</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div><span className="font-semibold text-slate-700">Título:</span> {tituloEnsayo || `Ensayo ${nivel} ${letra}`}</div>
                  <div><span className="font-semibold text-slate-700">Nivel:</span> {nivel} — Letra {letra}</div>
                  <div><span className="font-semibold text-slate-700">OAs:</span> {oaResult?.objetivos?.length ?? 0} objetivos</div>
                  <div><span className="font-semibold text-slate-700">Alumnos:</span> {studentResult?.parsedStudents?.length ?? 0}</div>
                  <div><span className="font-semibold text-slate-700">Preguntas:</span> {preguntasResult?.preguntas?.length ?? 0}</div>
                  <div><span className="font-semibold text-slate-700">Clave respuestas:</span> {pautaResult?.preguntas?.length ?? 0} ítems</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Las hojas de respuesta de los alumnos se cargarán desde el panel principal una vez guardado el ensayo.
              </p>
            </div>
          </WizardCard>
        )}
      </main>
    </div>
  )
}
