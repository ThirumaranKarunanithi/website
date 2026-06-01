import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'

function fmt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

// Bucket a pending reminder into Overdue / Today / Upcoming.
function bucketOf(r) {
  const now = new Date()
  const when = new Date(r.remindAt)
  if (when < now) return 'overdue'
  if (startOfDay(when).getTime() === startOfDay(now).getTime()) return 'today'
  return 'upcoming'
}

const BUCKETS = [
  { key: 'overdue', label: 'Overdue', tone: 'text-rose-600', dot: 'bg-rose-500' },
  { key: 'today', label: 'Today', tone: 'text-amber-600', dot: 'bg-brand-highlight' },
  { key: 'upcoming', label: 'Upcoming', tone: 'text-brand-navy', dot: 'bg-brand-info' },
]

export default function FollowupsPage({ onOpenLead }) {
  const [pending, setPending] = useState([])
  const [done, setDone] = useState([])
  const [showDone, setShowDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [p, d] = await Promise.all([
        api('/reminders?status=PENDING'),
        api('/reminders?status=DONE'),
      ])
      setPending(p)
      setDone(d)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function markDone(r) {
    const label = r.leadName ? ` for ${r.leadName}` : ''
    if (!window.confirm(`Mark this follow-up${label} as done? It will move to Completed.`)) return
    try { await api(`/reminders/${r.id}/done`, { method: 'PATCH' }); await load() }
    catch (e) { setError(e.message) }
  }
  async function remove(r) {
    if (!window.confirm('Delete this reminder?')) return
    try { await api(`/reminders/${r.id}`, { method: 'DELETE' }); await load() }
    catch (e) { setError(e.message) }
  }

  const grouped = { overdue: [], today: [], upcoming: [] }
  pending.forEach((r) => grouped[bucketOf(r)].push(r))

  function Row({ r, doneRow }) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3">
        <button
          onClick={() => onOpenLead?.(r.leadId)}
          className="min-w-0 flex-1 text-left"
          title="Open this lead"
        >
          <div className="font-semibold text-brand-navy hover:text-brand-primary hover:underline">
            {r.leadName || 'Lead'}{r.leadPhone ? <span className="font-normal text-slate-400"> · {r.leadPhone}</span> : ''}
          </div>
          {r.note && <div className="text-sm text-slate-600">{r.note}</div>}
          <div className="text-xs text-slate-400">
            {fmt(r.remindAt)}{r.memberName ? ` · ${r.memberName}` : ''}
          </div>
        </button>
        <button className="btn-ghost border border-slate-200 px-3 py-1.5 text-sm" onClick={() => onOpenLead?.(r.leadId)}>
          Open lead
        </button>
        {!doneRow && <button className="btn-primary px-3 py-1.5 text-sm" onClick={() => markDone(r)}>Mark done</button>}
        <button className="btn-ghost px-3 py-1.5 text-sm text-rose-600" onClick={() => remove(r)}>Delete</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Follow-ups</h1>
          <p className="text-sm text-slate-500">All reminders set on your leads, grouped by when they're due.</p>
        </div>
        <button className="btn-ghost border border-slate-200" onClick={() => setShowDone((s) => !s)}>
          {showDone ? 'Hide completed' : `Show completed (${done.length})`}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      {/* Count chips */}
      <div className="flex flex-wrap gap-3">
        {BUCKETS.map((b) => (
          <div key={b.key} className="card flex items-center gap-2 px-4 py-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${b.dot}`} />
            <span className="text-sm font-medium text-slate-500">{b.label}</span>
            <span className={`text-lg font-extrabold ${b.tone}`}>{grouped[b.key].length}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 text-center text-slate-400">Loading…</div>
      ) : pending.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-2xl">⏰</div>
          <h3 className="mt-4 font-bold text-brand-navy">No follow-ups yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Open a lead and use <b>Set a follow-up reminder</b> to schedule your next touchpoint.
          </p>
        </div>
      ) : (
        BUCKETS.map((b) => grouped[b.key].length > 0 && (
          <section key={b.key}>
            <h3 className={`mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${b.tone}`}>
              <span className={`h-2 w-2 rounded-full ${b.dot}`} /> {b.label} ({grouped[b.key].length})
            </h3>
            <div className="space-y-2">
              {grouped[b.key].map((r) => <Row key={r.id} r={r} />)}
            </div>
          </section>
        ))
      )}

      {showDone && done.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">Completed</h3>
          <div className="space-y-2 opacity-70">
            {done.map((r) => <Row key={r.id} r={r} doneRow />)}
          </div>
        </section>
      )}
    </div>
  )
}
