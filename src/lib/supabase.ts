import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno para inicializar Supabase. Revisa tu archivo .env.')
}

// Cliente estándar de Supabase (respeta Row Level Security RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Cliente administrativo con Service Role (omite RLS para tareas críticas del sistema)
export const supabaseAdmin: any = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : supabase
