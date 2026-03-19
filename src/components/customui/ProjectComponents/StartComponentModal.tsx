import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updateProjectComponent } from "@/services/ProjectComponentService";
import { updateProject } from "@/services/ProjectsService";

interface StartComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: number;
  componentName: string;
  projectId: number;
  projectStatus: 'PLANNING' | 'STARTED' | 'COMPLETED';
  defaultStartDate?: string | null; // "YYYY-MM-DD"
  onComponentUpdated?: () => void;
  onProjectUpdated?: () => void;
}

const isoToday = () => new Date().toISOString().slice(0, 10);

const StartComponentModal: React.FC<StartComponentModalProps> = ({
  isOpen,
  onClose,
  componentId,
  componentName,
  projectId,
  projectStatus,
  defaultStartDate,
  onComponentUpdated,
  onProjectUpdated,
}) => {
  const [startDate, setStartDate] = useState<string>(defaultStartDate || isoToday());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setStartDate(defaultStartDate || isoToday());
  }, [isOpen, defaultStartDate]);

  const handleConfirm = async () => {
    if (!startDate) {
      toast.error("Please select a start date.");
      return;
    }
    setSaving(true);
    try {
      // Check if parent project needs to be started first
      if (projectStatus === 'PLANNING') {
        const projectStarted = await updateProject(projectId, { 
          start_date: startDate, 
          status: "STARTED" 
        });
        if (!projectStarted) {
          toast.error("Failed to start parent project");
          return;
        }
        toast.success("Project and component started");
        onProjectUpdated?.();
      } else {
        toast.success("Component started");
      }

      // Start the component
      const ok = await updateProjectComponent(componentId, { 
        start_date: startDate, 
        status: "STARTED" 
      } as any);
      
      if (ok) {
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
          <DialogTitle>Start Component — {componentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Pick the date the component officially starts. We’ll set the status to <strong>STARTED</strong>.
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

export default StartComponentModal;
