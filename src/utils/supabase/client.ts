import { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/types/database.types"

// Patrón singleton para asegurar una única instancia del cliente en el navegador
let supabase: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (supabase) return supabase

  supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabase
}
