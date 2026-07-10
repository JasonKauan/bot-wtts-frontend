'use client'
import { useEffect, useRef, useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { botApi } from '@/lib/api'
import { Send, RotateCcw, Bot, Loader2, BellRing } from 'lucide-react'

interface Msg {
  de: 'voce' | 'bot' | 'dono'
  texto: string
}

const SUGESTOES = ['oi', 'quero agendar amanhã de tarde', 'meus horários', 'cancelar']

export default function TestarPage() {
  const { token } = useAuth()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const fimRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function enviar(msg?: string) {
    const m = (msg ?? texto).trim()
    if (!token || !m || enviando) return
    setTexto(''); setErro(''); setEnviando(true)
    setMsgs(prev => [...prev, { de: 'voce', texto: m }])
    try {
      localStorage.setItem('ab_testou_bot', '1') // onboarding: passo "testar o bot" concluído
      const respostas = await botApi.simular(token, m)
      setMsgs(prev => [...prev, ...respostas.map(r => ({ de: r.paraDono ? 'dono' as const : 'bot' as const, texto: r.texto }))])
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao conversar com o bot')
    } finally { setEnviando(false) }
  }

  async function reiniciar() {
    if (!token) return
    try { await botApi.resetarSimulacao(token) } catch { /* sessão pode nem existir */ }
    setMsgs([]); setErro('')
  }

  function handleSubmit(e: FormEvent) { e.preventDefault(); enviar() }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold text-foreground">Testar o bot</h1>
        <button onClick={reiniciar} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
          <RotateCcw size={15} /> Recomeçar conversa
        </button>
      </div>
      <p className="text-muted text-sm mb-4">
        Converse aqui como se você fosse um cliente no WhatsApp. É o bot de verdade, com os seus serviços
        e horários — mas nada é salvo na agenda. Perfeito pra ver como seus clientes vão ser atendidos.
      </p>

      <div className="bg-card border border-border rounded-xl shadow-card flex flex-col" style={{ height: '60vh' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.length === 0 && (
            <div className="text-center text-muted text-sm mt-10">
              <Bot size={32} className="mx-auto mb-2" />
              Mande um <b>oi</b> pra começar 👇
            </div>
          )}
          {msgs.map((m, i) => (
            m.de === 'dono' ? (
              <div key={i} className="mx-auto max-w-[85%] text-xs bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400 rounded-lg px-3 py-2 whitespace-pre-wrap">
                <span className="inline-flex items-center gap-1 font-semibold"><BellRing size={12} /> Aviso que VOCÊ receberia no seu WhatsApp:</span>
                {'\n'}{m.texto}
              </div>
            ) : (
              <div key={i} className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.de === 'voce'
                  ? 'ml-auto bg-primary text-primary-foreground rounded-br-sm'
                  : 'mr-auto bg-muted-bg text-foreground rounded-bl-sm'
              }`}>
                {m.texto}
              </div>
            )
          ))}
          {enviando && (
            <div className="mr-auto bg-muted-bg text-muted rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> digitando...
            </div>
          )}
          <div ref={fimRef} />
        </div>

        {msgs.length === 0 && (
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {SUGESTOES.map(s => (
              <button key={s} onClick={() => enviar(s)}
                className="text-xs border border-border rounded-full px-3 py-1.5 text-muted hover:text-primary hover:border-primary transition">
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="border-t border-border p-3 flex gap-2">
          <input value={texto} onChange={e => setTexto(e.target.value)} placeholder="Digite como se fosse seu cliente..."
            className="flex-1 bg-card border border-input rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition" />
          <button type="submit" disabled={enviando || !texto.trim()}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-50">
            <Send size={16} /> Enviar
          </button>
        </form>
      </div>

      {erro && <p className="text-danger text-sm mt-3">{erro}</p>}
      <p className="text-xs text-muted mt-3">
        💡 Dica: teste &quot;quero corte amanhã às 15h&quot;, &quot;remarcar&quot;, &quot;atendente&quot; — e veja os avisos que você receberia.
      </p>
    </div>
  )
}
