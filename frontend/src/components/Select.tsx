import { useEffect, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  ariaLabel?: string
}

export default function Select({ value, onChange, options, placeholder = 'اختر…', className = '', ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-right text-ink outline-none transition-colors hover:border-line-strong focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        <span className={`truncate ${selected ? '' : 'text-faint'}`}>{selected ? selected.label : placeholder}</span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 text-faint transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <ul role="listbox" className="absolute z-50 mt-1 max-h-60 w-full min-w-max overflow-auto rounded-lg border border-line bg-surface p-1 shadow-xl">
          {options.map((o) => {
            const active = o.value === value
            return (
              <li key={o.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false) }}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-right text-sm transition-colors ${active ? 'bg-accent-soft font-semibold text-accent-ink' : 'text-ink hover:bg-surface-2'}`}
                >
                  <span className="truncate">{o.label}</span>
                  {active && <span aria-hidden>✓</span>}
                </button>
              </li>
            )
          })}
          {options.length === 0 && <li className="px-3 py-2 text-sm text-faint">لا خيارات</li>}
        </ul>
      )}
    </div>
  )
}
