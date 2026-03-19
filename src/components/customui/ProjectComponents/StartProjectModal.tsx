import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updateProject } from "@/services/ProjectsService";

interface StartProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  defaultStartDate?: string | null; // "YYYY-MM-DD" (optional)
  onProjectUpdated?: () => void;
}

const isoToday = () => new Date().toISOString().slice(0, 10);

const StartProjectModal: React.FC<StartProjectModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  defaultStartDate,
  onProjectUpdated,
}) => {
  const [startDate, setStartDate] = useState<string>(defaultStartDate || isoToday());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStartDate(defaultStartDate || isoToday());
    }
  }, [isOpen, defaultStartDate]);

  const handleConfirm = async () => {
    if (!startDate) {
      toast.error("Please select a start date.");
      return;
    }
    setSaving(true);
    try {
      const ok = await updateProject(projectId, { start_date: startDate, status: "STARTED" });
      if (ok) {
        toast.success("Project started");
        onProjectUpdated?.();
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
          <DialogTitle>Start Project — {projectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Pick the date the project officially starts. This will set the project status to <strong>STARTED</strong>.
          </p>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving}>Start</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StartProjectModal;
