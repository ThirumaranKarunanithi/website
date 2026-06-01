import { useAuth } from '../lib/auth.jsx'
import Logo from './Logo.jsx'

// Authenticated app shell: sidebar nav + topbar + content.
export default function AppLayout({ nav, active, onNavigate, children }) {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-100 bg-white md:flex">
        <div className="border-b border-slate-100 px-5 py-4">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const isActive = item.key === active
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-brand-navy/70 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button onClick={logout} className="btn-ghost w-full justify-start text-sm">
            ⏻ Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-3 backdrop-blur">
          <div className="text-sm font-semibold text-brand-navy">
            {nav.find((n) => n.key === active)?.label}
          </div>
          <div className="flex items-center gap-3">
            <span className="chip bg-brand-info/15 text-brand-navy">
              {user?.accountType === 'COMPANY' ? 'Company' : 'Member'}
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-navy text-sm font-bold text-white">
              {(user?.displayName || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  )
}
