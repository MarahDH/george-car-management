import { useSettings } from './useSettings'
import { formatMoney } from './format'

/**
 * Dual-currency helper. The app stores money in SYP; the admin sets how many
 * SYP one USD is worth (usd_rate) in Settings, enabling conversion + USD display.
 */
export function useCurrency() {
  const { data } = useSettings()
  const sypSymbol = data?.currency_symbol ?? ''
  const usdSymbol = data?.usd_symbol ?? '$'
  const rate = Number(data?.usd_rate ?? 0) || 0 // SYP per 1 USD

  const usd = (value: number): string => {
    const n = Math.round((Number(value) || 0) * 100) / 100
    return `${usdSymbol}${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }

  return {
    rate,
    hasRate: rate > 0,
    sypSymbol,
    usdSymbol,
    /** Format a SYP amount (e.g. "80,000 ل.س"). */
    syp: (value: number) => formatMoney(value, sypSymbol),
    /** Format a USD amount (e.g. "$8"). */
    usd,
    /** Convert USD → SYP using the rate (0 if no rate set). */
    toSyp: (usdValue: number) => (rate > 0 ? Math.round((Number(usdValue) || 0) * rate) : 0),
    /** Convert SYP → USD using the rate (0 if no rate set). */
    toUsd: (sypValue: number) => (rate > 0 ? Math.round(((Number(sypValue) || 0) / rate) * 100) / 100 : 0),
  }
}
