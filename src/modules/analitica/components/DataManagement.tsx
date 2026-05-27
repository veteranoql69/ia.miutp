'use client'

import { useEffect, useState } from 'react'
import { getAlumnosCurso } from '../actions'
import { 
  cargarEstandaresPredeterminados, 
  getEstandaresCargados,
  estructurarProgramaConIA,
  estructurarDocumentoConIA,
  guardarEstandaresPersonalizados,
  guardarEstandarIndividual,
  eliminarEstandar
} from '@/modules/colegio/actions'
import ImportStudents from '@/modules/colegio/components/ImportStudents'
import { 
  Users, 
  School, 
  Settings, 
  FileSpreadsheet, 
  BookOpen, 
  Loader2, 
  PlusCircle, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  BookMarked,
  Tag,
  Layers,
  Search,
  Trash2,
  Edit2,
  Plus
} from 'lucide-react'

interface DataManagementProps {
  profile: any
  cursoSeleccionado: any
  onRefresh: () => void
}

export default function DataManagement({ profile, cursoSeleccionado, onRefresh }: DataManagementProps) {
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [loadingAlumnos, setLoadingAlumnos] = useState(false)
  const [errorAlumnos, setErrorAlumnos] = useState<string | null>(null)
  
  // Listado de estándares cargados
  const [objetivos, setObjetivos] = useState<any[]>([])
  const [habilidades, setHabilidades] = useState<any[]>([])
  const [loadingEstandaresData, setLoadingEstandaresData] = useState(false)

  // Toggles e importación
  const [showImport, setShowImport] = useState(false)
  const [loadingEstandares, setLoadingEstandares] = useState(false)
  const [estandaresStatus, setEstandaresStatus] = useState<'success' | 'error' | null>(null)
  const [estandaresMsg, setEstandaresMsg] = useState('')

  // Estados para estructuración de programa con IA
  const [showAiParser, setShowAiParser] = useState(false)
  const [rawProgramText, setRawProgramText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedObjetivos, setParsedObjetivos] = useState<any[]>([])
  const [parsedHabilidades, setParsedHabilidades] = useState<any[]>([])
  const [aiError, setAiError] = useState<string | null>(null)
  const [isSavingParsed, setIsSavingParsed] = useState(false)

  // NUEVOS ESTADOS: Carga e importación de PDF
  const [parsingMode, setParsingMode] = useState<'file' | 'text'>('file')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // Estados para gestión manual (Edición y Creación)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingItem, setEditingItem] = useState<{ type: 'objetivo' | 'habilidad'; item: any } | null>(null)
  const [showManualAdd, setShowManualAdd] = useState(false)
  const [manualType, setManualType] = useState<'objetivo' | 'habilidad'>('objetivo')
  
  // Campos de formulario para manual/edición
  const [formCodigo, setFormCodigo] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formEje, setFormEje] = useState('')
  const [formNombre, setFormNombre] = useState('')
  const [savingIndividual, setSavingIndividual] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Cargar alumnos matriculados
  const fetchAlumnos = async () => {
    if (!cursoSeleccionado) return
    setLoadingAlumnos(true)
    setErrorAlumnos(null)
    const res = await getAlumnosCurso(cursoSeleccionado.id)
    if (res.success && res.data) {
      setAlumnos(res.data)
    } else {
      setErrorAlumnos(res.error || 'Error al obtener alumnos del curso.')
    }
    setLoadingAlumnos(false)
  }

  // Cargar estándares desde la base de datos
  const fetchEstandares = async () => {
    setLoadingEstandaresData(true)
    const res = await getEstandaresCargados()
    if (res.success && res.objetivos && res.habilidades) {
      setObjetivos(res.objetivos)
      setHabilidades(res.habilidades)
    }
    setLoadingEstandaresData(false)
  }

  useEffect(() => {
    fetchAlumnos()
    fetchEstandares()
    setShowImport(false)
    setShowAiParser(false)
  }, [cursoSeleccionado])

  const handleImportComplete = () => {
    fetchAlumnos()
    onRefresh()
    setTimeout(() => {
      setShowImport(false)
    }, 1500)
  }

  const handleCargarEstandares = async () => {
    setLoadingEstandares(true)
    setEstandaresStatus(null)
    const res = await cargarEstandaresPredeterminados()
    setLoadingEstandares(false)

    if (res.success) {
      setEstandaresStatus('success')
      setEstandaresMsg('Estándares Mineduc cargados correctamente.')
      fetchEstandares() // Recargar visualizador
    } else {
      setEstandaresStatus('error')
      setEstandaresMsg(res.error || 'Error al precargar los estándares.')
    }
  }

  const handleParseProgram = async () => {
    setIsParsing(true)
    setAiError(null)
    
    let res;
    if (parsingMode === 'file') {
      if (!uploadedFile) {
        setAiError('Por favor selecciona un archivo PDF o imagen primero.')
        setIsParsing(false)
        return
      }
      
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.readAsDataURL(uploadedFile)
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = (error) => reject(error)
        })
        
        res = await estructurarDocumentoConIA(base64Data, uploadedFile.type)
      } catch (err: any) {
        setAiError(`Error al leer el archivo: ${err.message || err}`)
        setIsParsing(false)
        return
      }
    } else {
      if (!rawProgramText.trim()) {
        setAiError('Por favor ingresa o pega el texto del programa.')
        setIsParsing(false)
        return
      }
      res = await estructurarProgramaConIA(rawProgramText)
    }
    
    setIsParsing(false)
    if (res.success && res.objetivos && res.habilidades) {
      setParsedObjetivos(res.objetivos)
      setParsedHabilidades(res.habilidades)
    } else {
      setAiError(res.error || 'Error al procesar con IA.')
    }
  }

  const handleSaveParsed = async () => {
    setIsSavingParsed(true)
    const res = await guardarEstandaresPersonalizados(parsedObjetivos, parsedHabilidades)
    setIsSavingParsed(false)
    if (res.success) {
      setEstandaresStatus('success')
      setEstandaresMsg('Estándares estructurados con IA guardados correctamente.')
      setParsedObjetivos([])
      setParsedHabilidades([])
      setRawProgramText('')
      setShowAiParser(false)
      fetchEstandares()
      onRefresh()
    } else {
      setAiError(res.error || 'Error al guardar los estándares.')
    }
  }

  const handleSaveIndividual = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingIndividual(true)
    
    let res;
    if (editingItem) {
      // Edición
      const data = editingItem.type === 'objetivo' 
        ? { id: editingItem.item.id, codigo: formCodigo, descripcion: formDescripcion, eje_tematico: formEje }
        : { id: editingItem.item.id, nombre: formNombre, descripcion: formDescripcion }
      res = await guardarEstandarIndividual(editingItem.type, data)
    } else {
      // Creación
      const data = manualType === 'objetivo'
        ? { codigo: formCodigo, descripcion: formDescripcion, eje_tematico: formEje }
        : { nombre: formNombre, descripcion: formDescripcion }
      res = await guardarEstandarIndividual(manualType, data)
    }

    setSavingIndividual(false)
    if (res.success) {
      setEditingItem(null)
      setShowManualAdd(false)
      // Resetear campos
      setFormCodigo('')
      setFormDescripcion('')
      setFormEje('')
      setFormNombre('')
      fetchEstandares()
      onRefresh()
    } else {
      alert(res.error || 'Error al guardar estándar.')
    }
  }

  const handleDeleteEstandar = async (tipo: 'objetivo' | 'habilidad', id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este estándar? Si está vinculado a alguna pregunta de prueba, la operación fallará.')) return
    setDeletingId(id)
    const res = await eliminarEstandar(tipo, id)
    setDeletingId(null)
    if (res.success) {
      fetchEstandares()
      onRefresh()
    } else {
      alert(res.error || 'Error al eliminar. Asegúrate de que no existan preguntas de ensayos vinculadas a este estándar.')
    }
  }

  const startEdit = (tipo: 'objetivo' | 'habilidad', item: any) => {
    setEditingItem({ type: tipo, item })
    if (tipo === 'objetivo') {
      setFormCodigo(item.codigo)
      setFormDescripcion(item.descripcion)
      setFormEje(item.eje_tematico || '')
    } else {
      setFormNombre(item.nombre)
      setFormDescripcion(item.descripcion || '')
    }
  }

  // Filtrado de estándares
  const filteredObjetivos = objetivos.filter(obj => 
    obj.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (obj.eje_tematico && obj.eje_tematico.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredHabilidades = habilidades.filter(hab => 
    hab.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (hab.descripcion && hab.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (!cursoSeleccionado) {
    return (
      <div className="w-full h-96 flex flex-col justify-center items-center rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-xl p-8 text-center space-y-4">
        <Settings className="w-12 h-12 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-300">No hay Cursos Seleccionados</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          No tienes ningún curso asociado todavía. Asegúrate de registrar al menos un curso académico en el asistente de configuración.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 font-display">Carga y Gestión de Datos</h1>
        <p className="text-xs text-slate-400">Administra los recursos escolares del curso: <span className="font-semibold text-slate-300">{cursoSeleccionado.nivel} {cursoSeleccionado.letra}</span></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Columna Izquierda: Acciones y Configuración del Curso */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Detalle Curso */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-900 pb-3 select-none">
              <School className="w-4 h-4 text-violet-400" /> Configuración del Curso
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nivel / Grado:</span>
                <span className="font-bold text-slate-300">{cursoSeleccionado.nivel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Letra / Sección:</span>
                <span className="font-bold text-slate-300">{cursoSeleccionado.letra}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Año Académico:</span>
                <span className="font-bold text-slate-300">{cursoSeleccionado.ano_academico}</span>
              </div>
              {cursoSeleccionado.asignatura && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Asignatura Asignada:</span>
                  <span className="font-bold text-indigo-400">{cursoSeleccionado.asignatura}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card de Acciones Académicas (Herramientas UTP) */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-slate-900 pb-3 select-none">
              <BookOpen className="w-4 h-4 text-indigo-400" /> Herramientas UTP
            </h3>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 leading-relaxed mb-1 select-none">
                Selecciona una herramienta para configurar la base curricular o matricular alumnos.
              </p>

              {estandaresStatus && (
                <div className={`p-2.5 rounded-lg text-[11px] flex items-center gap-2 ${
                  estandaresStatus === 'success' 
                    ? 'bg-emerald-950/20 border border-emerald-800/30 text-emerald-400' 
                    : 'bg-rose-950/20 border border-rose-800/30 text-rose-400'
                }`}>
                  {estandaresStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{estandaresMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                {/* 1. Precarga estándar */}
                <button
                  onClick={handleCargarEstandares}
                  disabled={loadingEstandares}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-slate-200 disabled:opacity-50 outline-none focus:outline-none group"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400 group-hover:animate-pulse" />
                    <span>Precargar Estándares Mineduc</span>
                  </span>
                  {loadingEstandares ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <span className="text-[9px] bg-violet-950/40 text-violet-400 px-2 py-0.5 rounded border border-violet-900/20 font-bold uppercase select-none">Semilla</span>
                  )}
                </button>

                {/* 2. Cargar con IA */}
                <button
                  onClick={() => {
                    setShowAiParser(!showAiParser)
                    setShowImport(false)
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-200 border outline-none focus:outline-none ${
                    showAiParser 
                      ? 'bg-violet-950/20 border-violet-800 text-violet-300 shadow-md shadow-violet-900/10' 
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-indigo-400" />
                    <span>Estructurar Programa con IA</span>
                  </span>
                  <span className="text-[9px] bg-indigo-950/40 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900/20 font-bold uppercase select-none">Gemini</span>
                </button>

                {/* 3. Carga SIGE */}
                <button
                  onClick={() => {
                    setShowImport(!showImport)
                    setShowAiParser(false)
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all duration-200 border outline-none focus:outline-none ${
                    showImport 
                      ? 'bg-cyan-950/20 border-cyan-800 text-cyan-300 shadow-md shadow-cyan-900/10' 
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Cargar Nómina SIGE</span>
                  </span>
                  <span className="text-[9px] bg-cyan-950/40 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/20 font-bold uppercase select-none">CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Contenido Principal */}
        <div className="lg:col-span-2 space-y-6">
          {showImport ? (
            <ImportStudents
              cursoId={cursoSeleccionado.id}
              cursoNombre={`${cursoSeleccionado.nivel} ${cursoSeleccionado.letra}`}
              anoAcademico={cursoSeleccionado.ano_academico}
              onImportComplete={handleImportComplete}
            />
          ) : showAiParser ? (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6 animate-fade-in relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 select-none">
                  <Sparkles className="w-4 h-4 text-violet-400" /> Estructurar Programa con IA (Gemini)
                </h3>
                <span className="text-[10px] text-violet-400 font-bold tracking-wide uppercase select-none bg-violet-950/40 px-2 py-0.5 rounded border border-violet-900/20">
                  Model: 2.5 Flash
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 p-1 rounded-xl bg-slate-950 border border-slate-900 select-none max-w-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setParsingMode('file')
                      setAiError(null)
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      parsingMode === 'file' 
                        ? 'bg-violet-600 text-slate-100 shadow shadow-violet-900/25' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Subir PDF / Imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParsingMode('text')
                      setAiError(null)
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      parsingMode === 'text' 
                        ? 'bg-violet-600 text-slate-100 shadow shadow-violet-900/25' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pegar Texto
                  </button>
                </div>

                {parsingMode === 'file' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sube el documento PDF oficial de estándares nacionales Mineduc o las bases curriculares. La IA lo procesará directamente usando capacidades multimodales para extraer y resumir los Objetivos (OAs) y Habilidades.
                    </p>
                    
                    <div className="border-2 border-dashed border-slate-800 hover:border-violet-600 rounded-2xl p-8 text-center transition-colors bg-slate-950/40 relative">
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadedFile(e.target.files[0])
                            setAiError(null)
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-2 select-none pointer-events-none">
                        <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
                        {uploadedFile ? (
                          <div>
                            <p className="text-xs font-bold text-violet-400">{uploadedFile.name}</p>
                            <p className="text-[10px] text-slate-500">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Listo para procesar</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-semibold text-slate-300">Arrastra o selecciona un archivo</p>
                            <p className="text-[10px] text-slate-500">Soporta PDF, PNG, JPG (Máx. 50 MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Pega el texto de tu planificación anual, unidades pedagógicas, programas ministeriales o temario curricular. La IA extraerá automáticamente cada Objetivo de Aprendizaje (OA) y Habilidad Cognitiva.
                    </p>

                    <textarea
                      value={rawProgramText}
                      onChange={(e) => setRawProgramText(e.target.value)}
                      rows={8}
                      placeholder="Ejemplo:&#10;Unidad 1: Análisis crítico de medios. Objetivo de aprendizaje OA 10 (Lectura): Analizar y evaluar críticamente textos de medios de comunicación para determinar sesgos y veracidad de la información. Habilidades evaluadas: Reflexionar críticamente sobre contenidos e Interpretar sentidos implícitos en los discursos."
                      className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-600 focus:border-violet-600 outline-none resize-none transition-colors"
                    />
                  </div>
                )}

                {aiError && (
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiParser(false)
                      setRawProgramText('')
                      setUploadedFile(null)
                      setParsedObjetivos([])
                      setParsedHabilidades([])
                      setAiError(null)
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleParseProgram}
                    disabled={isParsing || (parsingMode === 'file' ? !uploadedFile : !rawProgramText.trim())}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-slate-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Analizando con Gemini...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-violet-300" /> Estructurar con IA
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Vista Previa de Datos Extraídos */}
              {(parsedObjetivos.length > 0 || parsedHabilidades.length > 0) && (
                <div className="mt-6 p-6 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                    <h4 className="text-xs font-bold text-violet-400 flex items-center gap-2 select-none">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resultados del Análisis Curricular (Edita antes de guardar)
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Objetivos extraídos */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-violet-400" /> Objetivos de Aprendizaje ({parsedObjetivos.length})
                      </h5>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {parsedObjetivos.map((obj, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-2">
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={obj.codigo} 
                                onChange={(e) => {
                                  const updated = [...parsedObjetivos]
                                  updated[idx].codigo = e.target.value
                                  setParsedObjetivos(updated)
                                }}
                                className="w-1/3 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-violet-400 font-bold outline-none focus:border-violet-600"
                                placeholder="Código"
                              />
                              <input 
                                type="text" 
                                value={obj.eje_tematico} 
                                onChange={(e) => {
                                  const updated = [...parsedObjetivos]
                                  updated[idx].eje_tematico = e.target.value
                                  setParsedObjetivos(updated)
                                }}
                                className="w-2/3 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 outline-none focus:border-violet-600"
                                placeholder="Eje temático"
                              />
                            </div>
                            <textarea 
                              value={obj.descripcion} 
                              onChange={(e) => {
                                const updated = [...parsedObjetivos]
                                updated[idx].descripcion = e.target.value
                                  setParsedObjetivos(updated)
                                }}
                                rows={2}
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 outline-none focus:border-violet-600 resize-none"
                              />
                              <button 
                                type="button" 
                                onClick={() => setParsedObjetivos(parsedObjetivos.filter((_, i) => i !== idx))}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                              >
                                Eliminar de la lista
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Habilidades extraídas */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" /> Habilidades Cognitivas ({parsedHabilidades.length})
                        </h5>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {parsedHabilidades.map((hab, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-2">
                              <input 
                                type="text" 
                                value={hab.nombre} 
                                onChange={(e) => {
                                  const updated = [...parsedHabilidades]
                                  updated[idx].nombre = e.target.value
                                  setParsedHabilidades(updated)
                                }}
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-indigo-400 font-bold outline-none focus:border-violet-600"
                                placeholder="Nombre habilidad"
                              />
                              <textarea 
                                value={hab.descripcion} 
                                onChange={(e) => {
                                  const updated = [...parsedHabilidades]
                                  updated[idx].descripcion = e.target.value
                                  setParsedHabilidades(updated)
                                }}
                                rows={2}
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 outline-none focus:border-violet-600 resize-none"
                              />
                              <button 
                                type="button" 
                                onClick={() => setParsedHabilidades(parsedHabilidades.filter((_, i) => i !== idx))}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                              >
                                Eliminar de la lista
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-900 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setParsedObjetivos([])
                          setParsedHabilidades([])
                        }}
                        className="px-4 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
                      >
                        Descartar Todo
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveParsed}
                        disabled={isSavingParsed}
                        className="px-4 py-2 rounded-xl text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-slate-100 font-semibold flex items-center gap-2 transition-all active:scale-[0.98]"
                      >
                        {isSavingParsed ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar y Guardar en Sistema
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            // Nómina Actual del Curso
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 select-none">
                  <Users className="w-4 h-4 text-cyan-400" /> Nómina Actual del Curso
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 select-none">
                  {alumnos.length} {alumnos.length === 1 ? 'Alumno' : 'Alumnos'}
                </span>
              </div>

              {loadingAlumnos ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : errorAlumnos ? (
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="text-xs text-slate-400">{errorAlumnos}</p>
                </div>
              ) : alumnos.length === 0 ? (
                <div className="text-center py-16 space-y-3 select-none">
                  <FileSpreadsheet className="w-12 h-12 text-slate-800 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-400">Sin Alumnos Matriculados</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    La lista de alumnos para esta sección está vacía. Haz clic en **Cargar Nómina SIGE** en el panel lateral para subir el listado desde un archivo CSV.
                  </p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[350px] divide-y divide-slate-900 pr-2 custom-scrollbar">
                  {alumnos.map((alumno) => (
                    <div key={alumno.estudiante_id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-900/10 px-2 rounded-lg transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{alumno.nombre} {alumno.apellido}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{alumno.rut}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                        alumno.genero === 'F' 
                          ? 'bg-pink-950/20 border-pink-900/30 text-pink-400'
                          : alumno.genero === 'M'
                          ? 'bg-sky-950/20 border-sky-900/30 text-sky-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}>
                        {alumno.genero === 'F' ? 'Femenino' : alumno.genero === 'M' ? 'Masculino' : 'Otro'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* SECCIÓN INFERIOR: Visualizador de Estándares Mineduc Estructurados */}
      <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-950/40 text-violet-400 border border-violet-800/20 shadow-md">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Estándares Pedagógicos Mineduc (Datos Estructurados)</h3>
              <p className="text-xs text-slate-500">Objetivos de aprendizaje y habilidades curriculares disponibles en el sistema.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 w-fit select-none">
            {objetivos.length} OAs • {habilidades.length} Habilidades
          </span>
        </div>

        {/* Barra de Búsqueda y Creación Manual */}
        {!(objetivos.length === 0 && habilidades.length === 0) && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:max-w-md relative">
              <input
                type="text"
                placeholder="Buscar por código, descripción o habilidad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:border-violet-600 outline-none transition-colors"
              />
              <Search className="w-4 h-4 text-slate-600 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <button
              onClick={() => {
                setManualType('objetivo')
                setShowManualAdd(true)
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-all select-none"
            >
              <Plus className="w-4 h-4 text-violet-400" /> Agregar Estándar Manual
            </button>
          </div>
        )}

        {loadingEstandaresData ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : objetivos.length === 0 && habilidades.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Layers className="w-12 h-12 text-slate-800 mx-auto" />
            <h4 className="text-sm font-bold text-slate-400">Sin Estándares Registrados</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              No hay bases curriculares cargadas en el sistema para este colegio. Presiona **Precargar Estándares Mineduc** o **Estructurar Programa con IA** en el panel de herramientas lateral.
            </p>
            <button
              onClick={() => {
                setManualType('objetivo')
                setShowManualAdd(true)
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-slate-100 flex items-center justify-center gap-1.5 transition-all mx-auto select-none"
            >
              <Plus className="w-4 h-4" /> Agregar Estándar Manual
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Columna Objetivos de Aprendizaje */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-900/60 pb-2 select-none">
                <Tag className="w-3.5 h-3.5 text-violet-400" /> Objetivos de Aprendizaje (OAs)
              </h4>
              
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredObjetivos.map((obj) => (
                  <div key={obj.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-2 hover:border-slate-800 transition-colors group relative">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex gap-2 items-center">
                        <span className="px-2 py-0.5 rounded bg-violet-950 border border-violet-900/30 text-[9px] font-bold text-violet-400">
                          {obj.codigo}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                          {obj.eje_tematico}
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity select-none">
                        <button 
                          onClick={() => startEdit('objetivo', obj)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteEstandar('objetivo', obj.id)}
                          className="text-[10px] text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-0.5"
                          disabled={deletingId === obj.id}
                        >
                          <Trash2 className="w-2.5 h-2.5" /> {deletingId === obj.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {obj.descripcion}
                    </p>
                  </div>
                ))}
                {filteredObjetivos.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-600 select-none">No se encontraron objetivos de aprendizaje.</p>
                )}
              </div>
            </div>

            {/* Columna Habilidades */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-900/60 pb-2 select-none">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Habilidades Evaluadas
              </h4>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredHabilidades.map((hab) => (
                  <div key={hab.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-2 hover:border-slate-800 transition-colors group relative">
                    <div className="flex justify-between items-start gap-2">
                      <h5 className="text-xs font-bold text-indigo-400">{hab.nombre}</h5>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity select-none">
                        <button 
                          onClick={() => startEdit('habilidad', hab)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteEstandar('habilidad', hab.id)}
                          className="text-[10px] text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-0.5"
                          disabled={deletingId === hab.id}
                        >
                          <Trash2 className="w-2.5 h-2.5" /> {deletingId === hab.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {hab.descripcion}
                    </p>
                  </div>
                ))}
                {filteredHabilidades.length === 0 && (
                  <p className="text-center py-6 text-xs text-slate-600 select-none">No se encontraron habilidades cognitivas.</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* MODAL PARA CREACIÓN Y EDICIÓN DE ESTÁNDAR MANUAL */}
      {(showManualAdd || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 relative">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 select-none">
              <BookMarked className="w-5 h-5 text-violet-400" />
              {editingItem 
                ? `Editar ${editingItem.type === 'objetivo' ? 'Objetivo' : 'Habilidad'}` 
                : `Agregar ${manualType === 'objetivo' ? 'Objetivo' : 'Habilidad'} Manual`
              }
            </h3>

            <form onSubmit={handleSaveIndividual} className="space-y-4">
              {!editingItem && (
                <div className="flex gap-4 p-1 rounded-xl bg-slate-950 border border-slate-900 select-none">
                  <button
                    type="button"
                    onClick={() => setManualType('objetivo')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      manualType === 'objetivo' 
                        ? 'bg-violet-600 text-slate-100 shadow shadow-violet-900/25' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Objetivo (OA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('habilidad')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      manualType === 'habilidad' 
                        ? 'bg-violet-600 text-slate-100 shadow shadow-violet-900/25' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Habilidad Cognitiva
                  </button>
                </div>
              )}

              {/* Form fields */}
              {((editingItem && editingItem.type === 'objetivo') || (!editingItem && manualType === 'objetivo')) ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Código del Objetivo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: OA 5 (Matemática)"
                      value={formCodigo}
                      onChange={(e) => setFormCodigo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-violet-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Eje Temático</label>
                    <input
                      type="text"
                      placeholder="Ej: Álgebra y Funciones, Lectura"
                      value={formEje}
                      onChange={(e) => setFormEje(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-violet-600 transition-colors"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Nombre de la Habilidad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Argumentar, Interpretar"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Descripción Curricular</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detalla de forma explícita el estándar o indicador pedagógico correspondiente..."
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-violet-600 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-900 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null)
                    setShowManualAdd(false)
                    setFormCodigo('')
                    setFormDescripcion('')
                    setFormEje('')
                    setFormNombre('')
                  }}
                  className="px-4 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingIndividual}
                  className="px-4 py-2 rounded-xl text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-slate-100 font-bold flex items-center gap-1.5"
                >
                  {savingIndividual && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Estándar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
