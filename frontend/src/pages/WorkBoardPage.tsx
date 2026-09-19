import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../lib/dashboard'
import { useUpdateInvoiceStatus } from '../lib/invoices'
import { useMoney } from '../lib/useMoney'
import { DEPARTMENTS, STATUS_ORDER } from '../lib/labels'
import Icon from '../components/Icon'
import Drawer from '../components/Drawer'
import StatusBadge from '../components/StatusBadge'
import WhatsAppModal from '../components/WhatsAppModal'
import { useToast } from '../components/Toast'
import type { Department, Invoice, InvoiceStatus } from '../types'

/** Days a car may sit in inspection/repair before the card is flagged. */
const STUCK_WARN_DAYS = 5
const STUCK_ALERT_DAYS = 10

/** Stage filter chips shown above the list; `all` shows every active car. */
const STAGE_CHIPS: { key: 'all' | InvoiceStatus; title: string }[] = [
  { key: 'all', title: 'الكل' },
  { key: 'inspecting', title: 'فحص' },
  { key: 'repairing', title: 'تصليح' },
  { key: 'ready', title: 'جاهزة' },
]

const NEXT_LABEL: Partial<Record<InvoiceStatus, string>> = { inspecting: 'بدء التصليح', repairing: 'جاهزة للتسليم' }

const STATUS_DEPTS: Department[] = ['mechanic', 'electrical', 'dozan']

/** Selectable page sizes for the table. */
const PAGE_SIZES = [12, 25, 50, 100]

/** Waiting-time buckets for the age filter. */
type AgeBucket = 'today' | 'recent' | 'stuck' | 'late'
const AGE_OPTIONS: { value: 'all' | AgeBucket; label: string }[] = [
  { value: 'all', label: 'كل المدد' },
  { value: 'today', label: 'اليوم' },
  { value: 'recent', label: '١–٤ أيام' },
  { value: 'stuck', label: `متأخرة (${STUCK_WARN_DAYS}–${STUCK_ALERT_DAYS - 1})` },
  { value: 'late', label: `متأخرة جداً (+${STUCK_ALERT_DAYS})` },
]

function ageBucket(days: number): AgeBucket {
  if (days <= 0) return 'today'
  if (days < STUCK_WARN_DAYS) return 'recent'
  if (days < STUCK_ALERT_DAYS) return 'stuck'
  return 'late'
}

/** Sort state shared by the sort dropdown and the clickable table headers. */
type SortKey = 'date' | 'plate' | 'remaining'
type SortState = { key: SortKey; dir: 'asc' | 'desc' }
const SORT_PRESETS: { value: string; label: string; sort: SortState }[] = [
  { value: 'oldest', label: 'الأقدم أولاً', sort: { key: 'date', dir: 'asc' } },
  { value: 'newest', label: 'الأحدث أولاً', sort: { key: 'date', dir: 'desc' } },
  { value: 'plate', label: 'اللوحة', sort: { key: 'plate', dir: 'asc' } },
  { value: 'due', label: 'الأعلى متبقياً', sort: { key: 'remaining', dir: 'desc' } },
]

function sortInvoices(arr: Invoice[], { key, dir }: SortState): Invoice[] {
  const m = dir === 'asc' ? 1 : -1
  return [...arr].sort((a, b) => {
    let r = 0
    if (key === 'date') r = a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id
    else if (key === 'plate') r = (a.car?.plate_number ?? '').localeCompare(b.car?.plate_number ?? '', 'ar')
    else r = a.remaining - b.remaining
    return r * m
  })
}

export default function WorkBoardPage() {
  const money = useMoney()
  const toast = useToast()
  const dash = useDashboard()
  const updateStatus = useUpdateInvoiceStatus()

  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<'all' | InvoiceStatus>('all')
  const [cityFilter, setCityFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState<'all' | Department>('all')
  const [ageFilter, setAgeFilter] = useState<'all' | AgeBucket>('all')
  const [dueOnly, setDueOnly] = useState(false)
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'asc' })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [wa, setWa] = useState<{ number: string | null; message: string } | null>(null)

  const loading = dash.isLoading
  const all = useMemo(() => [...(dash.data?.in_progress ?? []), ...(dash.data?.ready ?? [])], [dash.data])

  // City options come from the plate prefix ("حلب 220044" → "حلب").
  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const i of all) {
      const c = splitPlate(i.car?.plate_number).city
      if (c) set.add(c)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'))
  }, [all])

  // Search across plate, car, and customer.
  const q = query.trim().toLowerCase()
  const searched = useMemo(
    () => (q ? all.filter((i) => [i.car?.plate_number, i.car?.type, i.car?.model, i.customer?.name, i.invoice_number].some((v) => v?.toLowerCase().includes(q))) : all),
    [all, q],
  )

  // Everything except the stage chips — so the chip counts reflect the other filters.
  const preStage = useMemo(
    () =>
      searched.filter((i) => {
        if (cityFilter !== 'all' && splitPlate(i.car?.plate_number).city !== cityFilter) return false
        if (deptFilter !== 'all' && !(i.labor_items ?? []).some((l) => l.department === deptFilter)) return false
        if (ageFilter !== 'all' && ageBucket(daysSince(i.date)) !== ageFilter) return false
        if (dueOnly && i.remaining <= 0) return false
        return true
      }),
    [searched, cityFilter, deptFilter, ageFilter, dueOnly],
  )

  const chipCount = (key: 'all' | InvoiceStatus) => (key === 'all' ? preStage.length : preStage.filter((i) => i.status === key).length)

  const list = useMemo(() => {
    const staged = stageFilter === 'all' ? preStage : preStage.filter((i) => i.status === stageFilter)
    return sortInvoices(staged, sort)
  }, [preStage, stageFilter, sort])

  // Pagination — the board can hold 100+ cars, so page the table.
  const [pageSize, setPageSize] = useState(12)
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = useMemo(() => list.slice((safePage - 1) * pageSize, safePage * pageSize), [list, safePage, pageSize])
  // Any filter or page-size change sends the reader back to the first page.
  useEffect(() => setPage(1), [q, stageFilter, cityFilter, deptFilter, ageFilter, dueOnly, pageSize])

  const filtersActive = query !== '' || stageFilter !== 'all' || cityFilter !== 'all' || deptFilter !== 'all' || ageFilter !== 'all' || dueOnly
  function clearFilters() {
    setQuery('')
    setStageFilter('all')
    setCityFilter('all')
    setDeptFilter('all')
    setAgeFilter('all')
    setDueOnly(false)
  }

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'remaining' ? 'desc' : 'asc' }))
  }
  const sortValue = SORT_PRESETS.find((p) => p.sort.key === sort.key && p.sort.dir === sort.dir)?.value ?? 'custom'

  // Keep the modal bound to live data so it updates after a status change / refetch.
  const selected = selectedId != null ? all.find((i) => i.id === selectedId) ?? null : null

  async function advance(inv: Invoice) {
    const next = STATUS_ORDER[STATUS_ORDER.indexOf(inv.status) + 1]
    if (!next) return
    await updateStatus.mutateAsync({ id: inv.id, status: next })
    toast(next === 'ready' ? `السيارة ${inv.car?.plate_number ?? ''} جاهزة للتسليم` : `بدأ تصليح ${inv.car?.plate_number ?? ''}`)
  }

  function readyMessage(inv: Invoice) {
    return `عزيزي ${inv.customer?.name ?? ''}، سيارتك ${inv.car?.type ?? ''} ذات اللوحة رقم ${inv.car?.plate_number ?? ''} جاهزة الآن للتسليم في مركزنا. الإجمالي: ${money(inv.total)}. أهلاً بك.`
  }

  const updatedAt = dash.dataUpdatedAt ? new Date(dash.dataUpdatedAt).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-ink">
            <span className="aqua-grad grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm"><Icon name="car" className="h-5 w-5" /></span>
            حالة السيارات
          </h1>
          <p className="mt-1 text-sm text-muted">السيارات الموجودة في الورشة الآن. رتّب وفلتر القائمة، واضغط على أي سيارة لعرض التفاصيل.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-faint">
          {dash.isFetching && !loading && <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />}
          {updatedAt && <span>آخر تحديث {updatedAt}</span>}
          <button type="button" onClick={() => void dash.refetch()} className="rounded-lg border border-line px-2.5 py-1 font-semibold text-muted hover:bg-surface-2">تحديث</button>
        </div>
      </div>

      {/* Toolbar — search + filters share one wrapping row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search — compact, fixed width so the filters + pager share one row */}
        <div className="relative w-full sm:w-52">
          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint"><Icon name="search" className="h-4 w-4" /></span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم اللوحة أو العميل…"
            className="h-9 w-full rounded-lg border border-line bg-surface pr-9 pl-8 text-sm text-ink shadow-sm outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-cyan/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="مسح البحث"
              className="absolute inset-y-0 left-2 my-auto grid h-5 w-5 place-items-center rounded-full text-faint transition-colors hover:bg-surface-2 hover:text-muted"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <FilterSelect
          ariaLabel="تصفية حسب المرحلة"
          value={stageFilter}
          onChange={(v) => setStageFilter(v as 'all' | InvoiceStatus)}
          options={STAGE_CHIPS.map((c) => ({ value: c.key, label: `${c.title} (${chipCount(c.key)})` }))}
        />
        <FilterSelect
          ariaLabel="تصفية حسب المدينة"
          value={cityFilter}
          onChange={setCityFilter}
          options={[{ value: 'all', label: 'كل المدن' }, ...cities.map((c) => ({ value: c, label: c }))]}
        />
        <FilterSelect
          ariaLabel="تصفية حسب القسم"
          value={deptFilter}
          onChange={(v) => setDeptFilter(v as 'all' | Department)}
          options={[{ value: 'all', label: 'كل الأقسام' }, ...STATUS_DEPTS.map((d) => ({ value: d, label: DEPARTMENTS[d] }))]}
        />
        <FilterSelect
          ariaLabel="تصفية حسب المدة"
          value={ageFilter}
          onChange={(v) => setAgeFilter(v as 'all' | AgeBucket)}
          options={AGE_OPTIONS}
        />
        <button
          type="button"
          onClick={() => setDueOnly((v) => !v)}
          className={`inline-flex h-9 shrink-0 items-center rounded-lg border px-3 text-sm font-semibold shadow-sm transition-colors ${dueOnly ? 'border-bad bg-bad/10 text-bad' : 'border-line bg-surface text-muted hover:bg-surface-2'}`}
        >
          متبقٍ فقط
        </button>
        <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-line sm:block" />
        <FilterSelect
          ariaLabel="ترتيب القائمة"
          value={sortValue}
          onChange={(v) => {
            const p = SORT_PRESETS.find((x) => x.value === v)
            if (p) setSort(p.sort)
          }}
          options={sortValue === 'custom' ? [...SORT_PRESETS, { value: 'custom', label: 'مخصص' }] : SORT_PRESETS}
        />
        <FilterSelect
          ariaLabel="عدد السيارات في الصفحة"
          value={String(pageSize)}
          onChange={(v) => setPageSize(Number(v))}
          options={PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} لكل صفحة` }))}
        />
        {filtersActive && (
          <button type="button" onClick={clearFilters} className="inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-accent-ink hover:bg-accent-soft/40">
            مسح الفلاتر
          </button>
        )}
        {pageCount > 1 && (
          <div className="ms-auto">
            <PageNav page={safePage} pageCount={pageCount} onPage={setPage} />
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="warsha-skeleton h-11 w-full rounded-lg" />)}</div>
      ) : list.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-sm text-muted">
          <p>{filtersActive ? 'لا توجد نتائج مطابقة للفلاتر.' : 'لا توجد سيارات في الورشة حالياً.'}</p>
          {filtersActive ? (
            <button type="button" onClick={clearFilters} className="mt-2 inline-block font-semibold text-accent-ink hover:underline">مسح الفلاتر</button>
          ) : (
            <Link to="/invoices/new" className="mt-2 inline-block font-semibold text-accent-ink hover:underline">＋ فاتورة جديدة</Link>
          )}
        </div>
      ) : (
        <CarTable list={paged} sort={sort} onSort={toggleSort} onOpen={setSelectedId} />
      )}

      <Drawer
        open={selected !== null}
        title={
          selected ? (
            <span className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="tnum rounded-md bg-surface-2 px-2 py-0.5 text-sm font-bold text-ink ring-1 ring-line">{selected.car?.plate_number ?? '—'}</span>
              <span className="text-base font-bold text-ink">{[selected.car?.type, selected.car?.model, selected.car?.year].filter(Boolean).join(' ') || 'سيارة'}</span>
            </span>
          ) : ''
        }
        onClose={() => setSelectedId(null)}
      >
        {selected && (
          <CarDetails
            inv={selected}
            money={money}
            busy={updateStatus.isPending}
            onAdvance={selected.status === 'ready' ? undefined : () => void advance(selected)}
            onWhatsApp={selected.status === 'ready' ? () => setWa({ number: selected.customer?.whatsapp_number ?? null, message: readyMessage(selected) }) : undefined}
          />
        )}
      </Drawer>

      {wa && <WhatsAppModal open onClose={() => setWa(null)} waNumber={wa.number} defaultMessage={wa.message} title="إشعار الجاهزية" />}
    </div>
  )
}

function FilterSelect({ value, onChange, options, ariaLabel }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; ariaLabel: string }) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 shrink-0 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-muted shadow-sm outline-none transition-colors hover:bg-surface-2 focus:border-accent focus:ring-2 focus:ring-cyan/40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

/** Build the numbered page list with ellipsis gaps, MUI-style: 1 … 4 5 6 … 12. */
function pageItems(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const out: (number | 'gap')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(count - 1, page + 1)
  if (start > 2) out.push('gap')
  for (let p = start; p <= end; p++) out.push(p)
  if (end < count - 1) out.push('gap')
  out.push(count)
  return out
}

/** Compact numbered pager (MUI-style), sits inline in the toolbar above the table. */
function PageNav({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (p: number) => void }) {
  return (
    <nav className="flex items-center gap-1" aria-label="ترقيم الصفحات">
      <PageArrow disabled={page <= 1} onClick={() => onPage(page - 1)} dir="prev" />
      {pageItems(page, pageCount).map((it, i) =>
        it === 'gap' ? (
          <span key={`gap-${i}`} className="grid h-9 w-5 place-items-center text-xs text-faint">…</span>
        ) : (
          <PageNum key={it} n={it} active={it === page} onClick={() => onPage(it)} />
        ),
      )}
      <PageArrow disabled={page >= pageCount} onClick={() => onPage(page + 1)} dir="next" />
    </nav>
  )
}

function PageNum({ n, active, onClick }: { n: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`tnum grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-semibold transition-colors ${
        active ? 'border-accent bg-accent text-white shadow-sm' : 'border-line bg-surface text-muted hover:bg-surface-2'
      }`}
    >
      {n}
    </button>
  )
}

function PageArrow({ disabled, onClick, dir }: { disabled: boolean; onClick: () => void; dir: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === 'prev' ? 'الصفحة السابقة' : 'الصفحة التالية'}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface text-muted shadow-sm transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-surface"
    >
      <Icon name="chevron" className={`h-4 w-4 ${dir === 'prev' ? 'rotate-180' : ''}`} />
    </button>
  )
}

/** Dense, sortable table — the default view; scales to the board's 100+100 rows. */
function CarTable({ list, sort, onSort, onOpen }: { list: Invoice[]; sort: SortState; onSort: (k: SortKey) => void; onOpen: (id: number) => void }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-sm">
      <table className="w-full min-w-[480px] border-collapse text-right text-sm">
        <thead className="border-b border-line bg-surface-2/60 text-xs font-semibold text-muted">
          <tr>
            <Th label="اللوحة" sortKey="plate" sort={sort} onSort={onSort} />
            <Th label="السيارة" />
            <Th label="العميل" />
            <Th label="الحالة" />
            <th className="w-10 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line/70">
          {list.map((inv) => <CarTableRow key={inv.id} inv={inv} onOpen={() => onOpen(inv.id)} />)}
        </tbody>
      </table>
    </div>
  )
}

function Th({ label, sortKey, sort, onSort }: { label: string; sortKey?: SortKey; sort?: SortState; onSort?: (k: SortKey) => void }) {
  if (!sortKey || !sort || !onSort) return <th className="whitespace-nowrap px-3 py-2.5 font-semibold">{label}</th>
  const active = sort.key === sortKey
  return (
    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 transition-colors hover:text-accent ${active ? 'text-accent' : ''}`}>
        {label}
        <span className={`text-[10px] ${active ? 'text-accent' : 'text-faint/60'}`}>{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  )
}

function CarTableRow({ inv, onOpen }: { inv: Invoice; onOpen: () => void }) {
  const days = daysSince(inv.date)
  const stuck = inv.status !== 'ready' && days >= STUCK_WARN_DAYS
  const alert = inv.status !== 'ready' && days >= STUCK_ALERT_DAYS
  const carLabel = [inv.car?.type, inv.car?.model].filter(Boolean).join(' ')
  const { city, number } = splitPlate(inv.car?.plate_number)

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={`group cursor-pointer transition-colors ${alert ? 'hover:bg-bad/5' : stuck ? 'hover:bg-warn/5' : 'hover:bg-accent-soft/40'}`}
    >
      <td className="px-3 py-2">
        <span className="flex flex-col leading-tight">
          {city && <span className="text-[11px] text-muted">{city}</span>}
          <span dir="ltr" className="tnum font-bold text-ink">{number}</span>
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-semibold text-ink">{carLabel || 'سيارة'}</td>
      <td className="whitespace-nowrap px-3 py-2 text-muted">{inv.customer?.name ?? '—'}</td>
      <td className="px-3 py-2"><StatusBadge status={inv.status} /></td>
      <td className="px-3 py-2">
        <span className="grid h-6 w-6 place-items-center rounded-md text-faint transition-colors group-hover:text-accent" title="عرض التفاصيل">
          <Icon name="chevron" className="h-4 w-4 rotate-180" />
        </span>
      </td>
    </tr>
  )
}

function CarDetails({ inv, money, busy, onAdvance, onWhatsApp }: { inv: Invoice; money: (v: number) => string; busy: boolean; onAdvance?: () => void; onWhatsApp?: () => void }) {
  const days = daysSince(inv.date)
  const stuck = inv.status !== 'ready' && days >= STUCK_WARN_DAYS
  const alert = inv.status !== 'ready' && days >= STUCK_ALERT_DAYS
  const labor = inv.labor_items ?? []
  const paidPct = inv.total > 0 ? Math.min(100, Math.round((inv.paid_amount / inv.total) * 100)) : 0

  return (
    <div className="divide-y divide-line">
      {/* Status + invoice reference (car identity now lives in the modal header) */}
      <div className="flex items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={inv.status} />
          <AgeBadge days={days} status={inv.status} stuck={stuck} alert={alert} />
        </div>
        <Link to={`/invoices/${inv.id}`} className="shrink-0 text-xs font-semibold text-accent-ink hover:underline">
          الفاتورة {inv.invoice_number} ›
        </Link>
      </div>

      {/* Customer — plain labelled row */}
      <div className="flex items-center justify-between gap-3 py-3.5">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-faint">العميل</div>
          <Link to={`/customers/${inv.customer_id}`} className="font-semibold text-ink hover:text-accent-ink">{inv.customer?.name ?? '—'}</Link>
        </div>
        {inv.customer?.phone && <a href={`tel:${inv.customer.phone}`} dir="ltr" className="tnum text-sm text-muted transition-colors hover:text-accent-ink">{inv.customer.phone}</a>}
      </div>

      {/* Work — clean one-line list */}
      <div className="py-3.5">
        <div className="mb-2 text-[11px] font-semibold text-faint">الأعمال</div>
        {labor.length === 0 ? (
          <p className="text-sm text-faint">لم تُسجَّل أعمال بعد.</p>
        ) : (
          <ul className="space-y-2">
            {labor.map((l, i) => (
              <li key={l.id ?? i} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted ring-1 ring-line">{DEPARTMENTS[l.department]}</span>
                  <span className="truncate text-ink">{l.description || '—'}{l.worker_name ? ` · ${l.worker_name}` : ''}</span>
                </span>
                <span className="tnum shrink-0 text-muted">{money(l.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Money — single light panel with a payment bar */}
      <div className="py-3.5">
        <div className="rounded-xl bg-surface-2/50 p-3.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[11px] text-faint">الإجمالي</div>
              <div className="tnum mt-0.5 text-sm font-bold text-ink">{money(inv.total)}</div>
            </div>
            <div>
              <div className="text-[11px] text-faint">المدفوع</div>
              <div className="tnum mt-0.5 text-sm font-bold text-good">{money(inv.paid_amount)}</div>
            </div>
            <div>
              <div className="text-[11px] text-faint">المتبقي</div>
              <div className={`tnum mt-0.5 text-sm font-bold ${inv.remaining > 0 ? 'text-bad' : 'text-faint'}`}>{money(inv.remaining)}</div>
            </div>
          </div>
          {inv.remaining > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
                <span className="text-faint">نسبة السداد</span>
                <span className="tnum text-muted">{paidPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
          )}
        </div>
        {inv.notes && <p className="mt-3 text-sm text-muted">{inv.notes}</p>}
      </div>

      {/* Footer — meta + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
        <span className="text-xs text-faint tnum">دخلت الورشة {inv.date}{inv.odometer ? ` · العداد ${inv.odometer.toLocaleString('en-US')} كم` : ''}</span>
        <div className="flex gap-2">
          {onWhatsApp && (
            <button type="button" onClick={onWhatsApp} className="flex items-center gap-1.5 rounded-lg bg-good/10 px-4 py-2 text-sm font-semibold text-good hover:bg-good/20">
              <Icon name="phone" className="h-4 w-4" /> إبلاغ العميل
            </button>
          )}
          {onAdvance && (
            <button type="button" onClick={onAdvance} disabled={busy} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
              {busy ? 'جارٍ الحفظ…' : `${NEXT_LABEL[inv.status]} ←`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AgeBadge({ days, status, stuck, alert }: { days: number; status: InvoiceStatus; stuck: boolean; alert: boolean }) {
  const label = days <= 0 ? 'اليوم' : days === 1 ? 'منذ يوم' : days === 2 ? 'منذ يومين' : days <= 10 ? `منذ ${days} أيام` : `منذ ${days} يوماً`
  const tone = alert ? 'bg-bad/10 text-bad' : stuck ? 'bg-warn/10 text-warn' : status === 'ready' ? 'bg-good/10 text-good' : 'bg-surface-2 text-faint'
  return <span className={`tnum shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>
}

/** Split a Syrian plate string ("حلب 220044", "ريف دمشق 214578") into city + number. */
function splitPlate(plate?: string | null): { city: string; number: string } {
  const p = (plate ?? '').trim()
  if (!p) return { city: '', number: '—' }
  const i = p.lastIndexOf(' ')
  return i > 0 ? { city: p.slice(0, i), number: p.slice(i + 1) } : { city: '', number: p }
}

function daysSince(date: string): number {
  const d = new Date(date)
  const today = new Date()
  d.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86_400_000))
}
