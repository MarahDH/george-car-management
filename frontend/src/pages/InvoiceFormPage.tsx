import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCustomers, useCustomer } from '../lib/customers'
import { useSuppliers } from '../lib/suppliers'
import { useWorkers } from '../lib/workers'
import { useCurrency } from '../lib/currency'
import { useCreateInvoice, useInvoice, useUpdateInvoice, type InvoiceInput } from '../lib/invoices'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useMoney } from '../lib/useMoney'
import { extractErrors, inputClass } from '../lib/formError'
import { sanitizeNumberInput } from '../lib/format'
import { DEPARTMENTS, METHODS, STATUS_ORDER, STATUSES } from '../lib/labels'
import Select from '../components/Select'
import { useToast } from '../components/Toast'
import Breadcrumbs from '../components/Breadcrumbs'
import CustomerFormModal from '../components/CustomerFormModal'
import type { Car, Department, InvoiceStatus, PayMethod } from '../types'

interface LaborRow { key: number; department: Department; worker_id: string; description: string; amount: string }
interface PartRow { key: number; supplier_id: string; worker_id: string; name: string; buy_price: string; sell_price: string; price_usd: string; quantity: string }

let uid = 1
const nextKey = () => uid++

const departmentOptions = (Object.keys(DEPARTMENTS) as Department[]).map((d) => ({ value: d, label: DEPARTMENTS[d] }))
const statusOptions = STATUS_ORDER.map((s) => ({ value: s, label: STATUSES[s] }))
const methodOptions = (Object.keys(METHODS) as PayMethod[]).map((m) => ({ value: m, label: METHODS[m] }))

export default function InvoiceFormPage() {
  const { id } = useParams()
  const editId = id ? Number(id) : null
  const isEdit = editId !== null
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const money = useMoney()

  const { data: suppliers } = useSuppliers('')
  const { data: workers } = useWorkers()
  const currency = useCurrency()
  const existing = useInvoice(editId ?? NaN)
  const create = useCreateInvoice()
  const update = useUpdateInvoice(editId ?? 0)
  const toast = useToast()

  const [customerId, setCustomerId] = useState<number | null>(
    searchParams.get('customer_id') ? Number(searchParams.get('customer_id')) : null,
  )
  const [carId, setCarId] = useState<number | null>(
    searchParams.get('car_id') ? Number(searchParams.get('car_id')) : null,
  )
  const [customerName, setCustomerName] = useState('')
  const { data: picked } = useCustomer(customerId ?? NaN)
  const cars: Car[] = picked?.customer.cars ?? []

  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(searchParams.get('date') || today)
  const [odometer, setOdometer] = useState('')
  const [status, setStatus] = useState<InvoiceStatus>('inspecting')
  const [labor, setLabor] = useState<LaborRow[]>([{ key: nextKey(), department: 'mechanic', worker_id: '', description: '', amount: '' }])
  const [parts, setParts] = useState<PartRow[]>([])
  const [paid, setPaid] = useState('')
  const [method, setMethod] = useState<PayMethod>('cash')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || !existing.data) return
    const inv = existing.data
    setCustomerId(inv.customer_id)
    setCarId(inv.car_id)
    setCustomerName(inv.customer?.name ?? '')
    setDate(inv.date)
    setOdometer(inv.odometer ? String(inv.odometer) : '')
    setStatus(inv.status)
    setPaid(String(inv.paid_amount))
    setMethod(inv.payment_method ?? 'cash')
    setNotes(inv.notes ?? '')
    setLabor((inv.labor_items ?? []).map((l) => ({ key: nextKey(), department: l.department, worker_id: l.worker_id ? String(l.worker_id) : '', description: l.description ?? '', amount: String(l.amount) })))
    setParts((inv.part_items ?? []).map((p) => ({ key: nextKey(), supplier_id: p.supplier_id ? String(p.supplier_id) : '', worker_id: p.worker_id ? String(p.worker_id) : '', name: p.name, buy_price: String(p.buy_price), sell_price: String(p.sell_price), price_usd: p.price_usd != null ? String(p.price_usd) : '', quantity: String(p.quantity) })))
  }, [isEdit, existing.data])

  const totals = useMemo(() => {
    const laborTotal = labor.reduce((s, r) => s + (Number(r.amount) || 0), 0)
    const partsTotal = parts.reduce((s, r) => s + (Number(r.sell_price) || 0) * (Number(r.quantity) || 0), 0)
    const costTotal = parts.reduce((s, r) => s + (Number(r.buy_price) || 0) * (Number(r.quantity) || 0), 0)
    const total = laborTotal + partsTotal
    return { laborTotal, partsTotal, total, remaining: total - (Number(paid) || 0), profit: total - costTotal }
  }, [labor, parts, paid])

  const carOptions = cars.map((c) => ({ value: String(c.id), label: `${c.plate_number}${c.type ? ` — ${c.type}` : ''}` }))
  const supplierOptions = [{ value: '', label: 'بدون مورد' }, ...(suppliers?.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))]
  const workerOptions = [{ value: '', label: 'بدون عامل' }, ...(workers ?? []).map((w) => ({ value: String(w.id), label: w.name }))]

  async function handleSubmit() {
    setErrors({})
    setBanner(null)
    if (!customerId || !carId) {
      setBanner('يرجى اختيار العميل والسيارة.')
      return
    }
    const input: InvoiceInput = {
      customer_id: customerId,
      car_id: carId,
      date,
      odometer: odometer ? Number(odometer) : null,
      status,
      paid_amount: Number(paid) || 0,
      payment_method: method,
      notes: notes || null,
      labor_items: labor.filter((r) => r.amount !== '').map((r) => ({ department: r.department, worker_id: r.worker_id ? Number(r.worker_id) : null, description: r.description || null, amount: Number(r.amount) })),
      part_items: parts.filter((r) => r.name.trim() !== '').map((r) => ({ supplier_id: r.supplier_id ? Number(r.supplier_id) : null, worker_id: r.worker_id ? Number(r.worker_id) : null, name: r.name, buy_price: Number(r.buy_price) || 0, sell_price: Number(r.sell_price) || 0, price_usd: r.price_usd ? Number(r.price_usd) : null, quantity: Number(r.quantity) || 1 })),
    }
    try {
      const saved = isEdit ? await update.mutateAsync(input) : await create.mutateAsync(input)
      toast(isEdit ? 'تم تحديث الفاتورة' : 'تم حفظ الفاتورة')
      navigate(`/invoices/${saved.id}`, { replace: true })
    } catch (err) {
      const { message, fields } = extractErrors(err)
      setErrors(fields)
      setBanner(message)
    }
  }

  const busy = create.isPending || update.isPending

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Breadcrumbs items={[{ label: 'الفواتير', to: '/invoices' }, { label: isEdit ? 'تعديل الفاتورة' : 'فاتورة جديدة' }]} />
        <h1 className="text-2xl font-bold text-ink">{isEdit ? 'تعديل الفاتورة' : 'فاتورة جديدة'}</h1>
      </div>

      {banner && <div className="rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{banner}</div>}

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-bold text-ink">العميل والسيارة</h2>
        {customerId ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-surface-2 px-3 py-2 text-sm font-semibold">{customerName || picked?.customer.name || '—'}</span>
            <Select value={carId ? String(carId) : ''} onChange={(v) => setCarId(v ? Number(v) : null)} placeholder="اختر السيارة…" className="w-56" options={carOptions} ariaLabel="السيارة" />
            {!isEdit && <button type="button" onClick={() => { setCustomerId(null); setCarId(null) }} className="text-xs text-muted hover:text-ink">تغيير العميل</button>}
            {errors.car_id && <span className="text-xs text-bad">{errors.car_id}</span>}
          </div>
        ) : (
          <CustomerPicker onPick={(cid, name) => { setCustomerId(cid); setCustomerName(name); setCarId(null) }} />
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-4">
        <label className="block"><span className="mb-1 block text-xs font-medium text-muted">التاريخ</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-muted">العداد (كم)</span>
          <input value={odometer} onChange={(e) => setOdometer(sanitizeNumberInput(e.target.value))} inputMode="numeric" dir="ltr" className={`${inputClass} text-right`} /></label>
        <div className="col-span-2"><span className="mb-1 block text-xs font-medium text-muted">الحالة</span>
          <Select value={status} onChange={(v) => setStatus(v as InvoiceStatus)} options={statusOptions} ariaLabel="الحالة" /></div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-ink">أجور اليد</h2>
          <button type="button" onClick={() => setLabor((r) => [...r, { key: nextKey(), department: 'mechanic', worker_id: '', description: '', amount: '' }])} className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-ink">＋ سطر</button>
        </div>
        <div className="space-y-2">
          {labor.map((row, i) => (
            <div key={row.key} className="grid grid-cols-12 items-start gap-2">
              <div className="col-span-3"><Select value={row.department} onChange={(v) => setLabor((rs) => rs.map((r, j) => j === i ? { ...r, department: v as Department } : r))} options={departmentOptions} ariaLabel="القسم" /></div>
              <div className="col-span-3"><Select value={row.worker_id} onChange={(v) => setLabor((rs) => rs.map((r, j) => j === i ? { ...r, worker_id: v } : r))} placeholder="العامل…" options={workerOptions} ariaLabel="العامل" /></div>
              <input placeholder="الوصف" value={row.description} onChange={(e) => setLabor((rs) => rs.map((r, j) => j === i ? { ...r, description: e.target.value } : r))} className={`${inputClass} col-span-3`} />
              <input placeholder="المبلغ" value={row.amount} onChange={(e) => setLabor((rs) => rs.map((r, j) => j === i ? { ...r, amount: sanitizeNumberInput(e.target.value, { decimal: true }) } : r))} inputMode="numeric" dir="ltr" className={`${inputClass} col-span-2 text-right`} />
              <button type="button" onClick={() => setLabor((rs) => rs.filter((_, j) => j !== i))} className="col-span-1 self-center text-muted hover:text-bad">✕</button>
            </div>
          ))}
          {labor.length === 0 && <p className="text-sm text-faint">لا أجور.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-ink">قطع الغيار</h2>
          <button type="button" onClick={() => setParts((r) => [...r, { key: nextKey(), supplier_id: '', worker_id: '', name: '', buy_price: '', sell_price: '', price_usd: '', quantity: '1' }])} className="rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-ink">＋ قطعة</button>
        </div>
        {parts.length > 0 && (
          <div className="mb-1 grid grid-cols-12 gap-2 px-1 text-[11px] font-medium text-faint">
            <span className="col-span-2">اسم القطعة</span>
            <span className="col-span-2">العامل</span>
            <span className="col-span-2">المصدر</span>
            <span className="col-span-1 text-right">شراء</span>
            <span className="col-span-2 text-right">سوري (ل.س)</span>
            <span className="col-span-1 text-right">دولار</span>
            <span className="col-span-1 text-right">عدد</span>
            <span className="col-span-1" />
          </div>
        )}
        <div className="space-y-2">
          {parts.map((row, i) => (
            <div key={row.key} className="grid grid-cols-12 items-start gap-2">
              <input placeholder="اسم القطعة" value={row.name} onChange={(e) => setParts((rs) => rs.map((r, j) => j === i ? { ...r, name: e.target.value } : r))} className={`${inputClass} col-span-2`} />
              <div className="col-span-2"><Select value={row.worker_id} onChange={(v) => setParts((rs) => rs.map((r, j) => j === i ? { ...r, worker_id: v } : r))} placeholder="العامل…" options={workerOptions} ariaLabel="العامل" /></div>
              <div className="col-span-2"><Select value={row.supplier_id} onChange={(v) => setParts((rs) => rs.map((r, j) => j === i ? { ...r, supplier_id: v } : r))} placeholder="المصدر…" options={supplierOptions} ariaLabel="المصدر" /></div>
              <input placeholder="شراء" value={row.buy_price} onChange={(e) => setParts((rs) => rs.map((r, j) => j === i ? { ...r, buy_price: sanitizeNumberInput(e.target.value, { decimal: true }) } : r))} inputMode="numeric" dir="ltr" className={`${inputClass} col-span-1 text-right`} />
              <input placeholder="سوري" value={row.sell_price} onChange={(e) => { const v = sanitizeNumberInput(e.target.value, { decimal: true }); setParts((rs) => rs.map((r, j) => j === i ? { ...r, sell_price: v, price_usd: currency.hasRate && v !== '' && !Number.isNaN(Number(v)) ? String(currency.toUsd(Number(v))) : r.price_usd } : r)) }} inputMode="numeric" dir="ltr" className={`${inputClass} col-span-2 text-right`} />
              <input placeholder="دولار" value={row.price_usd} onChange={(e) => { const v = sanitizeNumberInput(e.target.value, { decimal: true }); setParts((rs) => rs.map((r, j) => j === i ? { ...r, price_usd: v, sell_price: currency.hasRate && v !== '' && !Number.isNaN(Number(v)) ? String(currency.toSyp(Number(v))) : r.sell_price } : r)) }} inputMode="numeric" dir="ltr" className={`${inputClass} col-span-1 text-right`} />
              <input placeholder="عدد" value={row.quantity} onChange={(e) => setParts((rs) => rs.map((r, j) => j === i ? { ...r, quantity: sanitizeNumberInput(e.target.value) } : r))} inputMode="numeric" dir="ltr" className={`${inputClass} col-span-1 text-right`} />
              <button type="button" onClick={() => setParts((rs) => rs.filter((_, j) => j !== i))} className="col-span-1 self-center text-muted hover:text-bad">✕</button>
            </div>
          ))}
          {parts.length === 0 && <p className="text-sm text-faint">لا قطع.</p>}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">المدفوع</span>
            <input value={paid} onChange={(e) => setPaid(sanitizeNumberInput(e.target.value, { decimal: true }))} inputMode="numeric" dir="ltr" className={`${inputClass} text-right`} /></label>
          <div><span className="mb-1 block text-xs font-medium text-muted">طريقة الدفع</span>
            <Select value={method} onChange={(v) => setMethod(v as PayMethod)} options={methodOptions} ariaLabel="طريقة الدفع" /></div>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">ملاحظات</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} /></label>
        </div>
        <div className="space-y-1.5 rounded-xl bg-surface-2 p-4 text-sm">
          <Row label="إجمالي الأجور" value={money(totals.laborTotal)} />
          <Row label="إجمالي القطع" value={money(totals.partsTotal)} />
          <div className="my-1 border-t border-line" />
          <Row label="الإجمالي" value={money(totals.total)} strong />
          {currency.hasRate && (
            <div className="flex items-center justify-between text-xs text-muted">
              <span>≈ بالدولار</span>
              <span className="tnum">{currency.usd(currency.toUsd(totals.total))}</span>
            </div>
          )}
          <Row label="المدفوع" value={money(Number(paid) || 0)} />
          <Row label="المتبقي (دين)" value={money(totals.remaining)} danger />
          <div className="my-1 border-t border-line" />
          <Row label="صافي الربح" value={money(totals.profit)} good />
        </div>
      </section>

      <div className="flex justify-end gap-2 pb-4">
        <Link to="/invoices" className="rounded-lg border border-line px-5 py-2.5 text-sm text-muted hover:bg-surface-2">إلغاء</Link>
        <button type="button" onClick={handleSubmit} disabled={busy} className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
          {busy ? 'جارٍ الحفظ…' : 'حفظ الفاتورة'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, strong, danger, good }: { label: string; value: string; strong?: boolean; danger?: boolean; good?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`tnum ${strong ? 'text-base font-bold text-ink' : danger ? 'font-semibold text-bad' : good ? 'font-semibold text-good' : 'text-ink'}`}>{value}</span>
    </div>
  )
}

function CustomerPicker({ onPick }: { onPick: (id: number, name: string) => void }) {
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const debounced = useDebouncedValue(q.trim(), 300)
  const { data } = useCustomers(debounced)
  return (
    <div>
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن العميل بالاسم أو رقم اللوحة…" className={`${inputClass} flex-1`} autoFocus />
        <button type="button" onClick={() => setCreating(true)} className="shrink-0 rounded-lg bg-accent-soft px-3 py-2.5 text-sm font-semibold text-accent-ink hover:bg-accent/20">＋ عميل جديد</button>
      </div>
      {debounced && (
        <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
          {(data?.data ?? []).map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onPick(c.id, c.name)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-right text-sm hover:border-accent/40 hover:bg-surface-2">
                <span className="font-semibold">{c.name}</span>
                {c.phone && <span dir="ltr" className="mr-2 text-xs text-faint">{c.phone}</span>}
              </button>
            </li>
          ))}
          {(data?.data ?? []).length === 0 && <li className="px-1 text-sm text-faint">لا نتائج — أنشئ عميلاً جديداً بالزر بالأعلى.</li>}
        </ul>
      )}
      {creating && (
        <CustomerFormModal
          open
          onClose={() => setCreating(false)}
          onSaved={(c) => { onPick(c.id, c.name); setCreating(false) }}
        />
      )}
    </div>
  )
}
