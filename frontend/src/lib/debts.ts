import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { DebtRow } from '../types'

export interface DebtsResponse {
  data: DebtRow[]
  meta: { total: number; current_page: number; last_page: number; per_page: number }
  summary: { total_debt: number; debtors_count: number }
}

export function useDebts(q: string) {
  return useQuery({
    queryKey: ['debts', q],
    queryFn: async (): Promise<DebtsResponse> => {
      const res = await api.get('/debts', { params: q ? { q } : {} })
      return res.data as DebtsResponse
    },
  })
}
