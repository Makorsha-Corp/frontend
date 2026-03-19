import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderedPart } from "@/types";
import toast from "react-hot-toast";
import { useState } from "react";
import { updateApprovedOfficeOrderByID } from "@/services/OrderedPartsService";

interface ApproveAllFromOfficeActionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderedParts: OrderedPart[];
}

const ApproveAllFromOfficeAction: React.FC<ApproveAllFromOfficeActionProps> = ({
  open,
  onOpenChange,
  orderedParts
}) => {
  const [loading, setLoading] = useState(false);

  const handleApproveAllOfficeOrder = async () => {
    setLoading(true);
    try {
      const updatePromises = orderedParts.map((orderedPart) => {
        if (!(orderedPart.in_storage && orderedPart.approved_storage_withdrawal)) {
          return updateApprovedOfficeOrderByID(orderedPart.id, true);
        }
      });
      await Promise.all(updatePromises);
      toast.success("Approved all ordered items from office");
    } catch (error) {
      toast.error("Failed to bulk approve");
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Approve All</DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            You are approving all the parts in this order. This cannot be undone and you will move to next status.
          </p>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to approve?
          </p>
        </DialogDescription>
        <Button onClick={handleApproveAllOfficeOrder} disabled={loading}>
          {loading ? "Approving..." : "Approve"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveAllFromOfficeAction;
