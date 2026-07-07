'use client'
import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '@/context/AuthContext'
import { bloqueiosApi, profissionaisApi } from '@/lib/api'
import type { Bloqueio, Profissional } from '@/lib/types'
import { CalendarOff, Plus, Trash2, Loader2, User } from 'lucide-react'

const inputCls = 'w-full bg-card border border-input rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

export default function FolgasPage() {
  const { token } = useAuth()
  const [itens, setItens] = useState<Bloqueio[]>([])
  const [profs, setProfs] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [descricao, setDescricao] = useState('')
  const [profissionalId, setProfissionalId] = useState('') // '' = estabelecimento inteiro
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function fetchData() {
    if (!token) return
    try {
      const [bloqueios, listaProfs] = await Promise.all([
        bloqueiosApi.list(token),
        profissionaisApi.list(token),
      ])
      setItens(bloqueios)
      setProfs(listaProfs.filter(p => p.ativo))
    }
    catch (err: unknown) { setErro(err instanceof Error ? err.message : 'Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [token]) // eslint-disable-line

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    if (!token || !inicio) return
    setSaving(true); setErro('')
    try {
      await bloqueiosApi.create(token, {
        dataInicio: inicio,
        dataFim: fim || undefined,
        descricao: descricao.trim() || undefined,
        profissionalId: profissionalId || undefined,
      })
      setInicio(''); setFim(''); setDescricao(''); setProfissionalId('')
      fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  async function remover(id: string) {
    if (!token) return
    if (!confirm('Remover esta folga? O bot volta a oferecer esses dias.')) return
    await bloqueiosApi.remove(token, id)
    fetchData()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Folgas e feriados</h1>
      <p className="text-muted text-sm mb-6">Marque os dias em que você não vai atender. O bot deixa de oferecer esses dias automaticamente.</p>

      <form onSubmit={adicionar} className="bg-card border border-border rounded-xl shadow-card p-5 mb-6 max-w-lg space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Do dia</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Até o dia <span className="text-muted font-normal">(opcional)</span></label>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)} className={inputCls} />
          </div>
        </div>
        {profs.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Quem folga?</label>
            <select value={profissionalId} onChange={e => setProfissionalId(e.target.value)} className={inputCls}>
              <option value="">Estabelecimento inteiro</option>
              {profs.map(p => <option key={p.id} value={p.id}>Só {p.nome}</option>)}
            </select>
            <p className="text-xs text-muted mt-1">Folga de um profissional bloqueia só os horários dele — os outros continuam atendendo normalmente.</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Motivo <span className="text-muted font-normal">(opcional)</span></label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: Feriado, Férias" className={inputCls} />
        </div>
        <button type="submit" disabled={saving || !inicio} className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Adicionar folga
        </button>
      </form>

      {erro && <p className="text-danger text-sm mb-4">{erro}</p>}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : itens.length === 0 ? (
        <div className="bg-card border border-border rounded-xl shadow-card p-10 text-center">
          <CalendarOff size={36} className="mx-auto text-muted mb-3" />
          <p className="text-muted">Nenhuma folga marcada. Você atende em todos os dias configurados.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-lg">
          {itens.map(b => (
            <div key={b.id} className="bg-card border border-border rounded-xl shadow-card p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                  {fmtPeriodo(b.dataInicio, b.dataFim)}
                  <span className="inline-flex items-center gap-1 text-xs font-normal rounded-full bg-muted-bg text-muted px-2 py-0.5">
                    <User size={11} /> {b.profissionalNome ?? 'Estabelecimento'}
                  </span>
                </div>
                {b.descricao && <div className="text-xs text-muted mt-0.5">{b.descricao}</div>}
              </div>
              <button onClick={() => remover(b.id)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-danger transition">
                <Trash2 size={16} /> Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function fmtData(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function fmtPeriodo(inicio: string, fim: string): string {
  return inicio === fim ? fmtData(inicio) : `${fmtData(inicio)} até ${fmtData(fim)}`
}
