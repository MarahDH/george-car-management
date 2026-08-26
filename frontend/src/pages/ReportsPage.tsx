import { useState } from 'react'
import { useReport } from '../lib/reports'
import { useMoney } from '../lib/useMoney'
import { downloadFile, openPdf } from '../lib/download'
import { DEPARTMENTS } from '../lib/labels'
import { Loading } from '../components/Spinner'
import type { Department } from '../types'

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function ReportsPage() {
  const today = new Date()
  const [from, setFrom] = useState(iso(new Date(today.getFullYear(), today.getMonth(), 1)))
  const [to, setTo] = useState(iso(today))
  const { data, isLoading } = useReport(from, to)
  const money = useMoney()

  function preset(kind: 'day' | 'week' | 'month') {
    const now = new Date()
    if (kind === 'day') { setFrom(iso(now)); setTo(iso(now)) }
    else if (kind === 'week') { const s = new Date(now); s.setDate(now.getDate() - 6); setFrom(iso(s)); setTo(iso(now)) }
    else { setFrom(iso(new Date(now.getFullYear(), now.getMonth(), 1))); setTo(iso(now)) }
  }

  const q = `from=${from}&to=${to}`
  const s = data?.summary

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">التقارير والإحصائيات</h1>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-4">
        <label className="block"><span className="mb-1 block text-xs text-muted">من</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink" /></label>
        <label className="block"><span className="mb-1 block text-xs text-muted">إلى</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-ink" /></label>
        <div className="flex gap-1">
          <button type="button" onClick={() => preset('day')} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-surface-2">اليوم</button>
          <button type="button" onClick={() => preset('week')} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-surface-2">الأسبوع</button>
          <button type="button" onClick={() => preset('month')} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-surface-2">الشهر</button>
        </div>
        <div className="ms-auto flex gap-2">
          <button type="button" onClick={() => void openPdf(`/reports/export?${q}&format=pdf`)} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-surface-2">PDF</button>
          <button type="button" onClick={() => void downloadFile(`/reports/export?${q}&format=xlsx`, `warsha-report-${from}-${to}.xlsx`)} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:bg-surface-2">Excel</button>
        </div>
      </div>

      {isLoading || !s ? (
        <Loading />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card label="إجمالي المقبوضات" value={money(s.collected)} tone="good" />
            <Card label="مصاريف شراء القطع" value={money(s.parts_spend)} />
            <Card label="صافي الربح" value={money(s.net_profit)} tone="accent" />
            <Card label="الديون المعلّقة (حالياً)" value={money(s.total_debt)} tone="bad" />
            <Card label="عدد الفواتير" value={String(s.invoices_count)} />
            <Card label="القسم الأكثر دخلاً" value={s.top_department ? DEPARTMENTS[s.top_department] : '—'} />
          </div>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="mb-3 font-bold text-ink">الدخل حسب القسم (أجور اليد)</h2>
            <div className="space-y-2">
              {(Object.keys(data!.departments) as Department[]).map((d) => {
                const val = data!.departments[d]
                const max = Math.max(...Object.values(data!.departments), 1)
                return (
                  <div key={d} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-muted">{DEPARTMENTS[d]}</span>
                    <div className="h-6 flex-1 overflow-hidden rounded bg-surface-2">
                      <div className="h-full rounded bg-accent" style={{ width: `${(val / max) * 100}%` }} />
                    </div>
                    <span className="tnum w-28 text-left text-sm text-ink">{money(val)}</span>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Card({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'accent' }) {
  const color = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : tone === 'accent' ? 'text-accent-ink' : 'text-ink'
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`mt-1 tnum text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
