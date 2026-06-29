export interface Agendamento {
  id: string
  clienteNome: string
  clienteTelefone: string
  servico: string
  profissional: string | null
  dataHora: string
  status: 'CONFIRMADO' | 'CANCELADO' | 'PENDENTE'
}

export interface DashboardData {
  agendamentos: Agendamento[]
  pendentes: number
}

export interface Profissional {
  id: string
  nome: string
  ativo: boolean
  criadoEm: string
}

export interface Servico {
  id: string
  nome: string
  duracaoMinutos: number
  ativo: boolean
  criadoEm: string
}

export interface Configuracao {
  id: string
  nome: string
  telefoneWhatsapp: string
  horarioAbertura: number
  horarioFechamento: number
  intervaloMinutos: number
  almocoInicio: number | null
  almocoFim: number | null
  diasFuncionamento: string // ISO "1,2,3,4,5,6,7"
  aprovacaoManual: boolean
}

export interface Bloqueio {
  id: string
  dataInicio: string // yyyy-mm-dd
  dataFim: string
  descricao: string | null
}

export interface ConfiguracaoPayload {
  nome: string
  horarioAbertura: number
  horarioFechamento: number
  intervaloMinutos: number
  almocoInicio: number | null
  almocoFim: number | null
  diasFuncionamento: string
  aprovacaoManual: boolean
}

export interface AuthResponse {
  token: string
  userId: string
  tenantId: string
  role: string
}

// ── Admin / back-office ──────────────────────────────────────────────────────
export type PlanoNome = 'TRIAL' | 'BASICO' | 'PRO' | 'PLUS'

export interface ClienteResumo {
  id: string
  nome: string
  telefoneWhatsapp: string | null
  emailDono: string | null
  plano: PlanoNome
  ativo: boolean
  vencido: boolean
  trialExpiraEm: string | null
  assinaturaExpiraEm: string | null
  criadoEm: string
}

export interface CriarClientePayload {
  nome: string
  email: string
  telefone?: string
  senha?: string
  trialDias?: number
}

export interface PlanoPayload {
  plano: PlanoNome
  modo: 'meses' | 'dias' | 'data'
  meses?: number
  dias?: number
  data?: string // yyyy-mm-dd
}

/** senhaProvisoria vem preenchida só quando o sistema gerou a senha (pra repassar). */
export interface SenhaResponse {
  id: string
  senhaProvisoria: string | null
}

export interface AuditoriaItem {
  adminEmail: string | null
  acao: string
  tenantNome: string | null
  detalhe: string | null
  criadoEm: string
}

// ── Assinatura (Iteração 6) ──────────────────────────────────────────────────
export interface AssinaturaStatus {
  plano: 'TRIAL' | 'BASICO' | 'PRO' | 'PLUS'
  valorMensal: number
  expiraEm: string | null
  diasRestantes: number
  vencida: boolean
  avisoTrial: boolean
}

export interface PixGerado {
  pagamentoId: string
  valor: number
  qrCode: string | null
  qrCodeBase64: string | null
  ticketUrl: string | null
}

export interface PagamentoStatus {
  id: string
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO'
  plano: string
  valor: number
}
