import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    // Rehydrate session. Any failure (expired/invalid token, server down) just
    // drops us to logged-out — never leaves the app stuck on a broken token.
    api('/me')
      .then(setUser)
      .catch(() => {
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const res = await api('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email: email.trim().toLowerCase(), password },
    })
    applyAuth(res)
    return res
  }

  async function signup(payload) {
    const clean = { ...payload }
    if (clean.email) clean.email = clean.email.trim().toLowerCase()
    if (clean.companyName) clean.companyName = clean.companyName.trim()
    if (clean.displayName) clean.displayName = clean.displayName.trim()
    if (clean.phone) clean.phone = clean.phone.trim()
    const res = await api('/auth/signup', {
      method: 'POST',
      auth: false,
      body: clean,
    })
    applyAuth(res)
    return res
  }

  function applyAuth(res) {
    setToken(res.accessToken)
    setUser({
      accountId: res.accountId,
      accountType: res.accountType,
      companyId: res.companyId,
      displayName: res.displayName,
    })
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
