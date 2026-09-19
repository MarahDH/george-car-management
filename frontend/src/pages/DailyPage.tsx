import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useDaily } from '../lib/daily'
import { useMoney } from '../lib/useMoney'
import { useCurrency } from '../lib/currency'
import { useWorkers } from '../lib/workers'
import { useSuppliers } from '../lib/suppliers'
import { useCustomers, useCustomer } from '../lib/customers'
import { useCreateInvoice, useDeleteInvoice, useUpdateInvoice, type InvoiceInput } from '../lib/invoices'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { DEPARTMENTS } from '../lib/labels'
import { sanitizeNumberInput } from '../lib/format'
import { Loading } from '../components/Spinner'
import Icon from '../components/Icon'
import DatePicker from '../components/DatePicker'
import DateRangePicker from '../components/DateRangePicker'
import Modal from '../components/Modal'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import CustomerFormModal from '../components/CustomerFormModal'
import CarFormModal from '../components/CarFormModal'
import { useToast } from '../components/Toast'
import type { Department, Invoice, PartItem } from '../types'
import { fmt, parse, todayStr } from '../lib/calendar'

/** Shift a YYYY-MM-DD by whole days, staying in local time (no UTC round-trip). */
function shiftDate(date: string, delta: number): string {
  const d = parse(date)
  d.setDate(d.getDate() + delta)
  return fmt(d)
}

/** First day of the current month, as YYYY-MM-DD. */
function monthStart(): string {
  const d = new Date()
  return fmt(new Date(d.getFullYear(), d.getMonth(), 1))
}

/** Inclusive day count between two YYYY-MM-DD strings. */
function dayCount(from: string, to: string): number {
  const diff = parse(to).getTime() - parse(from).getTime()
  return Math.abs(Math.round(diff / 86_400_000)) + 1
}

/** Quick range presets shown as chips in range mode. */
const RANGE_PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: 'اليوم', range: () => [todayStr(), todayStr()] },
  { label: 'آخر ٧ أيام', range: () => [shiftDate(todayStr(), -6), todayStr()] },
  { label: 'آخر ٣٠ يوماً', range: () => [shiftDate(todayStr(), -29), todayStr()] },
  { label: 'هذا الشهر', range: () => [monthStart(), todayStr()] },
]

type Option = { value: string; label: string }
type DateMode = 'day' | 'range'

export default function DailyPage() {
  const [mode, setMode] = useState<DateMode>('day')
  const [date, setDate] = useState(todayStr)
  const [from, setFrom] = useState(todayStr)
  const [to, setTo] = useState(todayStr)
  const [openId, setOpenId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  // A single day is just a range whose ends match; keep bounds ordered for the query.
  const rangeFrom = mode === 'day' ? date : from <= to ? from : to
  const rangeTo = mode === 'day' ? date : from <= to ? to : from
  const { data, isLoading } = useDaily(rangeFrom, rangeTo)
  const money = useMoney()
  const { data: workers } = useWorkers()
  const { data: suppliers } = useSuppliers('')

  const weekday = new Date(date + 'T00:00:00').toLocaleDateString('ar', { weekday: 'long' })
  // New cars are logged against the viewed day, or today when a range is shown.
  const newCarDate = mode === 'day' ? date : todayStr()

  function switchMode(next: DateMode) {
    if (next === mode) return
    if (next === 'range') {
      setFrom(date)
      setTo(date)
    } else {
      setDate(rangeTo)
    }
    setMode(next)
  }

  function goToday() {
    const t = todayStr()
    if (mode === 'day') setDate(t)
    else {
      setFrom(t)
      setTo(t)
    }
  }

  const invoices = data?.invoices ?? []
  const summary = data?.summary
  const selected = openId != null ? invoices.find((i) => i.id === openId) ?? null : null

  const workerOptions: Option[] = useMemo(
    () => [{ value: '', label: '—' }, ...(workers ?? []).map((w) => ({ value: String(w.id), label: w.name }))],
    [workers],
  )
  const supplierOptions: Option[] = useMemo(
    () => [{ value: '', label: '—' }, ...(suppliers?.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))],
    [suppliers],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">الحركة اليومية</h1>
          <p className="text-sm text-muted">سيارات اليوم في سطر واحد لكلٍّ منها — اضغط سيارة لعرض تفاصيلها وإدخال القطع والأعمال.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="aqua-grad flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan/30 transition-transform hover:-translate-y-0.5">
          <span className="text-lg leading-none">＋</span> إضافة سيارة
        </button>
      </div>

      {/* Date filter — single day or a range, one compact row */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2.5">
        {/* Mode toggle */}
        <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5 text-sm font-semibold">
          <button
            type="button"
            onClick={() => switchMode('day')}
            className={`rounded-md px-3 py-1.5 transition-colors ${mode === 'day' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            يوم واحد
          </button>
          <button
            type="button"
            onClick={() => switchMode('range')}
            className={`rounded-md px-3 py-1.5 transition-colors ${mode === 'range' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
          >
            فترة
          </button>
        </div>

        <span className="mx-0.5 hidden h-6 w-px bg-line sm:block" />

        {mode === 'day' ? (
          <>
            {/* Prev (right) · date · next (left) */}
            <div className="flex items-center gap-1">
              <button type="button" aria-label="اليوم السابق" onClick={() => setDate(shiftDate(date, -1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2">
                <Icon name="chevron" className="h-4 w-4 rotate-180" />
              </button>
              <DatePicker value={date} onChange={setDate} ariaLabel="اختر اليوم" />
              <button type="button" aria-label="اليوم التالي" onClick={() => setDate(shiftDate(date, 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2">
                <Icon name="chevron" className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm font-semibold text-muted">{weekday}</span>
            <button type="button" onClick={goToday} className="rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink hover:bg-accent/20">اليوم</button>
          </>
        ) : (
          <>
            <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} ariaLabel="اختر الفترة" />
            <span className="text-xs text-faint">{dayCount(rangeFrom, rangeTo)} يوم</span>
            <span className="mx-0.5 hidden h-6 w-px bg-line sm:block" />
            {RANGE_PRESETS.map((p) => {
              const [pf, pt] = p.range()
              const active = pf === from && pt === to
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setFrom(pf); setTo(pt) }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-muted hover:bg-surface-2'}`}
                >
                  {p.label}
                </button>
              )
            })}
          </>
        )}
      </div>

      {/* Summary */}
      {summary && summary.count > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="عدد السيارات" value={String(summary.count)} />
          <Stat label={mode === 'day' ? 'إجمالي اليوم' : 'إجمالي الفترة'} value={money(summary.total)} />
          <Stat label="المقبوض" value={money(summary.collected)} tone="good" />
          <Stat label="المتبقي (ديون)" value={money(summary.remaining)} tone="bad" />
        </div>
      )}

      {/* Cars of the day — one clean row per car */}
      {isLoading ? (
        <Loading />
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-12 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-faint"><Icon name="car" className="h-6 w-6" /></span>
          <p className="text-muted">لا توجد سيارات في هذا اليوم.</p>
          <button type="button" onClick={() => setAdding(true)} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-ink hover:bg-accent/20">
            <span className="text-base leading-none">＋</span> إضافة سيارة
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-xs font-semibold text-muted">
              <tr>
                <th className="px-3 py-2.5 text-right">السيارة</th>
                <th className="px-3 py-2.5 text-right">الزبون</th>
                <th className="px-3 py-2.5 text-right">الأقسام</th>
                <th className="px-3 py-2.5 text-center">الحالة</th>
                <th className="px-3 py-2.5 text-left">الإجمالي</th>
                <th className="px-3 py-2.5 text-left">المدفوع</th>
                <th className="px-3 py-2.5 text-left">المتبقي</th>
                <th className="w-8 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70 [&_td]:align-middle">
              {invoices.map((inv) => <CarRow key={inv.id} inv={inv} money={money} showDate={mode === 'range'} onOpen={() => setOpenId(inv.id)} />)}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <EditDrawer inv={selected} money={money} workerOptions={workerOptions} supplierOptions={supplierOptions} onClose={() => setOpenId(null)} />
      )}
      {adding && (
        <AddCarModal date={newCarDate} onClose={() => setAdding(false)} onCreated={(id) => { setAdding(false); setOpenId(id) }} />
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-good' : tone === 'bad' ? 'text-bad' : 'text-ink'
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`mt-1 tnum text-xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

// ── One clean summary row per car ───────────────────────────────────────
function CarRow({ inv, money, showDate, onOpen }: { inv: Invoice; money: (v: number) => string; showDate?: boolean; onOpen: () => void }) {
  const depts = Array.from(new Set((inv.labor_items ?? []).map((l) => l.department))) as Department[]
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() } }}
      className="cursor-pointer transition-colors hover:bg-accent-soft/30"
    >
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink"><Icon name="car" className="h-5 w-5" /></span>
          <span className="flex flex-col items-start leading-tight">
            <span dir="ltr" className="tnum whitespace-nowrap font-bold text-ink">{inv.car?.plate_number}</span>
            <span className="whitespace-nowrap text-[11px] text-muted">{[inv.car?.type, inv.car?.model, inv.car?.year].filter(Boolean).join(' · ') || '—'}</span>
            {showDate && <span dir="ltr" className="tnum mt-0.5 whitespace-nowrap text-[11px] text-faint">{inv.date}</span>}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span className="flex flex-col items-start leading-tight">
          <span className="whitespace-nowrap font-semibold text-ink">{inv.customer?.name ?? '—'}</span>
          {inv.customer?.phone && <span dir="ltr" className="tnum text-[11px] text-muted">{inv.customer.phone}</span>}
        </span>
      </td>
      <td className="px-3 py-2.5">
        {depts.length === 0 ? <span className="text-faint">—</span> : (
          <span className="flex flex-wrap gap-1">
            {depts.map((d) => <span key={d} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted ring-1 ring-line">{DEPARTMENTS[d]}</span>)}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-center"><StatusBadge status={inv.status} /></td>
      <td className="tnum whitespace-nowrap px-3 py-2.5 text-left font-semibold text-ink">{money(inv.total)}</td>
      <td className="tnum whitespace-nowrap px-3 py-2.5 text-left text-good">{money(inv.paid_amount)}</td>
      <td className={`tnum whitespace-nowrap px-3 py-2.5 text-left ${inv.remaining > 0 ? 'font-semibold text-bad' : 'text-faint'}`}>{money(inv.remaining)}</td>
      <td className="px-2 py-2.5 text-center text-faint">‹</td>
    </tr>
  )
}

// ── Editable item grid (Excel-style), one car at a time ─────────────────
interface PartRow {
  key: number
  supplier_id: string
  worker_id: string
  name: string
  buy_price: string
  sell_price: string
  price_usd: string
  quantity: string
}

interface LaborRow {
  key: number
  department: Department
  worker_id: string
  description: string
  amount: string
}

let uid = 1
const nextKey = () => uid++
const emptyRow = (): PartRow => ({ key: nextKey(), supplier_id: '', worker_id: '', name: '', buy_price: '', sell_price: '', price_usd: '', quantity: '1' })
const emptyLabor = (): LaborRow => ({ key: nextKey(), department: 'mechanic', worker_id: '', description: '', amount: '' })
const DEPT_OPTIONS: Option[] = (Object.keys(DEPARTMENTS) as Department[]).map((d) => ({ value: d, label: DEPARTMENTS[d] }))

function toRows(items?: PartItem[]): PartRow[] {
  return (items ?? []).map((p) => ({
    key: nextKey(),
    supplier_id: p.supplier_id ? String(p.supplier_id) : '',
    worker_id: p.worker_id ? String(p.worker_id) : '',
    name: p.name,
    buy_price: String(p.buy_price ?? 0),
    sell_price: String(p.sell_price ?? 0),
    price_usd: p.price_usd != null ? String(p.price_usd) : '',
    quantity: String(p.quantity ?? 1),
  }))
}
function toLaborRows(items?: Invoice['labor_items']): LaborRow[] {
  return (items ?? []).map((l) => ({
    key: nextKey(),
    department: l.department,
    worker_id: l.worker_id ? String(l.worker_id) : '',
    description: l.description ?? '',
    amount: String(l.amount ?? ''),
  }))
}

function EditDrawer({
  inv,
  money,
  workerOptions,
  supplierOptions,
  onClose,
}: {
  inv: Invoice
  money: (v: number) => string
  workerOptions: Option[]
  supplierOptions: Option[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const update = useUpdateInvoice(inv.id)
  const del = useDeleteInvoice()
  const currency = useCurrency()
  const toast = useToast()

  const [rows, setRows] = useState<PartRow[]>(() => toRows(inv.part_items))
  const [labor, setLabor] = useState<LaborRow[]>(() => toLaborRows(inv.labor_items))
  const [savedOnce, setSavedOnce] = useState(false)
  const [confirm, setConfirm] = useState<{ message: string; confirmLabel?: string; onYes: () => void } | null>(null)

  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Mirror the latest committed state so the debounced save always reads both grids.
  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const laborRef = useRef(labor)
  laborRef.current = labor

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (confirm) setConfirm(null); else onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, confirm])

  useEffect(() => {
    if (dirty.current) return
    setRows(toRows(inv.part_items))
    setLabor(toLaborRows(inv.labor_items))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv])

  const laborTotal = labor.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const partsTotal = rows.reduce((s, r) => s + (Number(r.sell_price) || 0) * (Number(r.quantity) || 0), 0)
  const total = laborTotal + partsTotal
  const remaining = total - (Number(inv.paid_amount) || 0)

  function buildInput(): InvoiceInput {
    return {
      customer_id: inv.customer_id,
      car_id: inv.car_id,
      date: inv.date,
      odometer: inv.odometer,
      status: inv.status,
      paid_amount: inv.paid_amount,
      payment_method: inv.payment_method,
      notes: inv.notes,
      labor_items: laborRef.current.filter((r) => r.amount !== '').map((r) => ({
        department: r.department,
        worker_id: r.worker_id ? Number(r.worker_id) : null,
        description: r.description || null,
        amount: Number(r.amount) || 0,
      })),
      part_items: rowsRef.current.filter((r) => r.name.trim() !== '').map((r) => ({
        supplier_id: r.supplier_id ? Number(r.supplier_id) : null,
        worker_id: r.worker_id ? Number(r.worker_id) : null,
        name: r.name.trim(),
        buy_price: Number(r.buy_price) || 0,
        sell_price: Number(r.sell_price) || 0,
        price_usd: r.price_usd !== '' ? Number(r.price_usd) : null,
        quantity: Number(r.quantity) || 1,
      })),
    }
  }

  function scheduleSave() {
    dirty.current = true
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        await update.mutateAsync(buildInput())
        dirty.current = false
        setSavedOnce(true)
        qc.invalidateQueries({ queryKey: ['daily'] })
      } catch {
        toast('تعذّر حفظ التغييرات')
      }
    }, 600)
  }

  // Persist on discrete moments only — a field losing focus, or a dropdown pick —
  // never on every keystroke. No-ops when nothing changed since the last save.
  function commit() {
    if (dirty.current) scheduleSave()
  }

  // Parts
  function patchPart(i: number, changes: Partial<PartRow>) {
    setRows((rs) => { const next = rs.map((r, j) => (j === i ? { ...r, ...changes } : r)); rowsRef.current = next; dirty.current = true; return next })
  }
  const addPart = () => setRows((rs) => [...rs, emptyRow()])
  function removePart(i: number) {
    setRows((rs) => { const next = rs.filter((_, j) => j !== i); rowsRef.current = next; scheduleSave(); return next })
  }
  function onSyp(i: number, v: string) {
    patchPart(i, { sell_price: v, price_usd: currency.hasRate && v !== '' && !Number.isNaN(Number(v)) ? String(currency.toUsd(Number(v))) : rows[i].price_usd })
  }
  function onUsd(i: number, v: string) {
    patchPart(i, { price_usd: v, sell_price: currency.hasRate && v !== '' && !Number.isNaN(Number(v)) ? String(currency.toSyp(Number(v))) : rows[i].sell_price })
  }

  // Labor
  function patchLabor(i: number, changes: Partial<LaborRow>) {
    setLabor((rs) => { const next = rs.map((r, j) => (j === i ? { ...r, ...changes } : r)); laborRef.current = next; dirty.current = true; return next })
  }
  const addLabor = () => setLabor((rs) => [...rs, emptyLabor()])
  function removeLabor(i: number) {
    setLabor((rs) => { const next = rs.filter((_, j) => j !== i); laborRef.current = next; scheduleSave(); return next })
  }

  async function deleteEntry() {
    try {
      await del.mutateAsync(inv.id)
      qc.invalidateQueries({ queryKey: ['daily'] })
      toast('تم حذف السيارة من اليوم')
      onClose()
    } catch {
      toast('تعذّر حذف السيارة')
    }
  }

  const carLabel = [inv.car?.type, inv.car?.model, inv.car?.year].filter(Boolean).join(' · ') || 'بدون تفاصيل'

  // Portal to <body> so the drawer spans the full viewport (an ancestor transform would otherwise trap it in the content area).
  return createPortal(
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <aside className="flex h-full w-full max-w-3xl flex-col bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="tnum rounded-md bg-surface-2 px-2 py-0.5 text-sm font-bold text-ink ring-1 ring-line">{inv.car?.plate_number ?? '—'}</span>
              <span className="text-lg font-bold text-ink">{carLabel}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>الزبون: <Link to={`/customers/${inv.customer_id}`} className="font-semibold text-ink hover:text-accent-ink">{inv.customer?.name}</Link></span>
              {inv.customer?.phone && <span dir="ltr" className="tnum">{inv.customer.phone}</span>}
              <StatusBadge status={inv.status} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SaveStatus pending={update.isPending} saved={savedOnce} />
            <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink">
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Parts grid */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">القطع</h3>
              <button type="button" onClick={addPart} className="flex items-center gap-1 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink hover:bg-accent/20">
                <span className="text-sm leading-none">＋</span> صف جديد
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border-2 border-line-strong">
              <table className="w-full min-w-[560px] border-collapse text-sm [&_td]:border [&_td]:border-line [&_th]:border [&_th]:border-line">
                <thead className="bg-surface-2 text-[11px] font-bold text-ink">
                  <tr>
                    <th className="px-3 py-2 text-right">القطعة</th>
                    <th className="px-2 py-2 text-right">العامل</th>
                    <th className="px-2 py-2 text-right">المصدر</th>
                    <th className="w-16 px-1 py-2 text-center">الكمية</th>
                    <th className="w-24 px-1 py-2 text-center">سوري</th>
                    <th className="w-20 px-1 py-2 text-center">دولار</th>
                    <th className="w-10 px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.key} className={i % 2 ? 'bg-surface-2/30' : 'bg-surface'}>
                      <td className="p-0"><CellInput value={row.name} onChange={(v) => patchPart(i, { name: v })} onCommit={commit} placeholder="اسم القطعة…" /></td>
                      <td className="p-0"><CellSelect value={row.worker_id} onChange={(v) => { patchPart(i, { worker_id: v }); scheduleSave() }} options={workerOptions} /></td>
                      <td className="p-0"><CellSelect value={row.supplier_id} onChange={(v) => { patchPart(i, { supplier_id: v }); scheduleSave() }} options={supplierOptions} /></td>
                      <td className="p-0"><CellInput value={row.quantity} onChange={(v) => patchPart(i, { quantity: v })} onCommit={commit} numeric decimal={false} className="text-center" /></td>
                      <td className="p-0"><CellInput value={row.sell_price} onChange={(v) => onSyp(i, v)} onCommit={commit} numeric placeholder="0" /></td>
                      <td className="p-0"><CellInput value={row.price_usd} onChange={(v) => onUsd(i, v)} onCommit={commit} numeric placeholder="—" /></td>
                      <td className="px-1 text-center align-middle">
                        <button type="button" onClick={() => setConfirm({ message: `حذف السطر «${rows[i].name.trim() || 'فارغ'}»؟`, onYes: () => removePart(i) })} aria-label="حذف الصف" className="mx-auto grid h-7 w-7 place-items-center rounded text-faint hover:bg-bad/10 hover:text-bad">
                          <Icon name="close" className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-faint">لا قطع بعد — اضغط «صف جديد» لإضافة أول سطر.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Labor grid (editable) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">الأجور</h3>
              <button type="button" onClick={addLabor} className="flex items-center gap-1 rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-ink hover:bg-accent/20">
                <span className="text-sm leading-none">＋</span> أجرة جديدة
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border-2 border-line-strong">
              <table className="w-full min-w-[520px] border-collapse text-sm [&_td]:border [&_td]:border-line [&_th]:border [&_th]:border-line">
                <thead className="bg-surface-2 text-[11px] font-bold text-ink">
                  <tr>
                    <th className="w-28 px-2 py-2 text-right">القسم</th>
                    <th className="px-2 py-2 text-right">العامل</th>
                    <th className="px-3 py-2 text-right">الوصف</th>
                    <th className="w-28 px-1 py-2 text-center">المبلغ (سوري)</th>
                    <th className="w-10 px-1 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {labor.map((row, i) => (
                    <tr key={row.key} className={i % 2 ? 'bg-surface-2/30' : 'bg-surface'}>
                      <td className="p-0"><CellSelect value={row.department} onChange={(v) => { patchLabor(i, { department: v as Department }); scheduleSave() }} options={DEPT_OPTIONS} /></td>
                      <td className="p-0"><CellSelect value={row.worker_id} onChange={(v) => { patchLabor(i, { worker_id: v }); scheduleSave() }} options={workerOptions} /></td>
                      <td className="p-0"><CellInput value={row.description} onChange={(v) => patchLabor(i, { description: v })} onCommit={commit} placeholder="وصف العمل…" /></td>
                      <td className="p-0"><CellInput value={row.amount} onChange={(v) => patchLabor(i, { amount: v })} onCommit={commit} numeric placeholder="0" /></td>
                      <td className="px-1 text-center align-middle">
                        <button type="button" onClick={() => setConfirm({ message: 'حذف سطر الأجرة؟', onYes: () => removeLabor(i) })} aria-label="حذف الأجرة" className="mx-auto grid h-7 w-7 place-items-center rounded text-faint hover:bg-bad/10 hover:text-bad">
                          <Icon name="close" className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {labor.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-faint">لا أجور — اضغط «أجرة جديدة» لإضافة سطر.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface-2/50 p-3 text-center">
            <div><div className="text-[11px] text-faint">الإجمالي</div><div className="tnum mt-0.5 text-sm font-bold text-ink">{money(total)}</div></div>
            <div><div className="text-[11px] text-faint">المدفوع</div><div className="tnum mt-0.5 text-sm font-bold text-good">{money(inv.paid_amount)}</div></div>
            <div><div className="text-[11px] text-faint">المتبقي</div><div className={`tnum mt-0.5 text-sm font-bold ${remaining > 0 ? 'text-bad' : 'text-faint'}`}>{money(remaining)}</div></div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={() => setConfirm({ message: 'حذف هذه السيارة من حركة اليوم نهائياً؟ لا يمكن التراجع.', confirmLabel: 'حذف السيارة', onYes: deleteEntry })}
            className="flex items-center gap-1.5 rounded-lg border border-bad/30 px-3 py-2 text-xs font-semibold text-bad hover:bg-bad/10"
          >
            <Icon name="trash" className="h-4 w-4" /> حذف السيارة من اليوم
          </button>
          <div className="flex items-center gap-3">
            <Link to={`/invoices/${inv.id}`} className="text-xs font-semibold text-accent-ink hover:underline">الفاتورة الكاملة ›</Link>
            <button type="button" onClick={onClose} className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-ink">تم</button>
          </div>
        </div>
      </aside>

      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={() => { confirm.onYes(); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>,
    document.body,
  )
}

function ConfirmDialog({ message, confirmLabel = 'حذف', onConfirm, onCancel }: { message: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bad/10 text-bad"><Icon name="trash" className="h-5 w-5" /></span>
          <p className="pt-1 text-sm font-semibold text-ink">{message}</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2">إلغاء</button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white hover:bg-bad/90">{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function SaveStatus({ pending, saved }: { pending: boolean; saved: boolean }) {
  if (pending) return <span className="flex items-center gap-1 text-[11px] font-semibold text-faint"><span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> يحفظ…</span>
  if (saved) return <span className="text-[11px] font-semibold text-good">تم الحفظ ✓</span>
  return null
}

function CellInput({ value, onChange, onCommit, placeholder, numeric, decimal = true, className = '' }: { value: string; onChange: (v: string) => void; onCommit?: () => void; placeholder?: string; numeric?: boolean; decimal?: boolean; className?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(numeric ? sanitizeNumberInput(e.target.value, { decimal }) : e.target.value)}
      onBlur={onCommit}
      placeholder={placeholder}
      inputMode={numeric ? 'numeric' : undefined}
      dir={numeric ? 'ltr' : undefined}
      className={`w-full bg-transparent px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint/70 focus:bg-accent-soft/50 focus:ring-2 focus:ring-inset focus:ring-accent ${numeric ? 'tnum text-right' : ''} ${className}`}
    />
  )
}

function CellSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Option[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full cursor-pointer bg-transparent px-2 py-2 text-sm text-ink outline-none transition-colors focus:bg-accent-soft/50 focus:ring-2 focus:ring-inset focus:ring-accent">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ── Add a car to the day: pick an existing customer/car, or create new ──
function AddCarModal({ date, onClose, onCreated }: { date: string; onClose: () => void; onCreated: (invoiceId: number) => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const create = useCreateInvoice()

  const [q, setQ] = useState('')
  const debounced = useDebouncedValue(q.trim(), 300)
  const { data: results } = useCustomers(debounced)

  const [customerId, setCustomerId] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState('')
  const { data: picked } = useCustomer(customerId ?? NaN)
  const cars = picked?.customer.cars ?? []

  const [carId, setCarId] = useState<number | null>(null)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [creatingCar, setCreatingCar] = useState(false)
  const justAddedCar = useRef(false)

  useEffect(() => {
    if (justAddedCar.current && cars.length > 0) {
      setCarId(cars.reduce((a, b) => (a.id > b.id ? a : b)).id)
      justAddedCar.current = false
    }
  }, [cars])

  async function add() {
    if (!customerId || !carId) return
    try {
      const saved = await create.mutateAsync({
        customer_id: customerId, car_id: carId, date, odometer: null, status: 'inspecting',
        paid_amount: 0, payment_method: 'cash', notes: null, labor_items: [], part_items: [],
      })
      qc.invalidateQueries({ queryKey: ['daily'] })
      toast('تمت إضافة السيارة لليوم')
      onCreated(saved.id)
    } catch {
      toast('تعذّر إضافة السيارة')
    }
  }

  const carOptions: Option[] = cars.map((c) => ({ value: String(c.id), label: `${c.plate_number}${c.type ? ` — ${c.type}` : ''}` }))

  return (
    <Modal open title="إضافة سيارة لليوم" onClose={onClose}>
      {!customerId ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن العميل بالاسم أو رقم اللوحة…" autoFocus className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-cyan/40" />
            <button type="button" onClick={() => setCreatingCustomer(true)} className="shrink-0 rounded-lg bg-accent-soft px-3 text-sm font-semibold text-accent-ink hover:bg-accent/20">＋ عميل جديد</button>
          </div>
          {debounced && (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {(results?.data ?? []).map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { setCustomerId(c.id); setCustomerName(c.name) }} className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-right text-sm hover:border-accent/40 hover:bg-surface-2">
                    <span className="font-semibold text-ink">{c.name}</span>
                    {c.phone && <span dir="ltr" className="tnum text-xs text-faint">{c.phone}</span>}
                  </button>
                </li>
              ))}
              {(results?.data ?? []).length === 0 && <li className="px-1 text-sm text-faint">لا نتائج — أنشئ عميلاً جديداً بالزر بالأعلى.</li>}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
            <span className="text-sm font-semibold text-ink">{customerName || picked?.customer.name || '—'}</span>
            <button type="button" onClick={() => { setCustomerId(null); setCarId(null) }} className="text-xs text-muted hover:text-ink">تغيير العميل</button>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">السيارة</span>
              <button type="button" onClick={() => setCreatingCar(true)} className="text-xs font-semibold text-accent-ink hover:underline">＋ سيارة جديدة</button>
            </div>
            {cars.length > 0 ? (
              <Select value={carId ? String(carId) : ''} onChange={(v) => setCarId(v ? Number(v) : null)} placeholder="اختر السيارة…" options={carOptions} ariaLabel="السيارة" />
            ) : (
              <p className="text-sm text-faint">لا سيارات لهذا العميل — أضف واحدة بالزر بالأعلى.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2">إلغاء</button>
            <button type="button" onClick={add} disabled={!carId || create.isPending} className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
              {create.isPending ? 'جارٍ الإضافة…' : 'إضافة وفتح'}
            </button>
          </div>
        </div>
      )}

      {creatingCustomer && (
        <CustomerFormModal open onClose={() => setCreatingCustomer(false)} onSaved={(c) => { setCustomerId(c.id); setCustomerName(c.name); setCreatingCustomer(false) }} />
      )}
      {creatingCar && customerId && (
        <CarFormModal open customerId={customerId} onClose={() => { justAddedCar.current = true; setCreatingCar(false) }} />
      )}
    </Modal>
  )
}
