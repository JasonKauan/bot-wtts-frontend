'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { profissionaisApi } from '@/lib/api'
import type { Profissional } from '@/lib/types'
import { Plus, Pencil, Power, Check, X } from 'lucide-react'

export default function ProfissionaisPage() {
  const { token } = useAuth()
  const [profs, setProfs] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function fetchData() {
    if (!token) return
    try { setProfs(await profissionaisApi.list(token)) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !novoNome.trim()) return
    setSaving(true); setErro('')
    try {
      await profissionaisApi.create(token, novoNome.trim())
      setNovoNome(''); fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setSaving(false) }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editando) return
    setSaving(true); setErro('')
    try {
      await profissionaisApi.update(token, editando.id, editando.nome.trim())
      setEditando(null); fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setSaving(false) }
  }

  async function toggleAtivo(id: string) {
    if (!token) return
    await profissionaisApi.toggleAtivo(token, id)
    fetchData()
  }

  const inputCls = 'bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Profissionais</h1>

      <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl shadow-card p-5 mb-6 flex gap-3">
        <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do profissional" className={`flex-1 ${inputCls}`} />
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm px-4 py-2 rounded-lg transition disabled:opacity-50">
          <Plus size={16} /> Adicionar
        </button>
      </form>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : profs.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center text-muted">Nenhum profissional cadastrado.</div>
      ) : (
        <div className="space-y-3">
          {profs.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl shadow-card p-4 flex items-center justify-between gap-4">
              {editando?.id === p.id ? (
                <form onSubmit={handleUpdate} className="flex gap-2 flex-1 items-center">
                  <input value={editando.nome} onChange={e => setEditando({ ...editando, nome: e.target.value })} className={`flex-1 ${inputCls} py-1.5`} />
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-1 text-primary text-sm font-medium"><Check size={15} /> Salvar</button>
                  <button type="button" onClick={() => setEditando(null)} className="inline-flex items-center gap-1 text-muted text-sm hover:text-foreground"><X size={15} /> Cancelar</button>
                </form>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{p.nome}</span>
                    {!p.ativo && <span className="ml-2 text-xs rounded-full bg-muted-bg text-muted px-2 py-0.5">inativo</span>}
                  </div>
                  <button onClick={() => setEditando({ id: p.id, nome: p.nome })} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition"><Pencil size={15} /> Editar</button>
                  <button onClick={() => toggleAtivo(p.id)} className={`inline-flex items-center gap-1 text-sm transition ${p.ativo ? 'text-muted hover:text-danger' : 'text-primary hover:text-primary-hover'}`}><Power size={15} /> {p.ativo ? 'Desativar' : 'Ativar'}</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
