import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'
import AuthShell from '../components/AuthShell.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('COMPANY')
  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    displayName: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function validate() {
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (accountType === 'COMPANY' && !form.companyName.trim())
      return 'Please enter your company name.'
    if (accountType === 'MEMBER' && !form.displayName.trim())
      return 'Please enter your name.'
    return ''
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const v = validate()
    if (v) return setError(v)

    setBusy(true)
    try {
      const payload = {
        email: form.email,
        password: form.password,
        accountType,
        ...(accountType === 'COMPANY'
          ? { companyName: form.companyName }
          : { displayName: form.displayName, phone: form.phone }),
      }
      const res = await signup(payload)
      navigate(res.accountType === 'COMPANY' ? '/company' : '/member')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const pwScore = scorePassword(form.password)

  const TypeCard = ({ value, title, desc }) => {
    const active = accountType === value
    return (
      <button
        type="button"
        onClick={() => setAccountType(value)}
        className={`flex-1 rounded-xl border-2 p-3 text-left transition ${
          active
            ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-brand-navy">{title}</span>
          <span
            className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
              active ? 'border-brand-primary' : 'border-slate-300'
            }`}
          >
            {active && <span className="h-2 w-2 rounded-full bg-brand-primary" />}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{desc}</p>
      </button>
    )
  }

  return (
    <AuthShell title="Create your account" subtitle="Start managing leads in minutes.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <TypeCard
            value="COMPANY"
            title="Company"
            desc="Master account — capture & assign leads, manage your team."
          />
          <TypeCard
            value="MEMBER"
            title="Member"
            desc="Join a company and work the leads assigned to you."
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="field"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {accountType === 'COMPANY' ? (
          <div>
            <label className="label">Company name</label>
            <input
              className="field"
              placeholder="Acme Pvt Ltd"
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Your name</label>
              <input
                className="field"
                placeholder="Priya R"
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="field"
                placeholder="+91…"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>
        )}

        <div>
          <label className="label">Password</label>
          <PasswordInput
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
          />
          {form.password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 rounded-full transition ${
                      pwScore > i
                        ? pwScore === 1
                          ? 'bg-rose-400'
                          : pwScore === 2
                          ? 'bg-brand-highlight'
                          : 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400">
                {['', 'Weak', 'Okay', 'Strong'][pwScore]}
              </span>
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

function scorePassword(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 3)
}
