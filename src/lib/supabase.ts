import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno para inicializar Supabase. Revisa tu archivo .env.')
}

// Cliente estándar de Supabase (respeta Row Level Security RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Cliente administrativo con Service Role (omite RLS para tareas críticas del sistema).
// Se instancia de forma lazy para que la validación ocurra en runtime (no en build time),
// evitando errores de Docker CI cuando SUPABASE_SERVICE_ROLE_KEY no está disponible en el build.
let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin(): ReturnType<typeof createClient<Database>> {
  if (_supabaseAdmin) return _supabaseAdmin

  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseServiceKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor.')
  }

  _supabaseAdmin = createClient<Database>(supabaseUrl!, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return _supabaseAdmin
}

// Alias de compatibilidad — úsalo sólo si estás seguro de que la variable de entorno existe.
// Preferir getSupabaseAdmin() en código nuevo.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop]
  },
})
