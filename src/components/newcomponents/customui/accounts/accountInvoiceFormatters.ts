export const formatInvoiceCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

export const formatInvoiceDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString() : '—';
