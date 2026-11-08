export type WorkOrderRecurrenceCadence = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface WorkOrderRecurrenceCadenceValue {
  cadence: WorkOrderRecurrenceCadence;
  /** Every N days when cadence is custom. */
  intervalDays: number;
}

export const DEFAULT_RECURRENCE_CADENCE: WorkOrderRecurrenceCadenceValue = {
  cadence: 'weekly',
  intervalDays: 2,
};

export function formatRecurrenceCadenceTriggerLabel(
  value: WorkOrderRecurrenceCadenceValue,
): string {
  if (value.cadence === 'custom') {
    const n = value.intervalDays;
    return n === 1 ? 'Every day' : `Every ${n} days`;
  }
  if (value.cadence === 'daily') return 'Daily';
  if (value.cadence === 'monthly') return 'Monthly';
  return 'Weekly';
}

export function formatRecurrenceCadenceShortLabel(
  cadence: string,
  intervalDays?: number | null,
): string {
  if (cadence === 'custom') {
    const n = intervalDays ?? 1;
    return n === 1 ? 'Every day' : `Every ${n} days`;
  }
  if (cadence === 'daily') return 'Daily';
  if (cadence === 'monthly') return 'Monthly';
  if (cadence === 'weekly') return 'Weekly';
  return cadence;
}
