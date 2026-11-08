import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
  const [resetHelpGuides, { isLoading: isResettingWorkspace }] = useResetHelpGuidesMutation();
  const [resetAllOpen, setResetAllOpen] = useState(false);
  const [isResettingAll, setIsResettingAll] = useState(false);

  const handleResetWorkspace = async () => {
    try {
      await resetHelpGuides({ scope: 'workspace' }).unwrap();
      appToast.success('Page guides reset for this workspace');
    } catch {
      appToast.error('Could not reset page guides');
    }
  };

  const handleResetAll = async () => {
    setIsResettingAll(true);
    try {
      await resetHelpGuides({ scope: 'all' }).unwrap();
      appToast.success('Page guides reset on all workspaces');
      setResetAllOpen(false);
    } catch {
      appToast.error('Could not reset page guides');
    } finally {
      setIsResettingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        First-visit walkthroughs run once per page. Resetting replays them the next time you open
        each page.
      </p>
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
              Resetting…
            </>
          ) : (
            'Reset guides for this workspace'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => setResetAllOpen(true)}>
          Reset on all workspaces…
        </Button>
      </div>

      <Dialog open={resetAllOpen} onOpenChange={setResetAllOpen}>
        <DialogContent className="w-[min(28rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle>Reset page guides everywhere?</DialogTitle>
            <DialogDescription>
              This clears seen walkthroughs for every workspace on your account. Tours will auto-run
              again on first visit to each page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isResettingAll}
              onClick={() => setResetAllOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={isResettingAll} onClick={() => void handleResetAll()}>
              {isResettingAll ? 'Resetting…' : 'Reset all'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpGuidesSettingsPanel;
