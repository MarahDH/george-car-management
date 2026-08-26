import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import { useToast } from './Toast'
import { useCreateCar, useUpdateCar } from '../lib/customers'
import { extractErrors, inputClass } from '../lib/formError'
import type { Car } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  customerId: number
  car?: Car | null
}

export default function CarFormModal({ open, onClose, customerId, car }: Props) {
  const isEdit = Boolean(car)
  const [plate, setPlate] = useState(car?.plate_number ?? '')
  const [type, setType] = useState(car?.type ?? '')
  const [model, setModel] = useState(car?.model ?? '')
  const [chassis, setChassis] = useState(car?.chassis_number ?? '')
  const [year, setYear] = useState(car?.year ? String(car.year) : '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)

  const create = useCreateCar(customerId)
  const update = useUpdateCar(customerId)
  const toast = useToast()
  const busy = create.isPending || update.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    setBanner(null)
    const input = {
      plate_number: plate,
      type: type || undefined,
      model: model || undefined,
      chassis_number: chassis || undefined,
      year: year ? Number(year) : null,
    }
    try {
      if (isEdit && car) {
        await update.mutateAsync({ id: car.id, input })
      } else {
        await create.mutateAsync(input)
      }
      toast(isEdit ? 'تم تحديث السيارة' : 'تم إضافة السيارة')
      onClose()
    } catch (err) {
      const { message, fields } = extractErrors(err)
      setErrors(fields)
      setBanner(message)
    }
  }

  return (
    <Modal open={open} title={isEdit ? 'تعديل السيارة' : 'إضافة سيارة'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {banner && (
          <div className="rounded-lg border border-bad/30 bg-bad/5 px-3 py-2 text-sm text-bad">
            {banner}
          </div>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">رقم اللوحة *</span>
          <input autoFocus value={plate} onChange={(e) => setPlate(e.target.value)} className={inputClass} />
          {errors.plate_number && (
            <span className="mt-1 block text-xs text-bad">{errors.plate_number}</span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">النوع</span>
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="تويوتا" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">الموديل</span>
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="كامري" className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">سنة الصنع</span>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              dir="ltr"
              placeholder="2018"
              className={`${inputClass} text-right`}
            />
            {errors.year && <span className="mt-1 block text-xs text-bad">{errors.year}</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">رقم الشاصي</span>
            <input value={chassis} onChange={(e) => setChassis(e.target.value)} dir="ltr" className={`${inputClass} text-right`} />
          </label>
        </div>

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
