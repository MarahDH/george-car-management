import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { CarInput, Customer, CustomerInput, CustomerProfile, Paginated } from '../types'

/** List / search customers (by name, phone, or car plate). */
export function useCustomers(q: string) {
  return useQuery({
    queryKey: ['customers', q],
    queryFn: async (): Promise<Paginated<Customer>> => {
      const res = await api.get('/customers', { params: q ? { q } : {} })
      return res.data as Paginated<Customer>
    },
  })
}

/** A single customer with cars, financial snapshot, and invoice timeline. */
export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async (): Promise<CustomerProfile> => {
      const res = await api.get(`/customers/${id}`)
      // The endpoint returns the customer under `data` alongside financials/invoices.
      return {
        customer: res.data.data,
        financials: res.data.financials,
        invoices: res.data.invoices,
      } as CustomerProfile
    },
    enabled: Number.isFinite(id),
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CustomerInput): Promise<Customer> => {
      const res = await api.post('/customers', input)
      return res.data.data as Customer
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CustomerInput): Promise<Customer> => {
      const res = await api.put(`/customers/${id}`, input)
      return res.data.data as Customer
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer', id] })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/customers/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useCreateCar(customerId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CarInput): Promise<void> => {
      await api.post(`/customers/${customerId}/cars`, input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', customerId] })
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCar(customerId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: number; input: CarInput }): Promise<void> => {
      await api.put(`/cars/${id}`, input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', customerId] })
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useDeleteCar(customerId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/cars/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', customerId] })
      qc.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}
