import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import Select from './Select'
import { useToast } from './Toast'
import { useCreateSupplierPayment } from '../lib/supplierDebts'
import { extractErrors, inputClass } from '../lib/formError'
import { sanitizeNumberInput } from '../lib/format'
import { METHODS } from '../lib/labels'
import type { PayMethod } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  supplierId: number
  supplierName: string
}

export default function SupplierPaymentModal({ open, onClose, supplierId, supplierName }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PayMethod>('cash')
  const [date, setDate] = useState(today)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)

  const create = useCreateSupplierPayment()
  const toast = useToast()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    setBanner(null)
    try {
      await create.mutateAsync({
        supplier_id: supplierId,
        amount: Number(amount),
        method,
        date,
        note: note || undefined,
      })
      toast('تم تسجيل الدفعة للمورد')
      onClose()
    } catch (err) {
      const { message, fields } = extractErrors(err)
      setErrors(fields)
      setBanner(message)
    }
  }

  return (
    <Modal open={open} title={`دفعة للمورد — ${supplierName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {banner && <div className="rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">{banner}</div>}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">المبلغ *</span>
          <input autoFocus value={amount} onChange={(e) => setAmount(sanitizeNumberInput(e.target.value, { decimal: true }))} inputMode="numeric" dir="ltr" className={`${inputClass} text-right`} />
          {errors.amount && <span className="mt-1 block text-xs text-bad">{errors.amount}</span>}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="block">
            <span className="mb-1 block text-sm font-medium text-muted">طريقة الدفع</span>
            <Select value={method} onChange={(v) => setMethod(v as PayMethod)} ariaLabel="طريقة الدفع" options={(Object.keys(METHODS) as PayMethod[]).map((m) => ({ value: m, label: METHODS[m] }))} />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">التاريخ</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">ملاحظة</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2">إلغاء</button>
          <button type="submit" disabled={create.isPending} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
            {create.isPending ? 'جارٍ الحفظ…' : 'حفظ الدفعة'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
