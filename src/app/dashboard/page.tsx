'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import DashboardShell from '@/modules/analitica/components/DashboardShell'
import BentoGridKPIs from '@/modules/analitica/components/BentoGridKPIs'
import ResponseMatrix from '@/modules/analitica/components/ResponseMatrix'
import GapsChart from '@/modules/analitica/components/GapsChart'
import DataManagement from '@/modules/analitica/components/DataManagement'
import CurriculumManager from '@/modules/procesamiento/components/CurriculumManager'
import ToolsHub from '@/modules/herramientas/components/ToolsHub'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUserId(user.id)
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading || !userId) {
    return (
      <main className="min-h-screen bg-black text-slate-100 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-semibold animate-pulse">
          Validando autenticación...
        </p>
      </main>
    )
  }

  return (
    <DashboardShell userId={userId}>
      {({ profile, cursoSeleccionado, ensayoSeleccionado, activeTab, onRefresh }) => {
        switch (activeTab) {
          case 'kpis':
            return <BentoGridKPIs ensayoSeleccionado={ensayoSeleccionado} />
          case 'matrix':
            return <ResponseMatrix ensayoSeleccionado={ensayoSeleccionado} />
          case 'gaps':
            return <GapsChart ensayoSeleccionado={ensayoSeleccionado} />
          case 'curriculum':
            return <CurriculumManager />
          case 'herramientas':
            return <ToolsHub />
          case 'management':
            return (
              <DataManagement
                profile={profile}
                cursoSeleccionado={cursoSeleccionado}
                onRefresh={onRefresh}
              />
            )
          default:
            return <BentoGridKPIs ensayoSeleccionado={ensayoSeleccionado} />
        }
      }}
    </DashboardShell>
  )
}
