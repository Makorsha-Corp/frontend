export const ALLOCATION_TYPES = [
  { value: 'factory', label: 'Factory' },
  { value: 'department', label: 'Department' },
  { value: 'other', label: 'Other' },
] as const;

export type AllocationTypeValue = (typeof ALLOCATION_TYPES)[number]['value'];

const ALLOCATION_LABEL_BY_VALUE = new Map(
  ALLOCATION_TYPES.map((c) => [c.value, c.label] as const)
);

export function expenseCategoryLabel(value: string): string {
  return ALLOCATION_LABEL_BY_VALUE.get(value as AllocationTypeValue) ?? value;
}
