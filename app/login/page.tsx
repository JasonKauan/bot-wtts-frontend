'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { CalendarCheck, Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { token } = await authApi.login(email, senha)
      login(token)
      router.push('/dashboard')
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-7">
          <span className="grid place-items-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-sm mb-3">
            <CalendarCheck size={26} />
          </span>
          <h1 className="text-2xl font-bold text-foreground">AgendaBot</h1>
          <p className="text-muted text-sm mt-1">Painel de controle</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-card p-6 space-y-4">
          <Field icon={Mail} type="email" value={email} onChange={setEmail} placeholder="seu@email.com" label="E-mail" />
          <Field icon={Lock} type="password" value={senha} onChange={setSenha} placeholder="••••••••" label="Senha" />

          {erro && <p className="text-danger text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Não tem conta?{' '}
          <Link href="/cadastro" className="text-primary hover:underline font-medium">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, type, value, onChange, placeholder }: {
  icon: React.ElementType
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          placeholder={placeholder}
          className="w-full bg-card border border-input rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
        />
      </div>
    </div>
  )
}
