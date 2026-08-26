import { STATUSES } from '../lib/labels'
import type { InvoiceStatus } from '../types'

const STYLES: Record<InvoiceStatus, string> = {
  inspecting: 'bg-surface-2 text-muted ring-line',
  repairing: 'bg-accent-soft text-accent-ink ring-accent/30',
  ready: 'bg-good/10 text-good ring-good/30',
}

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STYLES[status]}`}>
      {STATUSES[status]}
    </span>
  )
}
