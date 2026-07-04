'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { CeoResumo, Acerto } from '@/lib/types'
import { Crown, ArrowLeft, TrendingUp, TrendingDown, Trophy, Wallet, ShoppingCart, RefreshCw, Download, HandCoins, Check, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

function brl(n: number): string {
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CeoPage() {
  const { token } = useAuth()
  const [dados, setDados] = useState<CeoResumo | null>(null)
  const [acertos, setAcertos] = useState<Acerto[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [acertando, setAcertando] = useState(false)

  function fetchData() {
    if (!token) return
    setLoading(true); setErro('')
    Promise.all([adminApi.ceoResumo(token), adminApi.ceoAcerto(token)])
      .then(([r, a]) => { setDados(r); setAcertos(a) })
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchData, [token]) // eslint-disable-line

  async function acertar(vendedorId: string, vendedor: string) {
    if (!token) return
    setAcertando(true)
    try {
      const r = await adminApi.ceoAcertar(token, vendedorId)
      setAviso(`Comissões de ${vendedor} acertadas: ${r.vendasAcertadas} venda(s), ${brl(r.total)}.`)
      setTimeout(() => setAviso(''), 6000)
      fetchData()
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao acertar')
    } finally {
      setAcertando(false)
      setConfirmando(null)
    }
  }

  async function exportar() {
    if (!token) return
    try { await adminApi.baixarVendasCsv(token) }
    catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao exportar') }
  }

  const variacao = dados && dados.receitaMesAnterior > 0
    ? Math.round(((dados.receitaMes - dados.receitaMesAnterior) / dados.receitaMesAnterior) * 100)
    : null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground">
              <Crown size={18} />
            </span>
            <div>
              <h1 className="font-bold text-foreground leading-tight">Visão do negócio</h1>
              <p className="text-xs text-muted">Mês atual — só você vê esta tela</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={exportar} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
              <Download size={15} /> Exportar CSV
            </button>
            <button onClick={fetchData} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
              <RefreshCw size={15} /> Atualizar
            </button>
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
              <ArrowLeft size={15} /> Voltar
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {erro && <p className="text-danger text-sm mb-4">{erro}</p>}
        {aviso && <p className="text-primary text-sm mb-4 flex items-center gap-1"><Check size={15} /> {aviso}</p>}
        {loading ? <p className="text-muted">Carregando...</p> : dados && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-card border border-border rounded-xl shadow-card p-5">
                <div className="flex items-center gap-2 text-sm text-muted"><Wallet size={16} /> Receita do mês</div>
                <div className="text-3xl font-bold text-primary mt-2">{brl(dados.receitaMes)}</div>
                {variacao !== null && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${variacao >= 0 ? 'text-primary' : 'text-danger'}`}>
                    {variacao >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {variacao >= 0 ? '+' : ''}{variacao}% vs mês passado ({brl(dados.receitaMesAnterior)})
                  </div>
                )}
              </div>
              <div className="bg-card border border-border rounded-xl shadow-card p-5">
                <div className="flex items-center gap-2 text-sm text-muted"><ShoppingCart size={16} /> Vendas no mês</div>
                <div className="text-3xl font-bold text-foreground mt-2">{dados.vendasMes}</div>
                <div className="text-xs text-muted mt-1">mês passado: {dados.vendasMesAnterior}</div>
              </div>
              <div className="bg-card border border-border rounded-xl shadow-card p-5">
                <div className="flex items-center gap-2 text-sm text-muted"><Trophy size={16} /> Comissões a pagar</div>
                <div className="text-3xl font-bold text-foreground mt-2">{brl(dados.comissoesMes)}</div>
                <div className="text-xs text-muted mt-1">soma das comissões do mês</div>
              </div>
            </div>

            {acertos.length > 0 && (
              <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden mb-6">
                <div className="px-4 py-3 border-b border-border font-medium text-foreground flex items-center gap-2">
                  <HandCoins size={16} className="text-primary" /> Acerto de comissões
                  <span className="text-xs text-muted font-normal">— o que você ainda deve pra cada vendedor</span>
                </div>
                <div className="divide-y divide-border">
                  {acertos.map(a => (
                    <div key={a.vendedorId} className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-foreground font-medium">{a.vendedor}</div>
                        <div className="text-xs text-muted">{a.vendas} venda{a.vendas === 1 ? '' : 's'} sem acerto</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-foreground font-bold">{brl(a.comissaoPendente)}</span>
                        {confirmando === a.vendedorId ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted">Pagou {brl(a.comissaoPendente)}?</span>
                            <button onClick={() => acertar(a.vendedorId, a.vendedor)} disabled={acertando}
                              className="inline-flex items-center gap-1 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-lg px-3 py-1.5 transition disabled:opacity-50">
                              {acertando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Sim, marcar pago
                            </button>
                            <button onClick={() => setConfirmando(null)} className="text-sm text-muted hover:text-foreground transition">Não</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmando(a.vendedorId)}
                            className="text-sm border border-border rounded-lg px-3 py-1.5 text-muted hover:text-primary hover:border-primary transition">
                            Marcar como pago
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border font-medium text-foreground flex items-center gap-2">
                  <Trophy size={16} className="text-primary" /> Ranking do mês
                </div>
                {dados.ranking.length === 0 ? (
                  <p className="text-muted text-sm p-4">Nenhuma venda ainda neste mês.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted border-b border-border">
                        <th className="font-medium px-4 py-2">Vendedor</th>
                        <th className="font-medium px-4 py-2">Vendas</th>
                        <th className="font-medium px-4 py-2">Receita</th>
                        <th className="font-medium px-4 py-2">Comissão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.ranking.map((r, i) => (
                        <tr key={r.vendedor} className="border-b border-border last:border-0">
                          <td className="px-4 py-2.5 text-foreground font-medium">
                            {i === 0 && dados.ranking.length > 1 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''}{r.vendedor}
                          </td>
                          <td className="px-4 py-2.5 text-foreground">{r.vendas}</td>
                          <td className="px-4 py-2.5 text-foreground font-medium">{brl(r.receita)}</td>
                          <td className="px-4 py-2.5 text-muted">{brl(r.comissao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border font-medium text-foreground">Vendas recentes</div>
                {dados.vendasRecentes.length === 0 ? (
                  <p className="text-muted text-sm p-4">Nenhuma venda registrada ainda.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {dados.vendasRecentes.map((v, i) => (
                      <div key={i} className="px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <div className="text-foreground font-medium truncate">{v.tenantNome}</div>
                          <div className="text-xs text-muted">
                            {v.vendedor} · {v.plano} · {v.origem === 'PIX' ? 'PIX do cliente' : 'ativação manual'} · {fmtData(v.criadoEm)}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-foreground font-semibold">{brl(v.valor)}</div>
                          <div className="text-xs text-muted">com. {brl(v.comissaoValor)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function fmtData(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
