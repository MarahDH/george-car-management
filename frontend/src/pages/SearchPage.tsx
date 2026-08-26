import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCustomers } from '../lib/customers'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import Icon from '../components/Icon'
import CustomerFormModal from '../components/CustomerFormModal'
import type { Customer } from '../types'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const debounced = useDebouncedValue(query.trim(), 300)
  const { data, isLoading, isError } = useCustomers(debounced)
  const [creating, setCreating] = useState(false)

  const customers = data?.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">العملاء</h1>
          <p className="text-sm text-muted">
            {data?.meta.total != null ? `${data.meta.total} عميل · ` : ''}ابحث بالاسم أو رقم اللوحة، أو أضف عميلاً جديداً.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-ink"
        >
          <span className="text-lg leading-none">＋</span> عميل جديد
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-faint">
          <Icon name="search" className="h-5 w-5" />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو رقم اللوحة…"
          className="w-full rounded-xl border border-line bg-surface py-3.5 pr-11 pl-4 text-lg text-ink shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="warsha-skeleton h-20" />)}
        </div>
      ) : isError ? (
        <p className="py-10 text-center text-bad">تعذّر تحميل العملاء.</p>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-12 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-faint"><Icon name="search" className="h-6 w-6" /></span>
          <p className="text-muted">{debounced ? 'لا توجد نتائج مطابقة.' : 'لا يوجد عملاء بعد — ابدأ بإضافة عميل جديد.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) => <CustomerCard key={c.id} customer={c} />)}
        </div>
      )}

      <CustomerFormModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

function CustomerCard({ customer }: { customer: Customer }) {
  const count = customer.cars_count ?? customer.cars?.length ?? 0

  return (
    <Link
      to={`/customers/${customer.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-all hover:border-accent/50 hover:shadow-md"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
        <Icon name="car" className="h-6 w-6" />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-ink">{customer.name}</h3>
        {customer.phone ? (
          <div dir="ltr" className="text-right text-xs text-faint tnum">{customer.phone}</div>
        ) : (
          <div className="text-xs text-faint">لا يوجد هاتف</div>
        )}
      </div>

      <div className="shrink-0 rounded-lg bg-surface-2 px-3 py-1.5 text-center ring-1 ring-line">
        <div className="tnum text-lg font-bold leading-none text-ink">{count}</div>
        <div className="mt-0.5 text-[10px] text-faint">{count === 1 ? 'سيارة' : 'سيارات'}</div>
      </div>

      <span className="shrink-0 text-lg text-faint transition-colors group-hover:text-accent">‹</span>
    </Link>
  )
}
