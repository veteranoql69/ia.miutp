'use client'

import { useEffect, useState } from 'react'
import OnboardingForm from '@/modules/colegio/components/OnboardingForm'
import { getColegiosList, saveOnboardingProfesorColegio } from '@/modules/colegio/actions'
import { createClient } from '@/utils/supabase/client'
import { 
  CheckCircle2, 
  Sparkles, 
  School, 
  GraduationCap, 
  Loader2, 
  ShieldCheck, 
  ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Estados de flujo y sesión
  const [step, setStep] = useState(0) // 0: Rol, 1: Colegio, 2: Listo
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  
  // Selección de rol y datos
  const [rol, setRol] = useState<'utp' | 'profesor' | null>(null)
  
  // Carga de colegios existentes (para flujo profesor)
  const [colegiosDisponibles, setColegiosDisponibles] = useState<any[]>([])
  const [loadingColegios, setLoadingColegios] = useState(false)
  const [colegioSeleccionadoId, setColegioSeleccionadoId] = useState<string>('')
  const [isVincularPending, setIsVincularPending] = useState(false)
  const [vincularError, setVincularError] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserId(user.id)
        setUserEmail(user.email ?? null)
        
        // Verificar si el usuario ya tiene perfil y colegio configurado
        const { data: perfil } = await supabase
          .from('miutp_perfiles')
          .select('colegio_id, rol')
          .eq('id', user.id)
          .single()

        const perfilData = perfil as any
        if (perfilData?.colegio_id) {
          // Si ya tiene colegio, se va al dashboard
          router.push('/dashboard')
        } else {
          setSessionLoading(false)
        }
      }
    }
    
    checkUser()
  }, [router])

  // Carga colegios para flujo Profesor
  const cargarColegios = async () => {
    setLoadingColegios(true)
    const res = await getColegiosList()
    if (res.success && res.data) {
      setColegiosDisponibles(res.data)
      if (res.data.length > 0) {
        setColegioSeleccionadoId(res.data[0].id)
      }
    }
    setLoadingColegios(false)
  }

  // Selección de rol
  const handleSelectRol = (role: 'utp' | 'profesor') => {
    setRol(role)
    if (role === 'utp') {
      setStep(1)
    } else {
      cargarColegios()
      setStep(1)
    }
  }

  // Paso 1 (UTP) completado: Colegio creado/seleccionado
  const handleColegioComplete = (colegioRegistrado: any) => {
    router.push('/dashboard')
  }

  // Paso 1 (Profesor): Seleccionar colegio existente
  const handleVincularColegioProfesor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!colegioSeleccionadoId || !userId) return
    
    setIsVincularPending(true)
    setVincularError(null)
    
    const res = await saveOnboardingProfesorColegio(userId, colegioSeleccionadoId)
    setIsVincularPending(false)
    
    if (res.success) {
      router.push('/dashboard')
    } else {
      setVincularError(res.error || 'Error al vincular con el establecimiento.')
    }
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
      </header>

      {/* Main Content Area */}
      <section className="flex-1 flex items-center justify-center py-12 z-10">
        
        {/* Paso 0: Selección de Rol */}
        {step === 0 && (
          <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                Selecciona tu Rol Académico
              </h1>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">
                Para brindarte una experiencia adaptada a tus funciones en el establecimiento, cuéntanos cuál es tu rol académico.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Opción 1: Jefe de UTP */}
              <button 
                onClick={() => handleSelectRol('utp')}
                className="group relative text-left p-6 rounded-2xl bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800/80 hover:border-violet-500/40 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-violet-950/20 active:scale-[0.99] flex flex-col justify-between h-64 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-800/30 text-violet-400 w-fit group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 font-display">Jefe de UTP / Administrador</h3>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      Administra de manera centralizada el colegio, configura cursos oficiales, cargas académicas y herramientas pedagógicas.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                  Comenzar como Jefe de UTP <ChevronRight className="w-4 h-4" />
                </div>
              </button>

              {/* Opción 2: Profesor */}
              <button 
                onClick={() => handleSelectRol('profesor')}
                className="group relative text-left p-6 rounded-2xl bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/40 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-indigo-950/20 active:scale-[0.99] flex flex-col justify-between h-64 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/30 text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 font-display">Profesor de Asignatura</h3>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      Asóciate a un colegio existente. Sube ensayos, revisa matrices analíticas detalladas y obtén recomendaciones de IA para tus cursos.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                  Comenzar como Profesor <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Paso 1: Configurar Colegio (Jefe de UTP) */}
        {step === 1 && rol === 'utp' && userId && (
          <OnboardingForm userId={userId} userEmail={userEmail} onComplete={handleColegioComplete} />
        )}

        {/* Paso 1: Vincular Colegio Existente (Profesor) */}
        {step === 1 && rol === 'profesor' && (
          <div className="w-full max-w-md mx-auto p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6 animate-fade-in relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full blur-sm" />
            <div className="space-y-1 text-center">
              <School className="w-12 h-12 text-indigo-400 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-100 font-display">Selecciona tu Establecimiento</h2>
              <p className="text-xs text-slate-400">
                Selecciona el colegio donde impartes clases para sincronizarte con el Jefe de UTP.
              </p>
            </div>

            {vincularError && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-red-400 text-xs">
                {vincularError}
              </div>
            )}

            {loadingColegios ? (
              <div className="flex flex-col justify-center items-center py-8 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Cargando colegios registrados...</p>
              </div>
            ) : colegiosDisponibles.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs space-y-3 text-center">
                <p>No se encontraron colegios registrados en la plataforma.</p>
                <p className="text-[10px] text-slate-400">
                  Por favor, solicita a tu Jefe de UTP que registre el establecimiento para poder vincularte.
                </p>
                <button 
                  onClick={() => setStep(0)} 
                  className="px-3 py-1.5 rounded-lg bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50 text-amber-100 transition-all text-[11px]"
                >
                  Volver a selección de Rol
                </button>
              </div>
            ) : (
              <form onSubmit={handleVincularColegioProfesor} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="colegio" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Establecimiento Educacional</label>
                  <select
                    id="colegio"
                    value={colegioSeleccionadoId}
                    onChange={(e) => setColegioSeleccionadoId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 transition-all outline-none cursor-pointer"
                  >
                    {colegiosDisponibles.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.nombre} ({col.comuna}) - RBD: {col.rbd}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isVincularPending}
                  className="w-full py-3.5 px-5 rounded-xl text-slate-100 font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {isVincularPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Vinculando...</>
                  ) : (
                    'Confirmar Establecimiento'
                  )}
                </button>
              </form>
            )}
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
