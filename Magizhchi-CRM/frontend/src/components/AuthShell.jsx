import Logo from './Logo.jsx'

// Split-screen auth layout: brand panel + form panel.
export default function AuthShell({ children, title, subtitle }) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-navy lg:block">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-primary/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-info/20 blur-3xl" />
        <div className="absolute right-10 top-24 h-24 w-24 rounded-full bg-brand-highlight/30 blur-2xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold leading-tight text-white">
              Turn every lead into a{' '}
              <span className="text-brand-highlight">closed deal.</span>
            </h1>
            <p className="mt-4 text-lg text-white/70">
              One control center for your whole team — capture, assign, follow up
              and close. Built for every business.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {['Lead capture', 'Smart assignment', 'Follow-ups', 'Payments'].map((t) => (
                <span
                  key={t}
                  className="chip border border-white/15 bg-white/10 text-white/90"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Magizhchi Software
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-navy">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
