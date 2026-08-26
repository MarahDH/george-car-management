import type { Department, InvoiceStatus, PayMethod } from '../types'

export const DEPARTMENTS: Record<Department, string> = {
  mechanic: 'ميكانيك',
  electrical: 'كهرباء',
  dozan: 'دوزان',
}

export const STATUSES: Record<InvoiceStatus, string> = {
  inspecting: 'قيد الفحص',
  repairing: 'قيد الإصلاح',
  ready: 'جاهزة للتسليم',
}

export const STATUS_ORDER: InvoiceStatus[] = ['inspecting', 'repairing', 'ready']

export const METHODS: Record<PayMethod, string> = {
  cash: 'نقداً',
  network: 'شبكة',
}
