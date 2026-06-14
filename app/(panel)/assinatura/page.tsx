'use client'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { assinaturaApi } from '@/lib/api'
import type { AssinaturaStatus, PixGerado } from '@/lib/types'

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

  // Polling a cada 10s enquanto aguarda a confirmação do PIX
  useEffect(() => {
    if (!token || !pix || pago) return
    const id = setInterval(async () => {
      try {
        const p = await assinaturaApi.pagamento(token, pix.pagamentoId)
        if (p.status === 'APROVADO') {
          setPago(true)
          setPix(null)
          carregarStatus()
        } else if (p.status === 'REJEITADO') {
          setErro('Pagamento rejeitado. Tente novamente.')
          setPix(null)
        }
      } catch {
        // erro transitório: mantém o polling
      }
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

  if (!status) return <div className="text-gray-500">Carregando...</div>

  const expiraFmt = status.expiraEm ? new Date(status.expiraEm).toLocaleDateString('pt-BR') : '—'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Assinatura</h1>

      {status.vencida && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          ⚠️ Sua {status.plano === 'TRIAL' ? 'avaliação gratuita terminou' : 'assinatura venceu'}.
          Escolha um plano abaixo para continuar usando o AgendaBot.
        </div>
      )}
      {!status.vencida && status.avisoTrial && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-3 text-sm font-medium">
          ⏳ Seu período de teste termina em {status.diasRestantes} dia(s). Assine para não perder o acesso.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 max-w-md">
        <p className="text-sm text-gray-500 mb-1">Plano atual</p>
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-bold text-green-700">{status.plano}</span>
          {status.plano !== 'TRIAL' && (
            <span className="text-gray-500 text-sm">R$ {status.valorMensal.toFixed(2)}/mês</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {status.vencida ? 'Venceu em' : 'Válido até'} <strong>{expiraFmt}</strong>
          {!status.vencida && ` (${status.diasRestantes} dia(s) restante(s))`}
        </p>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Planos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mb-8">
        {PLANOS.map(p => {
          const atual = status.plano === p.id
          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border p-6 flex flex-col ${
                atual ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800">{p.nome}</span>
                {atual && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    atual
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                R$ {p.preco}<span className="text-sm font-normal text-gray-500">/mês</span>
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-6 flex-1">
                {p.detalhes.map(d => <li key={d}>✓ {d}</li>)}
              </ul>
              <button
                onClick={() => pagar(p.id)}
                disabled={gerando !== null}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {gerando === p.id ? 'Gerando PIX...' : atual ? 'Renovar com PIX' : 'Assinar com PIX'}
              </button>
            </div>
          )
        })}
      </div>

      {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

      {pago && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium max-w-md">
          ✅ Pagamento confirmado! Sua assinatura está ativa.
        </div>
      )}

      {pix && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
          <h3 className="font-semibold text-gray-800 mb-1">Pague com PIX</h3>
          <p className="text-sm text-gray-500 mb-4">
            R$ {pix.valor.toFixed(2)} — escaneie o QR code ou copie o código abaixo.
          </p>

          {pix.qrCodeBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${pix.qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-48 h-48 mx-auto mb-4 border border-gray-200 rounded-lg"
            />
          )}

          {pix.qrCode && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">PIX copia e cola</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={pix.qrCode}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50"
                />
                <button
                  onClick={copiar}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 rounded-lg transition"
                >
                  {copiado ? '✅' : 'Copiar'}
                </button>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            Aguardando confirmação do pagamento (verificamos a cada 10s)...
          </p>
        </div>
      )}
    </div>
  )
}
