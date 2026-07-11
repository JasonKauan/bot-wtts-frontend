'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { configApi, unidadesApi } from '@/lib/api'
import type { Configuracao, Unidade } from '@/lib/types'
import { Check, Loader2, Store, Plus } from 'lucide-react'

const inputCls = 'w-full bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

// ISO: 1=segunda ... 7=domingo
const DIAS: Array<{ iso: number; label: string }> = [
  { iso: 1, label: 'Seg' }, { iso: 2, label: 'Ter' }, { iso: 3, label: 'Qua' },
  { iso: 4, label: 'Qui' }, { iso: 5, label: 'Sex' }, { iso: 6, label: 'Sáb' }, { iso: 7, label: 'Dom' },
]

function parseDias(s: string): number[] {
  return s.split(',').map(p => Number(p.trim())).filter(n => n >= 1 && n <= 7)
}

/** Multi-unidade (Diamond): lista as unidades e cria novas. A troca fica no menu lateral. */
function UnidadesBloco() {
  const { token } = useAuth()
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [criando, setCriando] = useState(false)
  const [nomeNova, setNomeNova] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroUnidade, setErroUnidade] = useState('')

  useEffect(() => {
    if (!token) return
    unidadesApi.list(token).then(setUnidades).catch(() => {})
  }, [token])

  async function criar() {
    if (!token || !nomeNova.trim()) return
    setSalvando(true); setErroUnidade('')
    try {
      await unidadesApi.criar(token, { nome: nomeNova.trim() })
      setNomeNova(''); setCriando(false)
      setUnidades(await unidadesApi.list(token))
    } catch (e: unknown) {
      setErroUnidade(e instanceof Error ? e.message : 'Erro ao criar unidade')
    } finally { setSalvando(false) }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        <Store size={15} className="inline mr-1.5 -mt-0.5" />Unidades ({unidades.length})
      </label>
      <p className="text-xs text-muted mb-2">
        Tem mais de um estabelecimento? Cada unidade tem WhatsApp, agenda e assinatura próprios —
        e você troca entre elas no topo do menu lateral. A nova unidade começa com 14 dias grátis.
      </p>
      <div className="space-y-1.5 mb-2">
        {unidades.map(u => (
          <div key={u.tenantId} className="flex items-center gap-2 text-sm text-foreground">
            🏪 {u.nome}
            <span className="text-xs text-muted">({u.plano})</span>
            {u.atual && <span className="text-xs bg-primary-subtle text-primary px-2 py-0.5 rounded-full font-medium">atual</span>}
          </div>
        ))}
      </div>
      {criando ? (
        <div className="flex gap-2 items-center">
          <input value={nomeNova} onChange={e => setNomeNova(e.target.value)} placeholder="Nome da nova unidade" className={inputCls} autoFocus />
          <button type="button" onClick={criar} disabled={salvando || !nomeNova.trim()}
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50 shrink-0">
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Criar
          </button>
          <button type="button" onClick={() => setCriando(false)} className="text-sm text-muted hover:text-foreground shrink-0">Cancelar</button>
        </div>
      ) : (
        <button type="button" onClick={() => setCriando(true)}
          className="inline-flex items-center gap-1.5 text-sm border border-border rounded-lg px-3 py-2 text-muted hover:text-primary hover:border-primary transition">
          <Plus size={15} /> Nova unidade
        </button>
      )}
      {erroUnidade && <p className="text-danger text-xs mt-2">{erroUnidade}</p>}
    </div>
  )
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
  const [antecedencia, setAntecedencia] = useState(0)
  const [resumoDiario, setResumoDiario] = useState(true)
  const [faltasAprovacao, setFaltasAprovacao] = useState(0)
  const [permiteCombo, setPermiteCombo] = useState(true)
  const [nivelPlano, setNivelPlano] = useState(1)
  const [paginaPublica, setPaginaPublica] = useState(false)
  const [slug, setSlug] = useState('')
  const [reativacaoDias, setReativacaoDias] = useState(0)
  const [reativacaoMsg, setReativacaoMsg] = useState('')
  const [aniversarioAtivo, setAniversarioAtivo] = useState(false)
  const [aniversarioMsg, setAniversarioMsg] = useState('')
  const [linkCopiado, setLinkCopiado] = useState(false)
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
      setAntecedencia(c.antecedenciaMinHoras)
      setResumoDiario(c.resumoDiario)
      setFaltasAprovacao(c.faltasParaAprovacao)
      setPermiteCombo(c.permiteCombo)
      setNivelPlano(c.nivelPlano)
      setPaginaPublica(c.paginaPublica)
      setSlug(c.slug ?? '')
      setReativacaoDias(c.reativacaoDias)
      setReativacaoMsg(c.reativacaoMsg ?? '')
      setAniversarioAtivo(c.aniversarioAtivo)
      setAniversarioMsg(c.aniversarioMsg ?? '')
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
        antecedenciaMinHoras: antecedencia,
        resumoDiario,
        faltasParaAprovacao: faltasAprovacao,
        permiteCombo,
        paginaPublica,
        slug: slug.trim(),
        reativacaoDias,
        reativacaoMsg: reativacaoMsg.trim() || null,
        aniversarioAtivo,
        aniversarioMsg: aniversarioMsg.trim() || null,
      })
      setConfig(updated)
      setSlug(updated.slug ?? '')
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

          <div className="border-t border-border pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={permiteCombo} onChange={e => setPermiteCombo(e.target.checked)} className="accent-primary mt-1 h-4 w-4" />
              <span>
                <span className="block text-sm font-medium text-foreground">Permitir combos no bot</span>
                <span className="block text-xs text-muted mt-0.5">
                  O cliente pode pedir dois ou mais serviços de uma vez (&quot;corte e barba&quot;) e o bot agenda
                  um horário só, com a duração somada.
                </span>
              </span>
            </label>
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={resumoDiario} onChange={e => setResumoDiario(e.target.checked)} className="accent-primary mt-1 h-4 w-4" />
              <span>
                <span className="block text-sm font-medium text-foreground">Resumo do dia no WhatsApp</span>
                <span className="block text-xs text-muted mt-0.5">
                  Toda manhã você recebe a agenda de hoje no seu WhatsApp: quem vem, que horas e qual serviço.
                  Se não tiver nada marcado, não enviamos nada.
                </span>
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Antecedência mínima pra cancelar/remarcar (horas)</label>
            <input type="number" min={0} max={72} value={antecedencia} onChange={e => setAntecedencia(Number(e.target.value))} className={`w-24 ${inputCls}`} />
            <p className="text-xs text-muted mt-1">0 = sem regra. Ex.: 2 = o cliente só consegue cancelar/remarcar pelo bot até 2 horas antes do horário.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Escudo anti-faltão (nº de faltas)</label>
            <input type="number" min={0} max={10} value={faltasAprovacao} onChange={e => setFaltasAprovacao(Number(e.target.value))} className={`w-24 ${inputCls}`} />
            <p className="text-xs text-muted mt-1">
              0 = desligado. Ex.: 2 = quem faltou 2 vezes ou mais nos últimos 90 dias não confirma sozinho —
              o pedido cai na aba <b>Solicitações</b> e você decide se aceita.
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-1">💎 Recursos Diamond</p>
            {nivelPlano < 3 ? (
              <p className="text-xs text-muted">
                Página pública de agendamento, reativação de clientes sumidos e parabéns de aniversário
                fazem parte do plano <b>Diamond</b> — veja na aba Assinatura.
              </p>
            ) : (
              <div className="space-y-5 mt-3">
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={paginaPublica} onChange={e => setPaginaPublica(e.target.checked)} className="accent-primary mt-1 h-4 w-4" />
                    <span>
                      <span className="block text-sm font-medium text-foreground">Página pública de agendamento</span>
                      <span className="block text-xs text-muted mt-0.5">
                        Um link pra colocar na bio do Instagram: o cliente agenda pelo navegador, sem WhatsApp.
                      </span>
                    </span>
                  </label>
                  {paginaPublica && (
                    <div className="pl-7 mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted shrink-0">…/agendar/</span>
                        <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="minha-barbearia" className={`flex-1 ${inputCls}`} />
                      </div>
                      {config.slug && (
                        <button type="button"
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/agendar/${config.slug}`); setLinkCopiado(true); setTimeout(() => setLinkCopiado(false), 2000) }}
                          className="text-xs text-primary hover:underline">
                          {linkCopiado ? '✓ Link copiado!' : `Copiar link: ${typeof window !== 'undefined' ? window.location.origin : ''}/agendar/${config.slug}`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Reativar clientes sumidos (dias sem visita)</label>
                  <input type="number" min={0} max={365} value={reativacaoDias} onChange={e => setReativacaoDias(Number(e.target.value))} className={`w-24 ${inputCls}`} />
                  <p className="text-xs text-muted mt-1">
                    0 = desligado. Ex.: 45 = quem não aparece há 45 dias e não tem horário marcado recebe um
                    &quot;sentimos sua falta&quot; (no máximo 1 a cada 60 dias por cliente, 10 por dia).
                  </p>
                  {reativacaoDias > 0 && (
                    <textarea value={reativacaoMsg} onChange={e => setReativacaoMsg(e.target.value)} rows={2}
                      placeholder={'Mensagem personalizada (opcional). Use {nome} e {estabelecimento}.'}
                      className={`mt-2 ${inputCls}`} />
                  )}
                </div>

                <UnidadesBloco />

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={aniversarioAtivo} onChange={e => setAniversarioAtivo(e.target.checked)} className="accent-primary mt-1 h-4 w-4" />
                    <span>
                      <span className="block text-sm font-medium text-foreground">Parabéns de aniversário</span>
                      <span className="block text-xs text-muted mt-0.5">
                        Quem tem aniversário cadastrado (aba Clientes) recebe uma mensagem no dia — 1x por ano.
                      </span>
                    </span>
                  </label>
                  {aniversarioAtivo && (
                    <textarea value={aniversarioMsg} onChange={e => setAniversarioMsg(e.target.value)} rows={2}
                      placeholder={'Mensagem personalizada (opcional). Use {nome} e {estabelecimento}.'}
                      className={`mt-2 pl-0 ${inputCls}`} style={{ marginLeft: '1.75rem', width: 'calc(100% - 1.75rem)' }} />
                  )}
                </div>
              </div>
            )}
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
