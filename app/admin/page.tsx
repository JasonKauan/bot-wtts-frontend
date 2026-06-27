'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { ClienteResumo } from '@/lib/types'
import { ShieldCheck, Search, LogOut, RefreshCw, Loader2, Check, X } from 'lucide-react'

export default function AdminPage() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  async function fetchData() {
    if (!token) return
    setLoading(true); setErro('')
    try {
      setClientes(await adminApi.clientes(token))
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  function sair() {
    logout()
    router.push('/admin/login')
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(c =>
      c.nome?.toLowerCase().includes(q) ||
      c.emailDono?.toLowerCase().includes(q) ||
      c.telefoneWhatsapp?.toLowerCase().includes(q))
  }, [clientes, busca])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h1 className="font-bold text-foreground leading-tight">AgendaBot — Admin</h1>
              <p className="text-xs text-muted">Back-office</p>
            </div>
          </div>
          <button onClick={sair} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
            <LogOut size={15} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <h2 className="text-xl font-bold text-foreground">
            Clientes <span className="text-muted font-normal text-base">({filtrados.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar nome, e-mail, telefone"
                className="w-64 bg-card border border-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
            <button onClick={fetchData} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground border border-border rounded-lg px-3 py-2 transition">
              <RefreshCw size={15} /> Atualizar
            </button>
          </div>
        </div>

        {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

        {loading ? (
          <p className="text-muted">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center text-muted">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="font-medium px-4 py-3">Cliente</th>
                    <th className="font-medium px-4 py-3">Plano</th>
                    <th className="font-medium px-4 py-3">Status</th>
                    <th className="font-medium px-4 py-3">WhatsApp</th>
                    <th className="font-medium px-4 py-3">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(c => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{c.nome}</div>
                        <div className="text-xs text-muted">{c.emailDono ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3"><PlanoBadge plano={c.plano} /></td>
                      <td className="px-4 py-3"><AssinaturaBadge c={c} /></td>
                      <td className="px-4 py-3"><WhatsAppCell token={token} id={c.id} /></td>
                      <td className="px-4 py-3 text-muted">{fmtData(c.criadoEm)}</td>
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

function PlanoBadge({ plano }: { plano: ClienteResumo['plano'] }) {
  const cor = plano === 'TRIAL' ? 'bg-muted-bg text-muted' : 'bg-primary-subtle text-primary'
  return <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${cor}`}>{plano}</span>
}

function AssinaturaBadge({ c }: { c: ClienteResumo }) {
  if (c.vencido) return <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-danger-subtle text-danger">vencido</span>
  const limite = c.plano === 'TRIAL' ? c.trialExpiraEm : c.assinaturaExpiraEm
  const label = c.plano === 'TRIAL' ? 'trial' : 'ativo'
  return (
    <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-primary-subtle text-primary" title={limite ? `até ${fmtData(limite)}` : undefined}>
      {label}{limite ? ` · ${fmtData(limite)}` : ''}
    </span>
  )
}

/** Status do WhatsApp carregado sob demanda por linha (1 chamada à Evolution). */
function WhatsAppCell({ token, id }: { token: string | null; id: string }) {
  const [estado, setEstado] = useState<'loading' | 'on' | 'off'>('loading')

  useEffect(() => {
    let vivo = true
    if (!token) return
    adminApi.whatsapp(token, id)
      .then(r => { if (vivo) setEstado(r.conectado ? 'on' : 'off') })
      .catch(() => { if (vivo) setEstado('off') })
    return () => { vivo = false }
  }, [token, id])

  if (estado === 'loading') return <Loader2 size={15} className="animate-spin text-muted" />
  return estado === 'on'
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Check size={14} /> conectado</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-muted"><X size={14} /> desconectado</span>
}

function fmtData(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}
