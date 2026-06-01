import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import AuthShell from '../components/AuthShell.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) return setError('Please enter your email.')
    if (!password) return setError('Please enter your password.')

    setBusy(true)
    try {
      const res = await login(email, password)
      navigate(res.accountType === 'COMPANY' ? '/company' : '/member')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Magizhchi CRM workspace.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="field"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label">Password</label>
          </div>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-brand-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
