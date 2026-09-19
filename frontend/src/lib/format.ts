export function formatMoney(value: number, symbol = ''): string {
  const n = Math.round(Number(value) || 0)
  const grouped = n.toLocaleString('en-US')
  return symbol ? `${grouped} ${symbol}` : grouped
}

// Keep only what makes a valid number as the user types. Converts Arabic-Indic
// and Persian digits to Latin so the backend always receives parseable values.
// With { decimal: true } a single decimal point is allowed; otherwise digits only.
export function sanitizeNumberInput(value: string, opts: { decimal?: boolean } = {}): string {
  const latin = value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
  if (!opts.decimal) return latin.replace(/[^0-9]/g, '')
  // Allow one decimal separator (accept both '.' and Arabic '٫'); drop the rest.
  const cleaned = latin.replace(/٫/g, '.').replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return cleaned
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
}
