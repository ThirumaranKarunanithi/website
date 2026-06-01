const MAP = {
  NEW: { label: 'New', cls: 'bg-brand-navy/10 text-brand-navy' },
  ASSIGNED: { label: 'Assigned', cls: 'bg-brand-info/20 text-sky-700' },
  FOLLOW_UP: { label: 'Follow-up', cls: 'bg-brand-highlight/25 text-amber-700' },
  WON: { label: 'Won', cls: 'bg-emerald-100 text-emerald-700' },
  LOST: { label: 'Lost', cls: 'bg-rose-100 text-rose-700' },
}

export default function StatusBadge({ status }) {
  const s = MAP[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`chip ${s.cls}`}>{s.label}</span>
}

export const STATUS_OPTIONS = Object.keys(MAP)
export const STATUS_LABELS = Object.fromEntries(
  Object.entries(MAP).map(([k, v]) => [k, v.label]),
)
