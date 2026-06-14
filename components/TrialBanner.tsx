'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { assinaturaApi } from '@/lib/api'
import type { AssinaturaStatus } from '@/lib/types'

/** Aviso de trial acabando / assinatura vencida no topo do painel (Iteração 6). */
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
      <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-4">
        <span>⚠️ Sua assinatura venceu. Renove para continuar usando o AgendaBot.</span>
        <Link href="/assinatura" className="shrink-0 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition">
          Renovar
        </Link>
      </div>
    )
  }

  if (status.avisoTrial) {
    return (
      <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between gap-4">
        <span>⏳ Seu período de teste termina em {status.diasRestantes} dia(s).</span>
        <Link href="/assinatura" className="shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition">
          Assinar
        </Link>
      </div>
    )
  }

  return null
}
