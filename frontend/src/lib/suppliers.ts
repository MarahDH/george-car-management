import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Paginated, Supplier, SupplierStatementLine } from '../types'

export interface SupplierInput {
  name: string
  phone?: string
  notes?: string
}

export interface SupplierProfile {
  data: Supplier
  statement: SupplierStatementLine[]
  total_bought: number
}

export function useSuppliers(q: string) {
  return useQuery({
    queryKey: ['suppliers', q],
    queryFn: async (): Promise<Paginated<Supplier>> => {
      const res = await api.get('/suppliers', { params: q ? { q } : {} })
      return res.data as Paginated<Supplier>
    },
  })
}

export function useSupplier(id: number) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async (): Promise<SupplierProfile> => {
      const res = await api.get(`/suppliers/${id}`)
      return res.data as SupplierProfile
    },
    enabled: Number.isFinite(id),
  })
}

export function useCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SupplierInput): Promise<Supplier> => {
      const res = await api.post('/suppliers', input)
      return res.data.data as Supplier
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUpdateSupplier(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SupplierInput): Promise<Supplier> => {
      const res = await api.put(`/suppliers/${id}`, input)
      return res.data.data as Supplier
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier', id] })
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/suppliers/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}
