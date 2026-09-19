import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { CarInput, Customer, CustomerInput, CustomerProfile, Paginated } from '../types'

/**
 * List / search customers (by name, phone, or car plate) — first page only.
 * Includes archived customers so a returning customer can still be picked for a new invoice.
 */
export function useCustomers(q: string) {
  return useQuery({
    queryKey: ['customers', q],
    queryFn: async (): Promise<Paginated<Customer>> => {
      const res = await api.get('/customers', { params: { ...(q ? { q } : {}), status: 'all' } })
      return res.data as Paginated<Customer>
    },
  })
}

/**
 * Paged customer list that loads more on demand — scales to hundreds of records
 * without dumping them all at once. Used by the العملاء page's infinite-scroll list.
 */
export type CustomerSort = 'name' | 'phone' | 'cars' | 'debt' | 'last_visit' | 'archived_at'
/** active = still coming (default), archived = stopped coming, all = both. */
export type CustomerStatus = 'active' | 'archived' | 'all'

export function useInfiniteCustomers(q: string, sort: CustomerSort = 'name', dir: 'asc' | 'desc' = 'asc', status: CustomerStatus = 'active') {
  return useInfiniteQuery({
    queryKey: ['customers-infinite', q, sort, dir, status],
    queryFn: async ({ pageParam }): Promise<Paginated<Customer>> => {
      const res = await api.get('/customers', { params: { ...(q ? { q } : {}), sort, dir, status, page: pageParam } })
      return res.data as Paginated<Customer>
    },
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page ? last.meta.current_page + 1 : undefined,
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

/** Archive (stopped coming) or restore a customer; both refresh the lists and the profile. */
export function useSetCustomerArchived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, archived }: { id: number; archived: boolean }): Promise<Customer> => {
      const res = await api.post(`/customers/${id}/${archived ? 'archive' : 'unarchive'}`)
      return res.data.data as Customer
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customers-infinite'] })
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
