import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Paginated, Payment, PayMethod } from '../types'

export interface PaymentInput {
  customer_id: number
  amount: number
  method: PayMethod
  date: string
  note?: string
}

export function usePayments(customerId?: number) {
  return useQuery({
    queryKey: ['payments', customerId ?? 'all'],
    queryFn: async (): Promise<Paginated<Payment>> => {
      const res = await api.get('/payments', {
        params: customerId ? { customer_id: customerId } : {},
      })
      return res.data as Paginated<Payment>
    },
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PaymentInput): Promise<Payment> => {
      const res = await api.post('/payments', input)
      return res.data.data as Payment
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] })
      qc.invalidateQueries({ queryKey: ['debts'] })
      qc.invalidateQueries({ queryKey: ['customer'] })
      qc.invalidateQueries({ queryKey: ['report'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
