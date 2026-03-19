import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updateProject } from "@/services/ProjectsService";
import type { Project } from "@/types";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  initialName: string;
  initialDescription: string;
  initialPriority: Project["priority"]; // 'LOW' | 'MEDIUM' | 'HIGH'
  onProjectUpdated?: () => void;
}

const normalize = (s: string) => s.trim();

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  projectId,
  initialName,
  initialDescription,
  initialPriority,
  onProjectUpdated,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] =
    useState<Project["priority"]>(initialPriority);
  const [saving, setSaving] = useState(false);

  // Reset fields on open
  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setDescription(initialDescription);
    setPriority(initialPriority);
  }, [isOpen, initialName, initialDescription, initialPriority]);

  const isNameEmpty = useMemo(() => !normalize(name), [name]);

  const isPristine = useMemo(() => {
    return (
      normalize(name) === normalize(initialName) &&
      normalize(description) === normalize(initialDescription) &&
      priority === initialPriority
    );
  }, [name, description, priority, initialName, initialDescription, initialPriority]);

  const canSave = useMemo(() => !saving && !isNameEmpty && !isPristine, [saving, isNameEmpty, isPristine]);

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const ok = await updateProject(projectId, {
        name: normalize(name),
        description: normalize(description),
        priority,
      });
      if (ok) {
        toast.success("Project updated");
        onProjectUpdated?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a brief description"
              className="min-h-[90px]"
            />
          </div>

          <div>
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Project["priority"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">LOW</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="HIGH">HIGH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground border rounded-md p-3">
            Budget and deadline changes are managed via <strong>Plan Budget</strong> /{" "}
            <strong>Plan Deadlines</strong>. Start/End dates and Status are managed via{" "}
            <strong>Start Project</strong> / <strong>Complete Project</strong>.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave} aria-disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectModal;
