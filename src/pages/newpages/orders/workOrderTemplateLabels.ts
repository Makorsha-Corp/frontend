import type { WorkOrderTemplate } from '@/types/workOrderTemplate';

import type { FactorySection } from '@/types/factorySection';

import type { Machine } from '@/types/machine';



export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;



/** Max recurrence span from start date (~6 months). */

export const RECURRENCE_MAX_SPAN_DAYS = 183;



/** @deprecated Internal only — use `template.is_recurring` for badges, not user-facing entity labels. */

export type WorkOrderTemplateKind = 'template' | 'recurring';



/** @deprecated Use `template.is_recurring` directly. */

export function getWorkOrderTemplateKind(template: WorkOrderTemplate): WorkOrderTemplateKind {

  return template.is_recurring ? 'recurring' : 'template';

}



export function formatRecurrenceCadence(template: WorkOrderTemplate): string | null {

  if (!template.is_recurring) return null;



  const type = template.recurrence_type ?? 'weekly';

  if (type === 'daily') return 'Daily';

  if (type === 'weekly') return 'Weekly';

  if (type === 'monthly') return 'Monthly';



  return 'Recurring';

}



export function formatNextDueDate(isoDate: string | null | undefined): string | null {

  if (!isoDate) return null;

  const parsed = new Date(`${isoDate.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

}



export function formatRecurrenceRange(template: WorkOrderTemplate): string | null {

  const start = formatNextDueDate(template.recurrence_start_date);

  const end = formatNextDueDate(template.recurrence_end_date);

  if (!start || !end) return null;

  return `${start} – ${end}`;

}



export function defaultRecurrenceEndDate(startIso: string, recurrenceType: string | null | undefined): string {

  const start = new Date(`${startIso.slice(0, 10)}T12:00:00`);

  const end = new Date(start);

  const type = recurrenceType ?? 'weekly';

  if (type === 'daily') {

    end.setDate(end.getDate() + 14);

  } else if (type === 'monthly') {

    end.setMonth(end.getMonth() + 3);

  } else {

    end.setDate(end.getDate() + 28);

  }

  return end.toISOString().slice(0, 10);

}



export function validateRecurrenceSpan(startIso: string, endIso: string): string | null {

  if (!startIso || !endIso) return 'Set start and end dates for recurring work';

  const start = new Date(`${startIso.slice(0, 10)}T12:00:00`);

  const end = new Date(`${endIso.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Invalid date';

  if (end < start) return 'End date must be on or after the start date';

  const spanDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (spanDays > RECURRENCE_MAX_SPAN_DAYS) {

    return `Recurrence range cannot exceed ${RECURRENCE_MAX_SPAN_DAYS} days (~6 months)`;

  }

  return null;

}



export function formatProgramScopeSummary(

  template: WorkOrderTemplate,

  machines: Machine[] = [],

  sections: FactorySection[] = [],

): string | null {

  if (template.default_machine_id) {

    const machine = machines.find((m) => m.id === template.default_machine_id);

    return machine ? `Machine · ${machine.name}` : 'Machine scope';

  }

  if (template.default_factory_section_id) {

    const section = sections.find((s) => s.id === template.default_factory_section_id);

    return section ? `Section · ${section.name}` : 'Section scope';

  }

  return null;

}



export function formatProgramSummaryStrip(

  template: WorkOrderTemplate,

  machines: Machine[] = [],

  sections: FactorySection[] = [],

): string {

  const cadence = formatRecurrenceCadence(template) ?? 'Recurring';

  const range = formatRecurrenceRange(template);

  const nextDue = formatNextDueDate(template.next_generation_date);

  const scope = formatProgramScopeSummary(template, machines, sections);



  if (!template.next_generation_date) {

    return `${cadence} · set end on sheet (max 6 months) — save schedules all drafts in range`;

  }



  const parts = [`Repeats ${cadence.toLowerCase()}`];

  if (range) parts.push(range);

  else if (nextDue) parts.push(`next due ${nextDue}`);

  if (scope) parts.push(scope.toLowerCase());

  parts.push('Program range — change dates below to reschedule');



  return parts.join(' · ');

}



/** @deprecated Avoid split user-facing labels — prefer "Template" everywhere. */

export function templateRecurringLabel(kind: WorkOrderTemplateKind, plural = false): string {

  if (kind === 'recurring') return plural ? 'Recurrings' : 'Recurring';

  return plural ? 'Templates' : 'Template';

}



/** @deprecated Use templateRecurringLabel */

export function presetRecurringLabel(kind: WorkOrderTemplateKind, plural = false): string {

  return templateRecurringLabel(kind, plural);

}

