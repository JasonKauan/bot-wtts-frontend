'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { dashboardApi, agendamentosApi } from '@/lib/api'
import type { DashboardData, Agendamento } from '@/lib/types'
import { useRouter } from 'next/navigation'

const STATUS_LABEL: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  PENDENTE: 'Pendente',
}
const STATUS_COLOR: Record<string, string> = {
  CONFIRMADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-600',
  PENDENTE: 'bg-yellow-100 text-yellow-700',
}

export default function DashboardPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    if (!token) return
    try {
      const d = await dashboardApi.get(token)
      setData(d)
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

  if (loading) return <div className="text-gray-500">Carregando...</div>
  if (!data) return <div className="text-red-500">Erro ao carregar dashboard.</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Agendamentos hoje</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{data.agendamentos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Pendentes futuros</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{data.pendentes}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-3">Hoje</h2>

      {data.agendamentos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Nenhum agendamento para hoje.
        </div>
      ) : (
        <div className="space-y-3">
          {data.agendamentos.map(ag => (
            <div key={ag.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{ag.clienteNome}</p>
                <p className="text-sm text-gray-500">{ag.servico}{ag.profissional ? ` · ${ag.profissional}` : ''}</p>
                <p className="text-sm text-gray-400">{new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLOR[ag.status]}`}>
                {STATUS_LABEL[ag.status]}
              </span>
              {ag.status === 'CONFIRMADO' && (
                <button
                  onClick={() => handleStatus(ag, 'cancelar')}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2 py-1 rounded"
                >
                  Cancelar
                </button>
              )}
              {ag.status === 'PENDENTE' && (
                <button
                  onClick={() => handleStatus(ag, 'confirmar')}
                  className="text-xs text-green-600 hover:text-green-800 border border-green-200 px-2 py-1 rounded"
                >
                  Confirmar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
