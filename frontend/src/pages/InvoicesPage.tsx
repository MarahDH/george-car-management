import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInvoices } from '../lib/invoices'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useMoney } from '../lib/useMoney'
import { STATUSES, STATUS_ORDER } from '../lib/labels'
import StatusBadge from '../components/StatusBadge'
import Select from '../components/Select'
import { SkeletonList } from '../components/Spinner'
import type { InvoiceStatus } from '../types'

export default function InvoicesPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'' | InvoiceStatus>('')
  const debounced = useDebouncedValue(query.trim(), 300)
  const { data, isLoading } = useInvoices({ q: debounced, status })
  const money = useMoney()

  const invoices = data?.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">الفواتير وأوامر الصيانة</h1>
        <Link to="/invoices/new" className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-ink">
          <span className="text-lg leading-none">＋</span> فاتورة جديدة
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث برقم الفاتورة أو اسم العميل أو اللوحة…"
          className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <Select
          value={status}
          onChange={(v) => setStatus(v as '' | InvoiceStatus)}
          className="w-44"
          ariaLabel="تصفية الحالة"
          options={[{ value: '', label: 'كل الحالات' }, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUSES[s] }))]}
        />
      </div>

      {isLoading ? (
        <SkeletonList rows={6} />
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center text-muted">لا توجد فواتير.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-right font-semibold">رقم الفاتورة</th>
                <th className="p-3 text-right font-semibold">العميل / السيارة</th>
                <th className="p-3 text-right font-semibold">التاريخ</th>
                <th className="p-3 text-right font-semibold">الحالة</th>
                <th className="p-3 text-left font-semibold">الإجمالي</th>
                <th className="p-3 text-left font-semibold">المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="p-3">
                    <Link to={`/invoices/${inv.id}`} className="font-semibold text-accent-ink tnum">{inv.invoice_number}</Link>
                  </td>
                  <td className="p-3">
                    <div className="text-ink">{inv.customer?.name}</div>
                    <div className="text-xs text-faint">{inv.car?.plate_number}</div>
                  </td>
                  <td className="p-3 tnum text-muted">{inv.date}</td>
                  <td className="p-3"><StatusBadge status={inv.status} /></td>
                  <td className="p-3 text-left tnum text-ink">{money(inv.total)}</td>
                  <td className={`p-3 text-left tnum ${inv.remaining > 0 ? 'font-semibold text-bad' : 'text-faint'}`}>{money(inv.remaining)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
