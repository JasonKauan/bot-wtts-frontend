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
}

export interface AuthResponse {
  token: string
  userId: string
  tenantId: string
  role: string
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
