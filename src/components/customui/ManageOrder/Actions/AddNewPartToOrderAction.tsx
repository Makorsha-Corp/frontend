import { useState } from "react";


import ReactSelect from "react-select";
import toast from "react-hot-toast";
import { Part, OrderedPart, Order } from "@/types";
import { fetchStoragePartByFactoryAndPartID } from "@/services/StorageService";
import { insertOrderedParts } from "@/services/OrderedPartsService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface AddNewPartToOrderActionProps {
  isAddPartDialogOpen: boolean;
  setAddPartDialogOpen: (open: boolean) => void;
  order: Order;
  parts: Part[];
  orderedParts: OrderedPart[];
}

const AddNewPartToOrderAction: React.FC<AddNewPartToOrderActionProps> = ({
  isAddPartDialogOpen,
  setAddPartDialogOpen,
  order,    
  parts,
  orderedParts
}) => {
  const [searchQueryParts, setSearchQueryParts] = useState<string>("");
  const [selectedPartId, setSelectedPartId] = useState<number>(-1);
  const [selectedPartQty, setSelectedPartQty] = useState<number>(-1);
  const [isSampleSentToOffice, setIsSampleSentToOffice] = useState<boolean>(false);
  const [selectedPartNote, setSelectedPartNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const resetAddPart = () => {
    setSelectedPartQty(-1);
    setSelectedPartId(-1);
    setIsSampleSentToOffice(false);
    setSelectedPartNote("");
  };

  const handleSelectPart = (value: number) => {
    if (selectedPartId !== value) {
      setSelectedPartId(value);
    }
  };

  const handleAddPart = async () => {
    setAddPartDialogOpen(false);
    setLoading(true);
    try {
      const storage_data = await fetchStoragePartByFactoryAndPartID(selectedPartId, order.factory_id);
      const in_storage = order.order_type === "PFM" && storage_data!==null && storage_data.qty > 0;

      await insertOrderedParts(
        selectedPartQty,
        order.id,
        selectedPartId,
        isSampleSentToOffice ?? false,
        selectedPartNote.trim() || null,
        in_storage,
        false
      );

      toast.success("Part added");
      resetAddPart();
    } catch (error) {
      toast.error(`An error occurred: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isAddPartDialogOpen} onOpenChange={setAddPartDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-blue-700">Add Part +</DialogTitle>
          <DialogDescription>
            <div className="space-y-4">
              <div className="mt-2">
                <Label htmlFor="partId">Select Part</Label>
                <ReactSelect
                  id="partId"
                  options={parts
                    .filter((part) => part.name.toLowerCase().includes(searchQueryParts.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((part) => ({
                      value: part.id,
                      label: `${part.name} (${part.unit || "units"})`,
                      isDisabled: orderedParts.some((p) => p.part_id === part.id),
                    }))}
                  onChange={(selectedOption) => handleSelectPart(Number(selectedOption?.value))}
                  isSearchable
                  placeholder="Search or Select a Part"
                  value={
                    selectedPartId > 0
                      ? {
                          value: selectedPartId,
                          label: parts.find((p) => p.id === selectedPartId)?.name,
                        }
                      : null
                  }
                  className="w-[260px]"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="quantity" className="font-medium">
                  {`Quantity${
                    selectedPartId !== -1 ? ` in ${parts.find((p) => p.id === selectedPartId)?.unit || ""}` : ""
                  }`}
                </Label>
                <input
                  id="quantity"
                  type="number"
                  value={selectedPartQty >= 0 ? selectedPartQty : ""}
                  onChange={(e) => setSelectedPartQty(Number(e.target.value))}
                  placeholder={
                    selectedPartId !== -1
                      ? `Enter quantity in ${parts.find((p) => p.id === selectedPartId)?.unit || "units"}`
                      : "Enter quantity"
                  }
                  className="input input-bordered w-[220px] max-w-xs p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 leading-none">
                <label
                  htmlFor="sampleSentToOffice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Is Sample Sent to Office?
                </label>
                <Checkbox
                  id="sampleSentToOffice"
                  checked={isSampleSentToOffice}
                  onCheckedChange={(checked) => setIsSampleSentToOffice(checked === true)}
                  className="h-5 w-5 border-gray-300 rounded focus:ring-gray-500 checked:bg-gray-600 checked:border-transparent"
                />
                <p className="text-sm text-muted-foreground">{isSampleSentToOffice ? "Yes" : "No"}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="font-medium">
                  Note (Optional)
                </Label>
                <Textarea
                  id="note"
                  value={selectedPartNote || ""}
                  onChange={(e) => setSelectedPartNote(e.target.value)}
                  placeholder="Enter any notes"
                  className="min-h-24 w-3/4"
                />
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="bg-blue-700" onClick={handleAddPart} disabled={loading}>
            Confirm
          </Button>
          <Button className="bg-red-800" onClick={resetAddPart} disabled={loading}>
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewPartToOrderAction;
