import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { PayMethod, SupplierDebtRow } from '../types'

export interface SupplierDebtsResponse {
  data: SupplierDebtRow[]
  meta: { total: number; current_page: number; last_page: number; per_page: number }
  summary: { total_debt: number; total_purchases: number; total_paid: number; suppliers_count: number }
}

export function useSupplierDebts(q: string) {
  return useQuery({
    queryKey: ['supplier-debts', q],
    queryFn: async (): Promise<SupplierDebtsResponse> => {
      const res = await api.get('/supplier-debts', { params: q ? { q } : {} })
      return res.data as SupplierDebtsResponse
    },
  })
}

export interface SupplierPaymentInput {
  supplier_id: number
  amount: number
  method: PayMethod
  date: string
  note?: string
}

export function useCreateSupplierPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SupplierPaymentInput): Promise<void> => {
      await api.post('/supplier-payments', input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-debts'] })
      qc.invalidateQueries({ queryKey: ['supplier'] })
      qc.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}
