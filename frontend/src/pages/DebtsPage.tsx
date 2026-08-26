import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebts } from '../lib/debts'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useMoney } from '../lib/useMoney'
import PaymentModal from '../components/PaymentModal'
import WhatsAppModal from '../components/WhatsAppModal'
import { SkeletonList } from '../components/Spinner'
import type { DebtRow } from '../types'

export default function DebtsPage() {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim(), 300)
  const { data, isLoading } = useDebts(debounced)
  const money = useMoney()
  const [pay, setPay] = useState<DebtRow | null>(null)
  const [wa, setWa] = useState<{ row: DebtRow; message: string } | null>(null)

  const rows = data?.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">الديون والمستحقات</h1>
        <div className="rounded-xl border border-line bg-surface px-4 py-2 text-sm">
          <span className="text-muted">إجمالي الديون: </span>
          <b className="tnum text-bad">{money(data?.summary.total_debt ?? 0)}</b>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن مدين بالاسم أو الهاتف…"
        className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center text-muted">لا توجد ديون 🎉</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
              <div className="min-w-0">
                <Link to={`/customers/${row.id}`} className="font-semibold text-ink hover:text-accent-ink">{row.name}</Link>
                {row.phone && <span dir="ltr" className="mr-2 text-xs text-faint">{row.phone}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="tnum font-bold text-bad">{money(row.debt)}</span>
                <button type="button" onClick={() => setPay(row)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-ink">تسجيل دفعة</button>
                <button
                  type="button"
                  onClick={() => setWa({ row, message: `تذكير: لديكم مبلغ متبقٍ بقيمة ${money(row.debt)} لدى مركزنا. نرجو التكرم بالسداد. شكراً.` })}
                  className="rounded-lg bg-good/10 px-3 py-1.5 text-xs font-semibold text-good hover:bg-good/20"
                >واتساب</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pay && <PaymentModal open onClose={() => setPay(null)} customerId={pay.id} customerName={pay.name} />}
      {wa && <WhatsAppModal open onClose={() => setWa(null)} waNumber={wa.row.whatsapp_number} defaultMessage={wa.message} />}
    </div>
  )
}
