import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import UiLanguageToggle from '@/components/newcomponents/customui/UiLanguageToggle';
import { appToast } from '@/lib/appToast';
import { updateUser } from '@/features/auth/authSlice';
import { useUpdateMeMutation } from '@/features/auth/authApi';
import { setUiLanguage } from '@/i18n';
import {
  normalizeUiLanguage,
  readStoredUiLanguage,
  writeStoredUiLanguage,
  type UiLanguage,
} from '@/i18n/uiLanguage';

const LanguageSettingsPanel: React.FC = () => {
  const { t } = useTranslation('settings');
  const dispatch = useAppDispatch();
  const storedUser = useAppSelector((state) => state.auth.user);
  const [language, setLanguage] = useState<UiLanguage>(() =>
    normalizeUiLanguage(storedUser?.ui_language ?? readStoredUiLanguage()),
  );
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  useEffect(() => {
    if (storedUser?.ui_language) {
      setLanguage(normalizeUiLanguage(storedUser.ui_language));
    }
  }, [storedUser?.ui_language]);

  const handleSave = async () => {
    try {
      const user = await updateMe({ ui_language: language }).unwrap();
      const saved = normalizeUiLanguage(user.ui_language ?? language);
      dispatch(updateUser({ ui_language: saved }));
      writeStoredUiLanguage(saved);
      await setUiLanguage(saved);
      appToast.success(t('languageSaved'));
    } catch {
      appToast.error(t('languageSaveFailed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('languageLabel')}</Label>
        <UiLanguageToggle value={language} onChange={setLanguage} />
      </div>
      <Button type="button" onClick={() => void handleSave()} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('saveLanguage', { defaultValue: 'Save language' })}
          </>
        ) : (
          t('saveLanguage')
        )}
      </Button>
    </div>
  );
};

export default LanguageSettingsPanel;
