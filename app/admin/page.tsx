'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { ClienteResumo, PlanoNome, PlanoPayload } from '@/lib/types'
import {
  ShieldCheck, Search, LogOut, RefreshCw, Loader2, Check, X,
  UserPlus, CreditCard, KeyRound, Ban, Power, Copy,
} from 'lucide-react'

const inputCls =
  'w-full bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

export default function AdminPage() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')

  const [modalCriar, setModalCriar] = useState(false)
  const [planoDe, setPlanoDe] = useState<ClienteResumo | null>(null)
  const [senhaResult, setSenhaResult] = useState<{ nome: string; senha: string } | null>(null)

  async function fetchData() {
    if (!token) return
    setLoading(true); setErro('')
    try {
      setClientes(await adminApi.clientes(token))
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  function sair() {
    logout()
    router.push('/admin/login')
  }

  async function resetarSenha(c: ClienteResumo) {
    if (!token) return
    if (!confirm(`Gerar uma nova senha para "${c.nome}"? A senha atual deixa de funcionar.`)) return
    try {
      const r = await adminApi.resetarSenha(token, c.id)
      if (r.senhaProvisoria) setSenhaResult({ nome: c.nome, senha: r.senhaProvisoria })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao resetar senha')
    }
  }

  async function toggleAtivo(c: ClienteResumo) {
    if (!token) return
    const acao = c.ativo ? 'suspender' : 'reativar'
    if (!confirm(`Confirmar ${acao} "${c.nome}"?${c.ativo ? ' O painel fica bloqueado e o bot para de responder.' : ''}`)) return
    try {
      if (c.ativo) await adminApi.suspender(token, c.id)
      else await adminApi.reativar(token, c.id)
      fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro')
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(c =>
      c.nome?.toLowerCase().includes(q) ||
      c.emailDono?.toLowerCase().includes(q) ||
      c.telefoneWhatsapp?.toLowerCase().includes(q))
  }, [clientes, busca])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h1 className="font-bold text-foreground leading-tight">AgendaBot — Admin</h1>
              <p className="text-xs text-muted">Back-office</p>
            </div>
          </div>
          <button onClick={sair} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition">
            <LogOut size={15} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <h2 className="text-xl font-bold text-foreground">
            Clientes <span className="text-muted font-normal text-base">({filtrados.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar nome, e-mail, telefone"
                className="w-56 bg-card border border-input rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
            <button onClick={fetchData} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground border border-border rounded-lg px-3 py-2 transition">
              <RefreshCw size={15} /> Atualizar
            </button>
            <button onClick={() => setModalCriar(true)} className="inline-flex items-center gap-1.5 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg px-3 py-2 transition">
              <UserPlus size={15} /> Novo cliente
            </button>
          </div>
        </div>

        {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

        {loading ? (
          <p className="text-muted">Carregando...</p>
        ) : filtrados.length === 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center text-muted">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="font-medium px-4 py-3">Cliente</th>
                    <th className="font-medium px-4 py-3">Plano</th>
                    <th className="font-medium px-4 py-3">Status</th>
                    <th className="font-medium px-4 py-3">WhatsApp</th>
                    <th className="font-medium px-4 py-3">Criado</th>
                    <th className="font-medium px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(c => (
                    <tr key={c.id} className={`border-b border-border last:border-0 ${!c.ativo ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{c.nome}</div>
                        <div className="text-xs text-muted">{c.emailDono ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3"><PlanoBadge plano={c.plano} /></td>
                      <td className="px-4 py-3"><StatusBadge c={c} /></td>
                      <td className="px-4 py-3"><WhatsAppCell token={token} id={c.id} /></td>
                      <td className="px-4 py-3 text-muted">{fmtData(c.criadoEm)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn title="Plano" onClick={() => setPlanoDe(c)}><CreditCard size={15} /></IconBtn>
                          <IconBtn title="Resetar senha" onClick={() => resetarSenha(c)}><KeyRound size={15} /></IconBtn>
                          <IconBtn
                            title={c.ativo ? 'Suspender' : 'Reativar'}
                            danger={c.ativo}
                            onClick={() => toggleAtivo(c)}
                          >
                            {c.ativo ? <Ban size={15} /> : <Power size={15} />}
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {modalCriar && (
        <CriarClienteModal
          token={token}
          onClose={() => setModalCriar(false)}
          onDone={(senha, nome) => {
            setModalCriar(false)
            if (senha) setSenhaResult({ nome, senha })
            fetchData()
          }}
        />
      )}

      {planoDe && (
        <PlanoModal
          token={token}
          cliente={planoDe}
          onClose={() => setPlanoDe(null)}
          onDone={() => { setPlanoDe(null); fetchData() }}
        />
      )}

      {senhaResult && (
        <SenhaModal nome={senhaResult.nome} senha={senhaResult.senha} onClose={() => setSenhaResult(null)} />
      )}
    </div>
  )
}

// ── Componentes ────────────────────────────────────────────────────────────

function IconBtn({ children, title, onClick, danger }: {
  children: React.ReactNode; title: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`grid place-items-center h-8 w-8 rounded-lg border border-border transition ${danger ? 'text-muted hover:text-danger hover:border-danger' : 'text-muted hover:text-primary hover:border-primary'}`}
    >
      {children}
    </button>
  )
}

function PlanoBadge({ plano }: { plano: PlanoNome }) {
  const cor = plano === 'TRIAL' ? 'bg-muted-bg text-muted' : 'bg-primary-subtle text-primary'
  return <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${cor}`}>{plano}</span>
}

function StatusBadge({ c }: { c: ClienteResumo }) {
  if (!c.ativo) return <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-danger-subtle text-danger">suspenso</span>
  if (c.vencido) return <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-danger-subtle text-danger">vencido</span>
  const limite = c.plano === 'TRIAL' ? c.trialExpiraEm : c.assinaturaExpiraEm
  const label = c.plano === 'TRIAL' ? 'trial' : 'ativo'
  return (
    <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-primary-subtle text-primary" title={limite ? `até ${fmtData(limite)}` : undefined}>
      {label}{limite ? ` · ${fmtData(limite)}` : ''}
    </span>
  )
}

/** Status do WhatsApp carregado sob demanda por linha (1 chamada à Evolution). */
function WhatsAppCell({ token, id }: { token: string | null; id: string }) {
  const [estado, setEstado] = useState<'loading' | 'on' | 'off'>('loading')
  useEffect(() => {
    let vivo = true
    if (!token) return
    adminApi.whatsapp(token, id)
      .then(r => { if (vivo) setEstado(r.conectado ? 'on' : 'off') })
      .catch(() => { if (vivo) setEstado('off') })
    return () => { vivo = false }
  }, [token, id])

  if (estado === 'loading') return <Loader2 size={15} className="animate-spin text-muted" />
  return estado === 'on'
    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><Check size={14} /> conectado</span>
    : <span className="inline-flex items-center gap-1 text-xs font-medium text-muted"><X size={14} /> desconectado</span>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-card p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function CriarClienteModal({ token, onClose, onDone }: {
  token: string | null; onClose: () => void; onDone: (senha: string | null, nome: string) => void
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [trialDias, setTrialDias] = useState(14)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true); setErro('')
    try {
      const r = await adminApi.criarCliente(token, {
        nome: nome.trim(), email: email.trim(),
        telefone: telefone.trim() || undefined,
        senha: senha.trim() || undefined,
        trialDias,
      })
      onDone(r.senhaProvisoria, nome.trim())
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao criar cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Novo cliente" onClose={onClose}>
      <form onSubmit={salvar} className="space-y-3">
        <Campo label="Nome do estabelecimento"><input className={inputCls} value={nome} onChange={e => setNome(e.target.value)} required /></Campo>
        <Campo label="E-mail do dono"><input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} required /></Campo>
        <Campo label="Telefone (opcional)"><input className={inputCls} value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="55DDDNUMERO" /></Campo>
        <Campo label="Senha do dono (vazio = gerar automática)"><input className={inputCls} value={senha} onChange={e => setSenha(e.target.value)} placeholder="deixe vazio para gerar" /></Campo>
        <Campo label="Dias de trial"><input type="number" min={1} className={inputCls} value={trialDias} onChange={e => setTrialDias(Number(e.target.value))} /></Campo>

        {erro && <p className="text-danger text-sm">{erro}</p>}
        <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Criando...' : 'Criar cliente'}
        </button>
      </form>
    </Modal>
  )
}

function PlanoModal({ token, cliente, onClose, onDone }: {
  token: string | null; cliente: ClienteResumo; onClose: () => void; onDone: () => void
}) {
  const [plano, setPlano] = useState<PlanoNome>(cliente.plano === 'TRIAL' ? 'BASICO' : cliente.plano)
  const [modo, setModo] = useState<'meses' | 'dias' | 'data'>('meses')
  const [meses, setMeses] = useState(1)
  const [dias, setDias] = useState(30)
  const [data, setData] = useState('')
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)

  async function salvar() {
    if (!token) return
    setSaving(true); setErro('')
    const body: PlanoPayload =
      modo === 'meses' ? { plano, modo, meses }
      : modo === 'dias' ? { plano, modo, dias }
      : { plano, modo, data }
    try {
      await adminApi.alterarPlano(token, cliente.id, body)
      onDone()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao alterar plano')
      setSaving(false)
    }
  }

  const planos: PlanoNome[] = ['TRIAL', 'BASICO', 'PRO', 'PLUS']
  const modos: Array<{ k: 'meses' | 'dias' | 'data'; t: string }> = [
    { k: 'meses', t: 'Meses' }, { k: 'data', t: 'Data' }, { k: 'dias', t: 'Dias' },
  ]

  return (
    <Modal title={`Plano — ${cliente.nome}`} onClose={onClose}>
      <div className="space-y-4">
        <Campo label="Plano">
          <div className="flex gap-2 flex-wrap">
            {planos.map(p => (
              <button key={p} onClick={() => setPlano(p)} className={`text-sm rounded-lg px-3 py-1.5 border transition ${plano === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted hover:text-foreground'}`}>{p}</button>
            ))}
          </div>
        </Campo>

        <Campo label="Validade">
          <div className="flex gap-2 mb-3">
            {modos.map(m => (
              <button key={m.k} onClick={() => setModo(m.k)} className={`text-sm rounded-lg px-3 py-1.5 border transition ${modo === m.k ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted hover:text-foreground'}`}>{m.t}</button>
            ))}
          </div>

          {modo === 'meses' && (
            <div className="flex gap-2">
              {[1, 3, 12].map(n => (
                <button key={n} onClick={() => setMeses(n)} className={`flex-1 text-sm rounded-lg px-3 py-2 border transition ${meses === n ? 'bg-primary-subtle text-primary border-primary' : 'border-border text-muted hover:text-foreground'}`}>+{n} {n === 1 ? 'mês' : 'meses'}</button>
              ))}
            </div>
          )}
          {modo === 'dias' && (
            <div className="flex items-center gap-2">
              <input type="number" min={1} className={`w-28 ${inputCls}`} value={dias} onChange={e => setDias(Number(e.target.value))} />
              <span className="text-sm text-muted">dias a partir do vencimento atual</span>
            </div>
          )}
          {modo === 'data' && (
            <input type="date" className={inputCls} value={data} onChange={e => setData(e.target.value)} />
          )}
          <p className="text-xs text-muted mt-2">Estender soma ao tempo que ainda resta; se já venceu, conta a partir de hoje.</p>
        </Campo>

        {erro && <p className="text-danger text-sm">{erro}</p>}
        <button onClick={salvar} disabled={saving || (modo === 'data' && !data)} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Salvando...' : 'Aplicar'}
        </button>
      </div>
    </Modal>
  )
}

function SenhaModal({ nome, senha, onClose }: { nome: string; senha: string; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false)
  function copiar() {
    navigator.clipboard?.writeText(senha).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500) })
  }
  return (
    <Modal title="Senha provisória" onClose={onClose}>
      <p className="text-sm text-muted mb-3">Repasse esta senha para o dono de <span className="text-foreground font-medium">{nome}</span>. Ela não será mostrada de novo.</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-muted-bg rounded-lg px-3 py-2.5 text-base font-mono text-foreground tracking-wide">{senha}</code>
        <button onClick={copiar} className="inline-flex items-center gap-1.5 text-sm border border-border rounded-lg px-3 py-2.5 text-muted hover:text-foreground transition">
          {copiado ? <Check size={15} /> : <Copy size={15} />} {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <button onClick={onClose} className="w-full mt-4 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-2.5 rounded-lg transition">Pronto</button>
    </Modal>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function fmtData(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}
