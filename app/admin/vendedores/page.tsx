'use client'
import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { Vendedor } from '@/lib/types'
import { Users, ArrowLeft, Plus, Loader2, Check, Pencil, Power, X } from 'lucide-react'

const inputCls = 'w-full bg-card border border-input rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

export default function VendedoresPage() {
  const { token } = useAuth()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [modalNovo, setModalNovo] = useState(false)
  const [editando, setEditando] = useState<Vendedor | null>(null)

  async function fetchData() {
    if (!token) return
    try { setVendedores(await adminApi.vendedores(token)) }
    catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  async function toggleAtivo(v: Vendedor) {
    if (!token) return
    try {
      await adminApi.editarVendedor(token, v.id, { ativo: !v.ativo })
      setAviso(v.ativo ? 'Vendedor desativado (não loga mais).' : 'Vendedor reativado.')
      setTimeout(() => setAviso(''), 4000)
      fetchData()
    } catch (e: unknown) { setErro(e instanceof Error ? e.message : 'Erro') }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground">
              <Users size={18} />
            </span>
            <div>
              <h1 className="font-bold text-foreground leading-tight">Vendedores</h1>
              <p className="text-xs text-muted">Sua equipe de vendas e as comissões de cada um</p>
            </div>
          </div>
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
            <ArrowLeft size={15} /> Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <button onClick={() => setModalNovo(true)} className="inline-flex items-center gap-1.5 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-lg px-4 py-2 transition">
            <Plus size={15} /> Novo vendedor
          </button>
        </div>

        {erro && <p className="text-danger text-sm mb-4">{erro}</p>}
        {aviso && <p className="text-primary text-sm mb-4 flex items-center gap-1"><Check size={15} /> {aviso}</p>}

        {loading ? (
          <p className="text-muted">Carregando...</p>
        ) : vendedores.length === 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center">
            <Users size={36} className="mx-auto text-muted mb-3" />
            <p className="text-foreground font-medium">Nenhum vendedor ainda</p>
            <p className="text-muted text-sm mt-1">Crie o primeiro — ele loga no mesmo /admin e vê só os clientes dele.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendedores.map(v => (
              <div key={v.id} className={`bg-card border border-border rounded-xl shadow-card p-4 flex items-center justify-between gap-4 flex-wrap ${!v.ativo ? 'opacity-60' : ''}`}>
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{v.nome || v.email}</div>
                  <div className="text-xs text-muted">{v.email}</div>
                </div>
                <span className="text-sm font-semibold text-primary whitespace-nowrap">{Number(v.comissaoPct).toFixed(0)}% de comissão</span>
                {!v.ativo && <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-danger-subtle text-danger">desativado</span>}
                <div className="flex gap-2">
                  <button onClick={() => setEditando(v)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition"><Pencil size={15} /> Editar</button>
                  <button onClick={() => toggleAtivo(v)} className={`inline-flex items-center gap-1 text-sm transition ${v.ativo ? 'text-muted hover:text-danger' : 'text-primary'}`}>
                    <Power size={15} /> {v.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalNovo && token && (
        <VendedorModal
          token={token}
          onClose={() => setModalNovo(false)}
          onDone={() => { setModalNovo(false); fetchData() }}
        />
      )}
      {editando && token && (
        <VendedorModal
          token={token}
          vendedor={editando}
          onClose={() => setEditando(null)}
          onDone={() => { setEditando(null); fetchData() }}
        />
      )}
    </div>
  )
}

function VendedorModal({ token, vendedor, onClose, onDone }: {
  token: string; vendedor?: Vendedor; onClose: () => void; onDone: () => void
}) {
  const editar = !!vendedor
  const [nome, setNome] = useState(vendedor?.nome ?? '')
  const [email, setEmail] = useState(vendedor?.email ?? '')
  const [senha, setSenha] = useState('')
  const [pct, setPct] = useState(vendedor ? String(vendedor.comissaoPct) : '20')
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSaving(true); setErro('')
    const comissaoPct = Number(pct.replace(',', '.'))
    try {
      if (editar && vendedor) {
        await adminApi.editarVendedor(token, vendedor.id, {
          nome: nome.trim() || undefined,
          comissaoPct: isNaN(comissaoPct) ? undefined : comissaoPct,
          senha: senha.trim() || undefined,
        })
      } else {
        await adminApi.criarVendedor(token, { nome: nome.trim(), email: email.trim(), senha, comissaoPct })
      }
      onDone()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-card p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">{editar ? 'Editar vendedor' : 'Novo vendedor'}</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
        </div>
        <form onSubmit={salvar} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required={!editar} className={inputCls} />
          </div>
          {!editar && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail (login dele)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {editar ? 'Nova senha (deixe vazio pra manter)' : 'Senha (mín. 8 caracteres)'}
            </label>
            <input value={senha} onChange={e => setSenha(e.target.value)} required={!editar} minLength={editar ? undefined : 8} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Comissão por venda (%)</label>
            <input value={pct} onChange={e => setPct(e.target.value)} required className={`w-28 ${inputCls}`} />
            <p className="text-xs text-muted mt-1">Ex.: 20 → Plano PRO (R$129) rende R$25,80 pro vendedor. Você pode mudar quando quiser.</p>
          </div>
          {erro && <p className="text-danger text-sm">{erro}</p>}
          <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Salvando...' : editar ? 'Salvar alterações' : 'Criar vendedor'}
          </button>
        </form>
      </div>
    </div>
  )
}
