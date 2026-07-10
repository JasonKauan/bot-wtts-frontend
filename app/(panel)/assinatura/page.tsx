'use client'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { assinaturaApi } from '@/lib/api'
import type { AssinaturaStatus, PixGerado } from '@/lib/types'
import { Check, Copy, AlertTriangle, Clock, Loader2, Medal, Shield, Gem } from 'lucide-react'

const PLANOS = [
  {
    id: 'GOLD', nome: 'Gold', preco: '39,90', destaque: false,
    slogan: 'O essencial pra lotar a agenda',
    detalhes: ['Bot completo de agendamento', 'Lembretes automáticos (24h + no dia)',
      'Agendamentos ilimitados', '2 profissionais', 'Agenda, serviços e folgas'],
  },
  {
    id: 'PLATINUM', nome: 'Platinum', preco: '79,90', destaque: true,
    slogan: 'Pra quem tem equipe',
    detalhes: ['Tudo do Gold', 'Até 5 profissionais + grade individual', 'Combos ("corte e barba")',
      'Lista de espera', 'Escudo anti-faltão + fila de aprovação', 'Resumo diário no WhatsApp', 'CRM de clientes'],
  },
  {
    id: 'DIAMOND', nome: 'Diamond', preco: '119,90', destaque: false,
    slogan: 'Pra gerenciar o negócio',
    detalhes: ['Tudo do Platinum', 'Profissionais ilimitados', 'Clientes fixos (recorrência)',
      'Relatório financeiro + planilha', 'Conversas do bot (auditoria)'],
  },
] as const

/** Brasão do plano — dourado, prateado e diamante. */
function Brasao({ plano, size = 34 }: { plano: string; size?: number }) {
  const icone = size > 24 ? size - 16 : size - 8
  if (plano === 'GOLD') return (
    <span style={{ height: size, width: size }} className="grid place-items-center rounded-full bg-amber-100 text-amber-600 ring-2 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/40 shrink-0">
      <Medal size={icone} />
    </span>
  )
  if (plano === 'PLATINUM') return (
    <span style={{ height: size, width: size }} className="grid place-items-center rounded-full bg-slate-100 text-slate-500 ring-2 ring-slate-300 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/40 shrink-0">
      <Shield size={icone} />
    </span>
  )
  if (plano === 'DIAMOND') return (
    <span style={{ height: size, width: size }} className="grid place-items-center rounded-full bg-cyan-100 text-cyan-600 ring-2 ring-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-400 dark:ring-cyan-500/40 shrink-0">
      <Gem size={icone} />
    </span>
  )
  return null
}

const NOME_BONITO: Record<string, string> = {
  TRIAL: 'Teste grátis', GOLD: 'Gold', PLATINUM: 'Platinum', DIAMOND: 'Diamond',
}

export default function AssinaturaPage() {
  const { token } = useAuth()
  const [status, setStatus] = useState<AssinaturaStatus | null>(null)
  const [pix, setPix] = useState<PixGerado | null>(null)
  const [gerando, setGerando] = useState<string | null>(null)
  const [pago, setPago] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')

  const carregarStatus = useCallback(() => {
    if (!token) return
    assinaturaApi.get(token).then(setStatus).catch(() => {})
  }, [token])

  useEffect(() => { carregarStatus() }, [carregarStatus])

  useEffect(() => {
    if (!token || !pix || pago) return
    const id = setInterval(async () => {
      try {
        const p = await assinaturaApi.pagamento(token, pix.pagamentoId)
        if (p.status === 'APROVADO') { setPago(true); setPix(null); carregarStatus() }
        else if (p.status === 'REJEITADO') { setErro('Pagamento rejeitado. Tente novamente.'); setPix(null) }
      } catch { /* erro transitório */ }
    }, 10_000)
    return () => clearInterval(id)
  }, [token, pix, pago, carregarStatus])

  async function pagar(plano: string) {
    if (!token) return
    setGerando(plano); setErro(''); setPago(false)
    try {
      setPix(await assinaturaApi.gerarPix(token, plano))
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar o PIX')
    } finally {
      setGerando(null)
    }
  }

  async function copiar() {
    if (!pix?.qrCode) return
    await navigator.clipboard.writeText(pix.qrCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (!status) return <div className="text-muted">Carregando...</div>

  const expiraFmt = status.expiraEm ? new Date(status.expiraEm).toLocaleDateString('pt-BR') : '—'

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Assinatura</h1>

      {status.vencida && (
        <div className="mb-6 rounded-xl border border-border bg-danger-subtle text-danger px-4 py-3 text-sm font-medium flex items-center gap-2">
          <AlertTriangle size={16} />
          Sua {status.plano === 'TRIAL' ? 'avaliação gratuita terminou' : 'assinatura venceu'}. Escolha um plano abaixo para continuar.
        </div>
      )}
      {!status.vencida && status.avisoTrial && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400 px-4 py-3 text-sm font-medium flex items-center gap-2">
          <Clock size={16} /> Seu período de teste termina em {status.diasRestantes} dia(s). Assine para não perder o acesso.
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-card p-6 mb-8 max-w-md">
        <p className="text-sm text-muted mb-2">Plano atual</p>
        <div className="flex items-center gap-3">
          <Brasao plano={status.plano} />
          <span className="text-xl font-bold text-foreground">{NOME_BONITO[status.plano] ?? status.plano}</span>
          {status.plano !== 'TRIAL' && <span className="text-muted text-sm">R$ {status.valorMensal.toFixed(2).replace('.', ',')}/mês</span>}
        </div>
        <p className="text-sm text-muted mt-2">
          {status.vencida ? 'Venceu em' : 'Válido até'} <strong className="text-foreground">{expiraFmt}</strong>
          {!status.vencida && ` (${status.diasRestantes} dia(s) restante(s))`}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-4">Planos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mb-8">
        {PLANOS.map(p => {
          const atual = status.plano === p.id
          return (
            <div key={p.id} className={`bg-card rounded-xl border p-6 flex flex-col shadow-card relative ${atual || p.destaque ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
              {p.destaque && !atual && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full font-semibold">mais escolhido</span>
              )}
              <div className="flex items-center gap-3 mb-1">
                <Brasao plano={p.id} />
                <div className="flex-1">
                  <span className="font-bold text-foreground">{p.nome}</span>
                  <p className="text-xs text-muted">{p.slogan}</p>
                </div>
                {atual && <span className="text-xs bg-primary-subtle text-primary px-2 py-0.5 rounded-full font-medium shrink-0">atual</span>}
              </div>
              <p className="text-2xl font-bold text-foreground my-3">R$ {p.preco}<span className="text-sm font-normal text-muted">/mês</span></p>
              <ul className="text-sm text-muted space-y-1.5 mb-6 flex-1">
                {p.detalhes.map(d => <li key={d} className="flex items-start gap-2"><Check size={15} className="text-primary shrink-0 mt-0.5" /> {d}</li>)}
              </ul>
              <button onClick={() => pagar(p.id)} disabled={gerando !== null} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
                {gerando === p.id && <Loader2 size={16} className="animate-spin" />}
                {gerando === p.id ? 'Gerando PIX...' : atual ? 'Renovar com PIX' : 'Assinar com PIX'}
              </button>
            </div>
          )
        })}
      </div>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {pago && (
        <div className="rounded-xl border border-border bg-primary-subtle text-primary px-4 py-3 text-sm font-medium max-w-md flex items-center gap-2">
          <Check size={16} /> Pagamento confirmado! Sua assinatura está ativa.
        </div>
      )}

      {pix && (
        <div className="bg-card border border-border rounded-xl shadow-card p-6 max-w-md">
          <h3 className="font-semibold text-foreground mb-1">Pague com PIX</h3>
          <p className="text-sm text-muted mb-4">R$ {pix.valor.toFixed(2)} — escaneie o QR code ou copie o código abaixo.</p>

          {pix.qrCodeBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 mx-auto mb-4 rounded-lg bg-white p-1.5 border border-border" />
          )}

          {pix.qrCode && (
            <div className="mb-4">
              <p className="text-xs text-muted mb-1">PIX copia e cola</p>
              <div className="flex gap-2">
                <input readOnly value={pix.qrCode} className="flex-1 bg-muted-bg border border-border rounded-lg px-3 py-2 text-xs text-muted" />
                <button onClick={copiar} className="inline-flex items-center justify-center bg-muted-bg hover:bg-border text-foreground text-sm font-medium px-3 rounded-lg transition" title="Copiar">
                  {copiado ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>
          )}

          <p className="text-sm text-muted flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Aguardando confirmação do pagamento (verificamos a cada 10s)...
          </p>
        </div>
      )}
    </div>
  )
}
