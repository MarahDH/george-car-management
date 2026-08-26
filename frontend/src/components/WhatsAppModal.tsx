import { useState } from 'react'
import Modal from './Modal'
import { inputClass } from '../lib/formError'

interface Props {
  open: boolean
  onClose: () => void
  waNumber: string | null
  defaultMessage: string
  title?: string
}

export default function WhatsAppModal({ open, onClose, waNumber, defaultMessage, title }: Props) {
  const [message, setMessage] = useState(defaultMessage)

  function send() {
    const base = waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/'
    window.open(`${base}?text=${encodeURIComponent(message)}`, '_blank')
    onClose()
  }

  return (
    <Modal open={open} title={title ?? 'إرسال عبر واتساب'} onClose={onClose}>
      <div className="space-y-4">
        {!waNumber && (
          <div className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-ink">
            لا يوجد رقم هاتف لهذا العميل — سيفتح واتساب بدون تحديد المستلم.
          </div>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-muted">نص الرسالة</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className={inputClass}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:bg-surface-2"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={send}
            className="rounded-lg bg-good px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            فتح واتساب
          </button>
        </div>
      </div>
    </Modal>
  )
}
