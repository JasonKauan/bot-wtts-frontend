'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { configApi } from '@/lib/api'
import type { Configuracao } from '@/lib/types'

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

  if (!config) return <div className="text-gray-500">Carregando...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do negócio</label>
            <input
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              value={config.telefoneWhatsapp}
              disabled
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">Para alterar o WhatsApp, entre em contato com o suporte.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abertura (h)</label>
              <input
                type="number"
                min={0} max={23}
                value={form.horarioAbertura}
                onChange={e => setForm(f => ({ ...f, horarioAbertura: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento (h)</label>
              <input
                type="number"
                min={0} max={23}
                value={form.horarioFechamento}
                onChange={e => setForm(f => ({ ...f, horarioFechamento: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          {sucesso && <p className="text-green-600 text-sm">✅ Configurações salvas!</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  )
}
