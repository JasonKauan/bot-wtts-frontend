'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

const links = [
  { href: '/dashboard',     label: 'Dashboard',      icon: '📊' },
  { href: '/agenda',        label: 'Agenda',         icon: '📅' },
  { href: '/profissionais', label: 'Profissionais',  icon: '👤' },
  { href: '/servicos',      label: 'Serviços',       icon: '✂️' },
  { href: '/assinatura',    label: 'Assinatura',     icon: '💳' },
  { href: '/configuracoes', label: 'Configurações',  icon: '⚙️' },
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
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-xl font-bold text-green-700">📅 AgendaBot</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(l => {
          const active = pathname === l.href || pathname.startsWith(l.href + '/')
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{l.icon}</span>
              {l.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  )
}
