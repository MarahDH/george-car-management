import { useSettings } from './useSettings'
import { formatMoney } from './format'

/** Returns a formatter that appends the configured currency symbol (ل.س). */
export function useMoney(): (value: number) => string {
  const { data } = useSettings()
  const symbol = data?.currency_symbol ?? ''
  return (value: number) => formatMoney(value, symbol)
}
