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
  botAgendamentos30d: number
  botReceita30d: number
}

// ── Test-drive do bot / conversas ────────────────────────────────────────────
export interface RespostaSimulada {
  texto: string
  paraDono: boolean
}

export interface ConversaResumo {
  telefone: string
  clienteNome: string | null
  ultimaMensagem: string
  deCliente: boolean
  em: string
  mensagens: number
}

export interface MensagemBot {
  deCliente: boolean
  texto: string
  em: string
}

export interface Profissional {
  id: string
  nome: string
  ativo: boolean
  criadoEm: string
  // Grade própria (nulos = segue o horário do estabelecimento)
  horarioAbertura: number | null
  horarioFechamento: number | null
  almocoInicio: number | null
  almocoFim: number | null
  diasTrabalho: string | null // ISO "1,2,...,7"
}

export interface ProfissionalPayload {
  nome: string
  horarioAbertura?: number | null
  horarioFechamento?: number | null
  almocoInicio?: number | null
  almocoFim?: number | null
  diasTrabalho?: string | null
}

export interface Servico {
  id: string
  nome: string
  duracaoMinutos: number
  preco: number | null
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
  antecedenciaMinHoras: number
  resumoDiario: boolean
  faltasParaAprovacao: number // 0 = escudo anti-faltão desligado
  permiteCombo: boolean
  // Recursos Diamond
  paginaPublica: boolean
  slug: string | null
  reativacaoDias: number // 0 = desligado
  reativacaoMsg: string | null
  aniversarioAtivo: boolean
  aniversarioMsg: string | null
  nivelPlano: number // 1=Gold 2=Platinum 3=Diamond/Trial
}

export interface ClienteCrm {
  nome: string
  telefone: string
  visitas: number
  faltas: number
  ultimaVisita: string | null
  proximoAgendamento: string | null
  aniversario: string | null // "dd/mm" (Diamond)
}

export interface ServicoContagem {
  servico: string
  total: number
}

export interface FaturamentoLinha {
  nome: string
  atendimentos: number
  receita: number
}

export interface Relatorio {
  proximos7Dias: number
  realizados30Dias: number
  faltas30Dias: number
  cancelados30Dias: number
  taxaFaltaPct: number
  servicosTop: ServicoContagem[]
  receita30Dias: number
  receitaPorServico: FaturamentoLinha[]
  receitaPorProfissional: FaturamentoLinha[]
  financeiroLiberado: boolean // false = plano sem o recurso (mostrar upgrade)
}

export interface Bloqueio {
  id: string
  dataInicio: string // yyyy-mm-dd
  dataFim: string
  descricao: string | null
  profissionalId: string | null   // nulo = estabelecimento inteiro
  profissionalNome: string | null
  horaInicio: string | null       // nulos = dia inteiro; "14:00" = compromisso avulso
  horaFim: string | null
}

export interface Recorrencia {
  id: string
  clienteNome: string
  clienteTelefone: string | null
  servico: string
  profissional: string | null
  frequenciaDias: number // 7 semanal, 14 quinzenal, 28 mensal
  hora: string
  proximaData: string // yyyy-mm-dd
  ativo: boolean
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
  antecedenciaMinHoras: number
  resumoDiario: boolean
  faltasParaAprovacao: number
  permiteCombo: boolean
  paginaPublica: boolean
  slug: string
  reativacaoDias: number
  reativacaoMsg: string | null
  aniversarioAtivo: boolean
  aniversarioMsg: string | null
}

export interface Unidade {
  tenantId: string
  nome: string
  plano: string
  atual: boolean
}

export interface AuthResponse {
  token: string
  userId: string
  tenantId: string
  role: string
}

// ── Admin / back-office ──────────────────────────────────────────────────────
export type PlanoNome = 'TRIAL' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

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

// ── Painel CEO / vendedores ──────────────────────────────────────────────────
export interface AdminMe {
  nome: string | null
  email: string
  role: 'SUPERADMIN' | 'VENDEDOR'
  comissaoPct: number | null
}

export interface Vendedor {
  id: string
  nome: string | null
  email: string
  comissaoPct: number
  ativo: boolean
  criadoEm: string
}

export interface VendaLinha {
  tenantNome: string
  vendedor: string | null
  plano: string
  valor: number
  comissaoValor: number
  origem: string // MANUAL | PIX
  pago: boolean
  criadoEm: string
}

export interface Acerto {
  vendedorId: string
  vendedor: string
  vendas: number
  comissaoPendente: number
}

export interface AcertoHistorico {
  vendedor: string
  valor: number
  vendasQuitadas: number
  pendenteApos: number
  criadoEm: string
}

export interface RankingVendedor {
  vendedor: string
  vendas: number
  receita: number
  comissao: number
}

export interface CeoResumo {
  receitaMes: number
  vendasMes: number
  comissoesMes: number
  receitaMesAnterior: number
  vendasMesAnterior: number
  ranking: RankingVendedor[]
  vendasRecentes: VendaLinha[]
}

export interface MinhasVendas {
  vendasMes: number
  comissaoMes: number
  comissaoPendente: number
  vendas: VendaLinha[]
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
  plano: 'TRIAL' | 'GOLD' | 'PLATINUM' | 'DIAMOND'
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
