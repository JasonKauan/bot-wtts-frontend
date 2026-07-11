'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { agendamentosApi, unidadesApi } from '@/lib/api'
import type { Unidade } from '@/lib/types'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard, CalendarDays, Users, Scissors, CreditCard,
  Settings, MessageSquare, LogOut, CalendarCheck, Inbox, CalendarOff, BarChart3, Contact, Repeat,
  MessagesSquare, Bot,
} from 'lucide-react'

const links = [
  { href: '/dashboard',     label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/agenda',        label: 'Agenda',            icon: CalendarDays },
  { href: '/solicitacoes',  label: 'Solicitações',      icon: Inbox },
  { href: '/clientes',      label: 'Clientes',          icon: Contact },
  { href: '/fixos',         label: 'Clientes fixos',    icon: Repeat },
  { href: '/conversas',     label: 'Conversas do bot',  icon: MessagesSquare },
  { href: '/relatorios',    label: 'Relatórios',        icon: BarChart3 },
  { href: '/folgas',        label: 'Folgas',            icon: CalendarOff },
  { href: '/conectar',      label: 'Conectar WhatsApp', icon: MessageSquare },
  { href: '/testar',        label: 'Testar o bot',      icon: Bot },
  { href: '/profissionais', label: 'Profissionais',     icon: Users },
  { href: '/servicos',      label: 'Serviços',          icon: Scissors },
  { href: '/assinatura',    label: 'Assinatura',        icon: CreditCard },
  { href: '/configuracoes', label: 'Configurações',     icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { token, login, logout } = useAuth()
  const [pendentes, setPendentes] = useState(0)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [trocando, setTrocando] = useState(false)

  useEffect(() => {
    if (!token) return
    let vivo = true
    const carregar = () => agendamentosApi.pendentes(token)
      .then(l => { if (vivo) setPendentes(l.length) })
      .catch(() => {})
    carregar()
    const t = setInterval(carregar, 30000) // atualiza a cada 30s
    unidadesApi.list(token).then(u => { if (vivo) setUnidades(u) }).catch(() => {})
    return () => { vivo = false; clearInterval(t) }
  }, [token])

  /**
   * Multi-unidade: troca o token pro tenant escolhido SEM recarregar a página.
   * (Reload duro chegava no /dashboard antes de o token novo sair do localStorage
   * e o guard jogava pro /login.) Navegação client-side: o token novo já está no
   * contexto e todas as telas re-buscam os dados da unidade nova via useEffect[token].
   */
  async function trocarUnidade(tenantId: string) {
    if (!token || trocando) return
    setTrocando(true)
    try {
      const r = await unidadesApi.trocar(token, tenantId)
      login(r.token)
      router.push('/dashboard')
    } finally {
      setTrocando(false)
    }
  }

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarCheck size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">AgendaBot</span>
        </div>
        {unidades.length > 1 && (
          <select
            value={unidades.find(u => u.atual)?.tenantId ?? ''}
            onChange={e => trocarUnidade(e.target.value)}
            disabled={trocando}
            title="Trocar de unidade"
            className="mt-3 w-full bg-card border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition disabled:opacity-50"
          >
            {unidades.map(u => <option key={u.tenantId} value={u.tenantId}>🏪 {u.nome}</option>)}
          </select>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(l => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/')
          const Icon = l.icon
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-primary-subtle text-primary'
                  : 'text-muted hover:bg-muted-bg hover:text-foreground'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{l.label}</span>
              {l.href === '/solicitacoes' && pendentes > 0 && (
                <span className="grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-danger text-white text-xs font-bold">
                  {pendentes}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border flex items-center justify-between">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:bg-danger-subtle hover:text-danger transition"
        >
          <LogOut size={18} /> Sair
        </button>
        <ThemeToggle />
      </div>
    </aside>
  )
}
