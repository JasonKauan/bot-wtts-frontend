'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { dashboardApi, agendamentosApi, servicosApi, whatsappApi } from '@/lib/api'
import type { DashboardData, Agendamento } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, Check, X, Bot, Rocket, CircleCheck, Circle } from 'lucide-react'

function brl(n: number): string {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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

      <Onboarding />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={CalendarDays} label="Agendamentos hoje" value={data.agendamentos.length} />
        <StatCard icon={Clock} label="Pendentes futuros" value={data.pendentes} accent />
        <div className="bg-card border border-border rounded-xl shadow-card p-5 flex items-center gap-4">
          <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary-subtle text-primary">
            <Bot size={22} />
          </span>
          <div>
            <p className="text-sm text-muted">O bot agendou (30 dias)</p>
            <p className="text-3xl font-bold mt-0.5 text-primary">{data.botAgendamentos30d}</p>
            <p className="text-xs text-muted mt-0.5">
              {data.botReceita30d > 0 ? <>≈ <b className="text-foreground">{brl(data.botReceita30d)}</b> em serviços</> : 'horários marcados sozinho'}
            </p>
          </div>
        </div>
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

/**
 * Primeiros passos (onboarding): leva o dono novo pela mão até o primeiro agendamento.
 * Some sozinho quando os 3 passos estão completos (ou se o dono dispensar).
 */
function Onboarding() {
  const { token } = useAuth()
  const [conectado, setConectado] = useState<boolean | null>(null)
  const [temServicos, setTemServicos] = useState<boolean | null>(null)
  const [testou, setTestou] = useState(false)
  const [dispensado, setDispensado] = useState(true) // evita piscar antes de ler o localStorage

  useEffect(() => {
    setDispensado(localStorage.getItem('ab_onboarding_ok') === '1')
    setTestou(localStorage.getItem('ab_testou_bot') === '1')
    if (!token) return
    whatsappApi.status(token).then(s => setConectado(s.conectado)).catch(() => setConectado(false))
    servicosApi.list(token).then(l => setTemServicos(l.some(s => s.ativo))).catch(() => setTemServicos(false))
  }, [token])

  const completo = conectado === true && temServicos === true && testou
  if (dispensado || completo || conectado === null || temServicos === null) return null

  const passos = [
    { ok: conectado, label: 'Conectar seu WhatsApp', desc: 'Escaneie o QR e o bot começa a atender', href: '/conectar' },
    { ok: temServicos, label: 'Cadastrar seus serviços', desc: 'Com preço e duração — é o que o bot oferece', href: '/servicos' },
    { ok: testou, label: 'Testar o bot', desc: 'Converse com ele aqui no painel, sem compromisso', href: '/testar' },
  ]

  return (
    <div className="bg-card border border-primary/40 rounded-xl shadow-card p-5 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Rocket size={18} className="text-primary" /> Primeiros passos
          <span className="text-xs font-normal text-muted">— {passos.filter(p => p.ok).length} de 3 prontos</span>
        </div>
        <button onClick={() => { localStorage.setItem('ab_onboarding_ok', '1'); setDispensado(true) }}
          className="text-xs text-muted hover:text-foreground transition">Dispensar</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {passos.map(p => (
          <Link key={p.href} href={p.href}
            className={`rounded-lg border p-3.5 transition ${p.ok
              ? 'border-border bg-muted-bg/50 opacity-70'
              : 'border-primary/40 hover:border-primary hover:bg-primary-subtle/40'}`}>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {p.ok ? <CircleCheck size={17} className="text-primary shrink-0" /> : <Circle size={17} className="text-muted shrink-0" />}
              {p.label}
            </div>
            <p className="text-xs text-muted mt-1.5">{p.ok ? 'Feito! ✓' : p.desc}</p>
          </Link>
        ))}
      </div>
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
