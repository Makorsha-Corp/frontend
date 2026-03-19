import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { updateApprovedOfficeOrderByID } from "@/services/OrderedPartsService";
import { OrderedPart } from "@/types";
import toast from "react-hot-toast";
import React from "react";

interface ApproveOfficeActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const ApproveOfficeAction: React.FC<ApproveOfficeActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
}) => {
  const handleApproveOffice = async () => {
    try {
      await updateApprovedOfficeOrderByID(orderedPartInfo.id, true);
      toast.success("Ordered part has been approved!");
      setOpenThisActionDialog(false);
      setActionMenuOpen(false);
    } catch (error) {
      toast.error("Error occurred. Could not complete action");
    }
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent>
        <DialogTitle>
          Approval from Office - <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to approve this part?
          </p>
        </DialogDescription>
        <Button onClick={handleApproveOffice}>Approve</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveOfficeAction;
