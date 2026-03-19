import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderedPart, Order } from "@/types";
import toast from "react-hot-toast";
import { useState } from "react";
import { increaseDamagedPartQty } from "../../../../services/DamagedGoodsService";
import { updateApprovedPendingOrderByID } from "@/services/OrderedPartsService";
import { reduceMachinePartQty } from "@/services/MachinePartsService";

interface ApproveAllPendingActionProps {
  isApprovePendingDialogOpen: boolean;
  setApprovePendingDialogOpen: (open: boolean) => void;
  orderedParts: OrderedPart[];
  order: Order;
  isLoadingTableButtons: boolean;
  setIsLoadingTableButtons: (open: boolean) => void;
}

const ApproveAllPendingAction: React.FC<ApproveAllPendingActionProps> = ({
  isApprovePendingDialogOpen,
  setApprovePendingDialogOpen,
  orderedParts,
  order,
  setIsLoadingTableButtons,
}) => {
  const [loading, setLoading] = useState(false);

  const handleApproveAllPendingOrder = async () => {
    setLoading(true);
    setIsLoadingTableButtons(true);
    try {
      const updatePromises = orderedParts.map(async (ordered_part) => {
        const promises = [];

        if (!(ordered_part.in_storage && ordered_part.approved_storage_withdrawal)) {
          promises.push(updateApprovedPendingOrderByID(ordered_part.id, true));
        }

        return Promise.all(promises);
      });
      await Promise.all(updatePromises);
      toast.success("Approved all parts in the pending order");
    } catch (error) {
      toast.error("Failed to bulk approve");
    } finally {
      setLoading(false);
      setIsLoadingTableButtons(false);
    }
    setApprovePendingDialogOpen(false);
  };

  return (
    <Dialog open={isApprovePendingDialogOpen} onOpenChange={setApprovePendingDialogOpen}>
      <DialogContent>
        <DialogTitle>Approve All</DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            You are approving all the parts in this pending order. This cannot be undone and you will move to next status.
          </p>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to approve?
          </p>
        </DialogDescription>
        <Button onClick={handleApproveAllPendingOrder} disabled={loading}>
          {loading ? "Approving..." : "Approve"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveAllPendingAction;
