import { useState, type FormEvent } from 'react'
import { useCreateWorker, useDeleteWorker, useUpdateWorker, useWorkers } from '../lib/workers'
import { useToast } from '../components/Toast'
import { extractErrors, inputClass } from '../lib/formError'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import type { Worker } from '../types'

/** Which form dialog is open: a new worker, an existing one being renamed, or none. */
type FormState = { mode: 'add' } | { mode: 'edit'; worker: Worker } | null

export default function WorkersPage() {
  const { data: workers, isLoading } = useWorkers()
  const createWorker = useCreateWorker()
  const updateWorker = useUpdateWorker()
  const deleteWorker = useDeleteWorker()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(null)
  const [formName, setFormName] = useState('')
  const [query, setQuery] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Worker | null>(null)

  const saving = createWorker.isPending || updateWorker.isPending

  function openAdd() {
    setForm({ mode: 'add' })
    setFormName('')
    setFormError(null)
  }

  function openEdit(w: Worker) {
    setForm({ mode: 'edit', worker: w })
    setFormName(w.name)
    setFormError(null)
  }

  async function saveForm(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    const n = formName.trim()
    if (!n) return
    try {
      if (form.mode === 'edit') {
        await updateWorker.mutateAsync({ id: form.worker.id, name: n })
        toast('تم تحديث العامل')
      } else {
        await createWorker.mutateAsync(n)
        toast('تمت إضافة العامل')
      }
      setForm(null)
    } catch (err) {
      setFormError(extractErrors(err).message)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    await deleteWorker.mutateAsync(deleting.id)
    toast('تم حذف العامل')
    setDeleting(null)
  }

  const all = workers ?? []
  const q = query.trim().toLowerCase()
  // Client-side filter — the workers list is small enough to search in memory.
  const list = q ? all.filter((w) => w.name.toLowerCase().includes(q)) : all

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">العمّال</h1>
          <p className="text-sm text-muted">قائمة الفنيين — تُستخدم عند إدخال العمل اليومي واختيار العامل لكل قطعة.</p>
        </div>
        <button type="button" onClick={openAdd} className="aqua-grad shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-cyan/30">
          ＋ إضافة عامل
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-accent"><Icon name="search" className="h-5 w-5" /></span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="ابحث باسم العامل…"
          className="w-full rounded-xl border border-line bg-surface py-3 pr-12 pl-4 text-base text-ink shadow-sm outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-cyan/40"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead className="bg-surface-2 text-xs text-muted">
              <tr>
                <th className="w-14 px-4 py-2.5 text-right font-semibold">#</th>
                <th className="px-4 py-2.5 text-right font-semibold">العامل</th>
                <th className="px-4 py-2.5 text-left font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-line/70">
                    <td colSpan={3} className="px-4 py-2"><div className="warsha-skeleton h-9 w-full" /></td>
                  </tr>
                ))
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-14 text-center text-muted">
                    {q ? (
                      'لا توجد نتائج مطابقة.'
                    ) : (
                      <>
                        لا يوجد عمّال بعد —{' '}
                        <button type="button" onClick={openAdd} className="font-semibold text-accent-ink hover:underline">أضف أول عامل</button>.
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                list.map((w, i) => (
                  <tr key={w.id} className="border-t border-line/70 transition-colors hover:bg-accent-soft/40">
                    <td className="px-4 py-3 tnum text-faint">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink"><Icon name="wrench" className="h-4 w-4" /></span>
                        <span className="font-semibold text-ink">{w.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label="تعديل"
                          data-tip="تعديل"
                          onClick={() => openEdit(w)}
                          className="tip grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-accent-soft hover:text-accent-ink"
                        >
                          <Icon name="edit" className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="حذف"
                          data-tip="حذف"
                          onClick={() => setDeleting(w)}
                          className="tip grid h-8 w-8 place-items-center rounded-lg text-faint transition-colors hover:bg-bad/10 hover:text-bad"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && list.length > 0 && (
          <div className="border-t border-line bg-surface-2/50 px-4 py-2.5 text-xs text-muted">
            {q ? `عُرض ${list.length} من ${all.length}` : `${all.length} عامل`}
          </div>
        )}
      </div>

      {/* Add / edit dialog */}
      <Modal open={form !== null} title={form?.mode === 'edit' ? 'تعديل العامل' : 'عامل جديد'} onClose={() => setForm(null)}>
        <form onSubmit={saveForm} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{formError}</div>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">اسم العامل *</span>
            <input autoFocus value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="اسم العامل…" className={inputClass} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setForm(null)} className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2">
              إلغاء
            </button>
            <button type="submit" disabled={saving || !formName.trim()} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
              {saving ? 'جارٍ الحفظ…' : form?.mode === 'edit' ? 'حفظ التعديل' : 'إضافة'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={deleting !== null} title="حذف العامل" onClose={() => setDeleting(null)}>
        <div className="space-y-4">
          <p className="text-sm text-ink">
            هل أنت متأكد من حذف العامل «{deleting?.name}»؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2">
              إلغاء
            </button>
            <button type="button" onClick={() => void confirmDelete()} disabled={deleteWorker.isPending} className="rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {deleteWorker.isPending ? 'جارٍ الحذف…' : 'نعم، احذف'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
