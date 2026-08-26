import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Department, Invoice, InvoiceStatus, Paginated, PayMethod } from '../types'

export interface InvoiceInput {
  customer_id: number
  car_id: number
  date: string
  odometer?: number | null
  status: InvoiceStatus
  paid_amount?: number
  payment_method?: PayMethod | null
  notes?: string | null
  labor_items: { department: Department; description?: string | null; amount: number }[]
  part_items: {
    supplier_id?: number | null
    name: string
    buy_price: number
    sell_price: number
    quantity: number
  }[]
}

export function useInvoices(params: { q?: string; status?: string }) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async (): Promise<Paginated<Invoice>> => {
      const res = await api.get('/invoices', { params })
      return res.data as Paginated<Invoice>
    },
  })
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async (): Promise<Invoice> => {
      const res = await api.get(`/invoices/${id}`)
      return res.data.data as Invoice
    },
    enabled: Number.isFinite(id),
  })
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['invoices'] })
  qc.invalidateQueries({ queryKey: ['debts'] })
  qc.invalidateQueries({ queryKey: ['report'] })
  qc.invalidateQueries({ queryKey: ['customer'] })
}

export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InvoiceInput): Promise<Invoice> => {
      const res = await api.post('/invoices', input)
      return res.data.data as Invoice
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateInvoice(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InvoiceInput): Promise<Invoice> => {
      const res = await api.put(`/invoices/${id}`, input)
      return res.data.data as Invoice
    },
    onSuccess: () => {
      invalidateAll(qc)
      qc.invalidateQueries({ queryKey: ['invoice', id] })
    },
  })
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: InvoiceStatus }): Promise<void> => {
      await api.patch(`/invoices/${id}/status`, { status })
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice', vars.id] })
    },
  })
}

export function useDeleteInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/invoices/${id}`)
    },
    onSuccess: () => invalidateAll(qc),
  })
}
