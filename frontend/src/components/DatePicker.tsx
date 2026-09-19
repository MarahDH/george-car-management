import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { MONTHS, WEEKDAYS, parse, todayStr, monthCells } from '../lib/calendar'

/**
 * A styled single-date picker: a trigger button showing the chosen date and a
 * popover month grid. RTL-aware, matches the app's surface/ink/accent tokens.
 * Optional `min`/`max` (YYYY-MM-DD) disable out-of-bounds days.
 */
export default function DatePicker({
  value,
  onChange,
  min,
  max,
  ariaLabel,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  min?: string
  max?: string
  ariaLabel?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  // The month currently shown in the grid — seeded from the value, moves with the arrows.
  const [view, setView] = useState(() => parse(value))
  const wrap = useRef<HTMLDivElement>(null)

  // Re-sync the visible month whenever the popover opens on a new value.
  useEffect(() => {
    if (open) setView(parse(value))
  }, [open, value])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const y = view.getFullYear()
  const mo = view.getMonth()

  const cells = useMemo(() => monthCells(y, mo), [y, mo])

  const disabled = (d: string) => (min != null && d < min) || (max != null && d > max)

  function pick(d: string) {
    if (disabled(d)) return
    onChange(d)
    setOpen(false)
  }

  const shown = value || '—'
  const label = value ? `${parse(value).getDate()} ${MONTHS[parse(value).getMonth()]} ${parse(value).getFullYear()}` : shown

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="tnum flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink outline-none transition-colors hover:bg-surface focus:border-accent focus:ring-2 focus:ring-cyan/40"
      >
        <Icon name="calendar" className="h-4 w-4 text-muted" />
        {label}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-line bg-surface p-3 shadow-2xl" role="dialog">
          {/* Month navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="الشهر السابق" onClick={() => setView(new Date(y, mo - 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2">
              <Icon name="chevron" className="h-4 w-4 rotate-180" />
            </button>
            <div className="tnum text-sm font-bold text-ink">{MONTHS[mo]} {y}</div>
            <button type="button" aria-label="الشهر التالي" onClick={() => setView(new Date(y, mo + 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2">
              <Icon name="chevron" className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-semibold text-faint">
            {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const isToday = d === todayStr()
              const isSelected = d === value
              const off = disabled(d)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={off}
                  onClick={() => pick(d)}
                  aria-current={isToday ? 'date' : undefined}
                  className={`tnum grid h-9 place-items-center rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-accent font-bold text-white shadow-sm'
                      : off
                        ? 'cursor-not-allowed text-faint/40'
                        : isToday
                          ? 'font-bold text-accent-ink ring-1 ring-inset ring-accent/40 hover:bg-surface-2'
                          : 'text-ink hover:bg-surface-2'
                  }`}
                >
                  {Number(d.slice(8))}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 flex justify-center border-t border-line pt-2">
            <button
              type="button"
              onClick={() => pick(todayStr())}
              disabled={disabled(todayStr())}
              className="rounded-lg bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink hover:bg-accent/20 disabled:opacity-40"
            >
              اليوم
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
