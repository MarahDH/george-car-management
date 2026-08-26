import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسار التنقل" className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((crumb, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {crumb.to && !last ? (
              <Link to={crumb.to} className="text-muted hover:text-ink">{crumb.label}</Link>
            ) : (
              <span className={last ? 'font-semibold text-ink' : 'text-muted'}>{crumb.label}</span>
            )}
            {!last && <span className="text-faint" aria-hidden>‹</span>}
          </span>
        )
      })}
    </nav>
  )
}
