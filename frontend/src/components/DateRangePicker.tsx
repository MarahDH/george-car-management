import { useEffect, useState } from 'react'
import Icon from './Icon'
import { MONTHS, WEEKDAYS, parse, todayStr, monthCells } from '../lib/calendar'

/** Compact Arabic label for a range, dropping repeated month/year. */
function rangeLabel(from: string, to: string): string {
  if (!from || !to) return '—'
  const a = parse(from)
  const b = parse(to)
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  const sameYear = a.getFullYear() === b.getFullYear()
  if (from === to) return `${a.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()}`
  if (sameMonth) return `${a.getDate()} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
  if (sameYear) return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
  return `${a.getDate()} ${MONTHS[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
}

const order = (a: string, b: string): [string, string] => (a <= b ? [a, b] : [b, a])

/**
 * A single-calendar range picker: click a start day, then an end day, with the
 * days in between shaded (and previewed on hover). RTL, matches the app tokens.
 */
export default function DateRangePicker({
  from,
  to,
  onChange,
  ariaLabel,
  className = '',
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  ariaLabel?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => parse(from))
  // Set once the user clicks a start day and is waiting to click the end day.
  const [pending, setPending] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setView(parse(from))
      setPending(null)
      setHover(null)
    }
  }, [open, from])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.('[data-rangepicker]')) setOpen(false)
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
  const cells = monthCells(y, mo)

  // Which span to paint: the live selection, or a hover preview while choosing the end.
  const [lo, hi] = pending ? order(pending, hover ?? pending) : [from, to]

  function click(d: string) {
    if (pending == null) {
      setPending(d)
      setHover(d)
    } else {
      const [f, t] = order(pending, d)
      onChange(f, t)
      setPending(null)
      setOpen(false)
    }
  }

  return (
    <div data-rangepicker className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="tnum flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm font-medium text-ink outline-none transition-colors hover:bg-surface focus:border-accent focus:ring-2 focus:ring-cyan/40"
      >
        <Icon name="calendar" className="h-4 w-4 text-muted" />
        {rangeLabel(from, to)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-line bg-surface p-3 shadow-2xl" role="dialog">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="الشهر السابق" onClick={() => setView(new Date(y, mo - 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2">
              <Icon name="chevron" className="h-4 w-4 rotate-180" />
            </button>
            <div className="tnum text-sm font-bold text-ink">{MONTHS[mo]} {y}</div>
            <button type="button" aria-label="الشهر التالي" onClick={() => setView(new Date(y, mo + 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2">
              <Icon name="chevron" className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 text-center text-[11px] font-semibold text-faint">
            {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5" onMouseLeave={() => pending && setHover(pending)}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />
              const isStart = d === lo
              const isEnd = d === hi
              const endpoint = isStart || isEnd
              const between = d > lo && d < hi
              const isToday = d === todayStr()
              return (
                <div
                  key={i}
                  // Painted span sits on the wrapper so it reads as one connected bar;
                  // only the outer edges round (RTL: start is the right edge).
                  className={`${between || endpoint ? 'bg-accent-soft' : ''} ${
                    isStart && isEnd ? 'rounded-lg' : isStart ? 'rounded-r-lg' : isEnd ? 'rounded-l-lg' : ''
                  }`}
                >
                  <button
                    type="button"
                    onMouseEnter={() => pending && setHover(d)}
                    onClick={() => click(d)}
                    aria-current={isToday ? 'date' : undefined}
                    className={`tnum grid h-9 w-full place-items-center rounded-lg text-sm transition-colors ${
                      endpoint
                        ? 'bg-accent font-bold text-white shadow-sm'
                        : between
                          ? 'text-accent-ink'
                          : isToday
                            ? 'font-bold text-accent-ink ring-1 ring-inset ring-accent/40 hover:bg-surface-2'
                            : 'text-ink hover:bg-surface-2'
                    }`}
                  >
                    {Number(d.slice(8))}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-2 border-t border-line pt-2 text-center text-[11px] text-faint">
            {pending ? 'اختر تاريخ النهاية' : 'اضغط تاريخ البداية ثم النهاية'}
          </div>
        </div>
      )}
    </div>
  )
}
