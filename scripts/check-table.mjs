import { createClient } from '@supabase/supabase-js'

const db = createClient(
  'https://supa.manmec.cl',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MTUwNTA4MDAsCiAgImV4cCI6IDE4NzI4MTcyMDAKfQ.c9JvzwUcX_GxGJqzeSMINv-5z9R5gAJ4hKGs8Tk336w'
)

async function main() {
  const { data, error } = await db
    .from('miutp_simce_alumnos')
    .select('id, curso_letra, created_at')
    .limit(1)

  if (error) {
    console.log('Error querying table:', error.message)
  } else {
    console.log('Columns exist! Data:', data)
  }
}

main().catch(console.error)
