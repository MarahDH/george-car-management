export function formatMoney(value: number, symbol = ''): string {
  const n = Math.round(Number(value) || 0)
  const grouped = n.toLocaleString('en-US')
  return symbol ? `${grouped} ${symbol}` : grouped
}
