import Icon from '../components/Icon'

interface PlaceholderPageProps {
  title: string
  phase?: string
}

export default function PlaceholderPage({ title, phase }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        {phase && (
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink">
            {phase}
          </span>
        )}
      </div>

      <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong bg-surface p-12 text-center">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-faint">
          <Icon name="wrench" className="h-7 w-7" />
        </span>
        <h2 className="text-lg font-semibold text-ink">هذه الشاشة قيد الإنشاء</h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          الأساس (الواجهة العربية، المصادقة، الاتصال بالـ API) جاهز. سيتم بناء هذه الوحدة ضمن خطة
          المراحل المعتمدة.
        </p>
      </div>
    </div>
  )
}
