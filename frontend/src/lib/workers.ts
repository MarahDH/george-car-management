import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Worker } from '../types'

/** The managed list of workers (technicians). */
export function useWorkers(activeOnly = true) {
  return useQuery({
    queryKey: ['workers', activeOnly],
    queryFn: async (): Promise<Worker[]> => {
      const res = await api.get('/workers', { params: { active_only: activeOnly } })
      return res.data.data as Worker[]
    },
  })
}

export function useCreateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string): Promise<Worker> => {
      const res = await api.post('/workers', { name })
      return res.data.data as Worker
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}

export function useUpdateWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }): Promise<Worker> => {
      const res = await api.put(`/workers/${id}`, { name })
      return res.data.data as Worker
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}

export function useDeleteWorker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/workers/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workers'] }),
  })
}
