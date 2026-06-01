export default function StatCard({ label, value, tone = 'navy', hint }) {
  const tones = {
    navy: 'from-brand-navy to-brand-navyDeep text-white',
    orange: 'from-brand-primary to-brand-primaryDark text-white',
    info: 'from-brand-info to-sky-400 text-brand-navyDeep',
    yellow: 'from-brand-highlight to-amber-400 text-brand-navyDeep',
  }
  return (
    <div className={`card overflow-hidden bg-gradient-to-br p-5 ${tones[tone]}`}>
      <div className="text-sm font-medium opacity-80">{label}</div>
      <div className="mt-2 text-3xl font-extrabold">{value}</div>
      {hint && <div className="mt-1 text-xs opacity-70">{hint}</div>}
    </div>
  )
}
