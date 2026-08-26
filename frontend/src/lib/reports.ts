import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { ReportSummary } from '../types'

export function useReport(from: string, to: string) {
  return useQuery({
    queryKey: ['report', from, to],
    queryFn: async (): Promise<ReportSummary> => {
      const res = await api.get('/reports/summary', { params: { from, to } })
      return res.data as ReportSummary
    },
    enabled: Boolean(from && to),
  })
}
