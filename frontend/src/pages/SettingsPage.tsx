import { useEffect, useState } from 'react'
import { useSettings, useUpdateSettings } from '../lib/useSettings'
import { useBackups, useCreateBackup } from '../lib/backups'
import { downloadFile } from '../lib/download'
import { useToast } from '../components/Toast'
import { inputClass } from '../lib/formError'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function SettingsPage() {
  const { data: settings } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: backups, isLoading } = useBackups()
  const createBackup = useCreateBackup()
  const toast = useToast()

  const [businessName, setBusinessName] = useState('')
  const [currency, setCurrency] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('')
  const [invoiceFormat, setInvoiceFormat] = useState('')

  useEffect(() => {
    if (!settings) return
    setBusinessName(settings.business_name ?? '')
    setCurrency(settings.currency ?? '')
    setCurrencySymbol(settings.currency_symbol ?? '')
    setInvoiceFormat(settings.invoice_number_format ?? '')
  }, [settings])

  async function save() {
    await updateSettings.mutateAsync({
      business_name: businessName,
      currency,
      currency_symbol: currencySymbol,
      invoice_number_format: invoiceFormat,
    })
    toast('تم حفظ الإعدادات')
  }

  async function backupNow() {
    await createBackup.mutateAsync()
    toast('تم إنشاء نسخة احتياطية')
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-ink">الإعدادات</h1>

      <section className="max-w-2xl rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-bold text-ink">معلومات المركز</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-muted">اسم المركز</span>
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">رمز العملة (مثل SYP)</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} dir="ltr" className={`${inputClass} text-right`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-muted">رمز العرض (مثل ل.س)</span>
            <input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-muted">صيغة رقم الفاتورة</span>
            <input value={invoiceFormat} onChange={(e) => setInvoiceFormat(e.target.value)} dir="ltr" className={`${inputClass} text-right font-mono`} />
            <span className="mt-1 block text-xs text-faint">للعرض فقط — التوليد الحالي: سنة-شهر-تسلسل</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={save} disabled={updateSettings.isPending} className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
            {updateSettings.isPending ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
          </button>
        </div>
      </section>

      <section className="max-w-2xl rounded-2xl border border-line bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-ink">النسخ الاحتياطي</h2>
            <p className="text-xs text-muted">نسخة يومية تلقائية + يمكنك أخذ نسخة الآن وتنزيلها.</p>
          </div>
          <button type="button" onClick={backupNow} disabled={createBackup.isPending} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-ink disabled:opacity-60">
            {createBackup.isPending ? 'جارٍ…' : 'نسخة احتياطية الآن'}
          </button>
        </div>
        {isLoading ? (
          <p className="py-4 text-center text-sm text-muted">جارٍ التحميل…</p>
        ) : (backups ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-faint">لا توجد نسخ بعد.</p>
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
      </section>
    </div>
  )
}
