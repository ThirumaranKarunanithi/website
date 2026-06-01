import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import Modal from '../../components/Modal.jsx'

const STATUS = {
  PENDING: { label: 'Pending', cls: 'bg-brand-highlight/25 text-amber-700' },
  ACCEPTED: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700' },
  DECLINED: { label: 'Declined', cls: 'bg-rose-100 text-rose-700' },
}

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [designations, setDesignations] = useState([])
  const [perf, setPerf] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [desigOpen, setDesigOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [m, d, p] = await Promise.all([
        api('/members'),
        api('/designations'),
        api('/leads/stats/by-member'),
      ])
      setMembers(m)
      setDesignations(d)
      setPerf(p)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function changeDesignation(m, designationId) {
    try {
      await api(`/members/${m.membershipId}/designation`, {
        method: 'PATCH',
        body: { designationId: designationId || null },
      })
      await load()
    } catch (e) { setError(e.message) }
  }

  async function toggleCanAssign(m) {
    try {
      await api(`/members/${m.membershipId}/can-assign`, { method: 'PATCH', body: { canAssign: !m.canAssign } })
      await load()
    } catch (e) { setError(e.message) }
  }

  async function remove(m) {
    if (!window.confirm(`Remove ${m.displayName}? They immediately lose access to all of this company's records.`)) return
    try { await api(`/members/${m.membershipId}`, { method: 'DELETE' }); await load() }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Members</h1>
          <p className="text-sm text-slate-500">Invite your team, assign designations, and control access.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost border border-slate-200" onClick={() => setDesigOpen(true)}>Designations</button>
          <button className="btn-primary" onClick={() => setInviteOpen(true)}>+ Invite member</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-2xl">👥</div>
            <h3 className="mt-4 font-bold text-brand-navy">No members yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Invite a teammate by email. They must sign up as a <b>Member</b> first, then accept your invite.
            </p>
            <button className="btn-primary mt-4" onClick={() => setInviteOpen(true)}>+ Invite member</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Member</th>
                  <th className="px-5 py-3 font-semibold">Designation</th>
                  <th className="px-5 py-3 font-semibold">Companies</th>
                  <th className="px-5 py-3 font-semibold">Can assign</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const s = STATUS[m.status] || { label: m.status, cls: 'bg-slate-100 text-slate-600' }
                  return (
                    <tr key={m.membershipId} className="border-b border-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-navy text-sm font-bold text-white">
                            {(m.displayName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-navy">{m.displayName}</div>
                            <div className="text-xs text-slate-400">{m.email}{m.phone ? ` · ${m.phone}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          className="field py-1.5 text-sm"
                          value={m.designationId || ''}
                          onChange={(e) => changeDesignation(m, e.target.value)}
                        >
                          <option value="">— none —</option>
                          {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        {m.companyCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="chip bg-brand-info/15 text-brand-navy" title={(m.companies || []).join(', ')}>
                              {m.companyCount} {m.companyCount === 1 ? 'company' : 'companies'}
                            </span>
                            {m.companyCount > 1 && (
                              <span className="text-xs text-slate-400" title={(m.companies || []).join(', ')}>ⓘ</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                        <div className="mt-0.5 max-w-[12rem] truncate text-xs text-slate-400" title={(m.companies || []).join(', ')}>
                          {(m.companies || []).join(', ')}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {m.status === 'ACCEPTED' ? (
                          <button
                            onClick={() => toggleCanAssign(m)}
                            className={`relative h-6 w-11 flex-none rounded-full transition ${m.canAssign ? 'bg-brand-primary' : 'bg-slate-300'}`}
                            title={m.canAssign ? 'Can assign leads (manager) — click to revoke' : 'Cannot assign — click to grant'}
                          >
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${m.canAssign ? 'left-[1.375rem]' : 'left-0.5'}`} />
                          </button>
                        ) : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3"><span className={`chip ${s.cls}`}>{s.label}</span></td>
                      <td className="px-5 py-3 text-right">
                        <button className="btn-ghost text-sm text-rose-600" onClick={() => remove(m)}>Remove</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team performance — leads per member by status */}
      <TeamPerformance perf={perf} loading={loading} />

      <InviteModal
        open={inviteOpen}
        designations={designations}
        onClose={() => setInviteOpen(false)}
        onDone={async () => { setInviteOpen(false); await load() }}
      />
      <DesignationsModal
        open={desigOpen}
        designations={designations}
        onClose={() => setDesigOpen(false)}
        onChanged={load}
      />
    </div>
  )
}

function TeamPerformance({ perf, loading }) {
  if (loading) return null
  const cols = [
    { key: 'total', label: 'Total', cls: 'text-brand-navy' },
    { key: 'isNew', label: 'New', cls: 'text-brand-navy' },
    { key: 'assigned', label: 'Assigned', cls: 'text-sky-700' },
    { key: 'followUp', label: 'Follow-up', cls: 'text-amber-700' },
    { key: 'won', label: 'Won', cls: 'text-emerald-700' },
    { key: 'lost', label: 'Lost', cls: 'text-rose-700' },
  ]
  // company-wide totals row
  const totals = cols.reduce((acc, c) => {
    acc[c.key] = perf.reduce((s, m) => s + (m[c.key] || 0), 0)
    return acc
  }, {})

  return (
    <div>
      <h3 className="mb-2 mt-2 text-sm font-bold uppercase tracking-wide text-slate-400">
        Team performance — leads per member
      </h3>
      <div className="card overflow-x-auto">
        {perf.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No active members yet. Invite & accept a member to see their lead breakdown.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-semibold">Member</th>
                {cols.map((c) => <th key={c.key} className="px-4 py-3 text-center font-semibold">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {perf.map((m) => (
                <tr key={m.memberAccountId} className="border-b border-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-brand-navy">{m.memberName}</div>
                    <div className="text-xs text-slate-400">{m.email}</div>
                  </td>
                  {cols.map((c) => (
                    <td key={c.key} className={`px-4 py-3 text-center font-bold ${c.cls}`}>
                      {m[c.key] === 0 ? <span className="text-slate-300">0</span> : m[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {perf.length > 1 && (
                <tr className="bg-slate-50/60">
                  <td className="px-5 py-3 text-sm font-bold text-brand-navy">All members</td>
                  {cols.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-center font-extrabold text-brand-navy">{totals[c.key]}</td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Counts reflect each member's currently-assigned leads. Removed members' leads become unassigned.
      </p>
    </div>
  )
}

function InviteModal({ open, designations, onClose, onDone }) {
  const [email, setEmail] = useState('')
  const [designationId, setDesignationId] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await api('/members/invite', { method: 'POST', body: { email: email.trim(), designationId: designationId || null } })
      setEmail(''); setDesignationId('')
      await onDone()
    } catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite a member"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" form="invite-form" disabled={busy}>{busy ? 'Sending…' : 'Send invite'}</button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} className="space-y-3">
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div>
          <label className="label">Member's email</label>
          <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@email.com" required />
        </div>
        <div>
          <label className="label">Designation (optional)</label>
          <select className="field" value={designationId} onChange={(e) => setDesignationId(e.target.value)}>
            <option value="">— none —</option>
            {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <p className="text-xs text-slate-400">
          The person must already have a <b>Member</b> account. They'll see your invite on their workspace and can accept or decline.
        </p>
      </form>
    </Modal>
  )
}

function DesignationsModal({ open, designations, onClose, onChanged }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true); setErr('')
    try { await api('/designations', { method: 'POST', body: { name: name.trim() } }); setName(''); await onChanged() }
    catch (e2) { setErr(e2.message) }
    finally { setBusy(false) }
  }

  async function remove(d) {
    if (!window.confirm(`Delete designation "${d.name}"?`)) return
    try { await api(`/designations/${d.id}`, { method: 'DELETE' }); await onChanged() }
    catch (e2) { setErr(e2.message) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Designations"
      footer={<button className="btn-primary" onClick={onClose}>Done</button>}>
      {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input className="field flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Telecaller, Manager" />
        <button className="btn-navy" disabled={busy}>Add</button>
      </form>
      {designations.length === 0 ? (
        <p className="text-sm text-slate-400">No designations yet. Add roles like Manager, Team Lead, Telecaller.</p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {designations.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-brand-navy">{d.name}</span>
              <button className="text-sm text-rose-600 hover:underline" onClick={() => remove(d)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
