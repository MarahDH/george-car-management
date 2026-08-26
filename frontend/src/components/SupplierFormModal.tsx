import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import { useToast } from './Toast'
import { useCreateSupplier, useUpdateSupplier } from '../lib/suppliers'
import { extractErrors, inputClass } from '../lib/formError'
import type { Supplier } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  supplier?: Supplier | null
}

export default function SupplierFormModal({ open, onClose, supplier }: Props) {
  const isEdit = Boolean(supplier)
  const [name, setName] = useState(supplier?.name ?? '')
  const [phone, setPhone] = useState(supplier?.phone ?? '')
  const [notes, setNotes] = useState(supplier?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)

  const create = useCreateSupplier()
  const update = useUpdateSupplier(supplier?.id ?? 0)
  const toast = useToast()
  const busy = create.isPending || update.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    setBanner(null)
    const input = { name, phone: phone || undefined, notes: notes || undefined }
    try {
      if (isEdit) await update.mutateAsync(input)
      else await create.mutateAsync(input)
      toast(isEdit ? 'تم تحديث المورد' : 'تم إضافة المورد')
      onClose()
    } catch (err) {
      const { message, fields } = extractErrors(err)
      setErrors(fields)
      setBanner(message)
    }
  }

  return (
    <Modal open={open} title={isEdit ? 'تعديل المورد' : 'مورد جديد'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {banner && (
          <div className="rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{banner}</div>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">الاسم *</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          {errors.name && <span className="mt-1 block text-xs text-bad">{errors.name}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">الهاتف</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className={`${inputClass} text-right`} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">ملاحظات</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2">
            إلغاء
          </button>
          <button type="submit" disabled={busy} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
            {busy ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
