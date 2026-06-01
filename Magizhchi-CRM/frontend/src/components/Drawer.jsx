import { useEffect } from 'react'

// Right-side slide-over panel.
export default function Drawer({ open, onClose, title, subtitle, children, width = 'max-w-xl' }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-brand-navyDeep/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute right-0 top-0 flex h-full w-full ${width} flex-col bg-slate-50 shadow-2xl`}
        style={{ animation: 'fade-up 0.25s ease-out both' }}
      >
        <div className="flex items-start justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-brand-navy">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-navy"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
