import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Order } from "@/types";
import { useState } from "react";
import { fetchRunningOrdersByMachineId, UpdateStatusByID } from "@/services/OrdersService";
import { InsertStatusTracker } from "@/services/StatusTrackerService";
import { setMachineIsRunningById } from "@/services/MachineServices";
import { getNextStatusIdFromSequence } from "@/services/helper";
import { useAuth } from "@/context/AuthContext";
import { handleOrderApproval } from "../Processing/ApprovalProcesses";

interface AdvanceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

const AdvanceOrderDialog: React.FC<AdvanceOrderDialogProps> = ({
  open,
  onOpenChange,
  order,
}) => {
  const [loading, setLoading] = useState(false);
  const profile = useAuth().profile
  const handleAdvanceOrderStatus = async () => {
    setLoading(true);
    try {
      if (!profile) {
        toast.error("Profile not found");
        return;
      }

      const next_status_id = getNextStatusIdFromSequence(order.order_workflows.status_sequence,order.statuses.id);

      if (!next_status_id || next_status_id === order.statuses.id) {
        toast.error("Could not figure out next status");
        return;
      }

      if (order.current_status_id == 1) {
        await handleOrderApproval(order);
        toast.success("Order advanced to next status");
      }

      await UpdateStatusByID(order.id, next_status_id);
      await InsertStatusTracker(new Date(), order.id, profile.id, order.current_status_id);
      


      // Handle machine restart for completed PFM orders (status 8)
      if (order.order_type === "PFM" && next_status_id === 8) {
        const runningOrders = await fetchRunningOrdersByMachineId(order.machine_id);
        if (runningOrders.length === 0) {
          await setMachineIsRunningById(order.machine_id, true);
          toast.success("Machine is now running");
        }
      }

      // Generic success message for non-approval status changes

      onOpenChange(false);
    } catch (error) {
      toast.error("Error when trying to advance order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Advance Order Status</DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            You can now advance this order to the next status. Please confirm if you'd like to proceed.
          </p>
        </DialogDescription>
        <Button onClick={handleAdvanceOrderStatus} disabled={loading}>
          {loading ? "Processing..." : "Confirm"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AdvanceOrderDialog;
