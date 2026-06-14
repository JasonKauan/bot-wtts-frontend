'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { agendaApi, agendamentosApi, profissionaisApi } from '@/lib/api'
import type { Agendamento, Profissional } from '@/lib/types'

const STATUS_COLOR: Record<string, string> = {
  CONFIRMADO:     'bg-green-100 text-green-700',
  CANCELADO:      'bg-red-100 text-red-600',
  PENDENTE:       'bg-yellow-100 text-yellow-700',
  NAO_COMPARECEU: 'bg-gray-100 text-gray-500',
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
  const [data, setData]                 = useState(todayStr())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [filtroProf, setFiltroProf]     = useState<string>('')
  const [loading, setLoading]           = useState(true)
  const [novoBadge, setNovoBadge]       = useState(false)
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
      const params: Record<string, string> = { data }
      if (filtroProf) params.profissionalId = filtroProf
      const query = new URLSearchParams(params).toString()
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

  // Polling a cada 30s
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

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          {novoBadge && (
            <span className="animate-pulse bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              Novo agendamento!
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Filtro profissional */}
          {profissionais.length > 0 && (
            <select
              value={filtroProf}
              onChange={e => setFiltroProf(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Todos os profissionais</option>
              {profissionais.map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          )}

          {/* Navegação de data */}
          <button
            onClick={() => setData(d => { const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() - 1); return dt.toISOString().split('T')[0] })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >← Anterior</button>
          <button
            onClick={() => setData(todayStr())}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >Hoje</button>
          <button
            onClick={() => setData(d => { const dt = new Date(d + 'T00:00:00'); dt.setDate(dt.getDate() + 1); return dt.toISOString().split('T')[0] })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >Próximo →</button>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : agendamentos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Nenhum agendamento para esta data.
        </div>
      ) : (
        <div className="space-y-3">
          {agendamentos.map(ag => (
            <div key={ag.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <p className="font-medium text-gray-800">
                  {new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — {ag.clienteNome}
                </p>
                <p className="text-sm text-gray-500">{ag.servico}{ag.profissional ? ` · ${ag.profissional}` : ''}</p>
                <p className="text-xs text-gray-400">{ag.clienteTelefone}</p>
              </div>

              <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[ag.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {STATUS_LABEL[ag.status] ?? ag.status}
              </span>

              <div className="flex gap-2 flex-wrap">
                {ag.status === 'CONFIRMADO' && (
                  <>
                    <button onClick={() => handleAcao(ag.id, 'cancelar')}
                      className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded hover:bg-red-50">
                      Cancelar
                    </button>
                    <button onClick={() => handleAcao(ag.id, 'nao-compareceu')}
                      className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50">
                      Não veio
                    </button>
                  </>
                )}
                {ag.status === 'PENDENTE' && (
                  <button onClick={() => handleAcao(ag.id, 'confirmar')}
                    className="text-xs text-green-600 border border-green-200 px-2 py-1 rounded hover:bg-green-50">
                    Confirmar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-right">Atualiza automaticamente a cada 30s</p>
    </div>
  )
}
