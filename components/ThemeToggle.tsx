'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Alternar tema"
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className={`inline-flex items-center justify-center rounded-lg p-2 text-muted hover:bg-muted-bg hover:text-foreground transition ${className}`}
    >
      {mounted ? (isDark ? <Sun size={18} /> : <Moon size={18} />) : <span className="block h-[18px] w-[18px]" />}
    </button>
  )
}
