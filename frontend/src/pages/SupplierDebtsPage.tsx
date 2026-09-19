import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSupplierDebts } from '../lib/supplierDebts'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useMoney } from '../lib/useMoney'
import { SkeletonList } from '../components/Spinner'
import SupplierPaymentModal from '../components/SupplierPaymentModal'
import type { SupplierDebtRow } from '../types'

export default function SupplierDebtsPage() {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim(), 300)
  const { data, isLoading } = useSupplierDebts(debounced)
  const money = useMoney()
  const [pay, setPay] = useState<SupplierDebtRow | null>(null)

  const rows = data?.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">ديون تجار السوق</h1>
          <p className="text-sm text-muted">المبالغ المستحقة علينا للموردين (مشتريات القطع ناقص المدفوع).</p>
        </div>
        <div className="rounded-xl border border-line bg-surface px-4 py-2 text-sm">
          <span className="text-muted">إجمالي ما علينا: </span>
          <b className="tnum text-bad">{money(data?.summary.total_debt ?? 0)}</b>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن مورد بالاسم أو الهاتف…"
        className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center text-muted">لا توجد ديون للموردين 🎉</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="p-3 text-right font-semibold">المورد</th>
                <th className="p-3 text-left font-semibold">إجمالي المشتريات</th>
                <th className="p-3 text-left font-semibold">المدفوع</th>
                <th className="p-3 text-left font-semibold">المتبقي (دين)</th>
                <th className="p-3 text-center font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="p-3">
                    <Link to={`/suppliers/${row.id}`} className="font-semibold text-ink hover:text-accent-ink">{row.name}</Link>
                    {row.phone && <span dir="ltr" className="mr-2 text-xs text-faint">{row.phone}</span>}
                  </td>
                  <td className="p-3 text-left tnum text-muted">{money(row.purchases)}</td>
                  <td className="p-3 text-left tnum text-good">{money(row.paid)}</td>
                  <td className="p-3 text-left tnum font-bold text-bad">{money(row.debt)}</td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => setPay(row)} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-ink">تسجيل دفعة</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pay && <SupplierPaymentModal open onClose={() => setPay(null)} supplierId={pay.id} supplierName={pay.name} />}
    </div>
  )
}
