import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { displayItemTagName } from '@/i18n/itemTagLabels';
import type { UiLanguage } from '@/i18n/uiLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetTagsQuery } from '@/features/items/itemTagsApi';
import { Loader2, Search, Tags, X } from 'lucide-react';
import type { ItemTag } from '@/types/itemTag';
import ItemTagsManagerDialog from '@/components/newcomponents/customui/ItemTagsManagerDialog';
import { cn } from '@/lib/utils';

export interface ItemTagPickerSectionProps {
  /** Clears tag search when the parent dialog closes */
  dialogOpen: boolean;
  selectedTagIds: number[];
  onSelectedTagIdsChange: React.Dispatch<React.SetStateAction<number[]>>;
  /** Optional class on the scrollable tag list (e.g. shorter max-height in wide layouts) */
  tagListClassName?: string;
  className?: string;
}

const ItemTagPickerSection: React.FC<ItemTagPickerSectionProps> = ({
  dialogOpen,
  selectedTagIds,
  onSelectedTagIdsChange,
  tagListClassName,
  className,
}) => {
  const { t, i18n } = useTranslation(['items', 'misc']);
  const language = i18n.language as UiLanguage;
  const [tagSearch, setTagSearch] = useState('');
  const [isTagsManagerOpen, setIsTagsManagerOpen] = useState(false);
  const { data: tags = [], isLoading: isTagsLoading, isError: isTagsError } = useGetTagsQuery();

  useEffect(() => {
    if (!dialogOpen) setTagSearch('');
  }, [dialogOpen]);

  const tagById = useMemo(() => {
    const m = new Map<number, ItemTag>();
    tags.forEach((t) => m.set(t.id, t));
    return m;
  }, [tags]);

  const selectedTags = useMemo(
    () =>
      selectedTagIds
        .map((id) => tagById.get(id))
        .filter((t): t is ItemTag => t != null),
    [selectedTagIds, tagById]
  );

  const unselectedFilteredTags = useMemo(() => {
    if (!tags.length) return [];
    const q = tagSearch.trim().toLowerCase();
    return tags.filter((tag) => {
      if (selectedTagIds.includes(tag.id)) return false;
      if (!q) return true;
      const name = tag.name.toLowerCase();
      const code = (tag.tag_code || '').toLowerCase();
      const desc = (tag.description || '').toLowerCase();
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [tags, tagSearch, selectedTagIds]);

  const addTag = (tagId: number) => {
    onSelectedTagIdsChange((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
  };

  const removeTag = (tagId: number) => {
    onSelectedTagIdsChange((prev) => prev.filter((id) => id !== tagId));
  };

  return (
    <>
      <div className={cn('grid gap-2', className)}>
        <div className="flex items-center justify-between gap-2">
          <Label>{t('tagsOptionalLabel')}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setIsTagsManagerOpen(true)}
          >
            <Tags className="h-3.5 w-3.5 mr-1.5" />
            {t('manageTags')}
          </Button>
        </div>

        {isTagsLoading && tags.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            {t('loadingTags')}
          </div>
        ) : isTagsError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-3 text-sm text-destructive">
            {t('tagsLoadErrorPicker')}
          </p>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            {tags.length === 0 && (
              <div className="text-xs text-muted-foreground">{t('noTagsYetPickerHint')}</div>
            )}

            <div
              className={`min-h-[2.5rem] rounded-md border border-dashed border-border bg-background px-2 py-2 ${
                selectedTags.length ? 'flex flex-wrap gap-2' : 'flex items-center'
              }`}
            >
              {selectedTags.length === 0 ? (
                <span className="text-xs text-muted-foreground px-1">{t('noTagsSelected')}</span>
              ) : (
                selectedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/40 pl-2.5 pr-1 py-1 text-sm"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color || '#9067c6' }}
                    />
                    <span className="truncate">{displayItemTagName(tag, t, language)}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      aria-label={t('removeTagAria', { name: displayItemTagName(tag, t, language) })}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder={t('searchTagsDetailedPlaceholder')}
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="pl-9 h-9 bg-background"
                autoComplete="off"
                disabled={tags.length === 0}
              />
            </div>

            <div
              className={cn(
                'max-h-44 overflow-y-auto rounded-md border border-border bg-background',
                tagListClassName
              )}
            >
              {unselectedFilteredTags.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {tags.length > 0 && selectedTagIds.length === tags.length
                    ? t('allTagsSelected')
                    : tagSearch.trim()
                      ? t('noTagsMatchSearchShort')
                      : tags.length === 0
                        ? t('createTagsWithManage')
                        : t('noTagsToShow')}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {unselectedFilteredTags.map((tag) => (
                    <li key={tag.id}>
                      <button
                        type="button"
                        onClick={() => addTag(tag.id)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: tag.color || '#9067c6' }}
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {displayItemTagName(tag, t, language)}
                        </span>
                        {tag.is_system_tag && (
                          <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {t('systemTagBadge')}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      <ItemTagsManagerDialog open={isTagsManagerOpen} onOpenChange={setIsTagsManagerOpen} />
    </>
  );
};

export default ItemTagPickerSection;
