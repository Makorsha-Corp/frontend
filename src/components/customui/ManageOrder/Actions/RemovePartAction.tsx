import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { deleteOrderedPartByID } from '@/services/OrderedPartsService';
import { OrderedPart } from '@/types';
import React from 'react';
import toast from 'react-hot-toast';

interface RemovePartActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const RemovePartAction: React.FC<RemovePartActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
}) => {

  const handleRemovePart = async () => {
    try {
      await deleteOrderedPartByID(orderedPartInfo.id);
      toast.success("Successfully removed this part from the order");
      setOpenThisActionDialog(false);
      setActionMenuOpen(false);
    } catch (error) {
      toast.error("Error occurred. Could not complete action");
    }
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent>
        <DialogTitle>Remove Part</DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            You are about to remove part - <b>{orderedPartInfo.parts.name}</b> from the list.
          </p>
          <p className="text-sm text-muted-foreground">Please confirm.</p>
        </DialogDescription>
        <Button onClick={handleRemovePart}>Confirm</Button>
      </DialogContent>
    </Dialog>
  );
};

export default RemovePartAction;
