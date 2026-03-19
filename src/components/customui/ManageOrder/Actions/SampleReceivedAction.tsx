import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { updateSampleReceivedByID } from "@/services/OrderedPartsService";
import { OrderedPart } from "@/types";
import toast from "react-hot-toast";

interface SampleReceivedActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const SampleReceivedAction: React.FC<SampleReceivedActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
}) => {
  const handleSampleReceived = async () => {
    try {
      await updateSampleReceivedByID(orderedPartInfo.id, true);
      toast.success("Updated sample received status");
    } catch (error) {
      toast.error("Error occurred while updating sample received status.");
    }
    setOpenThisActionDialog(false);
    setActionMenuOpen(false);
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent>
        <DialogTitle>Receive Sample - <span className="text-sm">{orderedPartInfo.parts.name}</span></DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            Confirm that the sample has been received at the head office.
          </p>
        </DialogDescription>
        <Button onClick={handleSampleReceived}>Confirm</Button>
      </DialogContent>
    </Dialog>
  );
};

export default SampleReceivedAction;
