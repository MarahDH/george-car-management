import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCustomer, useDeleteCustomer, useDeleteCar } from '../lib/customers'
import { useMoney } from '../lib/useMoney'
import CustomerFormModal from '../components/CustomerFormModal'
import CarFormModal from '../components/CarFormModal'
import PaymentModal from '../components/PaymentModal'
import StatusBadge from '../components/StatusBadge'
import Icon from '../components/Icon'
import Breadcrumbs from '../components/Breadcrumbs'
import { useToast } from '../components/Toast'
import { Loading } from '../components/Spinner'
import { DEPARTMENTS } from '../lib/labels'
import type { Car, Department, Invoice } from '../types'

type Tab = 'cars' | 'invoices' | 'maintenance'

export default function CustomerProfilePage() {
  const { id } = useParams()
  const customerId = Number(id)
  const navigate = useNavigate()
  const { data, isLoading, isError } = useCustomer(customerId)
  const deleteCustomer = useDeleteCustomer()
  const deleteCar = useDeleteCar(customerId)
  const money = useMoney()
  const toast = useToast()

  const [editing, setEditing] = useState(false)
  const [paying, setPaying] = useState(false)
  const [carModal, setCarModal] = useState<{ open: boolean; car: Car | null }>({ open: false, car: null })
  const [tab, setTab] = useState<Tab>('cars')

  if (isLoading) return <Loading />

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10 text-center">
        <p className="text-bad">تعذّر تحميل بيانات العميل.</p>
        <Link to="/search" className="mt-3 inline-block text-accent-ink">العودة للبحث</Link>
      </div>
    )
  }

  const { customer, financials, invoices } = data
  const cars = customer.cars ?? []

  async function handleDeleteCustomer() {
    if (!confirm(`حذف العميل «${customer.name}» وكل سياراته وفواتيره؟`)) return
    await deleteCustomer.mutateAsync(customer.id)
    toast('تم حذف العميل')
    navigate('/search', { replace: true })
  }

  async function handleDeleteCar(car: Car) {
    if (!confirm(`حذف السيارة «${car.plate_number}»؟`)) return
    await deleteCar.mutateAsync(car.id)
    toast('تم حذف السيارة')
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'cars', label: 'السيارات', count: cars.length },
    { key: 'invoices', label: 'الفواتير', count: invoices.length },
    { key: 'maintenance', label: 'سجل الصيانة', count: invoices.length },
  ]

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: 'العملاء', to: '/search' }, { label: customer.name }]} />

      {/* Header */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink">{customer.name}</h1>
            <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Detail icon="debt" label="الهاتف">
                {customer.phone ? (
                  <span className="flex items-center gap-2">
                    <span dir="ltr" className="tnum">{customer.phone}</span>
                    {customer.whatsapp_number && <a href={`https://wa.me/${customer.whatsapp_number}`} target="_blank" rel="noreferrer" className="rounded-md bg-good/10 px-2 py-0.5 text-xs font-medium text-good hover:bg-good/20">واتساب</a>}
                  </span>
                ) : '—'}
              </Detail>
              {customer.alt_phone && <Detail icon="debt" label="رقم إضافي"><span dir="ltr" className="tnum">{customer.alt_phone}</span></Detail>}
              {customer.email && <Detail icon="reports" label="البريد"><span dir="ltr">{customer.email}</span></Detail>}
              {customer.address && <Detail icon="suppliers" label="العنوان">{customer.address}</Detail>}
            </div>
            {customer.notes && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">{customer.notes}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/invoices/new?customer_id=${customer.id}`} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-ink">فاتورة جديدة</Link>
            <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface-2">تعديل</button>
            <button type="button" onClick={handleDeleteCustomer} className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:border-bad/40 hover:bg-bad/5 hover:text-bad">حذف</button>
          </div>
        </div>
      </div>

      {/* Financial snapshot */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="text-xs font-medium text-muted">إجمالي المدفوع</div>
          <div className="mt-1 tnum text-2xl font-bold text-good">{money(financials.total_paid)}</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted">الديون المتبقية</div>
            {financials.debt > 0 && <button type="button" onClick={() => setPaying(true)} className="rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-white hover:bg-accent-ink">تسجيل دفعة</button>}
          </div>
          <div className={`mt-1 tnum text-2xl font-bold ${financials.debt > 0 ? 'text-bad' : 'text-faint'}`}>{money(financials.debt)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex gap-1 border-b border-line p-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${tab === t.key ? 'bg-petrol text-white' : 'text-muted hover:bg-surface-2'}`}
            >
              {t.label} <span className={`tnum ${tab === t.key ? 'text-petrol-faint' : 'text-faint'}`}>({t.count})</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'cars' && <CarsTab cars={cars} onAdd={() => setCarModal({ open: true, car: null })} onEdit={(car) => setCarModal({ open: true, car })} onDelete={handleDeleteCar} />}
          {tab === 'invoices' && <InvoicesTab invoices={invoices} money={money} />}
          {tab === 'maintenance' && <MaintenanceTab invoices={invoices} money={money} />}
        </div>
      </div>

      {editing && <CustomerFormModal open customer={customer} onClose={() => setEditing(false)} />}
      {paying && <PaymentModal open onClose={() => setPaying(false)} customerId={customer.id} customerName={customer.name} />}
      {carModal.open && <CarFormModal open customerId={customer.id} car={carModal.car} onClose={() => setCarModal({ open: false, car: null })} />}
    </div>
  )
}

function Detail({ icon, label, children }: { icon: 'debt' | 'reports' | 'suppliers'; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-muted">
      <Icon name={icon} className="h-4 w-4 shrink-0 text-faint" />
      <span className="text-faint">{label}:</span>
      <span className="text-ink">{children}</span>
    </div>
  )
}

function CarsTab({ cars, onAdd, onEdit, onDelete }: { cars: Car[]; onAdd: () => void; onEdit: (car: Car) => void; onDelete: (car: Car) => void }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">سيارات العميل</span>
        <button type="button" onClick={onAdd} className="flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-ink hover:bg-accent/20"><span className="text-base leading-none">＋</span> إضافة سيارة</button>
      </div>
      {cars.length === 0 ? (
        <p className="py-6 text-center text-sm text-faint">لا توجد سيارات مسجلة.</p>
      ) : (
        <ul className="space-y-2">
          {cars.map((car) => (
            <li key={car.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-petrol/5 text-petrol"><Icon name="dashboard" className="h-5 w-5" /></span>
                <div>
                  <div className="font-semibold text-ink">{car.plate_number}</div>
                  <div className="text-xs text-muted">{[car.type, car.model, car.year].filter(Boolean).join(' · ') || 'بدون تفاصيل'}{car.chassis_number ? ` · شاصي ${car.chassis_number}` : ''}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => onEdit(car)} className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface hover:text-ink">تعديل</button>
                <button type="button" onClick={() => onDelete(car)} className="rounded-md px-2 py-1 text-xs text-muted hover:bg-bad/5 hover:text-bad">حذف</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function InvoicesTab({ invoices, money }: { invoices: Invoice[]; money: (v: number) => string }) {
  if (invoices.length === 0) return <p className="py-6 text-center text-sm text-faint">لا توجد فواتير.</p>
  return (
    <ul className="space-y-2">
      {invoices.map((inv) => (
        <li key={inv.id}>
          <Link to={`/invoices/${inv.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 hover:border-accent/40 hover:bg-surface-2">
            <div>
              <div className="flex items-center gap-2"><span className="font-semibold text-ink tnum">{inv.invoice_number}</span><StatusBadge status={inv.status} /></div>
              <div className="text-xs text-faint tnum">{inv.date}{inv.car ? ` · ${inv.car.plate_number}` : ''}</div>
            </div>
            <div className="text-left">
              <div className="tnum text-sm text-ink">{money(inv.total)}</div>
              {inv.remaining > 0 && <div className="tnum text-xs font-semibold text-bad">متبقٍ {money(inv.remaining)}</div>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function MaintenanceTab({ invoices, money }: { invoices: Invoice[]; money: (v: number) => string }) {
  if (invoices.length === 0) return <p className="py-6 text-center text-sm text-faint">لا توجد زيارات صيانة بعد.</p>
  return (
    <ol className="relative space-y-4 border-r border-line pr-5">
      {invoices.map((inv) => {
        const depts = Array.from(new Set((inv.labor_items ?? []).map((l) => l.department))) as Department[]
        return (
          <li key={inv.id} className="relative">
            <span className="absolute -right-[26px] top-1.5 h-3 w-3 rounded-full bg-accent ring-4 ring-surface" />
            <Link to={`/invoices/${inv.id}`} className="block rounded-xl border border-line p-3 hover:border-accent/40 hover:bg-surface-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink tnum">{inv.date}</span>
                <StatusBadge status={inv.status} />
              </div>
              <div className="mt-1 text-xs text-muted">
                {inv.car?.plate_number ?? '—'}
                {inv.odometer ? ` · العداد ${inv.odometer.toLocaleString('en-US')} كم` : ''}
              </div>
              {depts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {depts.map((d) => <span key={d} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted ring-1 ring-line">{DEPARTMENTS[d]}</span>)}
                </div>
              )}
              <div className="mt-2 text-xs text-faint">الإجمالي {money(inv.total)}{inv.remaining > 0 ? ` · متبقٍ ${money(inv.remaining)}` : ''}</div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
