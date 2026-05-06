export function formatTZS(amount: number): string {
  return `TZS ${Math.round(amount).toLocaleString('en-TZ')}`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}
