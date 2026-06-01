import { useEffect, useState, useCallback, useRef } from 'react'
import { api, getToken } from '../../lib/api'
import Modal from '../../components/Modal.jsx'
import Drawer from '../../components/Drawer.jsx'
import CopyField from '../../components/CopyField.jsx'

const ORIGIN = window.location.origin

const CHANNELS = {
  REST: { label: 'Web Service (API)', icon: '🔌', tone: 'bg-brand-navy/10 text-brand-navy' },
  INSTAGRAM: { label: 'Instagram Form', icon: '📸', tone: 'bg-pink-100 text-pink-700' },
  GOOGLE_FORM: { label: 'Google Form', icon: '📝', tone: 'bg-emerald-100 text-emerald-700' },
  GENERIC: { label: 'Generic Webhook', icon: '🪝', tone: 'bg-brand-info/20 text-sky-700' },
}

// The four "Add leads from…" tiles the user picks from.
const SOURCE_TILES = [
  { key: 'EXCEL', icon: '📊', title: 'Excel / CSV', desc: 'Upload a spreadsheet of leads.', accent: 'border-emerald-200' },
  { key: 'REST', icon: '🔌', title: 'Web Service', desc: 'Let another system POST leads via API.', accent: 'border-brand-navy/20' },
  { key: 'INSTAGRAM', icon: '📸', title: 'Instagram Form', desc: 'Receive Instagram lead-ad submissions.', accent: 'border-pink-200' },
  { key: 'GOOGLE_FORM', icon: '📝', title: 'Google Form', desc: 'Receive Google Form responses.', accent: 'border-emerald-200' },
]

export default function LeadSourcesPage() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [excelOpen, setExcelOpen] = useState(false)
  const [createChannel, setCreateChannel] = useState(null) // REST | INSTAGRAM | GOOGLE_FORM
  const [detail, setDetail] = useState(null) // source object incl. one-time key

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSources(await api('/lead-sources'))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function pickTile(key) {
    if (key === 'EXCEL') setExcelOpen(true)
    else setCreateChannel(key)
  }

  async function toggle(s) {
    try {
      await api(`/lead-sources/${s.id}/enabled?value=${!s.enabled}`, { method: 'PATCH' })
      await load()
    } catch (e) { setError(e.message) }
  }

  async function remove(s) {
    if (!window.confirm(`Delete source "${s.name}"? Existing leads are kept.`)) return
    try {
      await api(`/lead-sources/${s.id}`, { method: 'DELETE' })
      await load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Lead Sources</h1>
        <p className="text-sm text-slate-500">
          Add leads from a spreadsheet, your website/app, Instagram, or Google Forms.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {/* Add-source tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SOURCE_TILES.map((t) => (
          <button
            key={t.key}
            onClick={() => pickTile(t.key)}
            className={`card flex flex-col items-start gap-2 border-2 ${t.accent} p-5 text-left transition hover:-translate-y-0.5 hover:shadow-glow`}
          >
            <span className="text-3xl">{t.icon}</span>
            <span className="font-bold text-brand-navy">{t.title}</span>
            <span className="text-xs text-slate-500">{t.desc}</span>
            <span className="mt-1 text-sm font-semibold text-brand-primary">+ Add</span>
          </button>
        ))}
      </div>

      {/* Connected sources */}
      <div className="card">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h3 className="font-bold text-brand-navy">Connected sources</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No API or webhook sources yet. Pick <b>Web Service</b>, <b>Instagram</b>, or <b>Google Form</b> above to create one.
            <div className="mt-1 text-xs text-slate-400">(Excel/CSV uploads import immediately — they don't create a source.)</div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {sources.map((s) => {
              const ch = CHANNELS[s.channel] || CHANNELS.GENERIC
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className={`grid h-10 w-10 flex-none place-items-center rounded-xl text-lg ${ch.tone}`}>
                    {ch.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-brand-navy">{s.name}</div>
                    <div className="text-xs text-slate-400">
                      {ch.label} · {s.type}
                    </div>
                  </div>
                  <span className={`chip ${s.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <button className="btn-ghost text-sm" onClick={() => setDetail(s)}>Setup</button>
                  <button className="btn-ghost text-sm" onClick={() => toggle(s)}>
                    {s.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button className="btn-ghost text-sm text-rose-600" onClick={() => remove(s)}>Delete</button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ExcelModal open={excelOpen} onClose={() => setExcelOpen(false)} onDone={load} />

      <CreateSourceModal
        channel={createChannel}
        onClose={() => setCreateChannel(null)}
        onCreated={async (created) => {
          setCreateChannel(null)
          await load()
          setDetail(created) // open setup with the one-time key visible
        }}
      />

      <SetupDrawer source={detail} onClose={() => setDetail(null)} />
    </div>
  )
}

function ExcelModal({ open, onClose, onDone }) {
  // 3-step wizard: pick file -> map columns -> result
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [map, setMap] = useState({ nameColumn: '', phoneColumns: [''], emailColumn: '', dedupe: true })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const inFlight = useRef(false)

  function resetAll() {
    setStep(1); setFile(null); setPreview(null)
    setMap({ nameColumn: '', phoneColumns: [''], emailColumn: '', dedupe: true })
    setResult(null); setErr(''); setBusy(false); inFlight.current = false
  }
  function close() { resetAll(); onClose() }

  async function doPreview(e) {
    e.preventDefault()
    if (!file || busy) return
    setBusy(true); setErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/lead-sources/preview-excel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: 'no-store',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Could not read the file')
      setPreview(data)
      const sug = data.suggested || {}
      setMap({
        nameColumn: sug.name || '',
        phoneColumns: sug.phones && sug.phones.length ? sug.phones : [''],
        emailColumn: sug.email || '',
        dedupe: true,
      })
      setStep(2)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  async function doImport() {
    if (busy || inFlight.current || result) return
    if (!map.nameColumn && !map.emailColumn && !map.phoneColumns.some(Boolean)) {
      setErr('Map at least a Name, Phone, or Email column.')
      return
    }
    inFlight.current = true
    setBusy(true); setErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mapping', JSON.stringify({
        nameColumn: map.nameColumn || null,
        phoneColumns: map.phoneColumns.filter(Boolean),
        emailColumn: map.emailColumn || null,
        dedupe: map.dedupe,
      }))
      const res = await fetch('/api/v1/lead-sources/import-excel', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        cache: 'no-store',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Import failed')
      setResult(data); setStep(3)
      await onDone()
    } catch (e2) {
      setErr(e2.message)
      inFlight.current = false
    } finally {
      setBusy(false)
    }
  }

  function setPhoneAt(i, val) {
    setMap((m) => { const phoneColumns = [...m.phoneColumns]; phoneColumns[i] = val; return { ...m, phoneColumns } })
  }
  function addPhone() { setMap((m) => ({ ...m, phoneColumns: [...m.phoneColumns, ''] })) }
  function removePhone(i) { setMap((m) => ({ ...m, phoneColumns: m.phoneColumns.filter((_, idx) => idx !== i) })) }

  const headers = preview?.headers || []

  const footer =
    step === 1 ? (
      <>
        <button className="btn-ghost" onClick={close}>Cancel</button>
        <button className="btn-primary" form="excel-pick" disabled={busy || !file}>
          {busy ? 'Reading…' : 'Next: map columns'}
        </button>
      </>
    ) : step === 2 ? (
      <>
        <button className="btn-ghost" onClick={() => { setStep(1); setErr('') }}>Back</button>
        <button className="btn-primary" onClick={doImport} disabled={busy}>
          {busy ? 'Importing…' : `Import ${preview?.totalRows || 0} rows`}
        </button>
      </>
    ) : (
      <button className="btn-primary" onClick={close}>Done</button>
    )

  return (
    <Modal open={open} onClose={close} title="Import from Excel / CSV" footer={footer} maxWidth="max-w-2xl">
      {err && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      {step === 1 && (
        <form id="excel-pick" onSubmit={doPreview} className="space-y-3">
          <p className="text-sm text-slate-600">
            Upload an <b>.xlsx</b> or <b>.csv</b> with a header row. Next you'll choose which
            columns map to <b>Name</b>, <b>Phone</b> (you can pick more than one), and{' '}
            <b>Email</b>. Every column is saved on the lead.
          </p>
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setErr('') }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-brand-primaryDark"
          />
          {file && <p className="text-xs text-slate-400">Selected: {file.name}</p>}
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Found <b>{headers.length}</b> columns and <b>{preview?.totalRows}</b> rows. Map them
            below — we pre-filled best guesses.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Name column</label>
              <select className="field" value={map.nameColumn} onChange={(e) => setMap((m) => ({ ...m, nameColumn: e.target.value }))}>
                <option value="">— none —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Email column</label>
              <select className="field" value={map.emailColumn} onChange={(e) => setMap((m) => ({ ...m, emailColumn: e.target.value }))}>
                <option value="">— none —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Phone column(s)</label>
            <div className="space-y-2">
              {map.phoneColumns.map((pc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select className="field flex-1" value={pc} onChange={(e) => setPhoneAt(i, e.target.value)}>
                    <option value="">— none —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {map.phoneColumns.length > 1 && (
                    <button type="button" className="btn-ghost px-3 text-rose-600" onClick={() => removePhone(i)} title="Remove">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-sm font-semibold text-brand-primary hover:underline" onClick={addPhone}>
              + Add another phone column
            </button>
            <p className="mt-1 text-xs text-slate-400">
              The first non-empty one is the primary contact; all are saved on the lead.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-navy">
            <input type="checkbox" checked={map.dedupe} onChange={(e) => setMap((m) => ({ ...m, dedupe: e.target.checked }))} />
            Skip duplicates (same phone or email already in this company)
          </label>

          {preview?.sampleRows?.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Preview (first {preview.sampleRows.length} rows)
              </div>
              <div className="max-h-52 overflow-auto rounded-lg border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left text-slate-500">
                      {headers.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1.5 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.map((r, ri) => (
                      <tr key={ri} className="border-t border-slate-50">
                        {headers.map((h) => <td key={h} className="whitespace-nowrap px-2 py-1.5 text-slate-600">{r[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 3 && result && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <div className="text-base font-bold text-emerald-800">
            ✓ Imported {result.imported} lead{result.imported === 1 ? '' : 's'}
            {result.skipped ? `, skipped ${result.skipped}` : ''}.
          </div>
          {result.errors?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-emerald-700">
              {result.errors.map((er, i) => <li key={i}>{er}</li>)}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}

function CreateSourceModal({ channel, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const open = !!channel
  const isApi = channel === 'REST'

  const meta = CHANNELS[channel] || {}

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const created = await api('/lead-sources', {
        method: 'POST',
        body: {
          name: name || meta.label,
          type: isApi ? 'API' : 'WEBHOOK',
          channel: isApi ? undefined : channel,
        },
      })
      setName('')
      await onCreated(created)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Add ${meta.label || 'source'}`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" form="create-source-form" disabled={busy}>
            {busy ? 'Creating…' : 'Create source'}
          </button>
        </>
      }
    >
      <form id="create-source-form" onSubmit={submit} className="space-y-3">
        {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div>
          <label className="label">Source name</label>
          <input
            className="field"
            placeholder={meta.label}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <p className="text-sm text-slate-500">
          {isApi
            ? 'We’ll generate a secret API key and an endpoint URL. Your website or app posts leads to it.'
            : 'We’ll generate a unique webhook URL. Connect it in the next step and leads flow in automatically.'}
        </p>
      </form>
    </Modal>
  )
}

function SetupDrawer({ source, onClose }) {
  if (!source) return null
  const isApi = source.type === 'API'
  const url = ORIGIN + source.path
  const ch = source.channel

  return (
    <Drawer
      open={!!source}
      onClose={onClose}
      title={`Set up: ${source.name}`}
      subtitle={(CHANNELS[ch] || {}).label}
    >
      <div className="space-y-5">
        {source.apiKeyOnce && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 text-sm font-semibold text-amber-800">
              ⚠️ Copy your API key now — it won’t be shown again.
            </div>
            <CopyField label="API key" value={source.apiKeyOnce} />
          </div>
        )}

        <section className="card p-4">
          <h4 className="mb-3 text-sm font-bold text-brand-navy">Endpoint</h4>
          <CopyField label={isApi ? 'POST URL' : 'Webhook URL'} value={url} />
          {isApi && (
            <div className="mt-3">
              <CopyField label="Auth header" value={`${source.apiKeyHeader}: <your-api-key>`} mono />
            </div>
          )}
        </section>

        {isApi && <ApiGuide url={url} header={source.apiKeyHeader} />}
        {ch === 'INSTAGRAM' && <InstagramGuide url={url} />}
        {ch === 'GOOGLE_FORM' && <GoogleFormGuide url={url} />}
        {ch === 'GENERIC' && <GenericGuide url={url} />}

        <section className="card p-4">
          <h4 className="mb-2 text-sm font-bold text-brand-navy">Field mapping</h4>
          <p className="text-sm text-slate-600">
            We automatically detect <b>name</b>, <b>phone</b> and <b>email</b> from common
            field names (e.g. “full_name”, “phone_number”, “email”). Send any of those keys
            and the lead is created and (if Automatic assignment is on) routed to a member.
          </p>
        </section>
      </div>
    </Drawer>
  )
}

function CodeBlock({ children }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-brand-navyDeep p-3 text-xs leading-relaxed text-slate-100">
      {children}
    </pre>
  )
}

function ApiGuide({ url, header }) {
  return (
    <section className="card p-4">
      <h4 className="mb-1 text-sm font-bold text-brand-navy">How to send a lead</h4>
      <p className="text-sm text-slate-600">POST JSON from your website/app/backend:</p>
      <CodeBlock>{`curl -X POST "${url}" \\
  -H "${header}: <your-api-key>" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Jane Doe","phone":"+91...","email":"jane@x.com"}'`}</CodeBlock>
    </section>
  )
}

function InstagramGuide({ url }) {
  return (
    <section className="card p-4">
      <h4 className="mb-1 text-sm font-bold text-brand-navy">Connect Instagram Lead Ads</h4>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
        <li>In Meta Business Suite, open your Lead Ad form’s automation / integration.</li>
        <li>
          Use a connector (e.g. Zapier / Make / Meta webhook relay) and set the delivery
          URL to the webhook above.
        </li>
        <li>Map the form fields to <code>name</code>, <code>phone</code>, <code>email</code> (or send Instagram’s native <code>field_data</code> — we parse it automatically).</li>
      </ol>
      <p className="mt-2 text-xs text-slate-400">
        We accept Instagram’s <code>field_data</code> array shape directly.
      </p>
    </section>
  )
}

function GoogleFormGuide({ url }) {
  return (
    <section className="card p-4">
      <h4 className="mb-1 text-sm font-bold text-brand-navy">Connect a Google Form</h4>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
        <li>Open your Form’s linked Google Sheet → <b>Extensions → Apps Script</b>.</li>
        <li>Paste the script below, then add an <b>On form submit</b> trigger.</li>
      </ol>
      <CodeBlock>{`function onFormSubmit(e) {
  var r = {};
  e.namedValues && Object.keys(e.namedValues)
    .forEach(function(k){ r[k] = e.namedValues[k][0]; });
  UrlFetchApp.fetch("${url}", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ answers: r })
  });
}`}</CodeBlock>
    </section>
  )
}

function GenericGuide({ url }) {
  return (
    <section className="card p-4">
      <h4 className="mb-1 text-sm font-bold text-brand-navy">Generic webhook</h4>
      <p className="text-sm text-slate-600">POST a flat JSON object of fields:</p>
      <CodeBlock>{`curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Jane","phone":"+91...","email":"jane@x.com"}'`}</CodeBlock>
    </section>
  )
}
