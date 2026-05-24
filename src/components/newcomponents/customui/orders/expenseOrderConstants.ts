export const EXPENSE_CATEGORIES = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'rent', label: 'Rent' },
  { value: 'services', label: 'Services' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
] as const;

export type ExpenseCategoryValue = (typeof EXPENSE_CATEGORIES)[number]['value'];

const CATEGORY_LABEL_BY_VALUE = new Map(
  EXPENSE_CATEGORIES.map((c) => [c.value, c.label] as const)
);

export function expenseCategoryLabel(value: string): string {
  return CATEGORY_LABEL_BY_VALUE.get(value as ExpenseCategoryValue) ?? value;
}
