'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard, CalendarDays, Users, Scissors, CreditCard,
  Settings, MessageSquare, LogOut, CalendarCheck,
} from 'lucide-react'

const links = [
  { href: '/dashboard',     label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/agenda',        label: 'Agenda',            icon: CalendarDays },
  { href: '/conectar',      label: 'Conectar WhatsApp', icon: MessageSquare },
  { href: '/profissionais', label: 'Profissionais',     icon: Users },
  { href: '/servicos',      label: 'Serviços',          icon: Scissors },
  { href: '/assinatura',    label: 'Assinatura',        icon: CreditCard },
  { href: '/configuracoes', label: 'Configurações',     icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-card border-r border-border flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-border">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground shadow-sm">
          <CalendarCheck size={20} />
        </span>
        <span className="text-lg font-bold tracking-tight text-foreground">AgendaBot</span>
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
              {l.label}
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
