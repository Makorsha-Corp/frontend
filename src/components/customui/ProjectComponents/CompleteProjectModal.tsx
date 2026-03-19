import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updateProject } from "@/services/ProjectsService";
import { fetchProjectComponentsByProjectId } from "@/services/ProjectComponentService";
import type { ProjectComponent } from "@/types";

interface CompleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onProjectUpdated?: () => void;
}

const isoToday = () => new Date().toISOString().slice(0, 10);

const CompleteProjectModal: React.FC<CompleteProjectModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onProjectUpdated,
}) => {
  const [completeDate, setCompleteDate] = useState<string>(isoToday());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState<ProjectComponent[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const comps = await fetchProjectComponentsByProjectId(projectId);
        setComponents(comps);
      } finally {
        setLoading(false);
      }
    })();
    setCompleteDate(isoToday());
  }, [isOpen, projectId]);

  const incompleteCount = useMemo(
    () => components.filter(c => c.status !== "COMPLETED").length,
    [components]
  );

  const handleConfirm = async () => {
    if (incompleteCount > 0) return;
    if (!completeDate) {
      toast.error("Please select a completion date.");
      return;
    }
    setSaving(true);
    try {
      const ok = await updateProject(projectId, { end_date: completeDate, status: "COMPLETED" });
      if (ok) {
        toast.success("Project completed");
        onProjectUpdated?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const blocked = incompleteCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Project — {projectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Set the project’s <strong>completion date</strong>. All components must be completed first.
          </p>

          <div>
            <Label>Completion Date</Label>
            <Input
              type="date"
              value={completeDate}
              onChange={(e) => setCompleteDate(e.target.value)}
              disabled={loading || blocked}
            />
          </div>

          {blocked ? (
            <div className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-md p-2">
              {incompleteCount} component{incompleteCount === 1 ? "" : "s"} not completed. Please complete all components before completing the project.
            </div>
          ) : (
            <div className="text-xs text-green-700 border border-green-200 bg-green-50 rounded-md p-2">
              All components are completed. You can finish the project.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving || loading || blocked}>Complete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteProjectModal;
