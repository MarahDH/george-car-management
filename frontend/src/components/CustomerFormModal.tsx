import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import { useToast } from './Toast'
import { useCreateCustomer, useUpdateCustomer } from '../lib/customers'
import { extractErrors, inputClass } from '../lib/formError'
import type { Customer } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  customer?: Customer | null
  onSaved?: (customer: Customer) => void
}

export default function CustomerFormModal({ open, onClose, customer, onSaved }: Props) {
  const isEdit = Boolean(customer)
  const [name, setName] = useState(customer?.name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [altPhone, setAltPhone] = useState(customer?.alt_phone ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [address, setAddress] = useState(customer?.address ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)

  const create = useCreateCustomer()
  const update = useUpdateCustomer(customer?.id ?? 0)
  const toast = useToast()
  const busy = create.isPending || update.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    setBanner(null)
    const input = {
      name,
      phone: phone || undefined,
      alt_phone: altPhone || undefined,
      email: email || undefined,
      address: address || undefined,
      country_code: '963',
      notes: notes || undefined,
    }
    try {
      const saved = isEdit ? await update.mutateAsync(input) : await create.mutateAsync(input)
      toast(isEdit ? 'تم تحديث بيانات العميل' : 'تم إضافة العميل')
      onSaved?.(saved)
      onClose()
    } catch (err) {
      const { message, fields } = extractErrors(err)
      setErrors(fields)
      setBanner(message)
    }
  }

  return (
    <Modal open={open} title={isEdit ? 'تعديل العميل' : 'عميل جديد'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {banner && (
          <div className="rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
            {banner}
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">الاسم *</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          {errors.name && <span className="mt-1 block text-xs text-bad">{errors.name}</span>}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">رقم الهاتف</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            placeholder="09xxxxxxxx"
            className={`${inputClass} text-right`}
          />
          {errors.phone && <span className="mt-1 block text-xs text-bad">{errors.phone}</span>}
          <span className="mt-1 block text-xs text-faint">رمز الدولة سوريا (963+) يُضاف تلقائياً للواتساب</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">رقم إضافي</span>
            <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} dir="ltr" className={`${inputClass} text-right`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">البريد الإلكتروني</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" className={`${inputClass} text-right`} />
            {errors.email && <span className="mt-1 block text-xs text-bad">{errors.email}</span>}
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">العنوان</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">ملاحظات</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60"
          >
            {busy ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
