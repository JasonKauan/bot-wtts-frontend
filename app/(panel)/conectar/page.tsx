'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { whatsappApi } from '@/lib/api'
import { MessageSquare, CheckCircle2, RefreshCw, Loader2, Unplug } from 'lucide-react'

export default function ConectarPage() {
  const { token } = useAuth()
  const [conectado, setConectado] = useState<boolean | null>(null)
  const [qr, setQr] = useState<string>('')
  const [carregandoQr, setCarregandoQr] = useState(false)
  const [confirmaDesconectar, setConfirmaDesconectar] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const checarStatus = useCallback(async () => {
    if (!token) return null
    try {
      const s = await whatsappApi.status(token)
      setConectado(s.conectado)
      return s.conectado
    } catch { return null }
  }, [token])

  const buscarQr = useCallback(async () => {
    if (!token) return
    setCarregandoQr(true)
    try {
      const r = await whatsappApi.qr(token)
      if (r.conectado) { setConectado(true); setQr('') }
      else setQr(r.qr || '')
    } catch { /* ignore */ } finally { setCarregandoQr(false) }
  }, [token])

  // Reset de verdade: logout + QR novo (cura o QR que "gera mas nunca conecta")
  const resetarQr = useCallback(async () => {
    if (!token) return
    setCarregandoQr(true); setQr('')
    try {
      const r = await whatsappApi.reconectar(token)
      setQr(r.qr || '')
    } catch { /* ignore */ } finally { setCarregandoQr(false) }
  }, [token])

  // Desconectar o WhatsApp (logout): volta pra tela de QR pra parear de novo
  const desconectar = useCallback(async () => {
    if (!token) return
    setDesconectando(true)
    try {
      const r = await whatsappApi.reconectar(token)
      setConectado(false)
      setQr(r.qr || '')
    } catch { /* ignore */ } finally {
      setDesconectando(false)
      setConfirmaDesconectar(false)
    }
  }, [token])

  // status inicial; se não conectado, busca o QR
  useEffect(() => {
    let active = true
    ;(async () => {
      const conn = await checarStatus()
      if (active && conn === false) buscarQr()
    })()
    return () => { active = false }
  }, [checarStatus, buscarQr])

  // enquanto não conectado: re-checa status e renova o QR a cada 6s
  useEffect(() => {
    if (conectado || conectado === null) return
    pollRef.current = setInterval(async () => {
      const conn = await checarStatus()
      if (conn) { if (pollRef.current) clearInterval(pollRef.current) }
      else buscarQr()
    }, 6000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [conectado, checarStatus, buscarQr])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Conectar WhatsApp</h1>
      <p className="text-muted text-sm mb-6">Conecte o WhatsApp do seu estabelecimento para o bot atender seus clientes automaticamente.</p>

      <div className="bg-card border border-border rounded-xl shadow-card p-8 max-w-md">
        {conectado === null ? (
          <div className="flex flex-col items-center text-muted py-10">
            <Loader2 className="animate-spin mb-3" /> Verificando conexão...
          </div>
        ) : conectado ? (
          <div className="flex flex-col items-center text-center py-6">
            <span className="grid place-items-center h-16 w-16 rounded-full bg-primary-subtle text-primary mb-4">
              <CheckCircle2 size={36} />
            </span>
            <h2 className="text-lg font-semibold text-foreground">WhatsApp conectado</h2>
            <p className="text-sm text-muted mt-1">Seu bot está ativo e pronto para atender seus clientes.</p>

            {!confirmaDesconectar ? (
              <button
                onClick={() => setConfirmaDesconectar(true)}
                className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-danger border border-border hover:border-danger rounded-lg px-4 py-2 transition"
              >
                <Unplug size={15} /> Desconectar
              </button>
            ) : (
              <div className="mt-6 w-full bg-danger-subtle border border-danger/30 rounded-xl p-4">
                <p className="text-sm text-foreground mb-3">Desconectar o WhatsApp? O bot <b>para de atender</b> até você escanear o QR de novo.</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setConfirmaDesconectar(false)} className="text-sm border border-border rounded-lg px-4 py-2 text-muted hover:text-foreground transition">
                    Voltar
                  </button>
                  <button onClick={desconectar} disabled={desconectando} className="inline-flex items-center gap-2 text-sm bg-danger hover:opacity-90 text-white font-semibold rounded-lg px-4 py-2 transition disabled:opacity-50">
                    {desconectando && <Loader2 size={15} className="animate-spin" />} Sim, desconectar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <span className="grid place-items-center h-11 w-11 rounded-xl bg-primary-subtle text-primary mb-4">
              <MessageSquare size={22} />
            </span>
            <h2 className="text-base font-semibold text-foreground mb-1">Escaneie o QR code</h2>
            <p className="text-sm text-muted mb-5">
              No WhatsApp do estabelecimento: <strong className="text-foreground">Aparelhos conectados → Conectar aparelho</strong>.
            </p>

            <div className="h-56 w-56 grid place-items-center rounded-xl border border-border bg-white p-2">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="QR code do WhatsApp" className="h-full w-full object-contain" />
              ) : (
                <span className="text-muted text-sm flex flex-col items-center gap-2 px-3 text-center">
                  <Loader2 className="animate-spin" /> Gerando QR...
                  <span className="text-xs">No primeiro acesso pode levar até <b>2 minutos</b> (servidor acordando). Deixe esta tela aberta 😊</span>
                </span>
              )}
            </div>

            <button onClick={resetarQr} disabled={carregandoQr} className="mt-5 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition disabled:opacity-50">
              <RefreshCw size={15} className={carregandoQr ? 'animate-spin' : ''} /> Gerar novo QR
            </button>
            <p className="text-xs text-muted mt-2">O QR atualiza sozinho e esta tela detecta a conexão automaticamente.<br />Escaneou e não conectou? Clique em <b>Gerar novo QR</b> e escaneie o novo.</p>
          </div>
        )}
      </div>
    </div>
  )
}
