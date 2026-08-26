import { AxiosError } from 'axios'

export interface FormErrors {
  message: string
  fields: Record<string, string>
}

/** Turn a Laravel 422 (or any axios error) into a message + per-field messages. */
export function extractErrors(err: unknown): FormErrors {
  const ax = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>
  const fields: Record<string, string> = {}
  const raw = ax.response?.data?.errors
  if (raw) {
    for (const key of Object.keys(raw)) {
      fields[key] = raw[key][0]
    }
  }
  return {
    message: ax.response?.data?.message ?? 'تعذّر الاتصال بالخادم.',
    fields,
  }
}

/** Shared input styling for form fields. */
export const inputClass =
  'w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20'
