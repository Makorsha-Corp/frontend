import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { updatePurchasedDateByID } from "@/services/OrderedPartsService";
import { OrderedPart } from "@/types";
import { useState } from "react";
import toast from "react-hot-toast";

interface PurchasedActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const PurchasedAction: React.FC<PurchasedActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo
}) => {
  const [datePurchased, setDatePurchased] = useState<Date | undefined>(
    orderedPartInfo.part_purchased_date
      ? new Date(orderedPartInfo.part_purchased_date)
      : new Date()
  );

  const handleUpdatePurchaseDate = async () => {
    if (datePurchased) {
      try {
        await updatePurchasedDateByID(orderedPartInfo.id, datePurchased);
        toast.success("Part purchased date set!");
      } catch (error) {
        toast.error("Error occurred. Could not complete action.");
      }
    } else {
      toast.error("Purchase date was not found");
      return;
    }

    setOpenThisActionDialog(false);
    setActionMenuOpen(false);
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>Date when part was purchased</DialogTitle>
        <DialogDescription>
          <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogDescription>
        <Calendar
          mode="single"
          selected={datePurchased}
          onSelect={setDatePurchased}
          className="rounded-md border"
        />
        <Button onClick={handleUpdatePurchaseDate}>Confirm</Button>
      </DialogContent>
    </Dialog>
  );
};

export default PurchasedAction;
