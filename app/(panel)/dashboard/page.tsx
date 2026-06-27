'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { dashboardApi, agendamentosApi } from '@/lib/api'
import type { DashboardData, Agendamento } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, Check, X } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  PENDENTE: 'Pendente',
}
const STATUS_COLOR: Record<string, string> = {
  CONFIRMADO: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  CANCELADO: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  PENDENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
}

export default function DashboardPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    if (!token) return
    try {
      setData(await dashboardApi.get(token))
    } catch {
      // token expirado
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleStatus(ag: Agendamento, acao: 'cancelar' | 'confirmar') {
    if (!token) return
    if (acao === 'cancelar') await agendamentosApi.cancelar(token, ag.id)
    else await agendamentosApi.confirmar(token, ag.id)
    fetchData()
  }

  if (loading) return <div className="text-muted">Carregando...</div>
  if (!data) return <div className="text-danger">Erro ao carregar dashboard.</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard icon={CalendarDays} label="Agendamentos hoje" value={data.agendamentos.length} />
        <StatCard icon={Clock} label="Pendentes futuros" value={data.pendentes} accent />
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-3">Hoje</h2>

      {data.agendamentos.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center text-muted">
          Nenhum agendamento para hoje.
        </div>
      ) : (
        <div className="space-y-3">
          {data.agendamentos.map(ag => (
            <div key={ag.id} className="bg-card border border-border rounded-xl shadow-card p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{ag.clienteNome}</p>
                <p className="text-sm text-muted">{ag.servico}{ag.profissional ? ` · ${ag.profissional}` : ''}</p>
                <p className="text-sm text-muted">{new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[ag.status] ?? ''}`}>
                {STATUS_LABEL[ag.status] ?? ag.status}
              </span>
              {ag.status === 'CONFIRMADO' && (
                <button onClick={() => handleStatus(ag, 'cancelar')}
                  className="inline-flex items-center gap-1 text-xs text-danger border border-border px-2.5 py-1.5 rounded-lg hover:bg-danger-subtle transition">
                  <X size={14} /> Cancelar
                </button>
              )}
              {ag.status === 'PENDENTE' && (
                <button onClick={() => handleStatus(ag, 'confirmar')}
                  className="inline-flex items-center gap-1 text-xs text-primary border border-border px-2.5 py-1.5 rounded-lg hover:bg-primary-subtle transition">
                  <Check size={14} /> Confirmar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-5 flex items-center gap-4">
      <span className={`grid place-items-center h-11 w-11 rounded-xl ${accent ? 'bg-primary-subtle text-primary' : 'bg-muted-bg text-muted'}`}>
        <Icon size={22} />
      </span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  )
}
