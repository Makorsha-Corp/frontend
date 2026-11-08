import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { setUiLanguage } from '@/i18n';
import {
  normalizeUiLanguage,
  readStoredUiLanguage,
  writeStoredUiLanguage,
  type UiLanguage,
} from '@/i18n/uiLanguage';

export interface UiLanguageToggleProps {
  value?: UiLanguage;
  onChange?: (lang: UiLanguage) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const UiLanguageToggle: React.FC<UiLanguageToggleProps> = ({
  value,
  onChange,
  className,
  size = 'md',
}) => {
  const { t } = useTranslation('common');
  const active = value ?? readStoredUiLanguage();

  const handleSelect = (lang: UiLanguage) => {
    if (lang === active) return;
    writeStoredUiLanguage(lang);
    void setUiLanguage(lang);
    onChange?.(lang);
  };

  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm';

  return (
    <div
      className={cn('inline-flex rounded-lg border border-border bg-muted/40 p-0.5', className)}
      role="group"
      aria-label={t('languageBangla')}
    >
      {(['en', 'bn'] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          className={cn(
            'rounded-md font-medium transition-colors',
            pad,
            active === lang
              ? 'bg-card text-card-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={active === lang}
          onClick={() => handleSelect(normalizeUiLanguage(lang))}
        >
          {lang === 'en' ? t('languageEnglish') : t('languageBangla')}
        </button>
      ))}
    </div>
  );
};

export default UiLanguageToggle;
