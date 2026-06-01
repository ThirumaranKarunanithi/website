import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import Modal from '../../components/Modal.jsx'
import Drawer from '../../components/Drawer.jsx'
import StatusBadge, { STATUS_OPTIONS, STATUS_LABELS } from '../../components/StatusBadge.jsx'

function fmt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function StatChip({ label, value, active, onClick, tone }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-[7rem] flex-1 flex-col rounded-xl border px-4 py-3 text-left transition ${
        active ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'
      }`}
    >
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={`mt-0.5 text-2xl font-extrabold ${tone || 'text-brand-navy'}`}>{value}</span>
    </button>
  )
}

export default function LeadsPage({ onCustomizeForm, openLeadId, onLeadOpened }) {
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState(null)
  const [members, setMembers] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [remapOpen, setRemapOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Distinct customField column names across loaded leads (for the re-map tool)
  const columnKeys = Array.from(
    new Set(leads.flatMap((l) => Object.keys(l.customFields || {}))),
  ).sort()

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (q.trim()) params.set('q', q.trim())
    const qs = params.toString()
    const data = await api(`/leads${qs ? `?${qs}` : ''}`)
    setLeads(data)
  }, [filterStatus, q])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, m] = await Promise.all([
        api('/leads/stats'),
        api('/leads/assignable-members'),
      ])
      setStats(s)
      setMembers(m)
      await loadLeads()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [loadLeads])

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Open a specific lead when navigated here from Follow-ups.
  useEffect(() => {
    if (openLeadId) {
      setSelectedId(openLeadId)
      onLeadOpened?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openLeadId])

  // Re-fetch list when filters change (after first load)
  useEffect(() => {
    if (loading) return
    loadLeads().catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus])

  async function refreshAfterMutation() {
    const [s] = await Promise.all([api('/leads/stats')])
    setStats(s)
    await loadLeads()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Leads</h1>
          <p className="text-sm text-slate-500">Capture, track, and assign every lead.</p>
        </div>
        <div className="flex gap-2">
          {columnKeys.length > 0 && (
            <button className="btn-ghost border border-slate-200" onClick={() => setRemapOpen(true)}>
              ↻ Re-map columns
            </button>
          )}
          <button className="btn-primary" onClick={() => setAddOpen(true)}>
            + Add lead
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats — also act as quick status filters */}
      <div className="flex flex-wrap gap-3">
        <StatChip label="All" value={stats?.total ?? '–'} active={filterStatus === ''} onClick={() => setFilterStatus('')} />
        <StatChip label="New" value={stats?.isNew ?? '–'} active={filterStatus === 'NEW'} onClick={() => setFilterStatus('NEW')} />
        <StatChip label="Assigned" value={stats?.assigned ?? '–'} active={filterStatus === 'ASSIGNED'} onClick={() => setFilterStatus('ASSIGNED')} tone="text-sky-700" />
        <StatChip label="Follow-up" value={stats?.followUp ?? '–'} active={filterStatus === 'FOLLOW_UP'} onClick={() => setFilterStatus('FOLLOW_UP')} tone="text-amber-700" />
        <StatChip label="Won" value={stats?.won ?? '–'} active={filterStatus === 'WON'} onClick={() => setFilterStatus('WON')} tone="text-emerald-700" />
        <StatChip label="Lost" value={stats?.lost ?? '–'} active={filterStatus === 'LOST'} onClick={() => setFilterStatus('LOST')} tone="text-rose-700" />
      </div>

      {/* Toolbar */}
      <div className="card flex flex-wrap items-center gap-3 p-3">
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            loadLeads().catch((err) => setError(err.message))
          }}
        >
          <input
            className="field flex-1"
            placeholder="Search name, phone, or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" className="btn-navy">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading leads…</div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-2xl">🎯</div>
            <h3 className="mt-4 font-bold text-brand-navy">No leads yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add your first lead manually, or connect a lead source (Excel / API / webhook) to start receiving them automatically.
            </p>
            <button className="btn-primary mt-4" onClick={() => setAddOpen(true)}>+ Add lead</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Lead</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Assignee</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-brand-navy">{l.name || '—'}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <div>{l.phone || '—'}</div>
                      <div className="text-xs text-slate-400">{l.email || ''}</div>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-5 py-3 text-slate-600">
                      {l.assignedMemberName || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="chip bg-slate-100 text-slate-600">{l.source}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmt(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddLeadModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCustomize={onCustomizeForm ? () => { setAddOpen(false); onCustomizeForm() } : null}
        onCreated={async () => {
          setAddOpen(false)
          await refreshAfterMutation()
        }}
      />

      <RemapModal
        open={remapOpen}
        columns={columnKeys}
        onClose={() => setRemapOpen(false)}
        onDone={async () => {
          setRemapOpen(false)
          await loadAll()
        }}
      />

      <LeadDetail
        leadId={selectedId}
        members={members}
        onClose={() => setSelectedId(null)}
        onChanged={refreshAfterMutation}
      />
    </div>
  )
}

function RemapModal({ open, columns, onClose, onDone }) {
  const [nameColumn, setNameColumn] = useState('')
  const [phoneColumns, setPhoneColumns] = useState([''])
  const [emailColumn, setEmailColumn] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)

  function reset() {
    setNameColumn(''); setPhoneColumns(['']); setEmailColumn('')
    setErr(''); setDone(null); setBusy(false)
  }
  function close() { reset(); onClose() }

  function setPhoneAt(i, v) {
    setPhoneColumns((p) => { const n = [...p]; n[i] = v; return n })
  }

  async function submit() {
    if (!nameColumn && !emailColumn && !phoneColumns.some(Boolean)) {
      setErr('Choose at least one column to re-map.')
      return
    }
    setBusy(true); setErr('')
    try {
      const res = await api('/leads/remap', {
        method: 'POST',
        body: {
          nameColumn: nameColumn || null,
          phoneColumns: phoneColumns.filter(Boolean),
          emailColumn: emailColumn || null,
          onlySource: null,
        },
      })
      setDone(res.updated)
      await onDone()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const Picker = ({ label, value, onChange }) => (
    <div>
      <label className="label">{label}</label>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— leave unchanged —</option>
        {columns.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={close}
      title="Re-map columns"
      maxWidth="max-w-lg"
      footer={
        done == null ? (
          <>
            <button className="btn-ghost" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={submit} disabled={busy}>
              {busy ? 'Applying…' : 'Apply to all leads'}
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={close}>Done</button>
        )
      }
    >
      {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      {done == null ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Pick which imported column should become each field. This updates{' '}
            <b>all leads</b> using the columns already saved on them — no re-import needed.
          </p>
          <Picker label="Name column" value={nameColumn} onChange={setNameColumn} />
          <div>
            <label className="label">Phone column(s)</label>
            <div className="space-y-2">
              {phoneColumns.map((pc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select className="field flex-1" value={pc} onChange={(e) => setPhoneAt(i, e.target.value)}>
                    <option value="">— leave unchanged —</option>
                    {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {phoneColumns.length > 1 && (
                    <button type="button" className="btn-ghost px-3 text-rose-600"
                      onClick={() => setPhoneColumns((p) => p.filter((_, idx) => idx !== i))}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-sm font-semibold text-brand-primary hover:underline"
              onClick={() => setPhoneColumns((p) => [...p, ''])}>
              + Add another phone column
            </button>
          </div>
          <Picker label="Email column" value={emailColumn} onChange={setEmailColumn} />
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          ✓ Re-mapped {done} lead{done === 1 ? '' : 's'}.
        </div>
      )}
    </Modal>
  )
}

function AddLeadModal({ open, onClose, onCreated, onCustomize }) {
  // Renders the company-designed form (Lead Form builder). Falls back to a
  // basic name/phone/email form if none is configured.
  const [fields, setFields] = useState(null)
  const [values, setValues] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setErr('')
    api('/lead-form')
      .then((fs) => {
        setFields(fs)
        const init = {}
        fs.forEach((f) => { init[f.fieldKey] = '' })
        setValues(init)
      })
      .catch((e) => setErr(e.message))
  }, [open])

  function set(key, v) { setValues((vals) => ({ ...vals, [key]: v })) }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      await api('/leads', { method: 'POST', body: { fields: values } })
      await onCreated()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  function renderField(f) {
    const common = {
      className: 'field',
      value: values[f.fieldKey] ?? '',
      onChange: (e) => set(f.fieldKey, e.target.value),
      placeholder: f.placeholder || '',
      required: f.required,
    }
    if (f.type === 'TEXTAREA') return <textarea rows={3} {...common} />
    if (f.type === 'DROPDOWN') return (
      <select {...common}>
        <option value="">{f.placeholder || '— select —'}</option>
        {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
    const typeMap = { NUMBER: 'number', EMAIL: 'email', DATE: 'date', PHONE: 'tel' }
    return <input type={typeMap[f.type] || 'text'} {...common} />
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a lead"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" form="add-lead-form" disabled={busy || !fields}>
            {busy ? 'Saving…' : 'Save lead'}
          </button>
        </>
      }
    >
      <form id="add-lead-form" onSubmit={submit} className="space-y-3">
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        {!fields ? (
          <div className="py-6 text-center text-sm text-slate-400">Loading form…</div>
        ) : fields.length === 0 ? (
          <p className="text-sm text-slate-500">
            No form fields configured. Go to <b>Lead Form</b> to design the Add-Lead form.
          </p>
        ) : (
          fields.map((f) => (
            <div key={f.id}>
              <label className="label">
                {f.label}{f.required && <span className="text-rose-500"> *</span>}
              </label>
              {renderField(f)}
            </div>
          ))
        )}
        {fields && onCustomize && (
          <div className="border-t border-slate-100 pt-3 text-right">
            <button
              type="button"
              onClick={onCustomize}
              className="text-sm font-semibold text-brand-primary hover:underline"
            >
              ✎ Customize this form
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}

function LeadDetail({ leadId, members, onClose, onChanged }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [assignee, setAssignee] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const open = !!leadId

  const load = useCallback(async () => {
    if (!leadId) return
    setLoading(true)
    setErr('')
    try {
      const d = await api(`/leads/${leadId}`)
      setDetail(d)
      setAssignee(d.lead.assignedMemberId || '')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { load() }, [load])

  async function act(fn) {
    setBusy(true)
    setErr('')
    try {
      await fn()
      await load()
      await onChanged?.()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const lead = detail?.lead

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={lead?.name || 'Lead'}
      subtitle={lead ? [lead.phone, lead.email].filter(Boolean).join(' · ') : ''}
    >
      {loading || !detail ? (
        <div className="p-8 text-center text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-5">
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

          {/* All imported details */}
          <DetailsSection
            lead={lead}
            onSave={(form) =>
              act(() => api(`/leads/${lead.id}`, { method: 'PATCH', body: form }))
            }
          />

          {/* Status */}
          <section className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-bold text-brand-navy">Status</h4>
              <StatusBadge status={lead.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  disabled={busy || s === lead.status}
                  onClick={() => act(() => api(`/leads/${lead.id}/status`, { method: 'PATCH', body: { status: s } }))}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    s === lead.status
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </section>

          {/* Assignment */}
          <section className="card p-4">
            <h4 className="mb-2 text-sm font-bold text-brand-navy">Assignment</h4>
            <p className="mb-3 text-sm text-slate-600">
              Currently:{' '}
              <span className="font-semibold">
                {lead.assignedMemberName || 'Unassigned'}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="field flex-1"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                disabled={members.length === 0}
              >
                <option value="">{members.length ? 'Select a member…' : 'No members yet'}</option>
                {members.map((m) => (
                  <option key={m.accountId} value={m.accountId}>
                    {m.displayName} ({m.email})
                  </option>
                ))}
              </select>
              <button
                className="btn-navy"
                disabled={busy || !assignee}
                onClick={() => act(() => api(`/leads/${lead.id}/assign`, { method: 'PATCH', body: { memberAccountId: assignee, auto: false } }))}
              >
                Assign
              </button>
              <button
                className="btn-info"
                disabled={busy || members.length === 0}
                title="Auto-assign to the least-loaded member"
                onClick={() => act(() => api(`/leads/${lead.id}/assign`, { method: 'PATCH', body: { auto: true } }))}
              >
                Auto
              </button>
            </div>
            {members.length === 0 && (
              <p className="mt-2 text-xs text-slate-400">
                Add team members (Members section) to enable assignment.
              </p>
            )}
          </section>

          {/* Follow-up reminder */}
          <ReminderSection
            lead={lead}
            busy={busy}
            onSet={(remindAt, note) =>
              act(() => api(`/leads/${lead.id}/reminders`, { method: 'POST', body: { remindAt, note } }))
            }
          />

          {/* Activity */}
          <section className="card p-4">
            <h4 className="mb-3 text-sm font-bold text-brand-navy">Activity</h4>
            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!note.trim()) return
                act(async () => {
                  await api(`/leads/${lead.id}/notes`, { method: 'POST', body: { note: note.trim() } })
                  setNote('')
                })
              }}
            >
              <input
                className="field flex-1"
                placeholder="Add a note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="btn-primary" disabled={busy || !note.trim()}>Add</button>
            </form>

            <ol className="space-y-3">
              {detail.timeline.length === 0 && (
                <li className="text-sm text-slate-400">No activity yet.</li>
              )}
              {detail.timeline.map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 flex-none rounded-full bg-brand-primary" />
                  <div className="flex-1">
                    <div className="text-sm text-brand-navy">{renderEvent(ev)}</div>
                    <div className="text-xs text-slate-400">{fmt(ev.createdAt)}</div>
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

// Keys already shown as first-class fields (case/space-insensitive) — hide them
// from the generic "all columns" list to avoid duplication.
const KNOWN_KEYS = new Set(["name", "phone", "email", "fullname", "phonenumber", "mobile", "mobilenumber", "emailaddress"])
const normKey = (k) => k.toLowerCase().replace(/[s_-]/g, "")

function DetailsSection({ lead }) {
  const cf = lead.customFields || {}
  const extraKeys = Object.keys(cf).filter((k) => !KNOWN_KEYS.has(normKey(k)) && String(cf[k]).trim() !== "")
  return (
    <section className="card p-4">
      <h4 className="mb-3 text-sm font-bold text-brand-navy">Details</h4>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        <DField label="Name" value={lead.name} />
        <DField label="Phone" value={lead.phone} />
        <DField label="Email" value={lead.email} />
        <DField label="Source" value={lead.source} />
        {extraKeys.map((k) => (
          <DField key={k} label={k} value={String(cf[k])} />
        ))}
      </dl>
    </section>
  )
}

function DField({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="truncate text-sm text-brand-navy" title={value || ""}>
        {value && String(value).trim() ? value : <span className="text-slate-300">—</span>}
      </dd>
    </div>
  )
}

// Quick "+N" helpers produce a local datetime string for the input default.
function ReminderSection({ lead, busy, onSet }) {
  const [when, setWhen] = useState('')
  const [note, setNote] = useState('')

  function quick(hours) {
    const d = new Date(Date.now() + hours * 3600 * 1000)
    // format for <input type="datetime-local"> (local time, no seconds)
    const pad = (n) => String(n).padStart(2, '0')
    setWhen(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)
  }

  function submit(e) {
    e.preventDefault()
    if (!when) return
    // datetime-local is local time; convert to ISO (UTC) for the API
    const iso = new Date(when).toISOString()
    onSet(iso, note.trim() || null)
    setWhen(''); setNote('')
  }

  return (
    <section className="card p-4">
      <h4 className="mb-2 text-sm font-bold text-brand-navy">⏰ Set a follow-up reminder</h4>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {[['+1h', 1], ['+3h', 3], ['Tomorrow', 24], ['+2 days', 48], ['Next week', 168]].map(([label, h]) => (
          <button key={label} type="button" onClick={() => quick(h)}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-navy hover:border-brand-primary hover:text-brand-primary">
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-2">
        <input type="datetime-local" className="field" value={when} onChange={(e) => setWhen(e.target.value)} />
        <input className="field" placeholder="What's the follow-up? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-primary w-full" disabled={busy || !when}>Set reminder</button>
      </form>
      <p className="mt-2 text-xs text-slate-400">
        Shows on the <b>Follow-ups</b> screen{lead.assignedMemberName ? ` for ${lead.assignedMemberName}` : ''} when due.
      </p>
    </section>
  )
}

function renderEvent(ev) {
  const p = ev.payload || {}
  switch (ev.type) {
    case "NOTE":
      return <>📝 {p.note}</>
    case "STATUS_CHANGE":
      return <>🔄 Status changed from <b>{p.from}</b> to <b>{p.to}</b></>
    case "ASSIGNMENT":
      return <>👤 Assigned to <b>{p.memberName || "a member"}</b></>
    case "CALL":
      return <>📞 Call logged</>
    case "MAIL":
      return <>✉️ Mail sent</>
    case "PAYMENT":
      return <>💳 Payment request</>
    case "REMINDER":
      return <>⏰ Reminder set</>
    default:
      return ev.type
  }
}
