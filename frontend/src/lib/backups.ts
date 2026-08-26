import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Backup } from '../types'

export function useBackups() {
  return useQuery({
    queryKey: ['backups'],
    queryFn: async (): Promise<Backup[]> => {
      const res = await api.get('/backups')
      return res.data.data as Backup[]
    },
  })
}

export function useCreateBackup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const res = await api.post('/backups')
      return res.data.name as string
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backups'] }),
  })
}
