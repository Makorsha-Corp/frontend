import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProjectComponentNoteMutation } from '@/features/projectComponentNotes/projectComponentNotesApi';
import type { ProjectComponentNote } from '@/types/projectComponentNote';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface ProjectComponentNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: ProjectComponentNote | null;
}

const ProjectComponentNoteDialog: React.FC<ProjectComponentNoteDialogProps> = ({
  open,
  onOpenChange,
  note,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [updateNote, { isLoading }] = useUpdateProjectComponentNoteMutation();

  useEffect(() => {
    if (!open || !note) return;
    setName(note.name ?? '');
    setDescription(note.description ?? '');
  }, [open, note]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;
    if (!name.trim()) {
      toast.error('Note title is required');
      return;
    }
    try {
      await updateNote({
        id: note.id,
        project_component_id: note.project_component_id,
        data: {
          name: name.trim(),
          description: description.trim() || name.trim(),
        },
      }).unwrap();
      toast.success('Note updated');
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      toast.error(error?.data?.detail || 'Failed to update note');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Note</DialogTitle>
          <DialogDescription>
            {note?.created_at
              ? `Created ${new Date(note.created_at).toLocaleString()}`
              : 'View and edit this note.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="note-description">Description</Label>
            <Textarea
              id="note-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-brand-primary hover:bg-brand-primary-hover"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectComponentNoteDialog;
