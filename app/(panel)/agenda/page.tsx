'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { agendaApi, agendamentosApi, profissionaisApi } from '@/lib/api'
import type { Agendamento, Profissional } from '@/lib/types'
import { ChevronLeft, ChevronRight, Check, X, UserX } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  CONFIRMADO:     'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  CANCELADO:      'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  PENDENTE:       'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  NAO_COMPARECEU: 'bg-muted-bg text-muted',
}
const STATUS_LABEL: Record<string, string> = {
  CONFIRMADO:     'Confirmado',
  CANCELADO:      'Cancelado',
  PENDENTE:       'Pendente',
  NAO_COMPARECEU: 'Não compareceu',
}

function todayStr() { return new Date().toISOString().split('T')[0] }

export default function AgendaPage() {
  const { token } = useAuth()
  const [data, setData]                   = useState(todayStr())
  const [agendamentos, setAgendamentos]   = useState<Agendamento[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [filtroProf, setFiltroProf]       = useState<string>('')
  const [loading, setLoading]             = useState(true)
  const [novoBadge, setNovoBadge]         = useState(false)
  const prevCount = useRef<number>(-1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchProfissionais = useCallback(async () => {
    if (!token) return
    try { setProfissionais(await profissionaisApi.list(token)) } catch {}
  }, [token])

  const fetchAgenda = useCallback(async (silent = false) => {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const ags = await agendaApi.list(token, data + (filtroProf ? `&profissionalId=${filtroProf}` : ''))
      if (prevCount.current !== -1 && ags.length > prevCount.current) {
        setNovoBadge(true)
        setTimeout(() => setNovoBadge(false), 5000)
      }
      prevCount.current = ags.length
      setAgendamentos(ags)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [token, data, filtroProf])

  useEffect(() => {
    fetchAgenda()
    fetchProfissionais()
    intervalRef.current = setInterval(() => fetchAgenda(true), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchAgenda, fetchProfissionais])

  async function handleAcao(id: string, acao: 'cancelar' | 'confirmar' | 'nao-compareceu') {
    if (!token) return
    if (acao === 'cancelar')         await agendamentosApi.cancelar(token, id)
    else if (acao === 'confirmar')   await agendamentosApi.confirmar(token, id)
    else                             await agendamentosApi.naoCompareceu(token, id)
    fetchAgenda(true)
  }

  const navBtn = 'inline-flex items-center gap-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-muted hover:bg-muted-bg hover:text-foreground transition'

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          {novoBadge && (
            <span className="animate-pulse bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">Novo agendamento!</span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {profissionais.length > 0 && (
            <select
              value={filtroProf}
              onChange={e => setFiltroProf(e.target.value)}
              className="bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos os profissionais</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          )}

          <button onClick={() => setData(d => { const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0] })} className={navBtn}><ChevronLeft size={16} /> Anterior</button>
          <button onClick={() => setData(todayStr())} className={navBtn}>Hoje</button>
          <button onClick={() => setData(d => { const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0] })} className={navBtn}>Próximo <ChevronRight size={16} /></button>
          <input type="date" value={data} onChange={e => setData(e.target.value)} className="bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : agendamentos.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center text-muted">Nenhum agendamento para esta data.</div>
      ) : (
        <div className="space-y-3">
          {agendamentos.map(ag => (
            <div key={ag.id} className="bg-card border border-border rounded-xl shadow-card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <p className="font-medium text-foreground">
                  {new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {ag.clienteNome}
                </p>
                <p className="text-sm text-muted">{ag.servico}{ag.profissional ? ` · ${ag.profissional}` : ''}</p>
                <p className="text-xs text-muted">{ag.clienteTelefone}</p>
              </div>

              <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[ag.status] ?? 'bg-muted-bg text-muted'}`}>
                {STATUS_LABEL[ag.status] ?? ag.status}
              </span>

              <div className="flex gap-2 flex-wrap">
                {ag.status === 'CONFIRMADO' && (
                  <>
                    <button onClick={() => handleAcao(ag.id, 'cancelar')} className="inline-flex items-center gap-1 text-xs text-danger border border-border px-2.5 py-1.5 rounded-lg hover:bg-danger-subtle transition"><X size={14} /> Cancelar</button>
                    <button onClick={() => handleAcao(ag.id, 'nao-compareceu')} className="inline-flex items-center gap-1 text-xs text-muted border border-border px-2.5 py-1.5 rounded-lg hover:bg-muted-bg transition"><UserX size={14} /> Não veio</button>
                  </>
                )}
                {ag.status === 'PENDENTE' && (
                  <button onClick={() => handleAcao(ag.id, 'confirmar')} className="inline-flex items-center gap-1 text-xs text-primary border border-border px-2.5 py-1.5 rounded-lg hover:bg-primary-subtle transition"><Check size={14} /> Confirmar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted mt-4 text-right">Atualiza automaticamente a cada 30s</p>
    </div>
  )
}
