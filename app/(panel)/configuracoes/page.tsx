'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { configApi } from '@/lib/api'
import type { Configuracao } from '@/lib/types'
import { Check, Loader2 } from 'lucide-react'

const inputCls = 'w-full bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

// ISO: 1=segunda ... 7=domingo
const DIAS: Array<{ iso: number; label: string }> = [
  { iso: 1, label: 'Seg' }, { iso: 2, label: 'Ter' }, { iso: 3, label: 'Qua' },
  { iso: 4, label: 'Qui' }, { iso: 5, label: 'Sex' }, { iso: 6, label: 'Sáb' }, { iso: 7, label: 'Dom' },
]

function parseDias(s: string): number[] {
  return s.split(',').map(p => Number(p.trim())).filter(n => n >= 1 && n <= 7)
}

export default function ConfiguracoesPage() {
  const { token } = useAuth()
  const [config, setConfig] = useState<Configuracao | null>(null)
  const [nome, setNome] = useState('')
  const [abertura, setAbertura] = useState(8)
  const [fechamento, setFechamento] = useState(18)
  const [intervalo, setIntervalo] = useState(60)
  const [temAlmoco, setTemAlmoco] = useState(false)
  const [almocoInicio, setAlmocoInicio] = useState(12)
  const [almocoFim, setAlmocoFim] = useState(13)
  const [dias, setDias] = useState<number[]>([1, 2, 3, 4, 5, 6, 7])
  const [aprovacaoManual, setAprovacaoManual] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!token) return
    configApi.get(token).then(c => {
      setConfig(c)
      setNome(c.nome)
      setAbertura(c.horarioAbertura)
      setFechamento(c.horarioFechamento)
      setIntervalo(c.intervaloMinutos)
      setTemAlmoco(c.almocoInicio != null && c.almocoFim != null)
      if (c.almocoInicio != null) setAlmocoInicio(c.almocoInicio)
      if (c.almocoFim != null) setAlmocoFim(c.almocoFim)
      setDias(parseDias(c.diasFuncionamento))
      setAprovacaoManual(c.aprovacaoManual)
    })
  }, [token])

  function toggleDia(iso: number) {
    setDias(d => d.includes(iso) ? d.filter(x => x !== iso) : [...d, iso].sort((a, b) => a - b))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    if (dias.length === 0) { setErro('Selecione ao menos um dia de funcionamento.'); return }
    setSaving(true); setErro(''); setSucesso(false)
    try {
      const updated = await configApi.update(token, {
        nome, horarioAbertura: abertura, horarioFechamento: fechamento,
        intervaloMinutos: intervalo,
        almocoInicio: temAlmoco ? almocoInicio : null,
        almocoFim: temAlmoco ? almocoFim : null,
        diasFuncionamento: dias.join(','),
        aprovacaoManual,
      })
      setConfig(updated)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (!config) return <div className="text-muted">Carregando...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      <div className="bg-card border border-border rounded-xl shadow-card p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome do negócio</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp</label>
            <input value={config.telefoneWhatsapp} disabled className="w-full bg-muted-bg border border-border rounded-lg px-3 py-2 text-sm text-muted" />
            <p className="text-xs text-muted mt-1">Para alterar o WhatsApp, entre em contato com o suporte.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Abertura (h)</label>
              <input type="number" min={0} max={23} value={abertura} onChange={e => setAbertura(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fechamento (h)</label>
              <input type="number" min={1} max={24} value={fechamento} onChange={e => setFechamento(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Intervalo (min)</label>
              <input type="number" min={5} max={240} step={5} value={intervalo} onChange={e => setIntervalo(Number(e.target.value))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Dias de funcionamento</label>
            <div className="flex gap-1.5 flex-wrap">
              {DIAS.map(d => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => toggleDia(d.iso)}
                  className={`text-sm rounded-lg px-3 py-1.5 border transition ${dias.includes(d.iso) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted hover:text-foreground'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2 cursor-pointer">
              <input type="checkbox" checked={temAlmoco} onChange={e => setTemAlmoco(e.target.checked)} className="accent-primary" />
              Intervalo de almoço (não oferece horários nessa faixa)
            </label>
            {temAlmoco && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-xs text-muted mb-1">Início (h)</label>
                  <input type="number" min={0} max={24} value={almocoInicio} onChange={e => setAlmocoInicio(Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Fim (h)</label>
                  <input type="number" min={0} max={24} value={almocoFim} onChange={e => setAlmocoFim(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={aprovacaoManual} onChange={e => setAprovacaoManual(e.target.checked)} className="accent-primary mt-1 h-4 w-4" />
              <span>
                <span className="block text-sm font-medium text-foreground">Aprovar agendamentos na mão</span>
                <span className="block text-xs text-muted mt-0.5">
                  Ligado: cada pedido do cliente entra na aba <b>Solicitações</b> e você Aceita ou Recusa (o cliente é avisado no WhatsApp).<br />
                  Desligado: o bot confirma na hora, sozinho.
                </span>
              </span>
            </label>
          </div>

          {erro && <p className="text-danger text-sm">{erro}</p>}
          {sucesso && <p className="text-primary text-sm flex items-center gap-1"><Check size={15} /> Configurações salvas!</p>}

          <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  )
}
