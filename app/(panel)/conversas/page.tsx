'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { conversasApi } from '@/lib/api'
import type { ConversaResumo, MensagemBot } from '@/lib/types'
import { MessagesSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

function fmtQuando(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const hoje = new Date()
  const mesmoDia = d.toDateString() === hoje.toDateString()
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return mesmoDia ? `hoje às ${hora}` : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`
}

export default function ConversasPage() {
  const { token } = useAuth()
  const [conversas, setConversas] = useState<ConversaResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [aberta, setAberta] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Record<string, MensagemBot[]>>({})
  const [carregandoMsgs, setCarregandoMsgs] = useState(false)

  useEffect(() => {
    if (!token) return
    conversasApi.list(token)
      .then(setConversas)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [token])

  async function abrir(telefone: string) {
    if (aberta === telefone) { setAberta(null); return }
    setAberta(telefone)
    if (!token || mensagens[telefone]) return
    setCarregandoMsgs(true)
    try {
      const msgs = await conversasApi.mensagens(token, telefone)
      setMensagens(prev => ({ ...prev, [telefone]: msgs }))
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar a conversa')
    } finally { setCarregandoMsgs(false) }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Conversas do bot</h1>
      <p className="text-muted text-sm mb-6">
        Tudo que o bot conversou com seus clientes nos últimos 90 dias — pra você acompanhar de perto
        como eles estão sendo atendidos.
      </p>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : conversas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center">
          <MessagesSquare size={36} className="mx-auto text-muted mb-3" />
          <p className="text-muted">Nenhuma conversa ainda. Assim que um cliente falar com o bot, aparece aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversas.map(c => (
            <div key={c.telefone} className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <button onClick={() => abrir(c.telefone)} className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-muted-bg/50 transition">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">
                    {c.clienteNome || c.telefone}
                    {c.clienteNome && <span className="ml-2 text-xs text-muted font-normal">{c.telefone}</span>}
                  </div>
                  <div className="text-xs text-muted truncate mt-0.5">
                    {c.deCliente ? '👤 ' : '🤖 '}{c.ultimaMensagem}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted">{fmtQuando(c.em)}</div>
                  <div className="text-xs text-muted mt-0.5 inline-flex items-center gap-1">
                    {c.mensagens} msg{c.mensagens === 1 ? '' : 's'}
                    {aberta === c.telefone ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
              </button>

              {aberta === c.telefone && (
                <div className="border-t border-border p-4 space-y-2 max-h-96 overflow-y-auto bg-background/50">
                  {carregandoMsgs && !mensagens[c.telefone] ? (
                    <p className="text-muted text-sm inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Carregando conversa...</p>
                  ) : (mensagens[c.telefone] ?? []).map((m, i) => (
                    <div key={i} className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                      m.deCliente
                        ? 'mr-auto bg-muted-bg text-foreground rounded-bl-sm'
                        : 'ml-auto bg-primary-subtle text-foreground rounded-br-sm'
                    }`}>
                      {m.texto}
                      <div className="text-[10px] text-muted mt-1 text-right">{m.deCliente ? 'cliente' : 'bot'} · {fmtQuando(m.em)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
