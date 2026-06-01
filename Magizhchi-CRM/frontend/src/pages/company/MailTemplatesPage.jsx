import { useEffect, useState, useCallback } from 'react'
import { api } from '../../lib/api'
import Modal from '../../components/Modal.jsx'

export default function MailTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [vars, setVars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // template or {} for new

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [t, v] = await Promise.all([api('/mail-templates'), api('/mail-templates/variables')])
      setTemplates(t)
      setVars(v)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function remove(t) {
    if (!window.confirm(`Delete template ${t.code}?`)) return
    try { await api(`/mail-templates/${t.id}`, { method: 'DELETE' }); await load() }
    catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Mail Templates</h1>
          <p className="text-sm text-slate-500">
            Reusable emails your team sends by <b>code</b>. Use merge tags like <code>{'{{lead.name}}'}</code>.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({})}>+ New template</button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-2xl">✉️</div>
            <h3 className="mt-4 font-bold text-brand-navy">No templates yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Create templates like <b>WELCOME01</b> or <b>FOLLOWUP02</b> — members pick the code to email a lead.
            </p>
            <button className="btn-primary mt-4" onClick={() => setEditing({})}>+ New template</button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {templates.map((t) => (
              <li key={t.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="chip mt-0.5 bg-brand-navy/10 font-mono text-brand-navy">{t.code}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-brand-navy">{t.subject}</div>
                  <div className="truncate text-xs text-slate-400">{t.body}</div>
                </div>
                <button className="btn-ghost text-sm" onClick={() => setEditing(t)}>Edit</button>
                <button className="btn-ghost text-sm text-rose-600" onClick={() => remove(t)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TemplateEditor template={editing} vars={vars}
        onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load() }} />
    </div>
  )
}

function TemplateEditor({ template, vars, onClose, onSaved }) {
  const open = template != null
  const isNew = template && !template.id
  const [form, setForm] = useState({ code: '', subject: '', body: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (template) {
      setForm({ code: template.code || '', subject: template.subject || '', body: template.body || '' })
      setErr('')
    }
  }, [template])

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }
  function insertVar(v) { set('body', (form.body || '') + `{{${v}}}`) }

  async function save() {
    if (!form.code.trim() || !form.subject.trim() || !form.body.trim()) {
      setErr('Code, subject, and body are all required.'); return
    }
    setBusy(true); setErr('')
    try {
      const body = { code: form.code.trim(), subject: form.subject.trim(), body: form.body }
      if (isNew) await api('/mail-templates', { method: 'POST', body })
      else await api(`/mail-templates/${template.id}`, { method: 'PUT', body })
      await onSaved()
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl"
      title={isNew ? 'New mail template' : 'Edit template'}
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save template'}</button>
      </>}>
      {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
      <div className="space-y-3">
        <div>
          <label className="label">Code</label>
          <input className="field font-mono uppercase" value={form.code}
            onChange={(e) => set('code', e.target.value)} placeholder="WELCOME01" />
          <p className="mt-1 text-xs text-slate-400">Short unique code members will pick (auto-uppercased).</p>
        </div>
        <div>
          <label className="label">Subject</label>
          <input className="field" value={form.subject} onChange={(e) => set('subject', e.target.value)}
            placeholder="Welcome to {{company.name}}, {{lead.name}}!" />
        </div>
        <div>
          <label className="label">Body</label>
          <textarea rows={7} className="field" value={form.body} onChange={(e) => set('body', e.target.value)}
            placeholder={'Hi {{lead.name}},\n\nThanks for your interest...\n\n— {{member.name}}, {{company.name}}'} />
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-slate-500">Merge tags (click to insert into body):</div>
          <div className="flex flex-wrap gap-1.5">
            {vars.map((v) => (
              <button key={v} type="button" onClick={() => insertVar(v)}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs text-brand-primary hover:border-brand-primary">
                {'{{'}{v}{'}}'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
