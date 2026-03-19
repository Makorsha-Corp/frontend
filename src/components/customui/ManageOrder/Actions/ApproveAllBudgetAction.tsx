import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateApprovedBudgetByID } from "@/services/OrderedPartsService";
import toast from "react-hot-toast";
import { OrderedPart } from "@/types";

interface ApproveAllBudgetActionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderedParts: OrderedPart[];
}

const ApproveAllBudgetAction: React.FC<ApproveAllBudgetActionProps> = ({ open, onOpenChange, orderedParts }) => {
  const [loading, setLoading] = useState(false);

  const handleApproveAllBudgets = async () => {
    setLoading(true);
    try {
      const updatePromises = orderedParts.map((ordered_part) => {
        if (!(ordered_part.in_storage && ordered_part.approved_storage_withdrawal)) {
          return updateApprovedBudgetByID(ordered_part.id, true);
        }
      });
      await Promise.all(updatePromises);
      toast.success("Approved budgets for all parts");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to bulk approve");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Approve All</DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            You are approving budgets for all parts. Only approve if you are okay with the whole quotation. This cannot be undone and you will be moved to the next status.
          </p>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to approve?
          </p>
        </DialogDescription>
        <Button disabled={loading} onClick={handleApproveAllBudgets}>
          {loading ? "Approving..." : "Approve"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveAllBudgetAction;
