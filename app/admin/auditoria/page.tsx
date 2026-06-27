'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { AuditoriaItem } from '@/lib/types'
import { ScrollText, ArrowLeft, RefreshCw } from 'lucide-react'

const LABEL: Record<string, string> = {
  CRIAR_CLIENTE: 'Criou cliente',
  ALTERAR_PLANO: 'Alterou plano',
  RESETAR_SENHA: 'Resetou senha',
  SUSPENDER: 'Suspendeu',
  REATIVAR: 'Reativou',
}

export default function AuditoriaPage() {
  const { token } = useAuth()
  const [itens, setItens] = useState<AuditoriaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  async function fetchData() {
    if (!token) return
    setLoading(true); setErro('')
    try {
      setItens(await adminApi.auditoria(token))
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground">
              <ScrollText size={18} />
            </span>
            <div>
              <h1 className="font-bold text-foreground leading-tight">Histórico de ações</h1>
              <p className="text-xs text-muted">Auditoria do back-office</p>
            </div>
          </div>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
            <ArrowLeft size={15} /> Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <button onClick={fetchData} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground border border-border rounded-lg px-3 py-2 transition">
            <RefreshCw size={15} /> Atualizar
          </button>
        </div>

        {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

        {loading ? (
          <p className="text-muted">Carregando...</p>
        ) : itens.length === 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center text-muted">
            Nenhuma ação registrada ainda.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="font-medium px-4 py-3">Quando</th>
                    <th className="font-medium px-4 py-3">Admin</th>
                    <th className="font-medium px-4 py-3">Ação</th>
                    <th className="font-medium px-4 py-3">Cliente</th>
                    <th className="font-medium px-4 py-3">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((a, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDataHora(a.criadoEm)}</td>
                      <td className="px-4 py-3 text-foreground">{a.adminEmail ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-primary-subtle text-primary">
                          {LABEL[a.acao] ?? a.acao}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">{a.tenantNome ?? '—'}</td>
                      <td className="px-4 py-3 text-muted">{a.detalhe ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function fmtDataHora(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
