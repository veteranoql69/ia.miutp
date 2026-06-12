'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { sendInvitacionEmail } from '@/lib/email'
import { z } from 'zod'

const emailSchema = z.string().email()

export async function createInvitaciones(
  emails: string[],
  colegioId: string,
  invitadoPorId: string,
): Promise<{ success: boolean; sent: number; errors: string[] }> {
  const validEmails = emails.filter((e) => {
    try { emailSchema.parse(e); return true } catch { return false }
  })

  if (validEmails.length === 0) {
    return { success: false, sent: 0, errors: ['No se proporcionaron correos válidos.'] }
  }

  // Obtener datos para el email
  const [{ data: colegio }, { data: perfil }] = await Promise.all([
    supabaseAdmin.from('miutp_colegios').select('nombre').eq('id', colegioId).single(),
    supabaseAdmin.from('miutp_perfiles').select('nombre').eq('id', invitadoPorId).single(),
  ])

  const colegioNombre: string = (colegio as any)?.nombre ?? 'el colegio'
  const invitadoPorNombre: string = (perfil as any)?.nombre ?? 'Un administrador'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://miutp.sditecnologia.cl'

  const errors: string[] = []
  let sent = 0

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

  for (const email of validEmails) {
    try {
      // Upsert por (colegio_id, email): renueva la invitación si ya existía
      const { data: inv, error: invError } = await supabaseAdmin
        .from('miutp_invitaciones')
        .upsert(
          {
            colegio_id: colegioId,
            invitado_por: invitadoPorId,
            email,
            rol: 'profesor',
            estado: 'pendiente',
            expires_at: expiresAt,
          },
          { onConflict: 'colegio_id,email' },
        )
        .select('token')
        .single()

      if (invError || !inv) {
        console.error('Error creando invitación para', email, invError)
        errors.push(`${email}: error al guardar la invitación`)
        continue
      }

      const link = `${appUrl}/invitacion?token=${(inv as any).token}`
      await sendInvitacionEmail(email, colegioNombre, invitadoPorNombre, link)
      sent++
    } catch (e: any) {
      errors.push(`${email}: ${e?.message ?? 'error desconocido'}`)
    }
  }

  return { success: sent > 0, sent, errors }
}

export async function acceptInvitacion(
  token: string,
  userId: string,
): Promise<{ success: boolean; colegioId?: string; error?: string }> {
  const { data: inv, error: fetchError } = await supabaseAdmin
    .from('miutp_invitaciones')
    .select('id, colegio_id, estado, expires_at, rol')
    .eq('token', token)
    .maybeSingle()

  if (fetchError || !inv) {
    return { success: false, error: 'Invitación no encontrada.' }
  }

  const invData = inv as any

  if (invData.estado !== 'pendiente') {
    return { success: false, error: 'Esta invitación ya fue utilizada o cancelada.' }
  }

  if (new Date(invData.expires_at) < new Date()) {
    await supabaseAdmin
      .from('miutp_invitaciones')
      .update({ estado: 'expirada' })
      .eq('id', invData.id)
    return { success: false, error: 'Esta invitación ha expirado.' }
  }

  // Asociar perfil al colegio
  const { error: perfilError } = await supabaseAdmin
    .from('miutp_perfiles')
    .upsert(
      { id: userId, colegio_id: invData.colegio_id, rol: invData.rol, actualizado_en: new Date().toISOString() },
      { onConflict: 'id' },
    )

  if (perfilError) {
    return { success: false, error: 'Error al asociar tu perfil al colegio.' }
  }

  // Marcar invitación como aceptada
  await supabaseAdmin
    .from('miutp_invitaciones')
    .update({ estado: 'aceptada', accepted_at: new Date().toISOString() })
    .eq('id', invData.id)

  return { success: true, colegioId: invData.colegio_id }
}

export async function getInvitacionByToken(token: string): Promise<{
  success: boolean
  data?: { colegioNombre: string; invitadoPorNombre: string; estado: string; expiresAt: string }
  error?: string
}> {
  const { data: inv, error } = await supabaseAdmin
    .from('miutp_invitaciones')
    .select(`
      estado,
      expires_at,
      miutp_colegios ( nombre ),
      miutp_perfiles ( nombre )
    `)
    .eq('token', token)
    .maybeSingle()

  if (error || !inv) {
    return { success: false, error: 'Invitación no encontrada.' }
  }

  const invData = inv as any

  return {
    success: true,
    data: {
      colegioNombre: invData.miutp_colegios?.nombre ?? 'Colegio desconocido',
      invitadoPorNombre: invData.miutp_perfiles?.nombre ?? 'Un administrador',
      estado: invData.estado,
      expiresAt: invData.expires_at,
    },
  }
}
