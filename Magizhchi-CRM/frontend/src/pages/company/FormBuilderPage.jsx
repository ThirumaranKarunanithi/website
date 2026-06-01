import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import Modal from '../../components/Modal.jsx'

const TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'TEXTAREA', label: 'Paragraph' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'DATE', label: 'Date' },
  { value: 'DROPDOWN', label: 'Dropdown' },
]
const ROLES = [
  { value: 'NONE', label: 'Custom field (stored only)' },
  { value: 'NAME', label: 'Lead Name' },
  { value: 'PHONE', label: 'Primary Phone' },
  { value: 'EMAIL', label: 'Email' },
]

export default function FormBuilderPage() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // field object or {} for new

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setFields(await api('/lead-form')) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function move(idx, dir) {
    const next = [...fields]
    const j = idx + dir
    if (j < 0 || j >= next.length) return
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setFields(next)
    try {
      await api('/lead-form/reorder', { method: 'POST', body: { orderedIds: next.map((f) => f.id) } })
    } catch (e) { setError(e.message); load() }
  }

  async function remove(f) {
    if (!window.confirm(`Delete field "${f.label}"? Existing leads keep their data.`)) return
    try { await api(`/lead-form/${f.id}`, { method: 'DELETE' }); await load() }
    catch (e) { setError(e.message) }
  }

  async function resetDefault() {
    if (!window.confirm('Reset the form to the default Name / Phone / Email fields?')) return
    try { setFields(await api('/lead-form/reset', { method: 'POST' })) }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Lead Form Builder</h1>
          <p className="text-sm text-slate-500">
            Design the fields shown when you click <b>+ Add lead</b>. Drag order with the arrows.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost border border-slate-200" onClick={resetDefault}>Reset to default</button>
          <button className="btn-primary" onClick={() => setEditing({})}>+ Add field</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : fields.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No fields yet. Click <b>+ Add field</b>.</div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {fields.map((f, i) => (
              <li key={f.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex flex-col">
                  <button className="text-slate-400 hover:text-brand-navy disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
                  <button className="text-slate-400 hover:text-brand-navy disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === fields.length - 1}>▼</button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brand-navy">{f.label}</span>
                    {f.required && <span className="chip bg-rose-100 text-rose-700">required</span>}
                    {f.role !== 'NONE' && <span className="chip bg-brand-info/20 text-sky-700">{f.role.toLowerCase()}</span>}
                  </div>
                  <div className="text-xs text-slate-400">
                    {TYPES.find((t) => t.value === f.type)?.label || f.type} · key: {f.fieldKey}
                    {f.type === 'DROPDOWN' && f.options?.length ? ` · ${f.options.length} options` : ''}
                  </div>
                </div>
                <button className="btn-ghost text-sm" onClick={() => setEditing(f)}>Edit</button>
                <button className="btn-ghost text-sm text-rose-600" onClick={() => remove(f)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FieldEditor
        field={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => { setEditing(null); await load() }}
      />
    </div>
  )
}

function FieldEditor({ field, onClose, onSaved }) {
  const open = field != null
  const isNew = field && !field.id
  const [form, setForm] = useState({ label: '', type: 'TEXT', role: 'NONE', required: false, placeholder: '', options: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (field) {
      setForm({
        label: field.label || '',
        type: field.type || 'TEXT',
        role: field.role || 'NONE',
        required: !!field.required,
        placeholder: field.placeholder || '',
        options: (field.options || []).join(', '),
      })
      setErr('')
    }
  }, [field])

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function save() {
    if (!form.label.trim()) { setErr('Label is required.'); return }
    setBusy(true); setErr('')
    try {
      const body = {
        label: form.label.trim(),
        type: form.type,
        role: form.role,
        required: form.required,
        placeholder: form.placeholder || null,
        options: form.type === 'DROPDOWN'
          ? form.options.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      }
      if (isNew) await api('/lead-form', { method: 'POST', body })
      else await api(`/lead-form/${field.id}`, { method: 'PUT', body })
      await onSaved()
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'Add field' : 'Edit field'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save field'}</button>
        </>
      }
    >
      {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      <div className="space-y-3">
        <div>
          <label className="label">Field label</label>
          <input className="field" value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="e.g. Course Interested" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Input type</label>
            <select className="field" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Maps to</label>
            <select className="field" value={form.role} onChange={(e) => set('role', e.target.value)}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        {form.type === 'DROPDOWN' && (
          <div>
            <label className="label">Dropdown options (comma-separated)</label>
            <input className="field" value={form.options} onChange={(e) => set('options', e.target.value)} placeholder="Classroom, Online, Hybrid" />
          </div>
        )}
        <div>
          <label className="label">Placeholder (optional)</label>
          <input className="field" value={form.placeholder} onChange={(e) => set('placeholder', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-navy">
          <input type="checkbox" checked={form.required} onChange={(e) => set('required', e.target.checked)} />
          Required field
        </label>
        <p className="text-xs text-slate-400">
          "Maps to" links this field's value to the lead's Name / Phone / Email so it shows in the
          leads table. Custom fields are stored on the lead and shown in its Details.
        </p>
      </div>
    </Modal>
  )
}
