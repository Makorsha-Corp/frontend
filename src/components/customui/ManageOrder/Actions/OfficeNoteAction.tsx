import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOfficeNoteByID } from "@/services/OrderedPartsService";
import { OrderedPart } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import toast from "react-hot-toast";

interface OfficeNoteActionProps {
  openThisActionDialog: boolean;
  setOpenThisActionDialog: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
}

const OfficeNoteAction: React.FC<OfficeNoteActionProps> = ({
  openThisActionDialog,
  setOpenThisActionDialog,
  setActionMenuOpen,
  orderedPartInfo,
}) => {
  const { profile } = useAuth();
  const [noteValue, setNoteValue] = useState<string>("");

  const handleAddOfficeNote = async () => {
    if (!noteValue.trim()) {
      toast.error("Cannot submit empty message");
      return;
    }

    try {
      const updated_note = (orderedPartInfo.office_note || "") +
        `${orderedPartInfo.office_note ? "\n" : ""}${profile?.name || "Unknown"}: ${noteValue.trim()}`;

      await updateOfficeNoteByID(orderedPartInfo.id, updated_note);
      toast.success("Your note has been added");
      setNoteValue("");
      setOpenThisActionDialog(false);
      setActionMenuOpen(false);
    } catch (error) {
      toast.error("Something went wrong when adding note");
    }
  };

  return (
    <Dialog open={openThisActionDialog} onOpenChange={setOpenThisActionDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle>
          Office Note – <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogTitle>
        <div className="grid w-full gap-2">
          <Label htmlFor="officeNote">Add your note here</Label>
          <Textarea
            placeholder="Type your note here."
            id="officeNote"
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            This note is only visible to head office
          </p>
        </div>
        <Button onClick={handleAddOfficeNote}>Submit</Button>
      </DialogContent>
    </Dialog>
  );
};

export default OfficeNoteAction;
