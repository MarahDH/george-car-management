import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { DailyResponse } from '../types'

/**
 * The day's movement, or a date range's when `to` differs from `from`.
 * A single day is just a range where both ends match.
 */
export function useDaily(from: string, to: string = from) {
  return useQuery({
    queryKey: ['daily', from, to],
    queryFn: async (): Promise<DailyResponse> => {
      const res = await api.get('/daily', { params: { from, to } })
      return res.data as DailyResponse
    },
    enabled: Boolean(from) && Boolean(to),
  })
}
