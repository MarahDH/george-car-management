export interface User {
  id: number
  name: string
  email: string
  role: string
}

export type Settings = Record<string, string>

export interface Car {
  id: number
  customer_id: number
  plate_number: string
  type: string | null
  model: string | null
  chassis_number: string | null
  year: number | null
  notes: string | null
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  email: string | null
  alt_phone: string | null
  address: string | null
  country_code: string | null
  whatsapp_number: string | null
  notes: string | null
  archived_at?: string | null
  is_archived?: boolean
  cars_count?: number
  cars?: Car[]
  debt?: number | null
  last_visit?: string | null
  created_at?: string
}

export interface Paginated<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface CustomerInput {
  name: string
  phone?: string
  email?: string
  alt_phone?: string
  address?: string
  country_code?: string
  notes?: string
}

export interface CarInput {
  plate_number: string
  type?: string
  model?: string
  chassis_number?: string
  year?: number | null
  notes?: string
}

export type InvoiceStatus = 'inspecting' | 'repairing' | 'ready'
export type Department = 'mechanic' | 'electrical' | 'dozan'
export type PayMethod = 'cash' | 'network'

export interface LaborItem {
  id?: number
  department: Department
  worker_id?: number | null
  worker_name?: string | null
  description?: string | null
  amount: number
}

export interface PartItem {
  id?: number
  supplier_id?: number | null
  supplier_name?: string | null
  worker_id?: number | null
  worker_name?: string | null
  name: string
  buy_price: number
  sell_price: number
  price_usd?: number | null
  quantity: number
  line_total?: number
}

export interface InvoiceCustomerRef {
  id: number
  name: string
  phone?: string | null
  whatsapp_number?: string | null
}

export interface InvoiceCarRef {
  id: number
  plate_number: string
  type: string | null
  model: string | null
  year: number | null
}

export interface Invoice {
  id: number
  invoice_number: string
  customer_id: number
  car_id: number
  date: string
  odometer: number | null
  status: InvoiceStatus
  labor_total: number
  parts_total: number
  cost_total: number
  total: number
  paid_amount: number
  payment_method: PayMethod | null
  remaining: number
  profit: number
  notes: string | null
  created_at?: string
  customer?: InvoiceCustomerRef
  car?: InvoiceCarRef
  labor_items?: LaborItem[]
  part_items?: PartItem[]
}

export interface Worker {
  id: number
  name: string
  is_active: boolean
}

export interface Supplier {
  id: number
  name: string
  phone: string | null
  notes: string | null
  part_items_count?: number
}

export interface SupplierStatementLine {
  id: number
  name: string
  buy_price: number
  quantity: number
  line_cost: number
  date: string | null
  invoice_id: number
  invoice_number: string | null
  customer_name: string | null
}

export interface Payment {
  id: number
  receipt_number: string
  customer_id: number
  amount: number
  method: PayMethod
  date: string
  note: string | null
  customer?: { id: number; name: string; whatsapp_number: string | null }
}

export interface DebtRow {
  id: number
  name: string
  phone: string | null
  whatsapp_number: string | null
  debt: number
}

export interface CustomerProfile {
  customer: Customer
  financials: { total_paid: number; debt: number }
  invoices: Invoice[]
}

export interface DashboardData {
  summary: { collected: number; open_count: number; total_debt: number }
  in_progress: Invoice[]
  ready: Invoice[]
}

export interface ReportSummary {
  range: { from: string; to: string }
  summary: {
    collected: number
    parts_spend: number
    total_debt: number
    net_profit: number
    invoices_count: number
    top_department: Department | null
  }
  departments: Record<Department, number>
}

export interface Backup {
  name: string
  size: number
  created_at: string
}

export interface SupplierDebtRow {
  id: number
  name: string
  phone: string | null
  purchases: number
  paid: number
  debt: number
}

export interface SupplierPaymentRow {
  id: number
  receipt_number: string | null
  amount: number
  method: PayMethod
  date: string | null
  note: string | null
}

export interface DailySummary {
  count: number
  total: number
  collected: number
  remaining: number
  parts_cost: number
}

export interface DailyResponse {
  date: string
  from?: string
  to?: string
  invoices: Invoice[]
  summary: DailySummary
}
