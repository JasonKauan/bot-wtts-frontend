const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    // Iteração 6: assinatura vencida → leva direto para a página de renovação
    if (res.status === 402 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/assinatura')) {
      window.location.href = '/assinatura'
    }
    const text = await res.text().catch(() => res.statusText)
    let message = text || `HTTP ${res.status}`
    try {
      const body = JSON.parse(text)
      if (typeof body?.message === 'string' && body.message) message = body.message
    } catch {
      // corpo não-JSON: mantém o texto bruto
    }
    throw new Error(message)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : (undefined as T)
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, senha: string) =>
    request<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),
  register: (nome: string, email: string, senha: string, telefoneWhatsapp: string) =>
    request<{ token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nomeEstabelecimento: nome, email, senha, telefoneWhatsapp }),
    }),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: (token: string) =>
    request<import('./types').DashboardData>('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Agenda ────────────────────────────────────────────────────────────────────
export const agendaApi = {
  list: (token: string, data?: string) =>
    request<import('./types').Agendamento[]>(`/api/agenda${data ? `?data=${data}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Agendamentos ──────────────────────────────────────────────────────────────
export const agendamentosApi = {
  criar: (token: string, body: {
    clienteNome: string; clienteTelefone?: string; servicoId: string;
    profissionalId?: string; data: string; hora: string
  }) =>
    request<import('./types').Agendamento>('/api/agendamentos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  cancelar: (token: string, id: string) =>
    request<void>(`/api/agendamentos/${id}/cancelar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),
  confirmar: (token: string, id: string) =>
    request<void>(`/api/agendamentos/${id}/confirmar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),
  naoCompareceu: (token: string, id: string) =>
    request<void>(`/api/agendamentos/${id}/nao-compareceu`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),
  recusar: (token: string, id: string) =>
    request<void>(`/api/agendamentos/${id}/recusar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),
  pendentes: (token: string) =>
    request<import('./types').Agendamento[]>('/api/agendamentos/pendentes', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Profissionais ─────────────────────────────────────────────────────────────
export const profissionaisApi = {
  list: (token: string) =>
    request<import('./types').Profissional[]>('/api/profissionais', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  create: (token: string, nome: string) =>
    request<import('./types').Profissional>('/api/profissionais', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome }),
    }),
  update: (token: string, id: string, nome: string) =>
    request<import('./types').Profissional>(`/api/profissionais/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome }),
    }),
  toggleAtivo: (token: string, id: string) =>
    request<import('./types').Profissional>(`/api/profissionais/${id}/ativo`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Serviços ──────────────────────────────────────────────────────────────────
export const servicosApi = {
  list: (token: string) =>
    request<import('./types').Servico[]>('/api/servicos', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  create: (token: string, nome: string, duracaoMinutos: number, preco: number | null = null) =>
    request<import('./types').Servico>('/api/servicos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome, duracaoMinutos, preco }),
    }),
  update: (token: string, id: string, nome: string, duracaoMinutos: number, preco: number | null = null) =>
    request<import('./types').Servico>(`/api/servicos/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome, duracaoMinutos, preco }),
    }),
  toggleAtivo: (token: string, id: string) =>
    request<import('./types').Servico>(`/api/servicos/${id}/ativo`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Assinatura (Iteração 6) ───────────────────────────────────────────────────
export const assinaturaApi = {
  get: (token: string) =>
    request<import('./types').AssinaturaStatus>('/api/assinatura', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  gerarPix: (token: string, plano: string) =>
    request<import('./types').PixGerado>('/api/assinatura/pix', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plano }),
    }),
  pagamento: (token: string, id: string) =>
    request<import('./types').PagamentoStatus>(`/api/assinatura/pagamentos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Configurações ─────────────────────────────────────────────────────────────
export const configApi = {
  get: (token: string) =>
    request<import('./types').Configuracao>('/api/configuracoes', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  update: (token: string, body: import('./types').ConfiguracaoPayload) =>
    request<import('./types').Configuracao>('/api/configuracoes', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
}

// ── Admin / back-office (Fase 1) ──────────────────────────────────────────────
export const adminApi = {
  login: (email: string, senha: string) =>
    request<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),
  clientes: (token: string) =>
    request<import('./types').ClienteResumo[]>('/api/admin/clientes', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  whatsapp: (token: string, id: string) =>
    request<{ estado: string; conectado: boolean }>(`/api/admin/clientes/${id}/whatsapp`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  criarCliente: (token: string, body: import('./types').CriarClientePayload) =>
    request<import('./types').SenhaResponse>('/api/admin/clientes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  alterarPlano: (token: string, id: string, body: import('./types').PlanoPayload) =>
    request<void>(`/api/admin/clientes/${id}/plano`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  resetarSenha: (token: string, id: string) =>
    request<import('./types').SenhaResponse>(`/api/admin/clientes/${id}/senha`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({}),
    }),
  suspender: (token: string, id: string) =>
    request<void>(`/api/admin/clientes/${id}/suspender`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  reativar: (token: string, id: string) =>
    request<void>(`/api/admin/clientes/${id}/reativar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  auditoria: (token: string) =>
    request<import('./types').AuditoriaItem[]>('/api/admin/auditoria', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  dispararLembretes: (token: string) =>
    request<{ enviados: number }>('/api/admin/lembretes/disparar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  me: (token: string) =>
    request<import('./types').AdminMe>('/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  minhasVendas: (token: string) =>
    request<import('./types').MinhasVendas>('/api/admin/minhas-vendas', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ceoResumo: (token: string) =>
    request<import('./types').CeoResumo>('/api/admin/ceo/resumo', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ceoAcerto: (token: string) =>
    request<import('./types').Acerto[]>('/api/admin/ceo/acerto', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ceoAcertar: (token: string, vendedorId: string) =>
    request<{ vendasAcertadas: number; total: number }>(`/api/admin/ceo/acerto/${vendedorId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
  /** Baixa o CSV de vendas (download direto no navegador). */
  baixarVendasCsv: async (token: string) => {
    const res = await fetch(`${API}/api/admin/ceo/vendas.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Falha ao exportar CSV')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendas.csv'
    a.click()
    URL.revokeObjectURL(url)
  },
  vendedores: (token: string) =>
    request<import('./types').Vendedor[]>('/api/admin/vendedores', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  criarVendedor: (token: string, body: { nome: string; email: string; senha: string; comissaoPct: number }) =>
    request<import('./types').Vendedor>('/api/admin/vendedores', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  editarVendedor: (token: string, id: string, body: { nome?: string; comissaoPct?: number; ativo?: boolean; senha?: string }) =>
    request<import('./types').Vendedor>(`/api/admin/vendedores/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
}

// ── Clientes (CRM leve) ───────────────────────────────────────────────────────
export const clientesApi = {
  list: (token: string) =>
    request<import('./types').ClienteCrm[]>('/api/clientes', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Relatórios ────────────────────────────────────────────────────────────────
export const relatoriosApi = {
  get: (token: string) =>
    request<import('./types').Relatorio>('/api/relatorios', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Bloqueios (folgas/feriados) ───────────────────────────────────────────────
export const bloqueiosApi = {
  list: (token: string) =>
    request<import('./types').Bloqueio[]>('/api/bloqueios', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  create: (token: string, body: { dataInicio: string; dataFim?: string; descricao?: string }) =>
    request<import('./types').Bloqueio>('/api/bloqueios', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  remove: (token: string, id: string) =>
    request<void>(`/api/bloqueios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── WhatsApp (conexão da instância) ───────────────────────────────────────────
export const whatsappApi = {
  status: (token: string) =>
    request<{ estado: string; conectado: boolean }>('/api/whatsapp/status', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  qr: (token: string) =>
    request<{ conectado: boolean; qr: string }>('/api/whatsapp/qr', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  /** Reset da sessão (logout + QR novo) — usar quando o QR gera mas nunca conecta. */
  reconectar: (token: string) =>
    request<{ conectado: boolean; qr: string }>('/api/whatsapp/reconectar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }),
}
