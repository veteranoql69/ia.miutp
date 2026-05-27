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
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-2xl overflow-hidden max-w-2xl w-full mx-auto">
      <div className="px-8 py-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      
      <div className="p-8">
        {children}
      </div>

      {footer && (
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  )
}
