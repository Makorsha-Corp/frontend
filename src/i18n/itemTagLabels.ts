import type { TFunction } from 'i18next';
import { displaySystemTagName } from '@/i18n/systemLabels';
import type { UiLanguage } from '@/i18n/uiLanguage';

export function displayItemTagName(
  tag: { name: string; tag_code?: string | null },
  t: TFunction,
  language: UiLanguage,
): string {
  const code = tag.tag_code?.trim();
  if (code) {
    return displaySystemTagName(code, t, language);
  }
  return tag.name;
}
