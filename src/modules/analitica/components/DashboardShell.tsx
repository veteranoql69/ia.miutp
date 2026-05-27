'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getDashboardContext, getAppliedTests } from '../actions'
import { 
  LayoutDashboard, 
  Grid3X3, 
  LineChart, 
  Settings, 
  LogOut, 
  ChevronDown, 
  School, 
  User, 
  Loader2, 
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react'

interface DashboardShellProps {
  userId: string
  children: (props: {
    profile: any
    colegio: any
    cursoSeleccionado: any
    ensayoSeleccionado: any
    activeTab: string
    onRefresh: () => void
  }) => React.ReactNode
}

export default function DashboardShell({ userId, children }: DashboardShellProps) {
  const router = useRouter()
  const supabase = createClient()

  // Estados de carga y datos principales
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [colegio, setColegio] = useState<any>(null)
  const [cursos, setCursos] = useState<any[]>([])
  
  // Selección de Filtros
  const [selectedCursoId, setSelectedCursoId] = useState<string>('')
  const [ensayos, setEnsayos] = useState<any[]>([])
  const [loadingEnsayos, setLoadingEnsayos] = useState(false)
  const [selectedEnsayoId, setSelectedEnsayoId] = useState<string>('')
  
  // Pestaña Activa
  const [activeTab, setActiveTab] = useState<string>('herramientas')
  const [error, setError] = useState<string | null>(null)
  
  // Trigger para refrescar datos
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Cargar contexto inicial
  useEffect(() => {
    const fetchContext = async () => {
      setLoading(true)
      const res = await getDashboardContext(userId)
      
      if (res.success) {
        if (res.onboardingRequired) {
          router.push('/onboarding')
          return
        }
        
        setProfile(res.profile)
        setColegio(res.colegio)
        setCursos(res.cursos || [])
        
        if (res.cursos && res.cursos.length > 0) {
          setSelectedCursoId(res.cursos[0].id)
        }
      } else {
        setError(res.error || 'Error al inicializar el dashboard.')
      }
      setLoading(false)
    }

    fetchContext()
  }, [userId, router, refreshTrigger])

  // Cargar ensayos cuando cambia el curso seleccionado
  useEffect(() => {
    if (!selectedCursoId) return

    const fetchEnsayos = async () => {
      setLoadingEnsayos(true)
      const res = await getAppliedTests(selectedCursoId)
      
      if (res.success) {
        setEnsayos(res.data || [])
        if (res.data && res.data.length > 0) {
          setSelectedEnsayoId(res.data[0].id)
        } else {
          setSelectedEnsayoId('')
        }
      } else {
        console.error('Error al cargar ensayos:', res.error)
      }
      setLoadingEnsayos(false)
    }

    fetchEnsayos()
  }, [selectedCursoId, refreshTrigger])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-slate-100 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-semibold animate-pulse">
          Cargando entorno analítico...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md p-6 rounded-2xl bg-red-950/20 border border-red-800/40 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-200">Error del Sistema</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <button 
            onClick={triggerRefresh}
            className="w-full py-2.5 px-4 rounded-xl bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

  const cursoSeleccionado = cursos.find(c => c.id === selectedCursoId)
  const ensayoSeleccionado = ensayos.find(e => e.id === selectedEnsayoId)

  return (
    <div className="min-h-screen bg-black text-slate-100 flex overflow-hidden">
      
      {/* Luces decorativas */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-950/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-950/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/40 backdrop-blur-xl flex flex-col justify-between p-6 z-10 shrink-0 select-none">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-slate-100 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 font-display">miUTP</span>
          </div>

          {/* Menú de Navegación */}
          <nav className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-3 select-none">Métricas</span>
              
              <button 
                onClick={() => setActiveTab('kpis')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold no-underline hover:no-underline transition-all duration-200 active:scale-[0.98] outline-none focus:outline-none focus:ring-0 ${
                  activeTab === 'kpis' 
                    ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-950/30' 
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40 hover:border-slate-900/40'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Resumen General
              </button>

              <button 
                onClick={() => setActiveTab('matrix')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold no-underline hover:no-underline transition-all duration-200 active:scale-[0.98] outline-none focus:outline-none focus:ring-0 ${
                  activeTab === 'matrix' 
                    ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-950/30' 
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40 hover:border-slate-900/40'
                }`}
              >
                <Grid3X3 className="w-4 h-4" /> Matriz de Logros
              </button>

              <button 
                onClick={() => setActiveTab('gaps')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold no-underline hover:no-underline transition-all duration-200 active:scale-[0.98] outline-none focus:outline-none focus:ring-0 ${
                  activeTab === 'gaps' 
                    ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-950/30' 
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40 hover:border-slate-900/40'
                }`}
              >
                <LineChart className="w-4 h-4" /> Brechas Pedagógicas
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-3 select-none">Currículum</span>

              <button
                onClick={() => setActiveTab('curriculum')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold no-underline hover:no-underline transition-all duration-200 active:scale-[0.98] outline-none focus:outline-none focus:ring-0 ${
                  activeTab === 'curriculum'
                    ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-950/30'
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40 hover:border-slate-900/40'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Programas Curriculares
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-3 select-none">Configuración</span>

              <button
                onClick={() => setActiveTab('herramientas')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold no-underline hover:no-underline transition-all duration-200 active:scale-[0.98] outline-none focus:outline-none focus:ring-0 ${
                  activeTab === 'herramientas'
                    ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-950/30'
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40 hover:border-slate-900/40'
                }`}
              >
                <Settings className="w-4 h-4" /> Centro de Herramientas
              </button>

              <button
                onClick={() => setActiveTab('management')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold no-underline hover:no-underline transition-all duration-200 active:scale-[0.98] outline-none focus:outline-none focus:ring-0 ${
                  activeTab === 'management'
                    ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-950/30'
                    : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40 hover:border-slate-900/40'
                }`}
              >
                <Settings className="w-4 h-4" /> Carga & Gestión de Datos
              </button>
            </div>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="space-y-4 pt-6 border-t border-slate-900">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">{profile?.nombre || 'Docente'}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">
                {profile?.rol === 'utp' ? 'Jefe de UTP' : 'Profesor'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all cursor-pointer outline-none focus:outline-none"
          >
            <LogOut className="w-4 h-4" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Topbar */}
        <header className="border-b border-slate-900 bg-slate-950/20 backdrop-blur-xl px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-10 select-none">
          <div className="flex items-center gap-3">
            <School className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-200">{colegio?.nombre}</h2>
              <p className="text-[10px] text-slate-500">RBD: {colegio?.rbd} • Comuna: {colegio?.comuna}</p>
            </div>
          </div>

          {/* Selectores */}
          <div className="flex items-center gap-3">
            {/* Curso */}
            <div className="relative group">
              <select
                value={selectedCursoId}
                onChange={(e) => setSelectedCursoId(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900 hover:text-slate-100 text-xs font-semibold text-slate-300 outline-none focus:outline-none cursor-pointer shadow-lg shadow-black/20 transition-all duration-200"
              >
                {cursos.length === 0 ? (
                  <option value="">Sin Cursos</option>
                ) : (
                  cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nivel} {c.letra} {c.asignatura ? `(${c.asignatura})` : ''}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-300 transition-colors" />
            </div>

            {/* Ensayo */}
            <div className="relative group">
              <select
                value={selectedEnsayoId}
                onChange={(e) => setSelectedEnsayoId(e.target.value)}
                disabled={loadingEnsayos || ensayos.length === 0}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900 hover:text-slate-100 text-xs font-semibold text-slate-300 outline-none focus:outline-none cursor-pointer shadow-lg shadow-black/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingEnsayos ? (
                  <option value="">Cargando Ensayos...</option>
                ) : ensayos.length === 0 ? (
                  <option value="">Sin Ensayos Cargados</option>
                ) : (
                  ensayos.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-slate-300 transition-colors" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-8 z-10">
          {children({
            profile,
            colegio,
            cursoSeleccionado,
            ensayoSeleccionado,
            activeTab,
            onRefresh: triggerRefresh
          })}
        </main>
      </div>
    </div>
  )
}
