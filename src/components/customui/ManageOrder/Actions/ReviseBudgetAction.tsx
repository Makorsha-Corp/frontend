import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { updateCostingByID } from "@/services/OrderedPartsService";
import { OrderedPart } from "@/types";
import toast from "react-hot-toast";
import { useState } from "react";

interface ReviseBudgetActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const ReviseBudgetAction: React.FC<ReviseBudgetActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo
}) => {
  const [denyCost, setDenyCost] = useState(false);
  const [denyBrand, setDenyBrand] = useState(false);
  const [denyVendor, setDenyVendor] = useState(false);
  const [costLoading, setCostLoading] = useState(false);

  const handleReviseBudget = async () => {
    if (!denyBrand && !denyCost && !denyVendor) {
      toast.error("You have not selected any category to deny.");
      return;
    }

    const newBrand = denyBrand ? null : orderedPartInfo.brand;
    const currentCost = typeof orderedPartInfo.unit_cost === "string"
      ? parseFloat(orderedPartInfo.unit_cost)
      : orderedPartInfo.unit_cost;
    const newCost = denyCost ? null : currentCost;
    const newVendor = denyVendor ? null : orderedPartInfo.vendor;

    try {
      setCostLoading(true);
      await updateCostingByID(orderedPartInfo.id, newBrand, newCost, newVendor);
      toast.success("Quotation updated");
    } catch (error) {
      toast.error("Error occurred, could not complete action");
    } finally {
      setCostLoading(false);
      setOpenThisActionDialog(false);
      setActionMenuOpen(false);
    }
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="text-red-600">
          Revise Budget - <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogTitle>
        <p className="text-sm text-muted-foreground">Checking a box will deny that category</p>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="checkDenyBrand"
            checked={denyBrand}
            onCheckedChange={(checked) => setDenyBrand(!!checked)}
          />
          <label htmlFor="checkDenyBrand" className="text-sm font-medium">
            Deny Brand
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="checkDenyVendor"
            checked={denyVendor}
            onCheckedChange={(checked) => setDenyVendor(!!checked)}
          />
          <label htmlFor="checkDenyVendor" className="text-sm font-medium">
            Deny Vendor
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="checkDenyCost"
            checked={denyCost}
            onCheckedChange={(checked) => setDenyCost(!!checked)}
          />
          <label htmlFor="checkDenyCost" className="text-sm font-medium">
            Deny Unit Cost
          </label>
        </div>

        <Button onClick={handleReviseBudget} disabled={costLoading}>
          {costLoading ? "Updating..." : "Confirm"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ReviseBudgetAction;
