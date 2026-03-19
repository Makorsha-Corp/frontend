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
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { updateProjectComponent } from "@/services/ProjectComponentService";
import type { ProjectComponent as ProjectComponentType } from "@/types";

interface EditComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: number;
  initialName: string;
  initialDescription: string; // pass "" if null
  onComponentUpdated?: () => void;
}

const normalize = (s: string) => s.trim();

const EditComponentModal: React.FC<EditComponentModalProps> = ({
  isOpen,
  onClose,
  componentId,
  initialName,
  initialDescription,
  onComponentUpdated,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (!isOpen) return;
    setName(initialName);
    setDescription(initialDescription);
  }, [isOpen, initialName, initialDescription]);

  const isNameEmpty = useMemo(() => !normalize(name), [name]);

  const isPristine = useMemo(
    () =>
      normalize(name) === normalize(initialName) &&
      normalize(description) === normalize(initialDescription),
    [name, description, initialName, initialDescription]
  );

  const canSave = !saving && !isNameEmpty && !isPristine;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: Partial<ProjectComponentType> = {
        name: normalize(name),
        description: normalize(description) || null,
      };

      const ok = await updateProjectComponent(componentId, payload);
      if (ok) {
        toast.success("Component updated");
        onComponentUpdated?.();
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
          <DialogTitle>Edit Component</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Component Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter component name"
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

          <div className="text-xs text-muted-foreground border rounded-md p-3">
            Budget &amp; deadline are planned via the project planning options.
            Start/End dates &amp; Status are controlled via Start/Complete actions.
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

export default EditComponentModal;
