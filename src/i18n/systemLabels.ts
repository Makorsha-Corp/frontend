import type { TFunction } from 'i18next';
import type { UiLanguage } from '@/i18n/uiLanguage';

/**
 * Maps known English system status / tag labels from the API to localized display text.
 * Comparisons in business logic must still use the English source strings from the API.
 */
const STATUS_KEY_BY_ENGLISH: Record<string, string> = {
  Pending: 'status.pending',
  Complete: 'status.complete',
  Receiving: 'status.receiving',
  Cancelled: 'status.cancelled',
  Draft: 'status.draft',
};

const SYSTEM_TAG_KEY_BY_ENGLISH: Record<string, string> = {
  supplier: 'tags.supplier',
  client: 'tags.client',
  utility: 'tags.utility',
  payroll: 'tags.payroll',
  raw_material: 'tags.rawMaterial',
  machine_part: 'tags.machinePart',
  project_item: 'tags.projectItem',
  consumable: 'tags.consumable',
  tool: 'tags.tool',
  finished_good: 'tags.finishedGood',
};

export function displaySystemStatusName(
  statusName: string | null | undefined,
  t: TFunction,
  language: UiLanguage,
): string {
  const raw = statusName?.trim();
  if (!raw) return '—';
  if (language === 'en') return raw;
  const key = STATUS_KEY_BY_ENGLISH[raw];
  return key ? t(key, { ns: 'misc', defaultValue: raw }) : raw;
}

export function displaySystemTagName(
  tagNameOrSlug: string | null | undefined,
  t: TFunction,
  language: UiLanguage,
): string {
  const raw = tagNameOrSlug?.trim();
  if (!raw) return '';
  if (language === 'en') return raw;
  const slugKey = SYSTEM_TAG_KEY_BY_ENGLISH[raw.toLowerCase().replace(/\s+/g, '_')];
  if (slugKey) return t(slugKey, { ns: 'misc', defaultValue: raw });
  const titleKey = STATUS_KEY_BY_ENGLISH[raw];
  if (titleKey) return t(titleKey, { ns: 'misc', defaultValue: raw });
  return raw;
}
