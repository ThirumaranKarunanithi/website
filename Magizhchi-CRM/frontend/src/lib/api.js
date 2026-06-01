// Thin fetch wrapper. Reads JWT from localStorage and attaches it.
const BASE = import.meta.env.VITE_API_URL || ''

const TOKEN_KEY = 'magizhchi.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

// Raised on auth failures so callers (AuthProvider) can self-heal by logging out.
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Turn a backend error body into a human-readable string.
// Backend sends either {message: "text"} or {message: {field: "msg", ...}}.
function extractMessage(data, status) {
  if (!data) return `Request failed (${status})`
  const m = data.message
  if (typeof m === 'string') return m
  if (m && typeof m === 'object') {
    // validation map -> "Email: must be valid; Password: too short"
    const parts = Object.entries(m).map(([k, v]) => {
      const label = k.charAt(0).toUpperCase() + k.slice(1)
      return `${label}: ${v}`
    })
    if (parts.length) return parts.join('. ')
  }
  if (typeof data.error === 'string') return data.error
  return `Request failed (${status})`
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE}/api/v1${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store', // never serve a cached API response (fixes stale 4xx)
    })
  } catch {
    // Network/connection failure (backend down, etc.)
    throw new ApiError(
      'Cannot reach the server. Make sure the backend is running, then try again.',
      0,
    )
  }

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(data, res.status), res.status)
  }
  return data
}
