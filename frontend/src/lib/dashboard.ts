import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import type { DashboardData } from '../types'

/** All landing-page data (KPIs + work boards) in a single request. */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const res = await api.get('/dashboard')
      return res.data as DashboardData
    },
    // The work board is often left open on a screen in the shop — keep it current.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}
