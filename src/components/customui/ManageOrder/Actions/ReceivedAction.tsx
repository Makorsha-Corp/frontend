import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { updateReceivedByFactoryDateByID } from "@/services/OrderedPartsService"
import { OrderedPart } from "@/types"
import { useState } from "react"
import toast from "react-hot-toast"
import { handlePFSReceivedAction, handlePFMReceivedAction, handlePFPReceivedAction, handleSTPReceivedAction } from "../Processing/CompletionProcesses"

interface ReceivedActionProps {
  openThisActionDialog: boolean
  setOpenThisActionDialog: (v: boolean) => void
  setActionMenuOpen: (v: boolean) => void
  orderedPartInfo: OrderedPart
  order_type: string
  factory_id: number
  machine_id: number
  project_component_id?: number
  src_factory_id?: number
}

const ReceivedAction: React.FC<ReceivedActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
  order_type,
  factory_id,
  machine_id,
  project_component_id,
  src_factory_id
}) => {
  const [dateReceived, setDateReceived] = useState<Date | undefined>(
    orderedPartInfo.part_received_by_factory_date
      ? new Date(orderedPartInfo.part_received_by_factory_date)
      : new Date()
  )

  const handleUpdateReceivedDate = () => {
    const updateReceivedDate = async () => {
      if (!dateReceived) {
        toast.error("Received date is missing.");
        return;
      }

      const receivedTime = dateReceived.getTime();

      const sentTime = orderedPartInfo.part_sent_by_office_date
        ? new Date(orderedPartInfo.part_sent_by_office_date).getTime()
        : null;

      const purchasedTime = orderedPartInfo.part_purchased_date
        ? new Date(orderedPartInfo.part_purchased_date).getTime()
        : null;

      if (sentTime !== null && receivedTime < sentTime) {
        toast.error("Received date must be after or equal to sent date.");
        return;
      }

      if (sentTime === null && purchasedTime !== null && receivedTime < purchasedTime) {
        toast.error("Received date must be after or equal to purchased date.");
        return;
      }

      try {
        await updateReceivedByFactoryDateByID(orderedPartInfo.id, dateReceived);
        toast.success("Part received by factory date set!");
        if (order_type === "PFS") {
          const recieved_handle_success = await handlePFSReceivedAction(
            orderedPartInfo,
            factory_id,
          );
          if(!recieved_handle_success) {
            await updateReceivedByFactoryDateByID(orderedPartInfo.id, null);
            toast.error("Resetting received date as part transfer failed");
          }
        }

        if (order_type === "PFM") {
          const received_handle_success = await handlePFMReceivedAction(
            orderedPartInfo,
            machine_id,
            factory_id,
          );
          if (!received_handle_success) {
            await updateReceivedByFactoryDateByID(orderedPartInfo.id, null);
            toast.error("Resetting received date as part transfer failed");
          }
        }

        if (order_type === "PFP" && project_component_id) {
          const received_handle_success = await handlePFPReceivedAction(
            orderedPartInfo,
            project_component_id,
          );
          if (!received_handle_success) {
            await updateReceivedByFactoryDateByID(orderedPartInfo.id, null);
            toast.error("Resetting received date as part transfer failed");
          }
        }

        if (order_type === "STP" && project_component_id && src_factory_id) {
          const received_handle_success = await handleSTPReceivedAction(
            orderedPartInfo,
            project_component_id,
            src_factory_id,
          );
          if (!received_handle_success) {
            await updateReceivedByFactoryDateByID(orderedPartInfo.id, null);
            toast.error("Resetting received date as part transfer failed");
          }
        }
        
        
      } catch (error) {
        toast.error("Error occurred, could not complete action.");
      }

      setOpenThisActionDialog(false);
      setActionMenuOpen(false);
    };

    updateReceivedDate();
  };
  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>Date when part was received at Factory</DialogTitle>
        <DialogDescription>
          <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogDescription>
        <Calendar
          mode="single"
          selected={dateReceived}
          onSelect={setDateReceived}
          className="rounded-md border"
        />
        <Button onClick={handleUpdateReceivedDate}>Confirm</Button>
      </DialogContent>
    </Dialog>
  )
}

export default ReceivedAction
