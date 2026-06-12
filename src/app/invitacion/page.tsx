import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getInvitacionByToken, acceptInvitacion } from '@/modules/invitaciones/actions'
import { Sparkles, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function InvitacionPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) {
    redirect('/login')
  }

  const invResult = await getInvitacionByToken(token)

  if (!invResult.success || !invResult.data) {
    return <ErrorCard message="Esta invitación no existe o el link es inválido." />
  }

  const { colegioNombre, invitadoPorNombre, estado, expiresAt } = invResult.data

  if (estado === 'aceptada') {
    return <ErrorCard message="Esta invitación ya fue aceptada anteriormente." icon="check" />
  }

  if (estado === 'expirada' || estado === 'cancelada' || new Date(expiresAt) < new Date()) {
    return <ErrorCard message="Esta invitación ha expirado. Solicita una nueva al Jefe de UTP." icon="clock" />
  }

  // Verificar si hay sesión activa
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Aceptar inmediatamente y redirigir
    const result = await acceptInvitacion(token, user.id)
    if (result.success) {
      redirect('/dashboard')
    }
    return <ErrorCard message={result.error ?? 'Error al aceptar la invitación.'} />
  }

  // Sin sesión: guardar token en cookie y mostrar UI de login
  const cookieStore = await cookies()
  cookieStore.set('invitation_token', token, {
    path: '/',
    maxAge: 900,
    httpOnly: true,
    sameSite: 'lax',
  })

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col items-center justify-center px-4">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md p-8 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur-sm" />

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-slate-100 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">miUTP</span>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-bold text-slate-100">Tienes una invitación</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            <span className="text-violet-300 font-semibold">{invitadoPorNombre}</span> te invita a unirte a{' '}
            <span className="text-violet-300 font-semibold">{colegioNombre}</span> como profesor.
          </p>
        </div>

        <a
          href="/login"
          className="block w-full py-3.5 px-5 rounded-xl text-slate-100 font-semibold tracking-wide text-center transition-all duration-200 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98]"
        >
          Iniciar sesión para aceptar
        </a>

        <p className="text-xs text-slate-600">
          Invitación válida hasta {new Date(expiresAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </main>
  )
}

function ErrorCard({ message, icon }: { message: string; icon?: 'check' | 'clock' }) {
  const Icon = icon === 'check' ? CheckCircle2 : icon === 'clock' ? Clock : ShieldAlert
  const color = icon === 'check' ? 'text-emerald-400' : icon === 'clock' ? 'text-amber-400' : 'text-red-400'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl text-center space-y-4">
        <Icon className={`w-12 h-12 mx-auto ${color}`} />
        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        <a href="/login" className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          Ir al inicio de sesión
        </a>
      </div>
    </main>
  )
}
