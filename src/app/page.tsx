'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirigir a Login si no hay usuario autenticado
        router.push('/login')
      } else {
        // Verificar si el usuario ya realizó el onboarding de colegio
        const { data: perfil } = await supabase
          .from('miutp_perfiles')
          .select('colegio_id')
          .eq('id', user.id)
          .single()

        const perfilData = perfil as any
        if (perfilData?.colegio_id) {
          // Si ya tiene colegio, enviarlo al Dashboard
          router.push('/dashboard')
        } else {
          // Si no tiene colegio, enviarlo al Onboarding
          router.push('/onboarding')
        }
      }
    }

    checkSessionAndRedirect()
  }, [router])

  return (
    <main className="min-h-screen bg-black text-slate-100 flex flex-col justify-center items-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-semibold animate-pulse">
        Inicializando Portal miUTP...
      </p>
    </main>
  )
}

