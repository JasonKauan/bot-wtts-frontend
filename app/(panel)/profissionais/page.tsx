'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { profissionaisApi } from '@/lib/api'
import type { Profissional } from '@/lib/types'
import { Plus, Pencil, Power, Check, X, Clock, Loader2 } from 'lucide-react'

const inputCls = 'bg-card border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition'

// ISO: 1=segunda ... 7=domingo
const DIAS: Array<{ iso: number; label: string }> = [
  { iso: 1, label: 'Seg' }, { iso: 2, label: 'Ter' }, { iso: 3, label: 'Qua' },
  { iso: 4, label: 'Qui' }, { iso: 5, label: 'Sex' }, { iso: 6, label: 'Sáb' }, { iso: 7, label: 'Dom' },
]

function parseDias(s: string | null): number[] {
  if (!s) return []
  return s.split(',').map(p => Number(p.trim())).filter(n => n >= 1 && n <= 7)
}

/** "Seg, Ter, Qua · 9h às 18h · almoço 12h–13h" */
function resumoGrade(p: Profissional): string {
  const dias = parseDias(p.diasTrabalho).map(n => DIAS.find(d => d.iso === n)?.label).filter(Boolean)
  let s = `${dias.join(', ')} · ${p.horarioAbertura}h às ${p.horarioFechamento}h`
  if (p.almocoInicio != null && p.almocoFim != null) s += ` · almoço ${p.almocoInicio}h–${p.almocoFim}h`
  return s
}

interface GradeForm {
  propria: boolean
  dias: number[]
  abertura: number
  fechamento: number
  temAlmoco: boolean
  almocoInicio: number
  almocoFim: number
}

function gradeInicial(p: Profissional): GradeForm {
  const propria = p.horarioAbertura != null
  return {
    propria,
    dias: propria ? parseDias(p.diasTrabalho) : [1, 2, 3, 4, 5, 6],
    abertura: p.horarioAbertura ?? 8,
    fechamento: p.horarioFechamento ?? 18,
    temAlmoco: p.almocoInicio != null && p.almocoFim != null,
    almocoInicio: p.almocoInicio ?? 12,
    almocoFim: p.almocoFim ?? 13,
  }
}

export default function ProfissionaisPage() {
  const { token } = useAuth()
  const [profs, setProfs] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null)
  const [gradeDe, setGradeDe] = useState<string | null>(null) // id do prof com editor de horários aberto
  const [grade, setGrade] = useState<GradeForm | null>(null)
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
      await profissionaisApi.create(token, { nome: novoNome.trim() })
      setNovoNome(''); fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setSaving(false) }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !editando) return
    const p = profs.find(x => x.id === editando.id)
    if (!p) return
    setSaving(true); setErro('')
    try {
      // Mantém a grade atual — aqui só muda o nome.
      await profissionaisApi.update(token, editando.id, {
        nome: editando.nome.trim(),
        horarioAbertura: p.horarioAbertura, horarioFechamento: p.horarioFechamento,
        almocoInicio: p.almocoInicio, almocoFim: p.almocoFim, diasTrabalho: p.diasTrabalho,
      })
      setEditando(null); fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setSaving(false) }
  }

  function abrirGrade(p: Profissional) {
    setEditando(null)
    setGradeDe(p.id)
    setGrade(gradeInicial(p))
    setErro('')
  }

  async function handleSalvarGrade(p: Profissional) {
    if (!token || !grade) return
    if (grade.propria && grade.dias.length === 0) { setErro('Selecione ao menos um dia de trabalho.'); return }
    setSaving(true); setErro('')
    try {
      await profissionaisApi.update(token, p.id, grade.propria ? {
        nome: p.nome,
        horarioAbertura: grade.abertura,
        horarioFechamento: grade.fechamento,
        almocoInicio: grade.temAlmoco ? grade.almocoInicio : null,
        almocoFim: grade.temAlmoco ? grade.almocoFim : null,
        diasTrabalho: grade.dias.join(','),
      } : { nome: p.nome })
      setGradeDe(null); setGrade(null); fetchData()
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro')
    } finally { setSaving(false) }
  }

  function toggleDia(iso: number) {
    setGrade(g => g ? { ...g, dias: g.dias.includes(iso) ? g.dias.filter(x => x !== iso) : [...g.dias, iso].sort((a, b) => a - b) } : g)
  }

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
            <div key={p.id} className="bg-card border border-border rounded-xl shadow-card p-4">
              <div className="flex items-center justify-between gap-4">
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
                      <p className="text-xs text-muted mt-0.5">
                        {p.horarioAbertura != null ? resumoGrade(p) : 'Segue o horário do estabelecimento'}
                      </p>
                    </div>
                    <button onClick={() => (gradeDe === p.id ? setGradeDe(null) : abrirGrade(p))} className={`inline-flex items-center gap-1 text-sm transition ${gradeDe === p.id ? 'text-primary' : 'text-muted hover:text-foreground'}`}><Clock size={15} /> Horários</button>
                    <button onClick={() => { setGradeDe(null); setEditando({ id: p.id, nome: p.nome }) }} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition"><Pencil size={15} /> Editar</button>
                    <button onClick={async () => { if (token) { await profissionaisApi.toggleAtivo(token, p.id); fetchData() } }} className={`inline-flex items-center gap-1 text-sm transition ${p.ativo ? 'text-muted hover:text-danger' : 'text-primary hover:text-primary-hover'}`}><Power size={15} /> {p.ativo ? 'Desativar' : 'Ativar'}</button>
                  </>
                )}
              </div>

              {gradeDe === p.id && grade && (
                <div className="mt-4 border-t border-border pt-4 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={grade.propria} onChange={e => setGrade({ ...grade, propria: e.target.checked })} className="accent-primary mt-1 h-4 w-4" />
                    <span>
                      <span className="block text-sm font-medium text-foreground">Tem horário próprio</span>
                      <span className="block text-xs text-muted mt-0.5">
                        Desligado: {p.nome.split(' ')[0]} atende nos mesmos dias e horários do estabelecimento.<br />
                        Ligado: você escolhe os dias e horários só dele(a) — o bot oferece apenas esses horários.
                      </span>
                    </span>
                  </label>

                  {grade.propria && (
                    <div className="space-y-4 pl-7">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Dias de trabalho</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {DIAS.map(d => (
                            <button key={d.iso} type="button" onClick={() => toggleDia(d.iso)}
                              className={`text-sm rounded-lg px-3 py-1.5 border transition ${grade.dias.includes(d.iso) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted hover:text-foreground'}`}>
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 max-w-xs">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Começa (h)</label>
                          <input type="number" min={0} max={23} value={grade.abertura} onChange={e => setGrade({ ...grade, abertura: Number(e.target.value) })} className={`w-full ${inputCls}`} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">Termina (h)</label>
                          <input type="number" min={1} max={24} value={grade.fechamento} onChange={e => setGrade({ ...grade, fechamento: Number(e.target.value) })} className={`w-full ${inputCls}`} />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2 cursor-pointer">
                          <input type="checkbox" checked={grade.temAlmoco} onChange={e => setGrade({ ...grade, temAlmoco: e.target.checked })} className="accent-primary" />
                          Intervalo de almoço
                        </label>
                        {grade.temAlmoco && (
                          <div className="grid grid-cols-2 gap-4 max-w-xs pl-6">
                            <div>
                              <label className="block text-xs text-muted mb-1">Início (h)</label>
                              <input type="number" min={0} max={24} value={grade.almocoInicio} onChange={e => setGrade({ ...grade, almocoInicio: Number(e.target.value) })} className={`w-full ${inputCls}`} />
                            </div>
                            <div>
                              <label className="block text-xs text-muted mb-1">Fim (h)</label>
                              <input type="number" min={0} max={24} value={grade.almocoFim} onChange={e => setGrade({ ...grade, almocoFim: Number(e.target.value) })} className={`w-full ${inputCls}`} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => handleSalvarGrade(p)} disabled={saving} className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Salvar horários
                    </button>
                    <button onClick={() => { setGradeDe(null); setGrade(null) }} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition"><X size={15} /> Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
