import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useIsFetching } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import Icon, { type IconName } from './Icon'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    title: 'الرئيسية',
    items: [
      { to: '/', label: 'لوحة التحكم', icon: 'dashboard', end: true },
      { to: '/board', label: 'حالة السيارات', icon: 'car' },
      { to: '/daily', label: 'الحركة اليومية', icon: 'calendar' },
    ],
  },
  {
    title: 'العملاء والفواتير',
    items: [
      { to: '/customers', label: 'العملاء', icon: 'search', end: true },
      { to: '/customers/archived', label: 'العملاء المؤرشفون', icon: 'archive' },
      { to: '/invoices', label: 'الفواتير', icon: 'invoice' },
      { to: '/debts', label: 'ديون العملاء', icon: 'debt' },
    ],
  },
  {
    title: 'الموردون',
    items: [
      { to: '/suppliers', label: 'الموردون', icon: 'suppliers' },
      { to: '/supplier-debts', label: 'ديون الموردين', icon: 'coins' },
    ],
  },
  {
    title: 'الإدارة',
    items: [
      { to: '/workers', label: 'العمّال', icon: 'wrench' },
      { to: '/reports', label: 'التقارير', icon: 'reports' },
      { to: '/settings', label: 'الإعدادات', icon: 'settings' },
    ],
  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fetching = useIsFetching()
  const [open, setOpen] = useState(false)

  // Global keyboard shortcuts: "/" opens search, "n" opens a new invoice.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === '/') { e.preventDefault(); navigate('/customers') }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); navigate('/invoices/new') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Global request progress bar */}
      {fetching > 0 && (
        <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
          <div className="warsha-bar h-full w-1/4 rounded-full bg-accent" />
        </div>
      )}

      {/* Sidebar (right in RTL) */}
      <aside className={`ocean-grad fixed inset-y-0 right-0 z-40 flex w-64 flex-col overflow-hidden text-petrol-ink transition-transform md:static md:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        {/* Floating aqua light — a soft "underwater" glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aqua-blob absolute -right-16 -top-10 h-56 w-56 rounded-full bg-cyan/25 blur-3xl" />
          <div className="aqua-blob absolute -left-20 bottom-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl [animation-delay:-4s]" />
        </div>

        <div className="relative flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <img src="/george-logo.png" alt="GEORGE" className="h-10 w-10 rounded-lg ring-1 ring-white/20" />
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-[0.15em] text-white">GEORGE</div>
            <div className="text-xs text-petrol-faint">إدارة صيانة السيارات</div>
          </div>
        </div>
        <nav className="relative flex-1 space-y-4 overflow-y-auto p-3">
          {NAV.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-petrol-faint/70">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'aqua-grad text-white shadow-lg shadow-cyan/20' : 'text-petrol-faint hover:bg-white/10 hover:text-petrol-ink'}`
                  }
                >
                  <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="relative border-t border-white/10 p-4 text-xs text-petrol-faint">الإصدار 0.1 · نسخة تجريبية</div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="glass z-20 flex h-16 shrink-0 items-center gap-3 rounded-none px-4 md:px-6">
          <button type="button" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2 md:hidden" aria-label="فتح القائمة">
            <Icon name="menu" className="h-5 w-5" />
          </button>

          <div className="ms-auto flex items-center gap-3">
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold text-ink">{user?.name}</div>
              <div className="text-xs text-faint">{user?.role === 'admin' ? 'مدير' : 'موظف'}</div>
            </div>
            <button type="button" onClick={() => void logout()} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-bad/40 hover:bg-bad/5 hover:text-bad">
              خروج
            </button>
          </div>
        </header>

        <main className="app-canvas min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {/* Keyed on the route so each page fades in instead of snapping */}
          <div key={location.pathname} className="fade-in h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
