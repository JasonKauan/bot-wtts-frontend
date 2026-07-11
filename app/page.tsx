'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/auth'
import {
  CalendarCheck, Bot, BellRing, Clock, Users, BarChart3, Link2,
  Check, Medal, Shield, Gem, MessageCircle, ArrowRight,
} from 'lucide-react'

function Brasao({ plano }: { plano: 'GOLD' | 'PLATINUM' | 'DIAMOND' }) {
  const cfg = {
    GOLD: { Icon: Medal, cls: 'bg-amber-100 text-amber-600 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/40' },
    PLATINUM: { Icon: Shield, cls: 'bg-slate-100 text-slate-500 ring-slate-300 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-slate-400/40' },
    DIAMOND: { Icon: Gem, cls: 'bg-cyan-100 text-cyan-600 ring-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-400 dark:ring-cyan-500/40' },
  }[plano]
  return <span className={`grid place-items-center h-9 w-9 rounded-full ring-2 shrink-0 ${cfg.cls}`}><cfg.Icon size={18} /></span>
}

export default function Landing() {
  const router = useRouter()
  const [logado, setLogado] = useState(false)

  useEffect(() => { if (getToken()) { setLogado(true); router.replace('/dashboard') } }, [router])
  if (logado) return null

  const features = [
    { icon: Bot, t: 'Bot que agenda sozinho', d: 'Responde na hora, mostra os horários livres de verdade e marca — 24h por dia, até de madrugada.' },
    { icon: BellRing, t: 'Lembretes automáticos', d: 'O cliente recebe lembrete um dia antes e no dia. Falta despenca, cadeira não fica vazia.' },
    { icon: Clock, t: 'Cancelar e remarcar', d: 'O próprio cliente cancela ou remarca pelo WhatsApp. Você nem precisa parar o que está fazendo.' },
    { icon: Users, t: 'Vários profissionais', d: 'Cada um com sua agenda, seus horários e suas folgas. O bot respeita tudo.' },
    { icon: Link2, t: 'Link de agendamento', d: 'Um link pra colocar na bio do Instagram: o cliente agenda pelo navegador, sem nem falar com você.' },
    { icon: BarChart3, t: 'Você vê o retorno', d: 'O painel mostra quanto o bot agendou no mês. O robô que custa R$ 39,90 se paga sozinho.' },
  ]
  const planos = [
    { id: 'GOLD' as const, nome: 'Gold', preco: '39,90', slogan: 'O essencial pra lotar a agenda', itens: ['Bot completo no WhatsApp', 'Lembretes automáticos', 'Agendamentos ilimitados', '2 profissionais'] },
    { id: 'PLATINUM' as const, nome: 'Platinum', preco: '79,90', slogan: 'Pra quem tem equipe', destaque: true, itens: ['Tudo do Gold + 5 profissionais', 'Combos ("corte e barba")', 'Lista de espera + anti-faltão', 'Resumo diário + CRM'] },
    { id: 'DIAMOND' as const, nome: 'Diamond', preco: '119,90', slogan: 'Pra gerenciar o negócio', itens: ['Tudo do Platinum + ilimitado', 'Link de agendamento na bio', 'Clientes fixos + aniversário', 'Financeiro + multi-unidade'] },
  ]

  const btnPrimary = 'inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-6 py-3 rounded-xl transition'

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground"><CalendarCheck size={20} /></span>
            <span className="text-lg font-bold">AgendaBot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground transition px-3 py-2">Entrar</Link>
            <Link href="/cadastro" className="text-sm font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-lg transition">Teste grátis</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-5 pt-16 pb-12 text-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-subtle text-primary px-3 py-1.5 rounded-full mb-5">
          <MessageCircle size={13} /> Agendamento pelo WhatsApp
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
          O funcionário que atende seu WhatsApp<br className="hidden sm:block" /> <span className="text-primary">24 horas e nunca falta</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
          Quantos clientes você já perdeu por não responder o WhatsApp na hora? O AgendaBot responde,
          mostra os horários livres e marca sozinho — enquanto você atende.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/cadastro" className={btnPrimary}>Começar grátis por 14 dias <ArrowRight size={18} /></Link>
          <Link href="/login" className="inline-flex items-center justify-center gap-2 border border-border hover:border-border text-foreground font-semibold px-6 py-3 rounded-xl transition">Já sou cliente</Link>
        </div>
        <p className="text-xs text-muted mt-4">Sem cartão de crédito · Todos os recursos liberados no teste</p>
      </section>

      {/* Como funciona */}
      <section className="max-w-5xl mx-auto px-5 py-12">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { n: '1', t: 'Conecte seu WhatsApp', d: 'Escaneia um QR code e pronto — o bot começa a atender no seu número.' },
            { n: '2', t: 'Cadastre seus serviços', d: 'Corte, barba, o que você faz — com preço e duração. Leva 2 minutos.' },
            { n: '3', t: 'Deixe o bot trabalhar', d: 'Os clientes mandam mensagem e agendam sozinhos. Você só atende.' },
          ].map(s => (
            <div key={s.n} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <span className="grid place-items-center h-9 w-9 rounded-full bg-primary text-primary-foreground font-bold mb-3">{s.n}</span>
              <h3 className="font-semibold mb-1.5">{s.t}</h3>
              <p className="text-sm text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 py-12">
        <h2 className="text-2xl font-bold text-center mb-2">Tudo que sua agenda precisa</h2>
        <p className="text-muted text-center mb-10">Simples pra você. Simples pro seu cliente.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.t} className="bg-card border border-border rounded-2xl p-6 shadow-card">
              <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary-subtle text-primary mb-4"><f.icon size={22} /></span>
              <h3 className="font-semibold mb-1.5">{f.t}</h3>
              <p className="text-sm text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="max-w-5xl mx-auto px-5 py-12">
        <h2 className="text-2xl font-bold text-center mb-2">Planos que cabem no bolso</h2>
        <p className="text-muted text-center mb-10">Menos que um corte por mês. Comece grátis por 14 dias.</p>
        <div className="grid md:grid-cols-3 gap-4 items-start">
          {planos.map(p => (
            <div key={p.id} className={`bg-card rounded-2xl border p-6 shadow-card relative ${p.destaque ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
              {p.destaque && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-3 py-0.5 rounded-full font-semibold">mais escolhido</span>}
              <div className="flex items-center gap-3 mb-3">
                <Brasao plano={p.id} />
                <div>
                  <div className="font-bold">{p.nome}</div>
                  <div className="text-xs text-muted">{p.slogan}</div>
                </div>
              </div>
              <p className="text-3xl font-bold mb-4">R$ {p.preco}<span className="text-sm font-normal text-muted">/mês</span></p>
              <ul className="space-y-2 mb-6">
                {p.itens.map(i => <li key={i} className="flex items-start gap-2 text-sm"><Check size={16} className="text-primary shrink-0 mt-0.5" /> {i}</li>)}
              </ul>
              <Link href="/cadastro" className={`w-full ${btnPrimary} ${p.destaque ? '' : 'bg-transparent border border-primary text-primary hover:bg-primary-subtle hover:text-primary'}`}>Começar grátis</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-5xl mx-auto px-5 py-12">
        <div className="bg-primary rounded-3xl px-8 py-12 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-3">Pare de perder cliente por WhatsApp não respondido</h2>
          <p className="text-primary-foreground/85 mb-7 max-w-xl mx-auto">Ative agora e veja o bot atendendo em 10 minutos. 14 dias grátis, sem cartão.</p>
          <Link href="/cadastro" className="inline-flex items-center justify-center gap-2 bg-white text-primary font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition">
            Criar minha conta grátis <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-5 py-8 flex items-center justify-between flex-wrap gap-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-primary text-primary-foreground"><CalendarCheck size={15} /></span>
            <span className="font-semibold text-foreground">AgendaBot</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-foreground transition">Entrar</Link>
            <Link href="/cadastro" className="hover:text-foreground transition">Criar conta</Link>
          </div>
          <span>Agendamento via WhatsApp · feito no Brasil 🇧🇷</span>
        </div>
      </footer>
    </main>
  )
}
