'use client'

import { useState, useTransition } from 'react'
import { saveOnboarding } from '../actions'
import { School, ClipboardList, MapPin, Building, GraduationCap, Loader2, CheckCircle2 } from 'lucide-react'

interface OnboardingFormProps {
  userId: string
  userEmail?: string | null
  onComplete: (colegio: any) => void
}

export default function OnboardingForm({ userId, userEmail, onComplete }: OnboardingFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Inferir nombre de colegio a partir del dominio
  let initialNombre = ''
  if (userEmail) {
    const domain = userEmail.split('@')[1]
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
      initialNombre = domain.split('.')[0].toUpperCase()
    }
  }

  const [formData, setFormData] = useState({
    nombre: initialNombre,
    rbd: '',
    tipo: 'HC' as 'TP' | 'HC',
    dependencia: 'Municipal',
    comuna: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.nombre || !formData.rbd || !formData.comuna) {
      setError('Por favor, completa todos los campos requeridos.')
      return
    }

    startTransition(async () => {
      const res = await saveOnboarding(userId, formData)
      if (res.success) {
        setSuccess(true)
        setTimeout(() => {
          onComplete(res.colegio)
        }, 1500)
      } else {
        setError(res.error || 'Ocurrió un error al guardar la configuración.')
      }
    })
  }

  return (
    <div className="w-full max-w-xl mx-auto p-8 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300">
      {/* Efecto de luz de acento superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500 rounded-full blur-sm" />

      {success ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-fade-in">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-bounce" />
          <h2 className="text-2xl font-bold text-slate-100 font-display">¡Configuración Exitosa!</h2>
          <p className="text-slate-400 text-sm max-w-xs">
            El establecimiento educativo ha sido registrado. Redirigiendo a la consola...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
              Configura tu Colegio
            </h1>
            <p className="text-slate-400 text-sm">
              Ingresa los datos del establecimiento para inicializar el portal analítico de miUTP.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-950/30 border border-red-800/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Nombre del Colegio */}
            <div className="space-y-2">
              <label htmlFor="nombre" className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <School className="w-4 h-4 text-violet-400" /> Nombre del Establecimiento *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={isPending}
                placeholder="Liceo Bicentenario de Excelencia..."
                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 transition-all outline-none"
                required
              />
            </div>

            {/* Fila RBD y Comuna */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="rbd" className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-violet-400" /> RBD (Rol Base de Datos) *
                </label>
                <input
                  type="text"
                  id="rbd"
                  name="rbd"
                  value={formData.rbd}
                  onChange={handleChange}
                  disabled={isPending}
                  placeholder="12345-6"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="comuna" className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-violet-400" /> Comuna *
                </label>
                <input
                  type="text"
                  id="comuna"
                  name="comuna"
                  value={formData.comuna}
                  onChange={handleChange}
                  disabled={isPending}
                  placeholder="La Serena"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Fila Modalidad y Dependencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="tipo" className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-violet-400" /> Modalidad Pedagógica *
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  disabled={isPending}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 transition-all outline-none cursor-pointer"
                >
                  <option value="HC">Científico Humanista (HC)</option>
                  <option value="TP">Técnico Profesional (TP)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="dependencia" className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Building className="w-4 h-4 text-violet-400" /> Dependencia Administrativa
                </label>
                <select
                  id="dependencia"
                  name="dependencia"
                  value={formData.dependencia}
                  onChange={handleChange}
                  disabled={isPending}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-600 transition-all outline-none cursor-pointer"
                >
                  <option value="Municipal">Municipal</option>
                  <option value="Particular Subvencionado">Particular Subvencionado</option>
                  <option value="SLEP">Servicio Local (SLEP)</option>
                  <option value="Particular Pagado">Particular Pagado</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 px-6 rounded-xl text-slate-100 font-semibold tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-indigo-900/20"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Guardando configuración...
              </>
            ) : (
              'Guardar y Registrar Colegio'
            )}
          </button>
        </form>
      )}
    </div>
  )
}
