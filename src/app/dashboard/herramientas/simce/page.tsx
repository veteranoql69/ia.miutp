import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'
import SimceWizard from '@/modules/herramientas/components/SimceWizard'

export const metadata = {
  title: 'Configuración SIMCE | miUTP',
  description: 'Wizard de configuración para Ensayos SIMCE',
}

export default async function SimceWizardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabaseAdmin
    .from('miutp_perfiles')
    .select('colegio_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!(perfil as any)?.colegio_id) redirect('/onboarding')

  return <SimceWizard colegioId={(perfil as any).colegio_id} userId={user.id} />
}
