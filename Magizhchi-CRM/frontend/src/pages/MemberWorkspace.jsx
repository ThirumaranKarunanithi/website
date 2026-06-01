import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/auth.jsx'
import AppLayout from '../components/AppLayout.jsx'
import Drawer from '../components/Drawer.jsx'
import StatusBadge, { STATUS_OPTIONS, STATUS_LABELS } from '../components/StatusBadge.jsx'
import { api } from '../lib/api'

const NAV = [
  { key: 'companies', label: 'My Companies', icon: '🏢' },
  { key: 'leads', label: 'My Leads', icon: '🎯' },
  { key: 'reminders', label: 'Reminders', icon: '⏰' },
  { key: 'permissions', label: 'Permissions', icon: '🔐' },
]

function fmt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

// Invites + joined companies for the logged-in member.
function CompaniesView() {
  const { user } = useAuth()
  const [invites, setInvites] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [i, c] = await Promise.all([api('/my/invites'), api('/my/companies')])
      setInvites(i)
      setCompanies(c)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function act(membershipId, action) {
    setBusy(membershipId); setError('')
    try {
      await api(`/my/invites/${membershipId}/${action}`, { method: 'POST' })
      await load()
    } catch (e) { setError(e.message) }
    finally { setBusy(null) }
  }

  if (loading) return <div className="card p-10 text-center text-slate-400">Loading…</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Welcome, {user?.displayName} 👋</h1>
        <p className="text-sm text-slate-500">Accept an invite to start working a company's leads.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      {/* Pending invites */}
      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Pending invites</h3>
        {invites.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">No pending invites right now.</div>
        ) : (
          <div className="space-y-3">
            {invites.map((inv) => (
              <div key={inv.membershipId} className="card flex flex-wrap items-center gap-3 p-4">
                <div className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-primary/10 text-xl">🏢</div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-brand-navy">{inv.companyName}</div>
                  <div className="text-xs text-slate-400">
                    {inv.designationName ? `Role: ${inv.designationName} · ` : ''}Invited {fmt(inv.invitedAt)}
                  </div>
                </div>
                <button className="btn-primary" disabled={busy === inv.membershipId}
                  onClick={() => act(inv.membershipId, 'accept')}>Accept</button>
                <button className="btn-ghost border border-slate-200" disabled={busy === inv.membershipId}
                  onClick={() => act(inv.membershipId, 'decline')}>Decline</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Joined companies */}
      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">My companies</h3>
        {companies.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">
            You haven't joined any company yet. Accept an invite above to get started.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {companies.map((c) => (
              <div key={c.membershipId} className="card flex items-center gap-3 p-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-xl">✅</div>
                <div>
                  <div className="font-bold text-brand-navy">{c.companyName}</div>
                  <div className="text-xs text-slate-400">
                    {c.designationName ? `${c.designationName} · ` : ''}Joined {fmt(c.acceptedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Placeholder({ title, desc }) {
  return (
    <div className="card flex flex-col items-center justify-center p-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-2xl">🚧</div>
      <h3 className="mt-4 text-lg font-bold text-brand-navy">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{desc}</p>
      <span className="chip mt-4 bg-brand-highlight/20 text-brand-navy">Coming in the next phase</span>
    </div>
  )
}

function dt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Member's assigned leads — hard-isolated to active companies.
function MyLeads() {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [canAssign, setCanAssign] = useState(false)

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (q.trim()) params.set('q', q.trim())
    const qs = params.toString()
    setLeads(await api(`/my/leads${qs ? `?${qs}` : ''}`))
  }, [filterStatus, q])

  const loadAll = useCallback(async () => {
    setLoading(true); setError('')
    try {
      setStats(await api('/my/leads/stats'))
      const ca = await api('/my/leads/can-assign').catch(() => ({ canAssign: false }))
      setCanAssign(!!ca.canAssign)
      await loadLeads()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [loadLeads])

  useEffect(() => { loadAll() }, []) // eslint-disable-line
  useEffect(() => { if (!loading) loadLeads().catch((e) => setError(e.message)) }, [filterStatus]) // eslint-disable-line

  async function refresh() {
    setStats(await api('/my/leads/stats'))
    await loadLeads()
  }

  const chips = [
    ['', 'All', stats?.total], ['NEW', 'New', stats?.isNew], ['ASSIGNED', 'Assigned', stats?.assigned],
    ['FOLLOW_UP', 'Follow-up', stats?.followUp], ['WON', 'Won', stats?.won], ['LOST', 'Lost', stats?.lost],
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">My Leads</h1>
        <p className="text-sm text-slate-500">
          {canAssign
            ? 'All leads in your company. Call, take notes, move them through the pipeline, and assign to teammates.'
            : 'Leads assigned to you. Call, take notes, and move them through your pipeline.'}
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-3">
        {chips.map(([val, label, n]) => (
          <button key={label} onClick={() => setFilterStatus(val)}
            className={`flex min-w-[6.5rem] flex-1 flex-col rounded-xl border px-4 py-3 text-left transition ${
              filterStatus === val ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
            <span className="text-xs font-medium text-slate-500">{label}</span>
            <span className="mt-0.5 text-2xl font-extrabold text-brand-navy">{n ?? '–'}</span>
          </button>
        ))}
      </div>

      <div className="card p-3">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); loadLeads().catch((err) => setError(err.message)) }}>
          <input className="field flex-1" placeholder="Search name, phone, or email…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-navy" type="submit">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading…</div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-2xl">🎯</div>
            <h3 className="mt-4 font-bold text-brand-navy">No leads assigned to you yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">When your company assigns you leads, they'll show up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Lead</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} onClick={() => setSelectedId(l.id)} className="cursor-pointer border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-brand-navy">{l.name || '—'}</td>
                    <td className="px-5 py-3 text-slate-600">
                      <div>{l.phone || '—'}</div>
                      <div className="text-xs text-slate-400">{l.email || ''}</div>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-5 py-3 text-slate-500">{l.companyName}</td>
                    <td className="px-5 py-3 text-slate-500">{dt(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MyLeadDetail
        lead={leads.find((l) => l.id === selectedId) || null}
        canAssign={canAssign}
        onClose={() => setSelectedId(null)}
        onChanged={refresh}
      />
    </div>
  )
}

function MyLeadDetail({ lead: row, canAssign, onClose, onChanged }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [callNote, setCallNote] = useState('')
  const [assignList, setAssignList] = useState([])
  const [assignee, setAssignee] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const leadId = row?.id
  const open = !!leadId

  const load = useCallback(async () => {
    if (!leadId) return
    setLoading(true); setErr('')
    try {
      setDetail(await api(`/my/leads/${leadId}`))
      // If this member can assign, load teammates in this lead's company.
      if (canAssign && row?.companyId) {
        try { setAssignList(await api(`/my/leads/assignable-members?companyId=${row.companyId}`)) }
        catch { setAssignList([]) }
      } else {
        setAssignList([])
      }
    }
    catch (e) { setErr(e.message) }
    finally { setLoading(false) }
  }, [leadId, canAssign, row])

  useEffect(() => { load() }, [load])

  async function act(fn) {
    setBusy(true); setErr('')
    try { await fn(); await load(); await onChanged?.() }
    catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  const lead = detail?.lead
  const cf = lead?.customFields || {}
  const KNOWN = new Set(['name', 'phone', 'email', 'fullname', 'phonenumber', 'mobile'])
  const extra = Object.keys(cf).filter((k) => !KNOWN.has(k.toLowerCase().replace(/[\s_-]/g, '')) && String(cf[k]).trim() !== '')

  return (
    <Drawer open={open} onClose={onClose} title={lead?.name || 'Lead'}
      subtitle={lead ? [lead.phone, lead.email].filter(Boolean).join(' · ') : ''}>
      {loading || !detail ? (
        <div className="p-8 text-center text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-5">
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

          {/* Quick actions */}
          <section className="card p-4">
            <h4 className="mb-2 text-sm font-bold text-brand-navy">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="btn-primary px-3 py-1.5 text-sm"
                   onClick={() => act(() => api(`/my/leads/${lead.id}/call`, { method: 'POST', body: { note: 'Dialed ' + lead.phone } }))}>
                  📞 Call {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="btn-navy px-3 py-1.5 text-sm">✉️ Email</a>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input className="field flex-1" placeholder="Log a call note…" value={callNote} onChange={(e) => setCallNote(e.target.value)} />
              <button className="btn-ghost border border-slate-200" disabled={busy || !callNote.trim()}
                onClick={() => act(async () => { await api(`/my/leads/${lead.id}/call`, { method: 'POST', body: { note: callNote.trim() } }); setCallNote('') })}>
                Log call
              </button>
            </div>
          </section>

          {/* Manager: (re)assign this lead */}
          {canAssign && assignList.length > 0 && (
            <section className="card p-4">
              <h4 className="mb-2 text-sm font-bold text-brand-navy">Assign to teammate</h4>
              <p className="mb-2 text-sm text-slate-600">
                Currently: <span className="font-semibold">{row?.assignedMemberName || 'you / unassigned'}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <select className="field flex-1" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  <option value="">Select a teammate…</option>
                  {assignList.map((m) => (
                    <option key={m.accountId} value={m.accountId}>{m.displayName} ({m.email})</option>
                  ))}
                </select>
                <button className="btn-navy" disabled={busy || !assignee}
                  onClick={() => act(async () => { await api(`/my/leads/${lead.id}/assign`, { method: 'PATCH', body: { memberAccountId: assignee } }); setAssignee('') })}>
                  Assign
                </button>
              </div>
            </section>
          )}

          {/* Status */}
          <section className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-bold text-brand-navy">Status</h4>
              <StatusBadge status={lead.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} disabled={busy || s === lead.status}
                  onClick={() => act(() => api(`/my/leads/${lead.id}/status`, { method: 'PATCH', body: { status: s } }))}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    s === lead.status ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </section>

          {/* Details */}
          {extra.length > 0 && (
            <section className="card p-4">
              <h4 className="mb-3 text-sm font-bold text-brand-navy">Details</h4>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {extra.map((k) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt>
                    <dd className="truncate text-sm text-brand-navy" title={String(cf[k])}>{String(cf[k])}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Activity */}
          <section className="card p-4">
            <h4 className="mb-3 text-sm font-bold text-brand-navy">Activity</h4>
            <form className="mb-4 flex gap-2" onSubmit={(e) => {
              e.preventDefault(); if (!note.trim()) return
              act(async () => { await api(`/my/leads/${lead.id}/notes`, { method: 'POST', body: { note: note.trim() } }); setNote('') })
            }}>
              <input className="field flex-1" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn-primary" disabled={busy || !note.trim()}>Add</button>
            </form>
            <ol className="space-y-3">
              {detail.timeline.length === 0 && <li className="text-sm text-slate-400">No activity yet.</li>}
              {detail.timeline.map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 flex-none rounded-full bg-brand-primary" />
                  <div className="flex-1">
                    <div className="text-sm text-brand-navy">{renderEvent(ev)}</div>
                    <div className="text-xs text-slate-400">{dt(ev.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </Drawer>
  )
}

function renderEvent(ev) {
  const p = ev.payload || {}
  switch (ev.type) {
    case 'NOTE': return <>📝 {p.note}</>
    case 'CALL': return <>📞 Call logged{p.note ? ` — ${p.note}` : ''}</>
    case 'STATUS_CHANGE': return <>🔄 Status: <b>{p.from}</b> → <b>{p.to}</b></>
    case 'ASSIGNMENT': return <>👤 Assigned to <b>{p.memberName || 'you'}</b></>
    case 'MAIL': return <>✉️ Mail sent</>
    case 'REMINDER': return <>⏰ Reminder set{p.note ? ` — ${p.note}` : ''}</>
    case 'PAYMENT': return <>💳 Payment request</>
    default: return ev.type
  }
}

export default function MemberWorkspace() {
  const [active, setActive] = useState('companies')

  const views = {
    companies: <CompaniesView />,
    leads: <MyLeads />,
    reminders: <Placeholder title="Reminders" desc="Your follow-up reminders across all companies will live here." />,
    permissions: <Placeholder title="Permissions" desc="A read-only view of what each company allows you to do." />,
  }

  return (
    <AppLayout nav={NAV} active={active} onNavigate={setActive}>
      {views[active]}
    </AppLayout>
  )
}
