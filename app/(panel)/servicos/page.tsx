'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { servicosApi } from '@/lib/api'
import type { Servico } from '@/lib/types'
import { Plus, Pencil, Power, Check, X } from 'lucide-react'

/** "40" ou "40,50" → número; vazio/inválido → null (sem preço). */
function parsePreco(txt: string): number | null {
  const n = Number(txt.trim().replace(',', '.'))
  return txt.trim() === '' || isNaN(n) || n < 0 ? null : n
}

export default function ServicosPage() {
  const { token } = useAuth()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [novoDuracao, setNovoDuracao] = useState(30)
  const [novoPreco, setNovoPreco] = useState('')
  const [editando, setEditando] = useState<{ id: string; nome: string; duracao: number; preco: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function fetchData() {
    if (!token) return
    try { setServicos(await servicosApi.list(token)) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !novoNome.trim()) return
    setSaving(true); setErro('')
    try {
      await servicosApi.create(token, novoNome.trim(), novoDuracao, parsePreco(novoPreco))
      setNovoNome(''); setNovoDuracao(30); setNovoPreco('')
      fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setSaving(false) }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editando) return
    setSaving(true); setErro('')
    try {
      await servicosApi.update(token, editando.id, editando.nome, editando.duracao, parsePreco(editando.preco))
      setEditando(null); fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setSaving(false) }
  }

  async function toggleAtivo(id: string) {
    if (!token) return
    await servicosApi.toggleAtivo(token, id)
    fetchData()
  }

  const inputCls = 'bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Serviços</h1>

      <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl shadow-card p-5 mb-6 flex gap-3 flex-wrap items-center">
        <input value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do serviço" className={`flex-1 min-w-[180px] ${inputCls}`} />
        <div className="flex items-center gap-2">
          <input type="number" min={1} value={novoDuracao} onChange={e => setNovoDuracao(Number(e.target.value))} className={`w-20 ${inputCls}`} />
          <span className="text-sm text-muted">min</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">R$</span>
          <input value={novoPreco} onChange={e => setNovoPreco(e.target.value)} placeholder="preço (opcional)" className={`w-32 ${inputCls}`} />
        </div>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm px-4 py-2 rounded-lg transition disabled:opacity-50">
          <Plus size={16} /> Adicionar
        </button>
      </form>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : servicos.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center text-muted">Nenhum serviço cadastrado.</div>
      ) : (
        <div className="space-y-3">
          {servicos.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl shadow-card p-4 flex items-center justify-between gap-4">
              {editando?.id === s.id ? (
                <form onSubmit={handleUpdate} className="flex gap-2 flex-1 flex-wrap items-center">
                  <input value={editando.nome} onChange={e => setEditando({ ...editando, nome: e.target.value })} className={`flex-1 min-w-[120px] ${inputCls} py-1.5`} />
                  <input type="number" min={1} value={editando.duracao} onChange={e => setEditando({ ...editando, duracao: Number(e.target.value) })} className={`w-16 ${inputCls} py-1.5`} />
                  <span className="text-xs text-muted">min</span>
                  <span className="text-xs text-muted">R$</span>
                  <input value={editando.preco} onChange={e => setEditando({ ...editando, preco: e.target.value })} placeholder="preço" className={`w-20 ${inputCls} py-1.5`} />
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-1 text-primary text-sm font-medium"><Check size={15} /> Salvar</button>
                  <button type="button" onClick={() => setEditando(null)} className="inline-flex items-center gap-1 text-muted text-sm hover:text-foreground"><X size={15} /> Cancelar</button>
                </form>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{s.nome}</span>
                    <span className="ml-2 text-xs text-muted">{s.duracaoMinutos} min</span>
                    {s.preco != null && <span className="ml-2 text-xs font-medium text-primary">R$ {Number(s.preco).toFixed(2).replace('.', ',')}</span>}
                    {!s.ativo && <span className="ml-2 text-xs rounded-full bg-muted-bg text-muted px-2 py-0.5">inativo</span>}
                  </div>
                  <button onClick={() => setEditando({ id: s.id, nome: s.nome, duracao: s.duracaoMinutos, preco: s.preco != null ? String(s.preco) : '' })} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition"><Pencil size={15} /> Editar</button>
                  <button onClick={() => toggleAtivo(s.id)} className={`inline-flex items-center gap-1 text-sm transition ${s.ativo ? 'text-muted hover:text-danger' : 'text-primary hover:text-primary-hover'}`}><Power size={15} /> {s.ativo ? 'Desativar' : 'Ativar'}</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
