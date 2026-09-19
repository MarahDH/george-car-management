import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface DrawerProps {
  open: boolean
  title: ReactNode
  onClose: () => void
  children: ReactNode
}

/** Left-side sliding panel — a roomier alternative to a centered modal for detail views. */
export default function Drawer({ open, title, onClose, children }: DrawerProps) {
  // Keep the panel mounted through its exit animation, then unmount.
  const [mounted, setMounted] = useState(open)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      // Next frame: flip to the shown state so the transform transitions in.
      const id = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(id)
    }
    setShown(false)
    const t = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-y-0 left-0 flex w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ${shown ? 'translate-x-0' : '-translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 text-lg font-bold text-ink">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-faint hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
