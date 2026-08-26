import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useIsFetching } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import Icon, { type IconName } from './Icon'
import ThemeToggle from './ThemeToggle'

interface NavItem {
  to: string
  label: string
  icon: IconName
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'لوحة التحكم', icon: 'dashboard', end: true },
  { to: '/search', label: 'العملاء', icon: 'search' },
  { to: '/invoices', label: 'الفواتير', icon: 'invoice' },
  { to: '/debts', label: 'الديون', icon: 'debt' },
  { to: '/suppliers', label: 'الموردون', icon: 'suppliers' },
  { to: '/reports', label: 'التقارير', icon: 'reports' },
  { to: '/settings', label: 'الإعدادات', icon: 'settings' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const fetching = useIsFetching()
  const [open, setOpen] = useState(false)

  // Global keyboard shortcuts: "/" opens search, "n" opens a new invoice.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === '/') { e.preventDefault(); navigate('/search') }
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
      <aside className={`fixed inset-y-0 right-0 z-40 flex w-64 flex-col bg-petrol text-petrol-ink transition-transform md:static md:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <img src="/george-logo.png" alt="GEORGE" className="h-10 w-10 rounded-lg" />
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-[0.15em] text-white">GEORGE</div>
            <div className="text-xs text-petrol-faint">إدارة صيانة السيارات</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-accent/15 text-white shadow-[inset_3px_0_0_var(--color-accent)]' : 'text-petrol-faint hover:bg-white/5 hover:text-petrol-ink'}`
              }
            >
              <Icon name={item.icon} className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-petrol-faint">الإصدار 0.1 · نسخة تجريبية</div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 md:px-6">
          <button type="button" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2 md:hidden" aria-label="فتح القائمة">
            <Icon name="menu" className="h-5 w-5" />
          </button>

          <div className="ms-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="text-left leading-tight">
              <div className="text-sm font-semibold text-ink">{user?.name}</div>
              <div className="text-xs text-faint">{user?.role === 'admin' ? 'مدير' : 'موظف'}</div>
            </div>
            <button type="button" onClick={() => void logout()} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-bad/40 hover:bg-bad/5 hover:text-bad">
              خروج
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-canvas p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
