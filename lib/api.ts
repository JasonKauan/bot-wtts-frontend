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
  create: (token: string, nome: string, duracaoMinutos: number) =>
    request<import('./types').Servico>('/api/servicos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome, duracaoMinutos }),
    }),
  update: (token: string, id: string, nome: string, duracaoMinutos: number) =>
    request<import('./types').Servico>(`/api/servicos/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nome, duracaoMinutos }),
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
  update: (token: string, body: { nome: string; horarioAbertura: number; horarioFechamento: number }) =>
    request<import('./types').Configuracao>('/api/configuracoes', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
}
