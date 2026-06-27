'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { configApi } from '@/lib/api'
import type { Configuracao } from '@/lib/types'
import { Check, Loader2 } from 'lucide-react'

export default function ConfiguracoesPage() {
  const { token } = useAuth()
  const [config, setConfig] = useState<Configuracao | null>(null)
  const [form, setForm] = useState({ nome: '', horarioAbertura: 8, horarioFechamento: 18 })
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!token) return
    configApi.get(token).then(c => {
      setConfig(c)
      setForm({ nome: c.nome, horarioAbertura: c.horarioAbertura, horarioFechamento: c.horarioFechamento })
    })
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true); setErro(''); setSucesso(false)
    try {
      const updated = await configApi.update(token, form)
      setConfig(updated)
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (!config) return <div className="text-muted">Carregando...</div>

  const inputCls = 'w-full bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      <div className="bg-card border border-border rounded-xl shadow-card p-6 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome do negócio</label>
            <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp</label>
            <input value={config.telefoneWhatsapp} disabled className="w-full bg-muted-bg border border-border rounded-lg px-3 py-2 text-sm text-muted" />
            <p className="text-xs text-muted mt-1">Para alterar o WhatsApp, entre em contato com o suporte.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Abertura (h)</label>
              <input type="number" min={0} max={23} value={form.horarioAbertura} onChange={e => setForm(f => ({ ...f, horarioAbertura: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Fechamento (h)</label>
              <input type="number" min={0} max={23} value={form.horarioFechamento} onChange={e => setForm(f => ({ ...f, horarioFechamento: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>

          {erro && <p className="text-danger text-sm">{erro}</p>}
          {sucesso && <p className="text-primary text-sm flex items-center gap-1"><Check size={15} /> Configurações salvas!</p>}

          <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  )
}
