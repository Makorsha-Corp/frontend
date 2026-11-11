import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { appToast } from '@/lib/appToast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useResetHelpGuidesMutation } from '@/features/auth/authApi';

const HelpGuidesSettingsPanel: React.FC = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [resetHelpGuides, { isLoading: isResettingWorkspace }] = useResetHelpGuidesMutation();
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

  const handleResetWorkspace = async () => {
    try {
      await resetHelpGuides({ scope: 'workspace' }).unwrap();
      appToast.success(t('settings:pageGuidesResetWorkspaceSuccess'));
    } catch {
      appToast.error(t('settings:pageGuidesResetWorkspaceFailed'));
    }
  };

  const handleResetAll = async () => {
    setIsResettingAll(true);
    try {
      await resetHelpGuides({ scope: 'all' }).unwrap();
      appToast.success(t('settings:pageGuidesResetAllSuccess'));
      setResetAllOpen(false);
    } catch {
      appToast.error(t('settings:pageGuidesResetWorkspaceFailed'));
    } finally {
      setIsResettingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t('settings:pageGuidesResetHint')}</p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="default"
          disabled={isResettingWorkspace}
          onClick={() => void handleResetWorkspace()}
        >
          {isResettingWorkspace ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('settings:resetting')}
            </>
          ) : (
            t('settings:resetGuidesWorkspace')
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => setResetAllOpen(true)}>
          {t('settings:resetGuidesAllPrompt')}
        </Button>
      </div>

      <Dialog open={resetAllOpen} onOpenChange={setResetAllOpen}>
        <DialogContent className="w-[min(28rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle>{t('settings:resetGuidesAllTitle')}</DialogTitle>
            <DialogDescription>{t('settings:resetGuidesAllDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isResettingAll}
              onClick={() => setResetAllOpen(false)}
            >
              {t('common:cancel')}
            </Button>
            <Button type="button" disabled={isResettingAll} onClick={() => void handleResetAll()}>
              {isResettingAll ? t('settings:resetting') : t('settings:resetAll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpGuidesSettingsPanel;
