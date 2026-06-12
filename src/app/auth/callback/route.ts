import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'
import { acceptInvitacion } from '@/modules/invitaciones/actions'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (errorParam) {
    console.error('Auth callback error:', errorParam, errorDescription)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      const userId = data.session.user.id
      const forwardedHost = request.headers.get('x-forwarded-host')
      const baseUrl = (process.env.NODE_ENV === 'development' || !forwardedHost)
        ? origin
        : `https://${forwardedHost}`

      // Verificar si hay una invitación pendiente (cookie dejada por /invitacion)
      const cookieStore = cookies()
      const invToken = cookieStore.get('invitation_token')?.value

      if (invToken) {
        cookieStore.delete('invitation_token')
        const invResult = await acceptInvitacion(invToken, userId)
        if (invResult.success) {
          return NextResponse.redirect(`${baseUrl}/dashboard`)
        }
      }

      // Decidir destino según perfil existente
      let destination = '/onboarding'
      const { data: perfil, error: perfilError } = await supabaseAdmin
        .from('miutp_perfiles')
        .select('colegio_id')
        .eq('id', userId)
        .maybeSingle()

      if (perfilError) {
        console.error('[auth/callback] Error al leer perfil:', perfilError.message, '— userId:', userId)
        // Si hay error de DB, enviamos al dashboard y dejamos que el middleware decida
        destination = '/dashboard'
      } else if (perfil?.colegio_id) {
        destination = '/dashboard'
      }

      return NextResponse.redirect(`${baseUrl}${destination}`)
    } else if (error) {
      console.error('Error al intercambiar código por sesión:', error.message)
      return NextResponse.redirect(`${origin}/login?authError=${encodeURIComponent(error.message)}`)
    }
  }

  const redirectError = errorParam || 'OAuthCallbackFailed'
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(redirectError)}`)
}


