'use client'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { clientesApi } from '@/lib/api'
import type { ClienteCrm } from '@/lib/types'
import { Search, Users, CalendarCheck, UserX } from 'lucide-react'

export default function ClientesPage() {
  const { token } = useAuth()
  const [clientes, setClientes] = useState<ClienteCrm[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!token) return
    clientesApi.list(token)
      .then(setClientes)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [token])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(c => c.nome?.toLowerCase().includes(q) || c.telefone.includes(q))
  }, [clientes, busca])

  return (
    <div>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          Clientes <span className="text-muted font-normal text-base">({filtrados.length})</span>
        </h1>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar nome ou telefone"
            className="w-64 bg-card border border-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
          />
        </div>
      </div>
      <p className="text-muted text-sm mb-6">Todo mundo que já agendou com você, direto do histórico — sem precisar cadastrar ninguém.</p>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center">
          <Users size={36} className="mx-auto text-muted mb-3" />
          <p className="text-muted">Nenhum cliente ainda. Assim que alguém agendar, aparece aqui.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="font-medium px-4 py-3">Cliente</th>
                  <th className="font-medium px-4 py-3">Visitas</th>
                  <th className="font-medium px-4 py-3">Faltas</th>
                  <th className="font-medium px-4 py-3">Última visita</th>
                  <th className="font-medium px-4 py-3">Próximo horário</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <tr key={c.telefone} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{c.nome}</div>
                      <div className="text-xs text-muted">{c.telefone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-foreground font-medium">
                        <CalendarCheck size={14} className="text-primary" /> {c.visitas}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.faltas > 0 ? (
                        <span className="inline-flex items-center gap-1 text-danger font-medium">
                          <UserX size={14} /> {c.faltas}
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{fmtData(c.ultimaVisita)}</td>
                    <td className="px-4 py-3">
                      {c.proximoAgendamento
                        ? <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-primary-subtle text-primary">{fmtDataHora(c.proximoAgendamento)}</span>
                        : <span className="text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtData(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}
function fmtDataHora(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
