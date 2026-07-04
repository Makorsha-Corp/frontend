import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, Pencil } from 'lucide-react';
import type { Account } from '@/types/account';
import AccountContextPanel from './AccountContextPanel';

export interface AccountDetailsDialogProps {
  account: Account | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

const AccountDetailsDialog: React.FC<AccountDetailsDialogProps> = ({
  account,
  open,
  onOpenChange,
  onEdit,
}) => {
  const handleEdit = () => {
    onOpenChange(false);
    onEdit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] w-[min(52rem,94vw)] max-w-none flex-col overflow-hidden"
        data-testid="account-details-dialog"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Account details
            {account ? (
              <span className="font-normal text-muted-foreground">· {account.name}</span>
            ) : null}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {account ? <AccountContextPanel account={account} /> : null}
        </div>
        <DialogFooter className="shrink-0 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleEdit}
            disabled={!account}
            data-testid="account-details-edit"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountDetailsDialog;
