'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getToken, saveToken, removeToken } from '@/lib/auth'

interface AuthCtx {
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthCtx>({ token: null, login: () => {}, logout: () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = getToken()
    if (t) setToken(t)
  }, [])

  function login(t: string) {
    saveToken(t)
    // Also set cookie so middleware can read it
    document.cookie = `token=${t}; path=/; max-age=86400; SameSite=Lax`
    setToken(t)
  }

  function logout() {
    removeToken()
    document.cookie = 'token=; path=/; max-age=0'
    setToken(null)
  }

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
