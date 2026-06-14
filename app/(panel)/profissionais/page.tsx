'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { profissionaisApi } from '@/lib/api'
import type { Profissional } from '@/lib/types'

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
      setNovoNome('')
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
      await profissionaisApi.update(token, editando.id, editando.nome.trim())
      setEditando(null)
      fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setSaving(false) }
  }

  async function toggleAtivo(id: string) {
    if (!token) return
    await profissionaisApi.toggleAtivo(token, id)
    fetchData()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profissionais</h1>

      {/* Formulário novo */}
      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex gap-3">
        <input
          value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          placeholder="Nome do profissional"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>

      {erro && <p className="text-red-500 text-sm mb-4">{erro}</p>}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : profs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Nenhum profissional cadastrado.
        </div>
      ) : (
        <div className="space-y-3">
          {profs.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              {editando?.id === p.id ? (
                <form onSubmit={handleUpdate} className="flex gap-2 flex-1">
                  <input
                    value={editando.nome}
                    onChange={e => setEditando({ ...editando, nome: e.target.value })}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <button type="submit" disabled={saving} className="text-green-600 text-sm font-medium">Salvar</button>
                  <button type="button" onClick={() => setEditando(null)} className="text-gray-400 text-sm">Cancelar</button>
                </form>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{p.nome}</span>
                    {!p.ativo && <span className="ml-2 text-xs text-gray-400">(inativo)</span>}
                  </div>
                  <button onClick={() => setEditando({ id: p.id, nome: p.nome })} className="text-sm text-blue-500 hover:text-blue-700">Editar</button>
                  <button onClick={() => toggleAtivo(p.id)} className={`text-sm ${p.ativo ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}>
                    {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
