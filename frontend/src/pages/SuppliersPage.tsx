import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSuppliers, useDeleteSupplier } from '../lib/suppliers'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import SupplierFormModal from '../components/SupplierFormModal'
import { useToast } from '../components/Toast'
import { SkeletonList } from '../components/Spinner'
import type { Supplier } from '../types'

export default function SuppliersPage() {
  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim(), 300)
  const { data, isLoading } = useSuppliers(debounced)
  const del = useDeleteSupplier()
  const toast = useToast()
  const [modal, setModal] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null })

  const suppliers = data?.data ?? []

  async function handleDelete(s: Supplier) {
    if (!confirm(`حذف المورد «${s.name}»؟`)) return
    await del.mutateAsync(s.id)
    toast('تم حذف المورد')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">الموردون والمصادر</h1>
        <button type="button" onClick={() => setModal({ open: true, supplier: null })} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-ink">
          <span className="text-lg leading-none">＋</span> مورد جديد
        </button>
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن مورد…" className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : suppliers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-10 text-center text-muted">لا يوجد موردون بعد.</div>
      ) : (
        <ul className="space-y-2">
          {suppliers.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
              <div>
                <Link to={`/suppliers/${s.id}`} className="font-semibold text-ink hover:text-accent-ink">{s.name}</Link>
                {s.phone && <span dir="ltr" className="mr-2 text-xs text-faint">{s.phone}</span>}
                <span className="mr-2 text-xs text-faint">· {s.part_items_count ?? 0} قطعة</span>
              </div>
              <div className="flex gap-1">
                <Link to={`/suppliers/${s.id}`} className="rounded-md px-2 py-1 text-xs text-accent-ink hover:bg-surface-2">كشف الحساب</Link>
                <button type="button" onClick={() => setModal({ open: true, supplier: s })} className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-ink">تعديل</button>
                <button type="button" onClick={() => handleDelete(s)} className="rounded-md px-2 py-1 text-xs text-muted hover:bg-bad/5 hover:text-bad">حذف</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal.open && <SupplierFormModal open onClose={() => setModal({ open: false, supplier: null })} supplier={modal.supplier} />}
    </div>
  )
}
