import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updateProjectComponent } from "@/services/ProjectComponentService";

interface CompleteComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: number;
  componentName: string;
  defaultStartDate?: string | null;
  onComponentUpdated?: () => void;
}

const isoToday = () => new Date().toISOString().slice(0, 10);

const CompleteComponentModal: React.FC<CompleteComponentModalProps> = ({
  isOpen,
  onClose,
  componentId,
  componentName,
  defaultStartDate,
  onComponentUpdated,
}) => {
  const [completeDate, setCompleteDate] = useState<string>(isoToday());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCompleteDate(isoToday());
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!completeDate) {
      toast.error("Please select a completion date.");
      return;
    }
    // Optional: basic guard if start exists and completion < start.
    if (defaultStartDate && completeDate < defaultStartDate) {
      toast.error("Completion date cannot be before start date.");
      return;
    }

    setSaving(true);
    try {
      const ok = await updateProjectComponent(componentId, { end_date: completeDate, status: "COMPLETED" } as any);
      if (ok) {
        toast.success("Component completed");
        onComponentUpdated?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Component — {componentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Set the component’s <strong>completion date</strong>. We’ll set the status to <strong>COMPLETED</strong>.
          </p>
          <div>
            <Label>Completion Date</Label>
            <Input type="date" value={completeDate} onChange={(e) => setCompleteDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving}>Complete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteComponentModal;
