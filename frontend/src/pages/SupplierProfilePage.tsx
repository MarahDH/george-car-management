import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSupplier } from '../lib/suppliers'
import { useMoney } from '../lib/useMoney'
import Breadcrumbs from '../components/Breadcrumbs'
import { Loading } from '../components/Spinner'
import SupplierPaymentModal from '../components/SupplierPaymentModal'
import { METHODS } from '../lib/labels'

export default function SupplierProfilePage() {
  const { id } = useParams()
  const { data, isLoading, isError } = useSupplier(Number(id))
  const money = useMoney()
  const [paying, setPaying] = useState(false)

  if (isLoading) return <Loading />

  if (isError || !data) return <p className="py-10 text-center text-bad">تعذّر تحميل المورد.</p>

  const { data: supplier, statement, debt, payments } = data

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'الموردون', to: '/suppliers' }, { label: supplier.name }]} />

      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">{supplier.name}</h1>
          {supplier.phone && <p dir="ltr" className="mt-1 text-right text-sm text-muted">{supplier.phone}</p>}
          {supplier.notes && <p className="mt-1 text-sm text-muted">{supplier.notes}</p>}
        </div>
        {debt.debt > 0 && (
          <button type="button" onClick={() => setPaying(true)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-ink">تسجيل دفعة للمورد</button>
        )}
      </div>

      {/* Financials */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="text-xs font-medium text-muted">إجمالي المشتريات</div>
          <div className="mt-1 tnum text-xl font-bold text-ink">{money(debt.purchases)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="text-xs font-medium text-muted">المدفوع للمورد</div>
          <div className="mt-1 tnum text-xl font-bold text-good">{money(debt.paid)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="text-xs font-medium text-muted">المتبقي علينا (دين)</div>
          <div className={`mt-1 tnum text-xl font-bold ${debt.debt > 0 ? 'text-bad' : 'text-faint'}`}>{money(debt.debt)}</div>
        </div>
      </div>

      {/* Payments to supplier */}
      {payments.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-bold text-ink">الدفعات للمورد</h2>
          <ul className="divide-y divide-line text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <span className="text-muted">
                  <span className="tnum">{p.date}</span>
                  <span className="mr-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs ring-1 ring-line">{METHODS[p.method]}</span>
                  {p.note && <span className="mr-2 text-xs text-faint">{p.note}</span>}
                </span>
                <b className="tnum text-good">{money(p.amount)}</b>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Purchases statement */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-bold text-ink">كشف حساب القطع المشتراة</h2>
        {statement.length === 0 ? (
          <p className="py-6 text-center text-sm text-faint">لا توجد مشتريات من هذا المورد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="p-2 text-right font-semibold">القطعة</th>
                  <th className="p-2 text-right font-semibold">الفاتورة</th>
                  <th className="p-2 text-right font-semibold">العميل</th>
                  <th className="p-2 text-right font-semibold">التاريخ</th>
                  <th className="p-2 text-left font-semibold">التكلفة</th>
                </tr>
              </thead>
              <tbody>
                {statement.map((line) => (
                  <tr key={line.id} className="border-b border-line last:border-0">
                    <td className="p-2">{line.name} × {line.quantity}</td>
                    <td className="p-2">
                      {line.invoice_id ? <Link to={`/invoices/${line.invoice_id}`} className="text-accent-ink tnum">{line.invoice_number}</Link> : '—'}
                    </td>
                    <td className="p-2 text-muted">{line.customer_name ?? '—'}</td>
                    <td className="p-2 tnum text-muted">{line.date ?? '—'}</td>
                    <td className="p-2 text-left tnum">{money(line.line_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {paying && <SupplierPaymentModal open onClose={() => setPaying(false)} supplierId={supplier.id} supplierName={supplier.name} />}
    </div>
  )
}
