import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { updateApprovedBudgetByID } from '@/services/OrderedPartsService';
import { OrderedPart } from '@/types';
import React from 'react';
import toast from 'react-hot-toast';

interface ApproveBudgetActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const ApproveBudgetAction: React.FC<ApproveBudgetActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
}) => {
  const approveBudget = async () => {
    try {
      await updateApprovedBudgetByID(orderedPartInfo.id, true);
      toast.success('The budget for this part has been approved!');
    } catch (error) {
      toast.error('Error occurred. Could not complete action');
    }

    setOpenThisActionDialog(false);
    setActionMenuOpen(false);
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent>
        <DialogTitle>
          Budget Approval - <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            Only approve if you are satisfied with the whole quotation.
            Approving cannot be undone and the values will be permanently saved.
          </p>
          <p className="text-sm text-muted-foreground">Do you Approve?</p>
        </DialogDescription>

        <Button onClick={approveBudget}>Approve</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveBudgetAction;
