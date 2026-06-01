import { useState } from 'react'

export default function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          className={`field flex-1 ${mono ? 'font-mono text-xs' : ''}`}
        />
        <button type="button" onClick={copy} className="btn-navy whitespace-nowrap">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
