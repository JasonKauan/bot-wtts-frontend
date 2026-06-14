'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { servicosApi } from '@/lib/api'
import type { Servico } from '@/lib/types'

export default function ServicosPage() {
  const { token } = useAuth()
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [novoDuracao, setNovoDuracao] = useState(30)
  const [editando, setEditando] = useState<{ id: string; nome: string; duracao: number } | null>(null)
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
      await servicosApi.create(token, novoNome.trim(), novoDuracao)
      setNovoNome(''); setNovoDuracao(30)
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
      await servicosApi.update(token, editando.id, editando.nome, editando.duracao)
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Serviços</h1>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex gap-3 flex-wrap">
        <input
          value={novoNome}
          onChange={e => setNovoNome(e.target.value)}
          placeholder="Nome do serviço"
          className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={novoDuracao}
            onChange={e => setNovoDuracao(Number(e.target.value))}
            className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="text-sm text-gray-500">min</span>
        </div>
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
      ) : servicos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Nenhum serviço cadastrado.
        </div>
      ) : (
        <div className="space-y-3">
          {servicos.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              {editando?.id === s.id ? (
                <form onSubmit={handleUpdate} className="flex gap-2 flex-1 flex-wrap items-center">
                  <input
                    value={editando.nome}
                    onChange={e => setEditando({ ...editando, nome: e.target.value })}
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm min-w-[120px]"
                  />
                  <input
                    type="number"
                    min={1}
                    value={editando.duracao}
                    onChange={e => setEditando({ ...editando, duracao: Number(e.target.value) })}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-400">min</span>
                  <button type="submit" disabled={saving} className="text-green-600 text-sm font-medium">Salvar</button>
                  <button type="button" onClick={() => setEditando(null)} className="text-gray-400 text-sm">Cancelar</button>
                </form>
              ) : (
                <>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{s.nome}</span>
                    <span className="ml-2 text-xs text-gray-400">{s.duracaoMinutos} min</span>
                    {!s.ativo && <span className="ml-2 text-xs text-gray-400">(inativo)</span>}
                  </div>
                  <button onClick={() => setEditando({ id: s.id, nome: s.nome, duracao: s.duracaoMinutos })} className="text-sm text-blue-500 hover:text-blue-700">Editar</button>
                  <button onClick={() => toggleAtivo(s.id)} className={`text-sm ${s.ativo ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}>
                    {s.ativo ? 'Desativar' : 'Ativar'}
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
