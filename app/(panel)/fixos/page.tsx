'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { recorrenciasApi, servicosApi, profissionaisApi } from '@/lib/api'
import type { Recorrencia, Servico, Profissional } from '@/lib/types'
import { Repeat, Plus, Trash2, Loader2, Power } from 'lucide-react'

const inputCls = 'w-full bg-card border border-input rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

const FREQUENCIAS = [
  { dias: 7, label: 'Toda semana' },
  { dias: 14, label: 'A cada 15 dias' },
  { dias: 28, label: 'Uma vez por mês' },
]

function freqLabel(dias: number): string {
  return FREQUENCIAS.find(f => f.dias === dias)?.label ?? `a cada ${dias} dias`
}

function fmtData(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function FixosPage() {
  const { token } = useAuth()
  const [itens, setItens] = useState<Recorrencia[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [profs, setProfs] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [profissionalId, setProfissionalId] = useState('')
  const [frequencia, setFrequencia] = useState(7)
  const [hora, setHora] = useState('19:00')
  const [primeiraData, setPrimeiraData] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function fetchData() {
    if (!token) return
    try {
      const [lista, servs, listaProfs] = await Promise.all([
        recorrenciasApi.list(token),
        servicosApi.list(token),
        profissionaisApi.list(token),
      ])
      setItens(lista)
      setServicos(servs.filter(s => s.ativo))
      setProfs(listaProfs.filter(p => p.ativo))
    }
    catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    if (!token || !nome.trim() || !servicoId || !primeiraData) return
    setSaving(true); setErro('')
    try {
      await recorrenciasApi.create(token, {
        clienteNome: nome.trim(),
        clienteTelefone: telefone.trim() || undefined,
        servicoId,
        profissionalId: profissionalId || undefined,
        frequenciaDias: frequencia,
        hora,
        primeiraData,
      })
      setNome(''); setTelefone(''); setPrimeiraData('')
      fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function toggle(id: string) {
    if (!token) return
    await recorrenciasApi.toggleAtivo(token, id)
    fetchData()
  }

  async function remover(id: string) {
    if (!token) return
    if (!confirm('Remover este cliente fixo? Os horários já criados na agenda continuam lá.')) return
    await recorrenciasApi.remove(token, id)
    fetchData()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Clientes fixos</h1>
      <p className="text-muted text-sm mb-6">
        &quot;Toda quinta às 19h&quot;: o sistema renova o horário sozinho, com uma semana de antecedência.
        Se o horário estiver ocupado, você é avisado no WhatsApp.
      </p>

      <form onSubmit={adicionar} className="bg-card border border-border rounded-xl shadow-card p-5 mb-6 max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome do cliente</label>
            <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex.: João" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">WhatsApp <span className="text-muted font-normal">(opcional)</span></label>
            <input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="5511999998888" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Serviço</label>
            <select value={servicoId} onChange={e => setServicoId(e.target.value)} required className={inputCls}>
              <option value="">Escolha...</option>
              {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          {profs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Profissional <span className="text-muted font-normal">(opcional)</span></label>
              <select value={profissionalId} onChange={e => setProfissionalId(e.target.value)} className={inputCls}>
                <option value="">Qualquer um</option>
                {profs.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Repete</label>
            <select value={frequencia} onChange={e => setFrequencia(Number(e.target.value))} className={inputCls}>
              {FREQUENCIAS.map(f => <option key={f.dias} value={f.dias}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Horário</label>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Primeira vez</label>
            <input type="date" value={primeiraData} onChange={e => setPrimeiraData(e.target.value)} required className={inputCls} />
          </div>
        </div>
        <button type="submit" disabled={saving || !nome.trim() || !servicoId || !primeiraData}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Adicionar cliente fixo
        </button>
        <p className="text-xs text-muted">Com o WhatsApp preenchido, o cliente recebe os lembretes e pode remarcar/cancelar pelo bot normalmente.</p>
      </form>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : itens.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center">
          <Repeat size={36} className="mx-auto text-muted mb-3" />
          <p className="text-muted">Nenhum cliente fixo ainda. Cadastre o primeiro acima.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-lg">
          {itens.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl shadow-card p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-foreground">
                  {r.clienteNome}
                  {!r.ativo && <span className="ml-2 text-xs rounded-full bg-muted-bg text-muted px-2 py-0.5">pausado</span>}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {r.servico}{r.profissional ? ` com ${r.profissional}` : ''} · {freqLabel(r.frequenciaDias)} às {r.hora}
                  {r.ativo && <> · próxima: {fmtData(r.proximaData)}</>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => toggle(r.id)} className={`inline-flex items-center gap-1 text-sm transition ${r.ativo ? 'text-muted hover:text-danger' : 'text-primary hover:text-primary-hover'}`}>
                  <Power size={15} /> {r.ativo ? 'Pausar' : 'Retomar'}
                </button>
                <button onClick={() => remover(r.id)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-danger transition">
                  <Trash2 size={15} /> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
