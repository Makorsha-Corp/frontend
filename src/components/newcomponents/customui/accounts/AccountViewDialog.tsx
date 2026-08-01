import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, ExternalLink } from 'lucide-react';
import AccountOverviewPanel from './AccountOverviewPanel';
import { useGetAccountByIdQuery } from '@/features/accounts/accountsApi';

export interface AccountViewDialogProps {
  accountId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When known, shown in title before fetch completes. */
  accountName?: string | null;
}

const AccountViewDialog: React.FC<AccountViewDialogProps> = ({
  accountId,
  open,
  onOpenChange,
  accountName: accountNameProp,
}) => {
  const navigate = useNavigate();
  const { data: account, isLoading } = useGetAccountByIdQuery(accountId!, {
    skip: !accountId || !open,
  });

  const accountName = accountNameProp ?? account?.name ?? null;

  const handleOpenWorkspace = () => {
    if (!accountId) return;
    onOpenChange(false);
    navigate(`/accounts/${accountId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[72vh] max-h-[72vh] w-[min(52rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {accountName ?? (accountId != null ? `Account #${accountId}` : 'Account')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <AccountOverviewPanel account={account} isLoading={isLoading} accountId={accountId} />
        </div>
        <DialogFooter className="shrink-0 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={handleOpenWorkspace}
            disabled={!accountId}
            data-testid="account-view-open-workspace"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open invoice workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountViewDialog;
