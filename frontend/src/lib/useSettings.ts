import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Settings } from '../types'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Settings> => {
      const res = await api.get('/settings')
      return res.data.settings as Settings
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<Settings>): Promise<Settings> => {
      const res = await api.put('/settings', input)
      return res.data.settings as Settings
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}
