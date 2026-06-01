import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth.jsx'
import { api } from '../lib/api'
import AppLayout from '../components/AppLayout.jsx'
import StatCard from '../components/StatCard.jsx'
import LeadsPage from './company/LeadsPage.jsx'
import LeadSourcesPage from './company/LeadSourcesPage.jsx'
import FormBuilderPage from './company/FormBuilderPage.jsx'
import MembersPage from './company/MembersPage.jsx'
import FollowupsPage from './company/FollowupsPage.jsx'
import SettingsPage from './company/SettingsPage.jsx'
import MailTemplatesPage from './company/MailTemplatesPage.jsx'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'leads', label: 'Leads', icon: '🎯' },
  { key: 'followups', label: 'Follow-ups', icon: '⏰' },
  { key: 'members', label: 'Members', icon: '👥' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'ingestion', label: 'Lead Sources', icon: '⬇️' },
  { key: 'formbuilder', label: 'Lead Form', icon: '🧩' },
  { key: 'templates', label: 'Mail Templates', icon: '✉️' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
]

function Placeholder({ title, desc }) {
  return (
    <div className="card flex flex-col items-center justify-center p-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-primary/10 text-2xl">
        🚧
      </div>
      <h3 className="mt-4 text-lg font-bold text-brand-navy">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{desc}</p>
      <span className="chip mt-4 bg-brand-highlight/20 text-brand-navy">Coming in the next phase</span>
    </div>
  )
}

function Dashboard({ onNavigate }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [memberCount, setMemberCount] = useState(0)
  const [followupCount, setFollowupCount] = useState(0)

  useEffect(() => {
    // Live numbers — fail-soft so one error doesn't blank the whole dashboard.
    api('/leads/stats').then(setStats).catch(() => {})
    api('/members')
      .then((m) => setMemberCount(m.filter((x) => x.status === 'ACCEPTED').length))
      .catch(() => {})
    api('/reminders?status=PENDING')
      .then((r) => setFollowupCount(r.length))
      .catch(() => {})
  }, [])

  // Bar chart heights are relative to the largest bucket.
  const buckets = [
    ['New', stats?.isNew ?? 0, 'bg-brand-navy'],
    ['Assigned', stats?.assigned ?? 0, 'bg-brand-info'],
    ['Follow-up', stats?.followUp ?? 0, 'bg-brand-primary'],
    ['Won', stats?.won ?? 0, 'bg-emerald-400'],
    ['Lost', stats?.lost ?? 0, 'bg-rose-300'],
  ]
  const maxVal = Math.max(1, ...buckets.map(([, v]) => v))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">
          Welcome, {user?.displayName} 👋
        </h1>
        <p className="text-sm text-slate-500">Here's the pulse of your pipeline.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button onClick={() => onNavigate?.('leads')} className="text-left">
          <StatCard label="Leads received" value={stats?.total ?? '–'} tone="navy" hint="All time" />
        </button>
        <button onClick={() => onNavigate?.('followups')} className="text-left">
          <StatCard label="In follow-up" value={followupCount} tone="orange" hint="Pending reminders" />
        </button>
        <button onClick={() => onNavigate?.('leads')} className="text-left">
          <StatCard label="Closed — won" value={stats?.won ?? '–'} tone="info" hint="All time" />
        </button>
        <button onClick={() => onNavigate?.('members')} className="text-left">
          <StatCard label="Team members" value={memberCount} tone="yellow" hint="Accepted" />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-brand-navy">Pipeline overview</h3>
          <div className="mt-6 flex h-48 items-end gap-3">
            {buckets.map(([l, v, c]) => (
              <div key={l} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-sm font-bold text-brand-navy">{v}</span>
                <div
                  className={`w-full rounded-t-lg ${c} opacity-90 transition-all`}
                  style={{ height: `${Math.max(4, (v / maxVal) * 100)}%` }}
                />
                <span className="text-xs text-slate-500">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-brand-navy">Quick start</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              'Create your first product',
              'Connect a lead source',
              'Invite team members',
              'Set assignment rules',
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary">
                  {i + 1}
                </span>
                <span className="text-brand-navy/80">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function CompanyDashboard() {
  const [active, setActive] = useState('dashboard')
  // When a follow-up's "Open lead" is clicked, jump to Leads with this lead open.
  const [openLeadId, setOpenLeadId] = useState(null)

  function openLead(id) {
    setOpenLeadId(id)
    setActive('leads')
  }

  const views = {
    dashboard: <Dashboard onNavigate={setActive} />,
    leads: (
      <LeadsPage
        onCustomizeForm={() => setActive('formbuilder')}
        openLeadId={openLeadId}
        onLeadOpened={() => setOpenLeadId(null)}
      />
    ),
    followups: <FollowupsPage onOpenLead={openLead} />,
    members: <MembersPage />,
    products: <Placeholder title="Products" desc="Create products — each is its own lead workflow and pipeline." />,
    ingestion: <LeadSourcesPage />,
    formbuilder: <FormBuilderPage />,
    templates: <MailTemplatesPage />,
    settings: <SettingsPage />,
  }

  return (
    <AppLayout nav={NAV} active={active} onNavigate={setActive}>
      {views[active]}
    </AppLayout>
  )
}
