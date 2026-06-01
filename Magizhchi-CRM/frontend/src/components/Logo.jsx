export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand-primary shadow-glow">
        <span className="text-lg font-extrabold text-white">M</span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-highlight" />
      </div>
      <div className="leading-tight">
        <div className="text-base font-extrabold tracking-tight text-brand-navy">
          Magizhchi <span className="text-brand-primary">CRM</span>
        </div>
      </div>
    </div>
  )
}
