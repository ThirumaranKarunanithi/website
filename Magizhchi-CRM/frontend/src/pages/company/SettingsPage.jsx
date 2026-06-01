import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'

const OPS = [
  { value: 'equals', label: 'is exactly' },
  { value: 'contains', label: 'contains' },
  { value: 'in', label: 'is one of (comma list)' },
  { value: 'gte', label: '≥ (number)' },
  { value: 'lte', label: '≤ (number)' },
]

export default function SettingsPage() {
  const [cfg, setCfg] = useState(null) // { mode, fallback, routes:[] }
  const [members, setMembers] = useState([])
  const [fields, setFields] = useState([]) // suggested field keys
  const [hidden, setHidden] = useState(new Set()) // normalized hidden field keys
  const [visSaved, setVisSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const norm = (k) => k.toLowerCase().replace(/[\s_-]/g, '')

  const load = useCallback(async () => {
    setError('')
    try {
      const [c, m, leads, vis] = await Promise.all([
        api('/settings/assignment/config'),
        api('/leads/assignable-members'),
        api('/leads'),
        api('/settings/visibility'),
      ])
      setCfg({ mode: c.mode, fallback: c.fallback || 'LEAST_LOADED', fallbackMemberId: c.fallbackMemberId || '', routes: c.routes || [] })
      setMembers(m)
      // suggest field keys from existing leads' core + custom fields
      const keys = new Set(['name', 'phone', 'email', 'source'])
      leads.forEach((l) => Object.keys(l.customFields || {}).forEach((k) => keys.add(k)))
      setFields(Array.from(keys))
      setHidden(new Set(vis.filter((v) => !v.visible).map((v) => norm(v.fieldKey))))
    } catch (e) { setError(e.message) }
  }, [])

  useEffect(() => { load() }, [load])

  function patch(p) { setCfg((c) => ({ ...c, ...p })); setSaved(false) }

  async function setMode(mode) {
    if (!cfg || mode === cfg.mode) return
    patch({ mode })
    // persist immediately (mode toggle), keep routes/fallback
    await save({ ...cfg, mode })
  }

  function addRoute() {
    patch({ routes: [...cfg.routes, { field: '', op: 'equals', value: '', memberAccountId: '' }] })
  }
  function setRoute(i, p) {
    const routes = cfg.routes.map((r, idx) => (idx === i ? { ...r, ...p } : r))
    patch({ routes })
  }
  function delRoute(i) { patch({ routes: cfg.routes.filter((_, idx) => idx !== i) }) }

  async function save(next = cfg) {
    setSaving(true); setError(''); setSaved(false)
    try {
      // strip incomplete routes (need field + member)
      const routes = next.routes
        .filter((r) => r.field && r.memberAccountId)
        .map((r) => ({ field: r.field, op: r.op || 'equals', value: r.value || '', memberAccountId: r.memberAccountId }))
      const res = await api('/settings/assignment/config', {
        method: 'PUT',
        body: {
          mode: next.mode,
          fallback: next.fallback,
          fallbackMemberId: next.fallback === 'MEMBER' ? next.fallbackMemberId || null : null,
          routes,
        },
      })
      setCfg({ mode: res.mode, fallback: res.fallback, fallbackMemberId: res.fallbackMemberId || '', routes: res.routes || [] })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function saveVisibility() {
    setSaving(true); setError(''); setVisSaved(false)
    try {
      // send the hidden field keys (use the original-cased keys that match)
      const hiddenKeys = fields.filter((f) => hidden.has(norm(f)))
      await api('/settings/visibility', { method: 'PUT', body: { hidden: hiddenKeys } })
      setVisSaved(true); setTimeout(() => setVisSaved(false), 2500)
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  if (!cfg) return <div className="card p-10 text-center text-slate-400">Loading settings…</div>

  const automatic = cfg.mode === 'LOAD_BALANCED'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Settings</h1>
        <p className="text-sm text-slate-500">Control how your CRM behaves for the whole company.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      {/* Auto-assign on/off */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-navy">Auto-assign new leads</h3>
            <p className="mt-1 text-sm text-slate-500">
              When ON, every incoming lead is assigned automatically the moment it arrives — no prompt.
            </p>
          </div>
          <button
            onClick={() => setMode(automatic ? 'MANUAL' : 'LOAD_BALANCED')}
            disabled={saving}
            className={`relative h-7 w-12 flex-none rounded-full transition ${automatic ? 'bg-brand-primary' : 'bg-slate-300'}`}
            title={automatic ? 'Turn off' : 'Turn on'}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${automatic ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <div className="mt-2">
          <span className={`chip ${automatic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {automatic ? 'Automatic — ON' : 'Manual — OFF'}
          </span>
          {saved && <span className="chip ml-2 bg-emerald-100 text-emerald-700">✓ Saved</span>}
        </div>
      </section>

      {/* Routing rules — only when automatic */}
      {automatic && (
        <section className="card p-5">
          <h3 className="font-bold text-brand-navy">Assignment rules</h3>
          <p className="mt-1 text-sm text-slate-500">
            Route leads to specific members by their details (area, age, occupation, course…). Rules run
            top-to-bottom; the <b>first match wins</b>. If none match, the fallback applies.
          </p>

          {members.length === 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Add team members first (Members tab) — rules must target an active member.
            </div>
          )}

          <div className="mt-4 space-y-3">
            {cfg.routes.length === 0 && (
              <p className="text-sm text-slate-400">No rules yet — leads will use the fallback below.</p>
            )}
            {cfg.routes.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-sm font-semibold text-slate-500">If</span>
                {/* field */}
                <input
                  list="lead-fields"
                  className="field w-36 py-1.5 text-sm"
                  placeholder="field (e.g. area)"
                  value={r.field}
                  onChange={(e) => setRoute(i, { field: e.target.value })}
                />
                {/* op */}
                <select className="field w-44 py-1.5 text-sm" value={r.op} onChange={(e) => setRoute(i, { op: e.target.value })}>
                  {OPS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {/* value */}
                <input
                  className="field w-36 py-1.5 text-sm"
                  placeholder="value"
                  value={r.value}
                  onChange={(e) => setRoute(i, { value: e.target.value })}
                />
                <span className="text-sm font-semibold text-slate-500">→ assign to</span>
                {/* member */}
                <select className="field w-44 py-1.5 text-sm" value={r.memberAccountId} onChange={(e) => setRoute(i, { memberAccountId: e.target.value })}>
                  <option value="">— member —</option>
                  {members.map((m) => <option key={m.accountId} value={m.accountId}>{m.displayName}</option>)}
                </select>
                <button className="btn-ghost px-2 py-1 text-sm text-rose-600" onClick={() => delRoute(i)} title="Remove rule">✕</button>
              </div>
            ))}
            <datalist id="lead-fields">
              {fields.map((f) => <option key={f} value={f} />)}
            </datalist>

            <button className="text-sm font-semibold text-brand-primary hover:underline" onClick={addRoute}>
              + Add rule
            </button>
          </div>

          {/* fallback */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <label className="label">If no rule matches…</label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="field max-w-xs"
                value={cfg.fallback}
                onChange={(e) => patch({ fallback: e.target.value })}
              >
                <option value="LEAST_LOADED">Assign to the least-loaded member (balance the team)</option>
                <option value="MEMBER">Assign all to one specific member</option>
                <option value="UNASSIGNED">Leave unassigned (a person handles it manually)</option>
              </select>
              {cfg.fallback === 'MEMBER' && (
                <select
                  className="field max-w-xs"
                  value={cfg.fallbackMemberId || ''}
                  onChange={(e) => patch({ fallbackMemberId: e.target.value })}
                >
                  <option value="">— choose member —</option>
                  {members.map((m) => <option key={m.accountId} value={m.accountId}>{m.displayName}</option>)}
                </select>
              )}
            </div>
            {cfg.fallback === 'MEMBER' && (
              <p className="mt-1 text-xs text-slate-400">
                With no rules above, this routes <b>every</b> incoming lead to the chosen member.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button className="btn-primary" onClick={() => save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save rules'}
            </button>
            {saved && <span className="chip bg-emerald-100 text-emerald-700">✓ Saved</span>}
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Example: <b>If</b> area <b>is exactly</b> Madurai <b>→ assign to</b> Priya. Or age <b>≤</b> 18 → Junior counsellor.
          </p>
        </section>
      )}

      {/* Field visibility for members */}
      <section className="card p-5">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-bold text-brand-navy">Field visibility for members</h3>
          {visSaved && <span className="chip bg-emerald-100 text-emerald-700">✓ Saved</span>}
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Choose which lead fields your members can see. Turned-off fields are hidden from the member's
          lead list and detail view. (Company/owner always sees everything.)
        </p>

        {fields.length === 0 ? (
          <p className="text-sm text-slate-400">No fields detected yet — import or add a lead first.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map((f) => {
              const isHidden = hidden.has(norm(f))
              return (
                <label key={f} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-sm font-medium text-brand-navy">{f}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setHidden((prev) => {
                        const next = new Set(prev)
                        if (next.has(norm(f))) next.delete(norm(f)); else next.add(norm(f))
                        return next
                      })
                      setVisSaved(false)
                    }}
                    className={`relative h-6 w-11 flex-none rounded-full transition ${isHidden ? 'bg-slate-300' : 'bg-brand-primary'}`}
                    title={isHidden ? 'Hidden from members — click to show' : 'Visible to members — click to hide'}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isHidden ? 'left-0.5' : 'left-[1.375rem]'}`} />
                  </button>
                </label>
              )
            })}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button className="btn-primary" disabled={saving} onClick={saveVisibility}>
            {saving ? 'Saving…' : 'Save visibility'}
          </button>
          {visSaved && <span className="chip bg-emerald-100 text-emerald-700">✓ Saved</span>}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Tip: hide sensitive columns (e.g. budget, source) while still letting members call and update leads.
        </p>
      </section>
    </div>
  )
}
