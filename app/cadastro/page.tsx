'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { CalendarCheck, Store, Mail, Lock, Phone, Loader2 } from 'lucide-react'

export default function CadastroPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', telefoneWhatsapp: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { token } = await authApi.register(form.nome, form.email, form.senha, form.telefoneWhatsapp)
      login(token)
      router.push('/dashboard')
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-7">
          <span className="grid place-items-center h-12 w-12 rounded-2xl bg-primary text-primary-foreground shadow-sm mb-3">
            <CalendarCheck size={26} />
          </span>
          <h1 className="text-2xl font-bold text-foreground">Criar conta</h1>
          <p className="text-muted text-sm mt-1">Configure seu bot em minutos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-card p-6 space-y-4">
          <Field icon={Store} label="Nome do negócio" value={form.nome} onChange={v => set('nome', v)} placeholder="Ex: Barbearia do João" />
          <Field icon={Mail} type="email" label="E-mail" value={form.email} onChange={v => set('email', v)} placeholder="seu@email.com" />
          <Field icon={Lock} type="password" label="Senha" value={form.senha} onChange={v => set('senha', v)} placeholder="••••••••" />
          <Field icon={Phone} type="tel" label="WhatsApp (com DDI)" value={form.telefoneWhatsapp} onChange={v => set('telefoneWhatsapp', v)} placeholder="5511999999999" />

          {erro && <p className="text-danger text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder }: {
  icon: React.ElementType
  label: string
  type?: string
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
