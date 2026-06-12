import { createClient } from '@supabase/supabase-js'

const db = createClient(
  'https://supa.manmec.cl',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MTUwNTA4MDAsCiAgImV4cCI6IDE4NzI4MTcyMDAKfQ.c9JvzwUcX_GxGJqzeSMINv-5z9R5gAJ4hKGs8Tk336w'
)

const ENSAYO_ID = '591dd152-4f37-4772-8f7e-802bbd6e0b61'

async function main() {
  console.log('\n🔍 Diagnóstico completo de alumnos del ensayo\n')

  // Conteo total por letra
  const { data: alumnos, error } = await db
    .from('miutp_simce_alumnos')
    .select('id, nombre_completo, curso_letra')
    .eq('ensayo_id', ENSAYO_ID)
    .order('curso_letra')

  if (error) { console.error('ERROR:', error.message); return }

  const byLetra = {}
  ;(alumnos || []).forEach(a => {
    const l = a.curso_letra || '(null)'
    byLetra[l] = (byLetra[l] || 0) + 1
  })

  console.log(`Total alumnos: ${alumnos.length}`)
  console.log('Por letra:', byLetra)
  
  // ¿Hay alguno con letra B?
  const cursob = alumnos.filter(a => a.curso_letra === 'B')
  if (cursob.length > 0) {
    console.log(`\n✅ Curso B encontrado con ${cursob.length} alumnos:`)
    cursob.slice(0, 5).forEach(a => console.log(`   - ${a.nombre_completo}`))
  } else {
    console.log('\n❌ NO hay alumnos con curso_letra = "B"')
    console.log('   → El registro del Curso B NO se guardó correctamente.')
  }
}

main().catch(console.error)
