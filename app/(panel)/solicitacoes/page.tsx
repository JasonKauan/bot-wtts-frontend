'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { agendamentosApi } from '@/lib/api'
import type { Agendamento } from '@/lib/types'
import { Check, X, Loader2, Inbox, User, Scissors, CalendarClock } from 'lucide-react'

export default function SolicitacoesPage() {
  const { token } = useAuth()
  const [itens, setItens] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  async function fetchData() {
    if (!token) return
    try { setItens(await agendamentosApi.pendentes(token)) }
    catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  async function decidir(id: string, acao: 'aceitar' | 'recusar') {
    if (!token) return
    setActing(id); setErro('')
    try {
      if (acao === 'aceitar') await agendamentosApi.confirmar(token, id)
      else await agendamentosApi.recusar(token, id)
      setItens(prev => prev.filter(a => a.id !== id)) // some da lista na hora
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setActing(null) }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Solicitações</h1>
      <p className="text-muted text-sm mb-6">Pedidos de horário esperando sua resposta. Toque em <b>Aceitar</b> ou <b>Recusar</b> — o cliente é avisado no WhatsApp.</p>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : itens.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-12 text-center">
          <Inbox size={40} className="mx-auto text-muted mb-3" />
          <p className="text-foreground font-medium">Nenhuma solicitação no momento 🎉</p>
          <p className="text-muted text-sm mt-1">Quando um cliente pedir um horário, ele aparece aqui.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {itens.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 text-lg font-bold text-foreground mb-3">
                <User size={20} className="text-primary shrink-0" /> {a.clienteNome}
              </div>
              <div className="space-y-1.5 text-[15px] text-foreground mb-5">
                <div className="flex items-center gap-2"><Scissors size={17} className="text-muted shrink-0" /> {a.servico}{a.profissional ? <span className="text-muted">— com {a.profissional}</span> : null}</div>
                <div className="flex items-center gap-2"><CalendarClock size={17} className="text-muted shrink-0" /> <b>{fmt(a.dataHora)}</b></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => decidir(a.id, 'aceitar')}
                  disabled={acting === a.id}
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-base py-3 rounded-xl transition disabled:opacity-50"
                >
                  {acting === a.id ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />} Aceitar
                </button>
                <button
                  onClick={() => decidir(a.id, 'recusar')}
                  disabled={acting === a.id}
                  className="inline-flex items-center justify-center gap-2 bg-danger hover:opacity-90 text-white font-semibold text-base py-3 rounded-xl transition disabled:opacity-50"
                >
                  <X size={20} /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function fmt(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
