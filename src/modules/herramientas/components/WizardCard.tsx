'use client'

import { ReactNode } from 'react'

interface WizardCardProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export default function WizardCard({ title, description, children, footer }: WizardCardProps) {
  return (
    <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800/70 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden max-w-2xl w-full mx-auto">
      <div className="px-8 py-6 border-b border-slate-800/70">
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>}
      </div>

      <div className="p-8">
        {children}
      </div>

      {footer && (
        <div className="px-8 py-4 bg-slate-900/50 border-t border-slate-800/70 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  )
}
