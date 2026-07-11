'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CalendarCheck, Check, ChevronLeft, Loader2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'

interface ServicoPub { id: string; nome: string; duracaoMinutos: number; preco: number | null }
interface ProfissionalPub { id: string; nome: string }
interface InfoPublica { nome: string; servicos: ServicoPub[]; profissionais: ProfissionalPub[] }

function brl(n: number): string {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`)
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`)
  return res.json()
}

export default function AgendarPublicoPage() {
  const { slug } = useParams<{ slug: string }>()
  const [info, setInfo] = useState<InfoPublica | null>(null)
  const [naoEncontrada, setNaoEncontrada] = useState(false)

  const [servico, setServico] = useState<ServicoPub | null>(null)
  const [profissionalId, setProfissionalId] = useState('')
  const [data, setData] = useState('')
  const [horarios, setHorarios] = useState<string[] | null>(null)
  const [hora, setHora] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<'CONFIRMADO' | 'PENDENTE' | null>(null)

  useEffect(() => {
    if (!slug) return
    getJson<InfoPublica>(`/api/publico/${slug}`).then(setInfo).catch(() => setNaoEncontrada(true))
  }, [slug])

  useEffect(() => {
    setHora(''); setHorarios(null)
    if (!slug || !servico || !data) return
    const q = new URLSearchParams({ data, servicoId: servico.id })
    if (profissionalId) q.set('profissionalId', profissionalId)
    getJson<string[]>(`/api/publico/${slug}/horarios?${q}`)
      .then(setHorarios)
      .catch(() => setHorarios([]))
  }, [slug, servico, profissionalId, data])

  async function confirmar() {
    if (!slug || !servico || !data || !hora || !nome.trim() || !telefone.trim()) return
    setEnviando(true); setErro('')
    try {
      const res = await fetch(`${API}/api/publico/${slug}/agendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicoId: servico.id,
          profissionalId: profissionalId || null,
          data, hora,
          clienteNome: nome.trim(),
          clienteTelefone: telefone.trim(),
        }),
      })
      const texto = await res.text()
      if (!res.ok) {
        let msg = texto || 'Não foi possível agendar. Tente outro horário.'
        try { msg = JSON.parse(texto).message ?? msg } catch { /* texto cru */ }
        throw new Error(msg)
      }
      setResultado(JSON.parse(texto).status)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao agendar')
      // o horário pode ter sido ocupado: recarrega a lista
      if (servico && data) {
        const q = new URLSearchParams({ data, servicoId: servico.id })
        if (profissionalId) q.set('profissionalId', profissionalId)
        getJson<string[]>(`/api/publico/${slug}/horarios?${q}`).then(setHorarios).catch(() => {})
      }
    } finally { setEnviando(false) }
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const max = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const inputCls = 'w-full bg-card border border-input rounded-lg px-3 py-3 text-base text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

  if (naoEncontrada) return (
    <main className="min-h-screen grid place-items-center bg-background p-6">
      <p className="text-muted text-center">Página não encontrada.<br />Confira o link com o estabelecimento.</p>
    </main>
  )
  if (!info) return (
    <main className="min-h-screen grid place-items-center bg-background p-6">
      <Loader2 size={28} className="animate-spin text-muted" />
    </main>
  )

  if (resultado) return (
    <main className="min-h-screen grid place-items-center bg-background p-6">
      <div className="bg-card border border-border rounded-2xl shadow-card p-8 max-w-sm w-full text-center">
        <span className="grid place-items-center h-14 w-14 rounded-full bg-primary-subtle text-primary mx-auto mb-4"><Check size={28} /></span>
        <h1 className="text-xl font-bold text-foreground mb-2">
          {resultado === 'CONFIRMADO' ? 'Agendado! 🎉' : 'Pedido enviado! 📝'}
        </h1>
        <p className="text-sm text-muted">
          {resultado === 'CONFIRMADO'
            ? <>Seu horário está confirmado na <b className="text-foreground">{info.nome}</b>. Você recebe a confirmação e o lembrete no WhatsApp.</>
            : <>A <b className="text-foreground">{info.nome}</b> vai confirmar seu horário e te avisar no WhatsApp.</>}
        </p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary text-primary-foreground"><CalendarCheck size={22} /></span>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{info.nome}</h1>
            <p className="text-xs text-muted">Agende seu horário em 1 minuto</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-card p-5 space-y-5">
          {!servico ? (
            <div>
              <p className="text-sm font-medium text-foreground mb-3">O que você quer fazer?</p>
              <div className="space-y-2">
                {info.servicos.map(s => (
                  <button key={s.id} onClick={() => setServico(s)}
                    className="w-full text-left border border-border hover:border-primary rounded-xl p-3.5 transition flex items-center justify-between gap-3">
                    <span>
                      <span className="block text-sm font-medium text-foreground">{s.nome}</span>
                      <span className="block text-xs text-muted">{s.duracaoMinutos} min</span>
                    </span>
                    {s.preco != null && <span className="text-sm font-semibold text-foreground shrink-0">{brl(s.preco)}</span>}
                  </button>
                ))}
                {info.servicos.length === 0 && <p className="text-sm text-muted">Sem serviços disponíveis no momento.</p>}
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => { setServico(null); setData(''); setHora('') }} className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground transition">
                <ChevronLeft size={14} /> {servico.nome}{servico.preco != null ? ` · ${brl(servico.preco)}` : ''} — trocar
              </button>

              {info.profissionais.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Com quem?</label>
                  <select value={profissionalId} onChange={e => setProfissionalId(e.target.value)} className={inputCls}>
                    <option value="">Tanto faz 😊</option>
                    {info.profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Que dia?</label>
                <input type="date" min={hoje} max={max} value={data} onChange={e => setData(e.target.value)} className={inputCls} />
              </div>

              {data && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Horário</label>
                  {horarios === null ? (
                    <p className="text-sm text-muted inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Buscando horários...</p>
                  ) : horarios.length === 0 ? (
                    <p className="text-sm text-muted">Nenhum horário livre nesse dia 😕 Tente outra data.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {horarios.map(h => (
                        <button key={h} onClick={() => setHora(h)}
                          className={`text-sm rounded-lg py-2 border transition ${hora === h ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'border-border text-foreground hover:border-primary'}`}>
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {hora && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Seu nome</label>
                    <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Como te chamamos?" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Seu WhatsApp</label>
                    <input value={telefone} onChange={e => setTelefone(e.target.value)} inputMode="tel" placeholder="11999998888 (DDD + número)" className={inputCls} />
                    <p className="text-xs text-muted mt-1">Você recebe a confirmação e o lembrete por lá.</p>
                  </div>

                  {erro && <p className="text-danger text-sm">{erro}</p>}

                  <button onClick={confirmar} disabled={enviando || !nome.trim() || telefone.replace(/\D/g, '').length < 10}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3.5 rounded-xl transition disabled:opacity-50 text-base">
                    {enviando ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {enviando ? 'Agendando...' : `Confirmar ${data.split('-').reverse().slice(0, 2).join('/')} às ${hora}`}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-4">Agendamento online por <b>AgendaBot</b> 🤖</p>
      </div>
    </main>
  )
}
