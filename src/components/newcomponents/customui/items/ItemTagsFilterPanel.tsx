import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGetTagsQuery } from '@/features/items/itemTagsApi';
import { cn } from '@/lib/utils';
import { Check, Loader2, PanelRightClose, Search, Tag, Tags, X } from 'lucide-react';
import type { ItemTag } from '@/types/itemTag';
import ItemTagsManagerDialog from '@/components/newcomponents/customui/ItemTagsManagerDialog';

const DEFAULT_TAG_COLOR = '#9067c6';

export interface ItemTagsFilterPanelProps {
  selectedTagIds: number[];
  onSelectedTagIdsChange: React.Dispatch<React.SetStateAction<number[]>>;
  onClose: () => void;
  className?: string;
}

const ItemTagsFilterPanel: React.FC<ItemTagsFilterPanelProps> = ({
  selectedTagIds,
  onSelectedTagIdsChange,
  onClose,
  className,
}) => {
  const [search, setSearch] = useState('');
  const [isTagsManagerOpen, setIsTagsManagerOpen] = useState(false);
  const { data: tags = [], isLoading, isError } = useGetTagsQuery();

  const activeTags = useMemo(
    () => tags.filter((t) => t.is_active !== false).sort((a, b) => a.name.localeCompare(b.name)),
    [tags]
  );

  const tagById = useMemo(() => {
    const m = new Map<number, ItemTag>();
    activeTags.forEach((t) => m.set(t.id, t));
    return m;
  }, [activeTags]);

  const selectedTags = useMemo(
    () =>
      selectedTagIds.map((id) => tagById.get(id)).filter((t): t is ItemTag => t != null),
    [selectedTagIds, tagById]
  );

  const filteredTags = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeTags;
    return activeTags.filter((tag) => {
      const name = tag.name.toLowerCase();
      const code = (tag.tag_code || '').toLowerCase();
      const desc = (tag.description || '').toLowerCase();
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [activeTags, search]);

  const toggleTag = (tagId: number) => {
    onSelectedTagIdsChange((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const removeTag = (tagId: number) => {
    onSelectedTagIdsChange((prev) => prev.filter((id) => id !== tagId));
  };

  const clearAllTags = () => {
    onSelectedTagIdsChange([]);
  };

  return (
    <>
      <aside
        className={cn(
          'flex w-72 shrink-0 flex-col border-l border-border bg-card min-h-0',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-heading">
              <Tag className="h-4 w-4 shrink-0" />
              Tags
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Filter items by tag</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={onClose}
            aria-label="Hide tags panel"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
          <div
            className={cn(
              'min-h-[2.5rem] rounded-md border border-dashed border-border bg-muted/20 px-2 py-2',
              selectedTags.length ? 'flex flex-wrap gap-2' : 'flex items-center'
            )}
          >
            {selectedTags.length === 0 ? (
              <span className="px-1 text-xs text-muted-foreground">No tags selected</span>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background pl-2.5 pr-1 py-1 text-sm"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color || DEFAULT_TAG_COLOR }}
                  />
                  <span className="truncate">{tag.name}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${tag.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>

          {selectedTags.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 self-start px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearAllTags}
            >
              Clear all tags
            </Button>
          ) : null}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-background pl-9"
              autoComplete="off"
              disabled={activeTags.length === 0}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {isLoading && activeTags.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tags…
            </div>
          ) : isError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-4 text-sm text-destructive">
              Could not load tags.
            </p>
          ) : activeTags.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
              No tags yet.
            </div>
          ) : (
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={clearAllTags}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
                    selectedTagIds.length === 0
                      ? 'border-brand-primary/40 bg-brand-primary/10'
                      : 'border-transparent hover:bg-muted/60'
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Tags className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 font-medium">All tags</span>
                  {selectedTagIds.length === 0 ? (
                    <Check className="h-4 w-4 shrink-0 text-brand-primary" />
                  ) : null}
                </button>
              </li>

              {filteredTags.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No tags match your search.
                </li>
              ) : (
                filteredTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const color = tag.color || DEFAULT_TAG_COLOR;

                  return (
                    <li key={tag.id}>
                      <button
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
                          isSelected
                            ? 'border-brand-primary/40 bg-brand-primary/10'
                            : 'border-transparent hover:bg-muted/60'
                        )}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-border/60"
                          style={{ backgroundColor: `${color}22` }}
                        >
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{tag.name}</div>
                          {tag.description ? (
                            <div className="truncate text-xs text-muted-foreground">{tag.description}</div>
                          ) : null}
                        </div>
                        {typeof tag.usage_count === 'number' ? (
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {tag.usage_count}
                          </span>
                        ) : null}
                        {isSelected ? <Check className="h-4 w-4 shrink-0 text-brand-primary" /> : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsTagsManagerOpen(true)}
          >
            <Tags className="mr-2 h-4 w-4" />
            Manage Tags
          </Button>
        </div>
      </aside>

      <ItemTagsManagerDialog open={isTagsManagerOpen} onOpenChange={setIsTagsManagerOpen} />
    </>
  );
};

export default ItemTagsFilterPanel;
