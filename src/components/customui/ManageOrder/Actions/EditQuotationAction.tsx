import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCostingByID } from '@/services/OrderedPartsService';
import { OrderedPart } from '@/types';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface EditQuotationActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const EditQuotationAction: React.FC<EditQuotationActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendor, setVendor] = useState(orderedPartInfo.vendor || '');
  const [brand, setBrand] = useState(orderedPartInfo.brand || '');
  const [unitCost, setUnitCost] = useState(
    orderedPartInfo.unit_cost?.toString() || ''
  );

  const handleEditQuotation = async () => {
    if (!vendor.trim() || !brand.trim() || !unitCost.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    const numericUnitCost = parseFloat(unitCost);
    if (isNaN(numericUnitCost) || numericUnitCost < 0) {
      toast.error('Cost/Unit must be a valid non-negative number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateCostingByID(orderedPartInfo.id, brand.trim(), numericUnitCost, vendor.trim());
      toast.success('Quotation updated successfully');
      setOpenThisActionDialog(false);
      setActionMenuOpen(false);
    } catch (error) {
      toast.error('Failed to update quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>
          Edit Quotation - <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogTitle>
        <fieldset className="grid gap-6 rounded-lg border p-4">
          <div className="grid gap-3">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              type="text"
              value={brand}
              placeholder="Enter brand name"
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              type="text"
              value={vendor}
              placeholder="Enter vendor name"
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="unit_cost">Cost/Unit</Label>
            <Input
              id="unit_cost"
              type="number"
              value={unitCost}
              placeholder="Enter the unit cost"
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>
        </fieldset>
        <Button onClick={handleEditQuotation} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuotationAction;
