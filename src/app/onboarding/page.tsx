'use client'

import { useEffect, useState } from 'react'
import OnboardingForm from '@/modules/colegio/components/OnboardingForm'
import ImportStudents from '@/modules/colegio/components/ImportStudents'
import { createCurso } from '@/modules/colegio/actions'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle2, LayoutDashboard, PlusCircle, ArrowRight, Sparkles, School, GraduationCap, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1) // 1: Colegio, 2: Primer Curso, 3: Cargar Alumnos, 4: Listo
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [colegio, setColegio] = useState<any>(null)
  const [curso, setCurso] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Redirigir a login si no hay sesión activa
        router.push('/login')
      } else {
        setUserId(user.id)
        
        // Verificar si el usuario ya tiene un colegio configurado
        const { data: perfil } = await supabase
          .from('miutp_perfiles')
          .select('colegio_id')
          .eq('id', user.id)
          .single()

        const perfilData = perfil as any
        if (perfilData?.colegio_id) {
          // Si ya tiene colegio, saltar al paso 2
          setColegio({ id: perfilData.colegio_id })
          setStep(2)
        }
        
        setSessionLoading(false)
      }
    }
    
    checkUser()
  }, [router])
  
  const [cursoData, setCursoData] = useState({
    nivel: '2 Medio',
    letra: 'A',
    ano_academico: new Date().getFullYear(),
  })
  const [cursoError, setCursoError] = useState<string | null>(null)
  const [isCursoPending, setIsCursoPending] = useState(false)

  // Paso 1 completado: Guardar Colegio
  const handleColegioComplete = (colegioRegistrado: any) => {
    setColegio(colegioRegistrado)
    setStep(2)
  }

  // Paso 2: Crear Primer Curso
  const handleCreateCurso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!colegio) return
    
    setCursoError(null)
    setIsCursoPending(true)

    const res = await createCurso(colegio.id, cursoData)
    setIsCursoPending(false)

    if (res.success) {
      setCurso(res.curso)
      setStep(3)
    } else {
      setCursoError(res.error || 'Error al registrar el curso.')
    }
  }

  // Paso 3 completado: Importar Estudiantes
  const handleImportComplete = (results: any) => {
    setStep(4)
  }

  if (sessionLoading) {
    return (
      <main className="min-h-screen bg-black text-slate-100 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-semibold animate-pulse">
          Verificando sesión con Google...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between py-12 px-4 relative overflow-hidden">
      
      {/* Fondo decorativo con luces sutiles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-8 border-b border-slate-900 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-slate-100 shadow-md shadow-indigo-950/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 font-display">miUTP</span>
        </div>
        
        {/* Pasos del asistente */}
        <div className="hidden md:flex items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : ''}`}>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${step >= 1 ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-800'}`}>1</span>
            <span>Establecimiento</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-800" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : ''}`}>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${step >= 2 ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-800'}`}>2</span>
            <span>Curso Inicial</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-800" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-400' : ''}`}>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center ${step >= 3 ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-800'}`}>3</span>
            <span>Alumnos (SIGE)</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <section className="flex-1 flex items-center justify-center py-12 z-10">
        
        {/* Paso 1: Configurar Colegio */}
        {step === 1 && userId && (
          <OnboardingForm userId={userId} onComplete={handleColegioComplete} />
        )}

        {/* Paso 2: Crear Primer Curso */}
        {step === 2 && (
          <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6 animate-fade-in">
            <div className="space-y-1 text-center">
              <PlusCircle className="w-12 h-12 text-violet-400 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-100 font-display">Registra tu Primer Curso</h2>
              <p className="text-xs text-slate-400">
                Para importar estudiantes, primero crea la sección del nivel que evaluarás.
              </p>
            </div>

            {cursoError && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-red-400 text-xs">
                {cursoError}
              </div>
            )}

            <form onSubmit={handleCreateCurso} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-violet-400" /> Nivel / Grado
                </label>
                <input
                  type="text"
                  value={cursoData.nivel}
                  onChange={(e) => setCursoData(prev => ({ ...prev, nivel: e.target.value }))}
                  placeholder="2 Medio"
                  disabled={isCursoPending}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Letra / Sección</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={cursoData.letra}
                    onChange={(e) => setCursoData(prev => ({ ...prev, letra: e.target.value.toUpperCase() }))}
                    placeholder="A"
                    disabled={isCursoPending}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 text-center transition-all outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Año Académico</label>
                  <input
                    type="number"
                    value={cursoData.ano_academico}
                    onChange={(e) => setCursoData(prev => ({ ...prev, ano_academico: parseInt(e.target.value) || new Date().getFullYear() }))}
                    placeholder="2026"
                    disabled={isCursoPending}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 text-center transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCursoPending}
                className="w-full py-3.5 px-5 rounded-xl text-slate-100 font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
              >
                {isCursoPending ? 'Registrando curso...' : 'Crear Curso y Continuar'}
              </button>
            </form>
          </div>
        )}

        {/* Paso 3: Cargar Nómina de Estudiantes */}
        {step === 3 && curso && (
          <div className="space-y-6">
            <ImportStudents
              cursoId={curso.id}
              cursoNombre={`${curso.nivel} ${curso.letra}`}
              anoAcademico={curso.ano_academico}
              onImportComplete={handleImportComplete}
            />
            {/* Opción de omitir */}
            <div className="text-center">
              <button 
                onClick={() => setStep(4)} 
                className="text-xs text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
              >
                Omitir este paso por ahora
              </button>
            </div>
          </div>
        )}

        {/* Paso 4: Finalizado */}
        {step === 4 && (
          <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-center space-y-6 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-pulse" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-100 font-display">¡Todo Listo para Evaluar!</h2>
              <p className="text-xs text-slate-400">
                Has configurado tu establecimiento, creado tu primer curso e importado su nómina. Ya puedes comenzar a procesar tus ensayos SIMCE.
              </p>
            </div>

            <div className="pt-2">
              <Link 
                href="/dashboard"
                className="w-full py-4 px-6 rounded-xl text-slate-100 font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-950/30"
              >
                <LayoutDashboard className="w-5 h-5" /> Ir al Dashboard Analítico
              </Link>
            </div>
          </div>
        )}

      </section>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto flex items-center justify-center text-[10px] text-slate-600 tracking-wider uppercase pt-8 border-t border-slate-900/60 z-10">
        <span>miUTP &copy; {new Date().getFullYear()} - Automatización SIMCE Premium</span>
      </footer>
    </main>
  )
}
