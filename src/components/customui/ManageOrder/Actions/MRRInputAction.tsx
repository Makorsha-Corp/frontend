import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { updateMrrNumberByID } from '@/services/OrderedPartsService';
import { OrderedPart } from '@/types';

interface MRRInputActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const MRRInputAction: React.FC<MRRInputActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
}) => {
  const [mrrNumber, setMrrNumber] = useState('');
  const [mrrLoading, setMrrLoading] = useState(false);

  const handleMRRinput = async () => {
    if (!mrrNumber.trim()) {
      toast.error('Please enter the MRR number.');
      return;
    }

    try {
      setMrrLoading(true);
      await updateMrrNumberByID(orderedPartInfo.id, mrrNumber.trim());
      toast.success('MRR Number has been set.');
      setOpenThisActionDialog(false);
      setActionMenuOpen(false);
    } catch (error) {
      toast.error('Error occurred while setting MRR number.');
    } finally {
      setMrrLoading(false);
    }
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent>
        <DialogTitle>
          MRR Number - <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            Please enter the MRR number for this ordered part.
          </p>
          <div className="grid gap-3 mt-2">
            <Label htmlFor="mrr">MRR Number:</Label>
            <Input
              id="mrr"
              type="text"
              value={mrrNumber}
              placeholder="Enter MRR number"
              onChange={(e) => setMrrNumber(e.target.value)}
            />
          </div>
        </DialogDescription>
        <Button onClick={handleMRRinput} disabled={mrrLoading}>
          {mrrLoading ? 'Updating...' : 'Confirm'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default MRRInputAction;
