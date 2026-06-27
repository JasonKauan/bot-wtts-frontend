'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { assinaturaApi } from '@/lib/api'
import type { AssinaturaStatus } from '@/lib/types'
import { AlertTriangle, Clock } from 'lucide-react'

/** Aviso de trial acabando / assinatura vencida no topo do painel. */
export default function TrialBanner() {
  const { token } = useAuth()
  const pathname = usePathname()
  const [status, setStatus] = useState<AssinaturaStatus | null>(null)

  useEffect(() => {
    if (!token) return
    assinaturaApi.get(token).then(setStatus).catch(() => {})
  }, [token, pathname])

  if (!status || pathname.startsWith('/assinatura')) return null

  if (status.vencida) {
    return (
      <div className="mb-6 rounded-xl border border-border bg-danger-subtle text-danger px-4 py-3 text-sm font-medium flex items-center justify-between gap-4">
        <span className="flex items-center gap-2"><AlertTriangle size={16} /> Sua assinatura venceu. Renove para continuar usando o AgendaBot.</span>
        <Link href="/assinatura" className="shrink-0 bg-danger text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition">Renovar</Link>
      </div>
    )
  }

  if (status.avisoTrial) {
    return (
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 px-4 py-3 text-sm font-medium flex items-center justify-between gap-4">
        <span className="flex items-center gap-2"><Clock size={16} /> Seu período de teste termina em {status.diasRestantes} dia(s).</span>
        <Link href="/assinatura" className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition">Assinar</Link>
      </div>
    )
  }

  return null
}
