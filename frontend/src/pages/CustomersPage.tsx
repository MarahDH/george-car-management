import { useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteCustomers, useSetCustomerArchived, type CustomerSort } from '../lib/customers'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useMoney } from '../lib/useMoney'
import Icon from '../components/Icon'
import CustomerFormModal from '../components/CustomerFormModal'
import WhatsAppModal from '../components/WhatsAppModal'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import type { Customer } from '../types'

type Sort = { key: CustomerSort; dir: 'asc' | 'desc' }

/**
 * The customers table. With `archived` it lists customers who stopped coming to the
 * center (see /customers/archived) and offers to restore them instead of adding new ones.
 */
export default function CustomersPage({ archived = false }: { archived?: boolean }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const money = useMoney()
  const toast = useToast()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const debounced = useDebouncedValue(query.trim(), 300)
  const [sort, setSort] = useState<Sort>(archived ? { key: 'archived_at', dir: 'desc' } : { key: 'name', dir: 'asc' })

  const {
    data, isLoading, isError, isPlaceholderData,
    hasNextPage, fetchNextPage, isFetchingNextPage,
  } = useInfiniteCustomers(debounced, sort.key, sort.dir, archived ? 'archived' : 'active')

  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<Customer | null>(null)
  const setArchived = useSetCustomerArchived()

  async function confirmRestore() {
    if (!restoring) return
    await setArchived.mutateAsync({ id: restoring.id, archived: false })
    toast(`تمت استعادة العميل «${restoring.name}»`)
    setRestoring(null)
  }
  const [wa, setWa] = useState<{ number: string | null; message: string } | null>(null)

  const customers = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.meta.total

  const scrollRef = useRef<HTMLDivElement>(null)
  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 240 && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }

  function onSort(key: CustomerSort) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' || key === 'phone' ? 'asc' : 'desc' },
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{archived ? 'العملاء المؤرشفون' : 'العملاء'}</h1>
          <p className="text-sm text-muted">
            {archived
              ? (total != null ? `${total} عميل توقّف عن زيارة المركز` : 'العملاء الذين توقّفوا عن زيارة المركز')
              : (total != null ? `${total} عميل مُسجّل` : 'قائمة العملاء')}
          </p>
        </div>
        {!archived && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="aqua-grad flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan/30 transition-transform hover:-translate-y-0.5"
          >
            <span className="text-lg leading-none">＋</span> عميل جديد
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-accent"><Icon name="search" className="h-5 w-5" /></span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="ابحث بالاسم أو رقم اللوحة أو الهاتف…"
          className="w-full rounded-xl border border-line bg-surface py-3 pr-12 pl-4 text-base text-ink shadow-sm outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-cyan/40"
        />
      </div>

      {/* Table */}
      {isError ? (
        <p className="py-10 text-center text-bad">تعذّر تحميل العملاء.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div ref={scrollRef} onScroll={onScroll} className={`max-h-[68vh] overflow-auto ${isPlaceholderData ? 'is-stale' : 'is-fresh'}`}>
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface-2 text-xs text-muted">
                <tr>
                  <Th label="العميل" sortKey="name" sort={sort} onSort={onSort} />
                  <Th label="الهاتف" sortKey="phone" sort={sort} onSort={onSort} />
                  <Th label="السيارات" sortKey="cars" sort={sort} onSort={onSort} align="center" />
                  <Th label="الديون" sortKey="debt" sort={sort} onSort={onSort} />
                  <Th label="آخر زيارة" sortKey="last_visit" sort={sort} onSort={onSort} />
                  {archived && <Th label="تاريخ الأرشفة" sortKey="archived_at" sort={sort} onSort={onSort} />}
                  <th className="px-4 py-2.5 text-left font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-t border-line/70">
                      <td colSpan={archived ? 7 : 6} className="px-4 py-2"><div className="warsha-skeleton h-9 w-full" /></td>
                    </tr>
                  ))
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={archived ? 7 : 6} className="px-4 py-16 text-center text-muted">
                      {debounced
                        ? 'لا توجد نتائج مطابقة.'
                        : archived
                          ? 'لا يوجد عملاء مؤرشفون — يمكنك أرشفة عميل من صفحة تفاصيله.'
                          : 'لا يوجد عملاء بعد — ابدأ بإضافة عميل جديد.'}
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <CustomerRow
                      key={c.id}
                      customer={c}
                      money={money}
                      archived={archived}
                      onOpen={() => navigate(`/customers/${c.id}`)}
                      onWhatsApp={() => setWa({ number: c.whatsapp_number, message: `مرحباً ${c.name}، نتواصل معكم من مركز صيانة السيارات.` })}
                      onRestore={() => setRestoring(c)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer: count + load more */}
          {!isLoading && customers.length > 0 && (
            <div className="flex items-center justify-between border-t border-line bg-surface-2/50 px-4 py-2.5 text-xs text-muted">
              <span>عُرض {customers.length}{total != null ? ` من ${total}` : ''}</span>
              {isFetchingNextPage ? (
                <span>جارٍ التحميل…</span>
              ) : hasNextPage ? (
                <button type="button" onClick={() => fetchNextPage()} className="rounded-lg px-3 py-1 font-semibold text-accent-ink hover:bg-white/70">تحميل المزيد ↓</button>
              ) : (
                <span>الكل</span>
              )}
            </div>
          )}
        </div>
      )}

      {wa && <WhatsAppModal open onClose={() => setWa(null)} waNumber={wa.number} defaultMessage={wa.message} title="مراسلة العميل" />}
      <CustomerFormModal open={creating} onClose={() => setCreating(false)} />

      {/* Restore confirmation */}
      <Modal open={restoring !== null} title="استعادة العميل" onClose={() => setRestoring(null)}>
        <div className="space-y-4">
          <p className="text-sm text-ink">
            إعادة العميل «{restoring?.name}» إلى قائمة العملاء النشطين؟
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRestoring(null)} className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2">
              إلغاء
            </button>
            <button type="button" onClick={() => void confirmRestore()} disabled={setArchived.isPending} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
              {setArchived.isPending ? 'جارٍ الاستعادة…' : 'نعم، استعد العميل'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Th({ label, sortKey, sort, onSort, align = 'right' }: { label: string; sortKey: CustomerSort; sort: Sort; onSort: (k: CustomerSort) => void; align?: 'right' | 'center' }) {
  const active = sort.key === sortKey
  return (
    <th className={`px-4 py-2.5 font-semibold ${align === 'center' ? 'text-center' : 'text-right'}`}>
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 transition-colors hover:text-ink ${active ? 'text-accent-ink' : ''}`}>
        {label}
        <span className="text-[9px] leading-none">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </button>
    </th>
  )
}

function CustomerRow({ customer, money, archived, onOpen, onWhatsApp, onRestore }: { customer: Customer; money: (v: number) => string; archived: boolean; onOpen: () => void; onWhatsApp: () => void; onRestore: () => void }) {
  const cars = customer.cars_count ?? customer.cars?.length ?? 0
  return (
    <tr onClick={onOpen} className="cursor-pointer border-t border-line/70 transition-colors hover:bg-accent-soft/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink"><Icon name="car" className="h-4 w-4" /></span>
          <span className="font-semibold text-ink">{customer.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted">{customer.phone ? <span dir="ltr" className="tnum">{customer.phone}</span> : <span className="text-faint">—</span>}</td>
      <td className="px-4 py-3">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink">
            <Icon name="car" className="h-3.5 w-3.5" />
            <span className="tnum">{cars}</span>
          </span>
        </div>
      </td>
      <td className="px-4 py-3"><DebtBadge debt={customer.debt} money={money} /></td>
      <td className="px-4 py-3"><span className="tnum text-muted">{customer.last_visit ?? '—'}</span></td>
      {archived && <td className="px-4 py-3"><span className="tnum text-muted">{customer.archived_at?.slice(0, 10) ?? '—'}</span></td>}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button type="button" aria-label="واتساب" data-tip="واتساب" disabled={!customer.whatsapp_number} onClick={onWhatsApp} className="tip grid h-8 w-8 place-items-center rounded-lg text-good transition-colors hover:bg-good/10 disabled:opacity-25"><Icon name="phone" className="h-4 w-4" /></button>
          {archived ? (
            <button type="button" aria-label="استعادة" data-tip="استعادة" onClick={onRestore} className="tip grid h-8 w-8 place-items-center rounded-lg text-accent-ink transition-colors hover:bg-accent-soft"><Icon name="archive" className="h-4 w-4" /></button>
          ) : (
            <Link aria-label="فاتورة جديدة" data-tip="فاتورة جديدة" to={`/invoices/new?customer_id=${customer.id}`} className="tip grid h-8 w-8 place-items-center rounded-lg text-accent-ink transition-colors hover:bg-accent-soft"><Icon name="invoice" className="h-4 w-4" /></Link>
          )}
          <span className="grid h-8 w-8 place-items-center text-faint">‹</span>
        </div>
      </td>
    </tr>
  )
}

function DebtBadge({ debt, money }: { debt: number | null | undefined; money: (v: number) => string }): ReactNode {
  if (debt == null) return <span className="text-faint">—</span>
  if (debt > 0) {
    return (
      <span className="tnum inline-flex items-center gap-1.5 rounded-full bg-bad/10 px-2.5 py-1 text-xs font-semibold text-bad">
        <span className="h-1.5 w-1.5 rounded-full bg-bad" />{money(debt)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-good/10 px-2.5 py-1 text-xs font-semibold text-good">
      <span className="h-1.5 w-1.5 rounded-full bg-good" />مسدّد
    </span>
  )
}
