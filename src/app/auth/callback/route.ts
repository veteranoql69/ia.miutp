import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  console.log('--- CALLBACK ENTRADA ---')
  console.log('URL de petición:', request.url)
  console.log('Search Params:', Object.fromEntries(searchParams.entries()))
  
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (errorParam) {
    console.error('Error reportado por el proveedor de Auth en la URL:', errorParam, errorDescription)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      console.log('Sesión intercambiada correctamente. Usuario:', data.session.user.email)
      const forwardedHost = request.headers.get('x-forwarded-host')
      
      if (process.env.NODE_ENV === 'development' || !forwardedHost) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else if (error) {
      console.error('Error al intercambiar código por sesión en el servidor:', error.message)
      return NextResponse.redirect(`${origin}/login?authError=${encodeURIComponent(error.message)}`)
    }
  }

  // Redirigir a login con el error original o un indicador genérico
  const redirectError = errorParam || 'OAuthCallbackFailed'
  console.log('Redirigiendo a login con error:', redirectError)
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(redirectError)}`)
}


