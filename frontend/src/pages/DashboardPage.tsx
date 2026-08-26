import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useReport } from '../lib/reports'
import { useDebts } from '../lib/debts'
import { useInvoices } from '../lib/invoices'
import { useMoney } from '../lib/useMoney'
import Icon, { type IconName } from '../components/Icon'
import StatusBadge from '../components/StatusBadge'
import WhatsAppModal from '../components/WhatsAppModal'
import type { Invoice } from '../types'

export default function DashboardPage() {
  const { user } = useAuth()
  const money = useMoney()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [q, setQ] = useState('')
  const report = useReport(today, today)
  const debts = useDebts('')
  const inspecting = useInvoices({ status: 'inspecting' })
  const repairing = useInvoices({ status: 'repairing' })
  const ready = useInvoices({ status: 'ready' })
  const [wa, setWa] = useState<{ number: string | null; message: string } | null>(null)

  const inProgress = [...(inspecting.data?.data ?? []), ...(repairing.data?.data ?? [])]
  const readyList = ready.data?.data ?? []
  const openCount = (inspecting.data?.meta.total ?? 0) + (repairing.data?.meta.total ?? 0)

  const cards: { label: string; value: string; icon: IconName; to: string; tone: string }[] = [
    { label: 'مقبوضات اليوم', value: money(report.data?.summary.collected ?? 0), icon: 'reports', to: '/reports', tone: 'text-good' },
    { label: 'قيد العمل', value: String(openCount), icon: 'invoice', to: '/invoices', tone: 'text-ink' },
    { label: 'إجمالي الديون', value: money(debts.data?.summary.total_debt ?? 0), icon: 'debt', to: '/debts', tone: 'text-bad' },
  ]

  function readyMessage(inv: Invoice) {
    return `عزيزي ${inv.customer?.name ?? ''}، سيارتك ${inv.car?.type ?? ''} ذات اللوحة رقم ${inv.car?.plate_number ?? ''} جاهزة الآن للتسليم في مركزنا. الإجمالي: ${money(inv.total)}. أهلاً بك.`
  }

  return (
    <div className="space-y-6">
      {/* Hero with search */}
      <div className="rounded-2xl bg-petrol p-6 text-petrol-ink">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">أهلاً، {user?.name} 👋</h1>
            <p className="mt-1 text-sm text-petrol-faint">ابحث عن عميل أو سيارة، أو افتح فاتورة جديدة.</p>
          </div>
          <Link to="/invoices/new" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-ink">＋ فاتورة جديدة</Link>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`) }}
          className="relative mt-4"
        >
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-petrol"><Icon name="search" className="h-5 w-5" /></span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم أو رقم اللوحة…"
            className="w-full rounded-xl border-0 bg-white/95 py-3.5 pr-12 pl-4 text-lg text-ink shadow-lg outline-none focus:ring-2 focus:ring-accent"
          />
        </form>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="rounded-xl border border-line bg-surface p-5 transition-colors hover:border-accent/40">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">{c.label}</span>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent-ink"><Icon name={c.icon} className="h-5 w-5" /></span>
            </div>
            <div className={`mt-3 tnum text-3xl font-bold ${c.tone}`}>{c.value}</div>
          </Link>
        ))}
      </div>

      {/* Work board */}
      <div className="grid gap-4 md:grid-cols-2">
        <Board title="قيد العمل" icon="invoice" empty="لا توجد سيارات قيد العمل.">
          {inProgress.map((inv) => (
            <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 hover:border-accent/40 hover:bg-surface-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-ink">{inv.customer?.name}</div>
                <div className="text-xs text-faint tnum">{inv.car?.plate_number}</div>
              </div>
              <StatusBadge status={inv.status} />
            </Link>
          ))}
        </Board>

        <Board title="جاهزة للتسليم" icon="debt" empty="لا توجد سيارات جاهزة.">
          {readyList.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3">
              <Link to={`/invoices/${inv.id}`} className="min-w-0 flex-1">
                <div className="truncate font-semibold text-ink">{inv.customer?.name}</div>
                <div className="text-xs text-faint tnum">{inv.car?.plate_number} · {money(inv.total)}</div>
              </Link>
              <button type="button" onClick={() => setWa({ number: inv.customer?.whatsapp_number ?? null, message: readyMessage(inv) })} className="rounded-lg bg-good/10 px-3 py-1.5 text-xs font-semibold text-good hover:bg-good/20">واتساب</button>
            </div>
          ))}
        </Board>
      </div>

      {wa && <WhatsAppModal open onClose={() => setWa(null)} waNumber={wa.number} defaultMessage={wa.message} title="إشعار الجاهزية" />}
    </div>
  )
}

function Board({ title, icon, empty, children }: { title: string; icon: IconName; empty: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children]
  const hasItems = items.filter(Boolean).length > 0
  return (
    <section className="rounded-2xl border border-line bg-surface-2/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-petrol/5 text-petrol"><Icon name={icon} className="h-4 w-4" /></span>
        <h2 className="font-bold text-ink">{title}</h2>
      </div>
      {hasItems ? (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pl-1">{children}</div>
      ) : (
        <p className="py-6 text-center text-sm text-faint">{empty}</p>
      )}
    </section>
  )
}
