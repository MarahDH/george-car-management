import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDashboard } from '../lib/dashboard'
import { useReport } from '../lib/reports'
import { useCustomers } from '../lib/customers'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useMoney } from '../lib/useMoney'
import Icon, { type IconName } from '../components/Icon'

const STATUS_COLORS = { inspecting: '#8199ac', repairing: '#0d84c9', ready: '#10a06a' }

const QUICK_ACTIONS: { to: string; label: string; icon: IconName }[] = [
  { to: '/invoices/new', label: 'فاتورة جديدة', icon: 'invoice' },
  { to: '/board', label: 'حالة السيارات', icon: 'car' },
  { to: '/daily', label: 'الحركة اليومية', icon: 'calendar' },
  { to: '/debts', label: 'ديون العملاء', icon: 'debt' },
  { to: '/reports', label: 'التقارير', icon: 'reports' },
  { to: '/suppliers', label: 'الموردون', icon: 'suppliers' },
]

export default function DashboardPage() {
  const money = useMoney()
  const navigate = useNavigate()
  const greeting = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير'

  const dash = useDashboard()
  const data = dash.data
  const loading = dash.isLoading

  // Month-to-date report for the charts + monthly takings.
  const now = new Date()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const to = new Date().toISOString().slice(0, 10)
  const report = useReport(from, to)

  // Live customer search
  const [q, setQ] = useState('')
  const debounced = useDebouncedValue(q.trim(), 250)
  const { data: results } = useCustomers(debounced)
  const matches = debounced ? (results?.data ?? []).slice(0, 6) : []

  const inProgress = data?.in_progress ?? []
  const readyList = data?.ready ?? []
  const openCount = data?.summary.open_count ?? 0

  const status = useMemo(() => ({
    inspecting: inProgress.filter((i) => i.status === 'inspecting').length,
    repairing: inProgress.filter((i) => i.status === 'repairing').length,
    ready: readyList.length,
  }), [inProgress, readyList])
  const statusTotal = status.inspecting + status.repairing + status.ready


  const cards: { label: string; value: string; icon: IconName; to: string; tone: string; loading: boolean }[] = [
    { label: 'مقبوضات اليوم', value: money(data?.summary.collected ?? 0), icon: 'reports', to: '/reports', tone: 'text-good', loading },
    { label: 'مقبوضات الشهر', value: money(report.data?.summary.collected ?? 0), icon: 'coins', to: '/reports', tone: 'text-accent-ink', loading: report.isLoading },
    { label: 'قيد العمل', value: String(openCount), icon: 'invoice', to: '/board', tone: 'text-ink', loading },
    { label: 'إجمالي الديون', value: money(data?.summary.total_debt ?? 0), icon: 'debt', to: '/debts', tone: 'text-bad', loading },
  ]

  return (
    <div className="space-y-6">
      {/* Hero — greeting + live search */}
      <div className="ocean-grad relative z-20 rounded-3xl p-6 pb-16 text-petrol-ink shadow-xl shadow-petrol/20 sm:p-8 sm:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="aurora absolute inset-0" />
          <div className="aqua-blob absolute -right-10 -top-20 h-64 w-64 rounded-full bg-cyan/30 blur-3xl" />
          <div className="aqua-blob absolute left-1/4 -bottom-24 h-64 w-64 rounded-full bg-accent/30 blur-3xl [animation-delay:-5s]" />
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="wave-bob absolute inset-x-0 bottom-0 h-10 w-full">
            <path fill="var(--color-canvas)" fillOpacity="0.18" d="M0 64 C 240 112, 480 16, 720 48 S 1200 112, 1440 56 L 1440 120 L 0 120 Z" />
            <path fill="var(--color-canvas)" d="M0 88 C 260 120, 520 48, 780 72 S 1220 120, 1440 84 L 1440 120 L 0 120 Z" />
          </svg>
        </div>
        <div className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="rise-in text-2xl font-bold text-white sm:text-3xl">{greeting} 👋</h1>
            <p className="rise-in mt-2 text-sm text-petrol-faint [animation-delay:80ms] sm:text-base">من تبحث عنه اليوم؟ اكتب اسم العميل أو رقم اللوحة للعثور الفوري.</p>

            {/* Live search — the star of the page */}
            <form
              onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(`/customers?q=${encodeURIComponent(q.trim())}`) }}
              className="group rise-in relative mt-6 text-right [animation-delay:160ms]"
            >
              {/* 3D glowing halo behind the search — brightens on focus */}
              <div aria-hidden className="glow-pulse hero-glow pointer-events-none absolute -inset-2.5 rounded-[1.9rem]" />
              {/* Shimmering gradient border */}
              <div className="shimmer-border hero-search-inner relative z-10 rounded-2xl p-[2.5px]">
                <span className="pointer-events-none absolute inset-y-0 right-5 z-20 grid place-items-center text-accent"><Icon name="search" className="h-6 w-6" /></span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحث بالاسم أو رقم اللوحة…"
                  className="w-full rounded-[calc(1rem-2px)] bg-white py-5 pr-14 pl-12 text-lg text-ink outline-none placeholder:text-faint sm:text-xl"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} aria-label="مسح البحث" className="absolute inset-y-0 left-4 z-20 my-auto grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:bg-bad/10 hover:text-bad">
                    <span className="text-sm leading-none">✕</span>
                  </button>
                )}
              </div>
              {debounced && (
              <div className="drop-in absolute inset-x-0 top-full z-30 mt-3 overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-2xl">
                {matches.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-muted">لا توجد نتائج مطابقة لـ «{debounced}»</div>
                ) : (
                  <>
                    {matches.map((c) => (
                      <Link
                        key={c.id}
                        to={`/customers/${c.id}`}
                        onClick={() => setQ('')}
                        className="flex items-center gap-3 border-b border-line/70 px-4 py-2.5 last:border-0 hover:bg-accent-soft/50"
                      >
                        <span className="aqua-grad grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"><Icon name="car" className="h-4 w-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{c.name}</span>
                          {c.phone && <span dir="ltr" className="block text-right text-xs text-faint tnum">{c.phone}</span>}
                        </span>
                        <span className="shrink-0 rounded-lg bg-surface-2 px-2 py-0.5 text-xs text-muted">{c.cars_count ?? 0} سيارة</span>
                      </Link>
                    ))}
                    <button type="submit" className="block w-full bg-surface-2/60 px-4 py-2 text-center text-xs font-semibold text-accent-ink hover:bg-surface-2">عرض كل النتائج ↩</button>
                  </>
                )}
              </div>
            )}
            </form>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="glass rounded-2xl p-5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{c.label}</span>
              <span className="aqua-grad grid h-9 w-9 place-items-center rounded-xl text-white shadow-md shadow-cyan/30"><Icon name={c.icon} className="h-5 w-5" /></span>
            </div>
            {c.loading
              ? <div className="warsha-skeleton mt-3 h-8 w-24" />
              : <div className={`mt-3 tnum text-2xl font-bold ${c.tone}`}>{c.value}</div>}
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Work status donut */}
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink"><Icon name="invoice" className="h-4 w-4 text-accent" /> توزيع حالة السيارات</h2>
          {loading ? (
            <div className="warsha-skeleton h-40 w-full" />
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative mx-auto h-40 w-40 shrink-0 rounded-full" style={{ background: conicFor([
                { value: status.inspecting, color: STATUS_COLORS.inspecting },
                { value: status.repairing, color: STATUS_COLORS.repairing },
                { value: status.ready, color: STATUS_COLORS.ready },
              ], statusTotal) }}>
                <div className="absolute inset-[24%] grid place-items-center rounded-full bg-surface text-center">
                  <div>
                    <div className="tnum text-2xl font-bold text-ink">{statusTotal}</div>
                    <div className="text-[10px] text-muted">سيارة</div>
                  </div>
                </div>
              </div>
              <ul className="flex-1 space-y-2.5 text-sm">
                <Legend color={STATUS_COLORS.inspecting} label="قيد الفحص" value={status.inspecting} total={statusTotal} />
                <Legend color={STATUS_COLORS.repairing} label="قيد التصليح" value={status.repairing} total={statusTotal} />
                <Legend color={STATUS_COLORS.ready} label="جاهزة للتسليم" value={status.ready} total={statusTotal} />
              </ul>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass rounded-2xl p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink"><Icon name="dashboard" className="h-4 w-4 text-accent" /> إجراءات سريعة</h2>
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.to} to={a.to} className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4 text-center transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:bg-surface-2">
                <span className="aqua-grad grid h-10 w-10 place-items-center rounded-xl text-white shadow-sm shadow-cyan/30"><Icon name={a.icon} className="h-5 w-5" /></span>
                <span className="text-xs font-semibold text-ink">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

function conicFor(segments: { value: number; color: string }[], total: number): string {
  if (total <= 0) return 'conic-gradient(var(--color-line) 0 100%)'
  let acc = 0
  const parts = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = (acc / total) * 100
      acc += s.value
      const end = (acc / total) * 100
      return `${s.color} ${start}% ${end}%`
    })
  return `conic-gradient(${parts.join(', ')})`
}

function Legend({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <li className="flex items-center gap-2">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
      <span className="flex-1 text-muted">{label}</span>
      <span className="tnum font-semibold text-ink">{value}</span>
      <span className="tnum w-9 text-left text-xs text-faint">{pct}%</span>
    </li>
  )
}
