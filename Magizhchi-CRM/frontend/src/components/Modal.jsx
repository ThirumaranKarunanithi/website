import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      // Prevent the page behind the modal from scrolling
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand-navyDeep/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Flex column capped to viewport height: header + footer stay pinned, body scrolls */}
      <div
        className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-xl2 bg-white shadow-card animate-fade-up`}
      >
        <div className="flex flex-none items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-base font-bold text-brand-navy">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-navy"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-none justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
