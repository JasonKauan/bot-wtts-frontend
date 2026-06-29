'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { relatoriosApi } from '@/lib/api'
import type { Relatorio } from '@/lib/types'
import { CalendarClock, CheckCircle2, UserX, XCircle, TrendingUp } from 'lucide-react'

export default function RelatoriosPage() {
  const { token } = useAuth()
  const [dados, setDados] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!token) return
    relatoriosApi.get(token)
      .then(setDados)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <div className="text-muted">Carregando...</div>
  if (erro) return <p className="text-danger text-sm">{erro}</p>
  if (!dados) return null

  const cards = [
    { label: 'Próximos 7 dias', valor: dados.proximos7Dias, icon: CalendarClock, destaque: true },
    { label: 'Atendidos (30 dias)', valor: dados.realizados30Dias, icon: CheckCircle2 },
    { label: 'Faltas (30 dias)', valor: dados.faltas30Dias, icon: UserX },
    { label: 'Cancelados (30 dias)', valor: dados.cancelados30Dias, icon: XCircle },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Relatórios</h1>
      <p className="text-muted text-sm mb-6">Um resumo rápido do seu movimento.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-card border border-border rounded-xl shadow-card p-4">
              <Icon size={20} className={c.destaque ? 'text-primary' : 'text-muted'} />
              <div className={`text-3xl font-bold mt-2 ${c.destaque ? 'text-primary' : 'text-foreground'}`}>{c.valor}</div>
              <div className="text-xs text-muted mt-0.5">{c.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl shadow-card p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <TrendingUp size={17} className="text-muted" /> Taxa de falta (30 dias)
          </div>
          <div className="text-4xl font-bold text-foreground">{dados.taxaFaltaPct}%</div>
          <p className="text-xs text-muted mt-1">
            {dados.taxaFaltaPct === 0 ? 'Sem faltas no período 🎉' : 'dos atendimentos marcados acabaram em falta.'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-card p-5">
          <div className="text-sm font-medium text-foreground mb-3">Serviços mais pedidos (30 dias)</div>
          {dados.servicosTop.length === 0 ? (
            <p className="text-muted text-sm">Ainda sem dados no período.</p>
          ) : (
            <div className="space-y-2">
              {dados.servicosTop.map((s, i) => (
                <div key={s.servico} className="flex items-center justify-between text-sm">
                  <span className="text-foreground"><span className="text-muted mr-1">{i + 1}.</span>{s.servico}</span>
                  <span className="font-semibold text-foreground">{s.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
