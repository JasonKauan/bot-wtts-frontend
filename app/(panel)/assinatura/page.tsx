'use client'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { assinaturaApi } from '@/lib/api'
import type { AssinaturaStatus, PixGerado } from '@/lib/types'
import { Check, Copy, AlertTriangle, Clock, Loader2 } from 'lucide-react'

const PLANOS = [
  { id: 'BASICO', nome: 'Básico', preco: 79,  detalhes: ['1 profissional', '100 agendamentos/mês'] },
  { id: 'PRO',    nome: 'Pro',    preco: 129, detalhes: ['5 profissionais', 'Agendamentos ilimitados'] },
  { id: 'PLUS',   nome: 'Plus',   preco: 199, detalhes: ['Profissionais ilimitados', 'Tudo ilimitado'] },
] as const

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
        <p className="text-sm text-muted mb-1">Plano atual</p>
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold text-primary">{status.plano}</span>
          {status.plano !== 'TRIAL' && <span className="text-muted text-sm">R$ {status.valorMensal.toFixed(2)}/mês</span>}
        </div>
        <p className="text-sm text-muted mt-2">
          {status.vencida ? 'Venceu em' : 'Válido até'} <strong className="text-foreground">{expiraFmt}</strong>
          {!status.vencida && ` (${status.diasRestantes} dia(s) restante(s))`}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-4">Planos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mb-8">
        {PLANOS.map(p => {
          const atual = status.plano === p.id
          return (
            <div key={p.id} className={`bg-card rounded-xl border p-6 flex flex-col shadow-card ${atual ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-foreground">{p.nome}</span>
                {atual && <span className="text-xs bg-primary-subtle text-primary px-2 py-0.5 rounded-full font-medium">atual</span>}
              </div>
              <p className="text-2xl font-bold text-foreground mb-4">R$ {p.preco}<span className="text-sm font-normal text-muted">/mês</span></p>
              <ul className="text-sm text-muted space-y-1.5 mb-6 flex-1">
                {p.detalhes.map(d => <li key={d} className="flex items-center gap-2"><Check size={15} className="text-primary shrink-0" /> {d}</li>)}
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
