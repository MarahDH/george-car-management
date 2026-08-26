import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useInvoice, useDeleteInvoice, useUpdateInvoiceStatus } from '../lib/invoices'
import { useMoney } from '../lib/useMoney'
import { openPdf } from '../lib/download'
import { DEPARTMENTS, METHODS, STATUSES, STATUS_ORDER } from '../lib/labels'
import StatusBadge from '../components/StatusBadge'
import WhatsAppModal from '../components/WhatsAppModal'
import Breadcrumbs from '../components/Breadcrumbs'
import { useToast } from '../components/Toast'
import { Loading } from '../components/Spinner'
import type { InvoiceStatus } from '../types'

export default function InvoiceViewPage() {
  const { id } = useParams()
  const invoiceId = Number(id)
  const navigate = useNavigate()
  const { data: inv, isLoading, isError } = useInvoice(invoiceId)
  const del = useDeleteInvoice()
  const setStatus = useUpdateInvoiceStatus()
  const money = useMoney()
  const toast = useToast()
  const [wa, setWa] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  if (isLoading) return <Loading />
  if (isError || !inv) return <p className="py-10 text-center text-bad">تعذّر تحميل الفاتورة.</p>

  const readyMessage =
    `عزيزي ${inv.customer?.name ?? ''}، سيارتك ${inv.car?.type ?? ''} ذات اللوحة رقم ${inv.car?.plate_number ?? ''} ` +
    `جاهزة الآن للتسليم في ${'مركزنا'}. الإجمالي: ${money(inv.total)}. أهلاً بك.`
  const invoiceMessage =
    `فاتورة رقم ${inv.invoice_number} بإجمالي ${money(inv.total)}، ` +
    `المدفوع ${money(inv.paid_amount)}، المتبقي ${money(inv.remaining)}. شكراً لتعاملكم معنا.`

  async function handleDelete() {
    if (!confirm(`حذف الفاتورة ${inv!.invoice_number}؟`)) return
    await del.mutateAsync(inv!.id)
    toast('تم حذف الفاتورة')
    navigate('/invoices', { replace: true })
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'الفواتير', to: '/invoices' }, { label: inv.invoice_number }]} />

      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ink tnum">{inv.invoice_number}</h1>
              <StatusBadge status={inv.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              <Link to={`/customers/${inv.customer_id}`} className="text-accent-ink">{inv.customer?.name}</Link>
              {' · '}{inv.car?.plate_number}{inv.car?.type ? ` — ${inv.car.type}` : ''}
            </p>
            <p className="text-xs text-faint tnum">{inv.date}{inv.odometer ? ` · العداد ${inv.odometer.toLocaleString('en-US')} كم` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void openPdf(`/invoices/${inv.id}/pdf`)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface-2">PDF</button>
            <Link to={`/invoices/${inv.id}/edit`} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface-2">تعديل</Link>
            <button type="button" onClick={handleDelete} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-bad/40 hover:bg-bad/5 hover:text-bad">حذف</button>
          </div>
        </div>

        {/* Status + WhatsApp actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="text-xs text-muted">الحالة:</span>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus.mutate({ id: inv.id, status: s as InvoiceStatus }, { onSuccess: () => toast('تم تحديث حالة الفاتورة') })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${inv.status === s ? 'bg-petrol text-white' : 'border border-line text-muted hover:bg-surface-2'}`}
            >
              {STATUSES[s]}
            </button>
          ))}
          <div className="mx-1 h-5 w-px bg-line" />
          {inv.status === 'ready' && (
            <button type="button" onClick={() => setWa({ open: true, message: readyMessage })} className="rounded-lg bg-good/10 px-3 py-1.5 text-xs font-semibold text-good hover:bg-good/20">واتساب: جاهزة للتسليم</button>
          )}
          <button type="button" onClick={() => setWa({ open: true, message: invoiceMessage })} className="rounded-lg bg-good/10 px-3 py-1.5 text-xs font-semibold text-good hover:bg-good/20">واتساب: تفاصيل الفاتورة</button>
        </div>
      </div>

      {/* Labor */}
      {(inv.labor_items ?? []).length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-2 font-bold text-ink">أجور اليد</h2>
          <table className="w-full text-sm">
            <tbody>
              {inv.labor_items!.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="py-2">{DEPARTMENTS[l.department]}</td>
                  <td className="py-2 text-muted">{l.description}</td>
                  <td className="py-2 text-left tnum">{money(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Parts */}
      {(inv.part_items ?? []).length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-2 font-bold text-ink">قطع الغيار</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-muted"><th className="py-1 text-right">القطعة</th><th className="py-1 text-right">المورد</th><th className="py-1 text-left">عدد</th><th className="py-1 text-left">الإجمالي</th></tr></thead>
            <tbody>
              {inv.part_items!.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2 text-muted">{p.supplier_name ?? '—'}</td>
                  <td className="py-2 text-left tnum">{p.quantity}</td>
                  <td className="py-2 text-left tnum">{money((p.line_total ?? p.sell_price * p.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Totals */}
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mx-auto max-w-xs space-y-1.5 text-sm">
          <Line label="إجمالي الأجور" value={money(inv.labor_total)} />
          <Line label="إجمالي القطع" value={money(inv.parts_total)} />
          <div className="my-1 border-t border-line" />
          <Line label="الإجمالي" value={money(inv.total)} strong />
          <Line label={`المدفوع${inv.payment_method ? ` (${METHODS[inv.payment_method]})` : ''}`} value={money(inv.paid_amount)} />
          <Line label="المتبقي" value={money(inv.remaining)} danger />
          <div className="my-1 border-t border-line" />
          <Line label="صافي الربح" value={money(inv.profit)} good />
        </div>
      </section>

      <WhatsAppModal
        open={wa.open}
        onClose={() => setWa({ open: false, message: '' })}
        waNumber={inv.customer?.whatsapp_number ?? null}
        defaultMessage={wa.message}
      />
    </div>
  )
}

function Line({ label, value, strong, danger, good }: { label: string; value: string; strong?: boolean; danger?: boolean; good?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`tnum ${strong ? 'text-base font-bold text-ink' : danger ? 'font-semibold text-bad' : good ? 'font-semibold text-good' : 'text-ink'}`}>{value}</span>
    </div>
  )
}
