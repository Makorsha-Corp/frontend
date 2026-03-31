import React, { useMemo, useState } from 'react';
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
import { ItemTag } from '@/types/itemTag';
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetTagsQuery,
  useUpdateTagMutation,
} from '@/features/items/itemTagsApi';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ItemTagsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ItemTagsManagerDialog: React.FC<ItemTagsManagerDialogProps> = ({ open, onOpenChange }) => {
  const { data: tags = [] } = useGetTagsQuery();
  const [createTag, { isLoading: isCreating }] = useCreateTagMutation();
  const [updateTag, { isLoading: isUpdating }] = useUpdateTagMutation();
  const [deleteTag, { isLoading: isDeleting }] = useDeleteTagMutation();

  const [name, setName] = useState('');
  const [color, setColor] = useState('#9067c6');
  const [description, setDescription] = useState('');
  const [editingTag, setEditingTag] = useState<ItemTag | null>(null);

  const isBusy = isCreating || isUpdating || isDeleting;
  const activeTags = useMemo(() => tags.filter((t) => t.is_active !== false), [tags]);

  const resetForm = () => {
    setName('');
    setColor('#9067c6');
    setDescription('');
    setEditingTag(null);
  };

  const startEdit = (tag: ItemTag) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color || '#9067c6');
    setDescription(tag.description || '');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      if (editingTag) {
        await updateTag({
          id: editingTag.id,
          data: {
            name: name.trim(),
            color: color || null,
            description: description.trim() || null,
          },
        }).unwrap();
        toast.success('Tag updated');
      } else {
        await createTag({
          name: name.trim(),
          color: color || null,
          description: description.trim() || null,
        }).unwrap();
        toast.success('Tag created');
      }
      resetForm();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save tag');
    }
  };

  const handleDelete = async (tag: ItemTag) => {
    if (tag.is_system_tag) {
      toast.error('System tags cannot be deleted');
      return;
    }
    if (!window.confirm(`Delete tag "${tag.name}"?`)) return;
    try {
      await deleteTag(tag.id).unwrap();
      toast.success('Tag deleted');
      if (editingTag?.id === tag.id) resetForm();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete tag');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Manage Item Tags</DialogTitle>
          <DialogDescription>Create, edit, and remove item tags.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Existing Tags</Label>
            <div className="border border-border rounded-lg p-2 max-h-[52vh] overflow-y-auto">
              {activeTags.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No tags yet.</p>
              ) : (
                <div className="space-y-2">
                  {activeTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted/50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color || '#9067c6' }} />
                          <span className="font-medium truncate">{tag.name}</span>
                        </div>
                        {tag.description ? <p className="text-xs text-muted-foreground truncate">{tag.description}</p> : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(tag)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(tag)}
                          disabled={tag.is_system_tag}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{editingTag ? 'Edit Tag' : 'Add Tag'}</Label>
            <div className="space-y-3 border border-border rounded-lg p-3">
              <div>
                <Label htmlFor="tag-name">Name *</Label>
                <Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tag name" className="mt-1" />
              </div>
              <div>
                <div>
                  <Label htmlFor="tag-color">Color</Label>
                  <Input id="tag-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1 h-10 p-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="tag-description">Description</Label>
                <Textarea
                  id="tag-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" onClick={handleSave} disabled={isBusy || !name.trim()} className="bg-brand-primary hover:bg-brand-primary-hover">
                  {editingTag ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {editingTag ? 'Update Tag' : 'Create Tag'}
                </Button>
                {editingTag ? (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isBusy}>
                    Cancel Edit
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ItemTagsManagerDialog;

