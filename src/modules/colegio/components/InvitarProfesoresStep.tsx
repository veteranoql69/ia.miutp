'use client'

import { useState } from 'react'
import { createInvitaciones } from '@/modules/invitaciones/actions'
import { Mail, Plus, X, Loader2, CheckCircle2, ChevronRight, Users } from 'lucide-react'

interface Props {
  colegioId: string
  userId: string
  onComplete: () => void
}

export default function InvitarProfesoresStep({ colegioId, userId, onComplete }: Props) {
  const [inputEmail, setInputEmail] = useState('')
  const [emails, setEmails] = useState<string[]>([])
  const [inputError, setInputError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number; errors: string[] } | null>(null)

  const addEmail = () => {
    const trimmed = inputEmail.trim().toLowerCase()
    if (!trimmed) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setInputError('Formato de correo inválido.')
      return
    }
    if (emails.includes(trimmed)) {
      setInputError('Este correo ya fue agregado.')
      return
    }
    setEmails((prev) => [...prev, trimmed])
    setInputEmail('')
    setInputError(null)
  }

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail()
    }
  }

  const handleEnviar = async () => {
    if (emails.length === 0) return
    setIsLoading(true)
    const res = await createInvitaciones(emails, colegioId, userId)
    setIsLoading(false)
    setResult({ sent: res.sent, errors: res.errors })
  }

  if (result) {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6 animate-fade-in text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur-sm" />
        <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
        <div className="space-y-1">
          <p className="text-xl font-bold text-slate-100">
            {result.sent} {result.sent === 1 ? 'invitación enviada' : 'invitaciones enviadas'}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-3 text-left space-y-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-400">{err}</p>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">
            Los profesores recibirán un correo con un link válido por 48 horas.
          </p>
        </div>
        <button
          onClick={onComplete}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-slate-100 font-semibold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          Ir al Dashboard <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6 animate-fade-in relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full blur-sm" />

      <div className="space-y-1 text-center">
        <Users className="w-10 h-10 text-violet-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-100 font-display">Invita a tu equipo</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Envía invitaciones a los profesores de tu colegio. Cada correo recibirá un link válido por 48 horas.
        </p>
      </div>

      {/* Input de email */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Correo del profesor
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => { setInputEmail(e.target.value); setInputError(null) }}
              onKeyDown={handleKeyDown}
              placeholder="profesor@colegio.cl"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-slate-100 text-sm transition-all outline-none placeholder:text-slate-600"
            />
          </div>
          <button
            type="button"
            onClick={addEmail}
            className="px-4 py-3 rounded-xl bg-violet-950/50 hover:bg-violet-900/50 border border-violet-800/50 text-violet-400 hover:text-violet-300 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {inputError && <p className="text-xs text-red-400">{inputError}</p>}
      </div>

      {/* Lista de emails agregados */}
      {emails.length > 0 && (
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {emails.map((email) => (
            <li key={email} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-800/60 text-sm text-slate-300">
              <span className="truncate">{email}</span>
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="ml-2 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Acciones */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onComplete}
          className="flex-1 py-3 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300 text-sm font-medium transition-all"
        >
          Omitir por ahora
        </button>
        <button
          type="button"
          onClick={handleEnviar}
          disabled={emails.length === 0 || isLoading}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-slate-100 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
          ) : (
            `Enviar ${emails.length > 0 ? `(${emails.length})` : ''}`
          )}
        </button>
      </div>
    </div>
  )
}
