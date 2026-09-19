import { useEffect, useState } from 'react'
import { useSettings, useUpdateSettings } from '../lib/useSettings'
import { useBackups, useCreateBackup } from '../lib/backups'
import { downloadFile } from '../lib/download'
import { useToast } from '../components/Toast'
import { inputClass } from '../lib/formError'
import { sanitizeNumberInput } from '../lib/format'
import Icon, { type IconName } from '../components/Icon'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

type TabId = 'general' | 'currency' | 'backups'
const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'general', label: 'عام', icon: 'settings' },
  { id: 'currency', label: 'العملة وسعر الصرف', icon: 'coins' },
  { id: 'backups', label: 'النسخ الاحتياطي', icon: 'reports' },
]

export default function SettingsPage() {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: backups, isLoading } = useBackups()
  const createBackup = useCreateBackup()
  const toast = useToast()

  const [tab, setTab] = useState<TabId>('general')
  const [businessName, setBusinessName] = useState('')
  const [currency, setCurrency] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('')
  const [invoiceFormat, setInvoiceFormat] = useState('')
  const [usdRate, setUsdRate] = useState('')
  const [usdSymbol, setUsdSymbol] = useState('')

  useEffect(() => {
    if (!settings) return
    setBusinessName(settings.business_name ?? '')
    setCurrency(settings.currency ?? '')
    setCurrencySymbol(settings.currency_symbol ?? '')
    setInvoiceFormat(settings.invoice_number_format ?? '')
    setUsdRate(settings.usd_rate ?? '')
    setUsdSymbol(settings.usd_symbol ?? '')
  }, [settings])

  async function save() {
    await updateSettings.mutateAsync({
      business_name: businessName,
      currency,
      currency_symbol: currencySymbol,
      invoice_number_format: invoiceFormat,
      usd_rate: usdRate,
      usd_symbol: usdSymbol,
    })
    toast('تم حفظ الإعدادات')
  }

  async function backupNow() {
    await createBackup.mutateAsync()
    toast('تم إنشاء نسخة احتياطية')
  }

  const saveBtn = (
    <div className="mt-5 flex justify-end border-t border-line pt-4">
      <button type="button" onClick={save} disabled={updateSettings.isPending} className="aqua-grad rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan/30 transition-transform hover:-translate-y-0.5 disabled:opacity-60">
        {updateSettings.isPending ? 'جارٍ الحفظ…' : '✓ حفظ الإعدادات'}
      </button>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-bold text-ink">
          <span className="aqua-grad grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm"><Icon name="settings" className="h-5 w-5" /></span>
          الإعدادات
        </h1>
        <p className="mt-1 text-sm text-muted">إدارة إعدادات الحساب والتطبيق.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        {/* Settings sub-nav */}
        <nav className="glass flex gap-2 overflow-x-auto rounded-2xl p-2 md:flex-col md:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${tab === t.id ? 'aqua-grad text-white shadow-md shadow-cyan/30' : 'text-muted hover:bg-white/60 hover:text-ink'}`}
            >
              <Icon name={t.icon} className="h-5 w-5 shrink-0" />
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Panel */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-6">
          {tab === 'general' && (
            <>
              <PanelHeader icon="settings" title="إعدادات عامة" hint="اسم المركز الظاهر على الفواتير وصيغة الترقيم." />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-muted">اسم المركز</span>
                  <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-muted">صيغة رقم الفاتورة</span>
                  <input value={invoiceFormat} onChange={(e) => setInvoiceFormat(e.target.value)} dir="ltr" className={`${inputClass} text-right font-mono`} />
                  <span className="mt-1 block text-xs text-faint">للعرض فقط — التوليد الحالي: سنة-شهر-تسلسل</span>
                </label>
              </div>
              {saveBtn}
            </>
          )}

          {tab === 'currency' && (
            <>
              <PanelHeader icon="coins" title="العملة وسعر الصرف" hint="رموز العملة وسعر صرف الدولار المستخدم للتحويل التلقائي." />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-muted">رمز العملة (مثل SYP)</span>
                  <input value={currency} onChange={(e) => setCurrency(e.target.value)} dir="ltr" className={`${inputClass} text-right`} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-muted">رمز العرض (مثل ل.س)</span>
                  <input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} className={inputClass} />
                </label>

                <div className="rounded-xl border border-accent/20 bg-accent-soft/40 p-3 sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-semibold text-ink">سعر صرف الدولار</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-muted">1 {usdSymbol || '$'} =</span>
                    <input value={usdRate} onChange={(e) => setUsdRate(sanitizeNumberInput(e.target.value, { decimal: true }))} inputMode="numeric" dir="ltr" placeholder="مثال: 15000" className={`${inputClass} w-40 text-right`} />
                    <span className="text-sm font-medium text-muted">{currencySymbol || 'ل.س'}</span>
                    <label className="ms-auto flex items-center gap-2">
                      <span className="text-xs text-muted">رمز الدولار</span>
                      <input value={usdSymbol} onChange={(e) => setUsdSymbol(e.target.value)} dir="ltr" placeholder="$" className={`${inputClass} w-16 text-center`} />
                    </label>
                  </div>
                  <span className="mt-1.5 block text-xs text-muted">يُستخدم لتحويل الأسعار تلقائياً بين الدولار والسوري عند إدخال القطع.</span>
                </div>
              </div>
              {saveBtn}
            </>
          )}

          {tab === 'backups' && (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <PanelHeader icon="reports" title="النسخ الاحتياطي" hint="نسخة يومية تلقائية + يمكنك أخذ نسخة الآن وتنزيلها." noMargin />
                <button type="button" onClick={backupNow} disabled={createBackup.isPending} className="aqua-grad rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-cyan/30 disabled:opacity-60">
                  {createBackup.isPending ? 'جارٍ…' : 'نسخة احتياطية الآن'}
                </button>
              </div>
              {isLoading ? (
                <p className="py-6 text-center text-sm text-muted">جارٍ التحميل…</p>
              ) : (backups ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-faint">لا توجد نسخ بعد.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {backups!.map((b) => (
                    <li key={b.name} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <span className="font-mono text-ink">{b.name}</span>
                        <span className="mr-2 text-xs text-faint">{b.created_at} · {formatSize(b.size)}</span>
                      </div>
                      <button type="button" onClick={() => void downloadFile(`/backups/${b.name}/download`, b.name)} className="rounded-lg border border-line px-3 py-1 text-xs text-muted hover:bg-surface-2">تنزيل</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PanelHeader({ icon, title, hint, noMargin }: { icon: IconName; title: string; hint?: string; noMargin?: boolean }) {
  return (
    <div className={noMargin ? '' : 'mb-4'}>
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Icon name={icon} className="h-5 w-5 text-accent" />
        {title}
      </h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
