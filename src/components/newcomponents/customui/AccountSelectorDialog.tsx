import React, { useEffect, useMemo, useState } from 'react';
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
import { Search, Loader2, X } from 'lucide-react';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetTagsQuery } from '@/features/accounts/accountTagsApi';
import type { Account } from '@/types/account';
import { API_LIMITS } from '@/constants/apiLimits';

export interface AccountSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (account: Account | null) => void;
  selectedAccountId?: number;
  filterTagCode?: string;
  title?: string;
  description?: string;
  allowClear?: boolean;
}

const AccountSelectorDialog: React.FC<AccountSelectorDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  selectedAccountId,
  filterTagCode,
  title = 'Select account',
  description = 'Search and choose an account.',
  allowClear = false,
}) => {
  const [search, setSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>([]);

  const { data: accounts = [], isLoading } = useGetAccountsQuery(
    {
      skip: 0,
      limit: API_LIMITS.STRICT_100,
      search: search || undefined,
      // Never hard-limit by tags; tag grouping is just guidance.
      // Tag filtering is handled client-side so users can always choose any account.
    },
    { skip: !open }
  );
  const { data: tags = [] } = useGetTagsQuery(undefined, { skip: !open });

  const filteredAccounts = useMemo(() => {
    if (selectedTagCodes.length === 0) return accounts;
    return accounts.filter((acc) => {
      const accountTagCodes = (acc.tags || []).map((t) => t.tag_code);
      return selectedTagCodes.every((tagCode) => accountTagCodes.includes(tagCode));
    });
  }, [accounts, selectedTagCodes]);

  const visibleTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tag_code.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
    );
  }, [tags, tagSearch]);

  const highlighted = useMemo(
    () => filteredAccounts.find((a) => a.id === highlightedId) ?? null,
    [filteredAccounts, highlightedId]
  );

  useEffect(() => {
    if (!open) {
      setSearch('');
      setTagSearch('');
      setHighlightedId(null);
      setSelectedTagCodes([]);
      return;
    }
    setSearch('');
    setTagSearch('');
    setHighlightedId(selectedAccountId ?? null);
    setSelectedTagCodes(filterTagCode ? [filterTagCode] : []);
  }, [open, selectedAccountId, filterTagCode]);

  useEffect(() => {
    if (!filteredAccounts.some((a) => a.id === highlightedId)) {
      setHighlightedId(null);
    }
  }, [filteredAccounts, highlightedId]);

  const confirmSelection = () => {
    if (!highlighted) return;
    onSelect(highlighted);
    onOpenChange(false);
  };

  const clearSelection = () => {
    onSelect(null);
    onOpenChange(false);
  };

  const toggleTag = (tagCode: string) => {
    setSelectedTagCodes((prev) =>
      prev.includes(tagCode) ? prev.filter((c) => c !== tagCode) : [...prev, tagCode]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[78vh] max-h-[78vh] w-[min(40rem,94vw)] max-w-none sm:max-w-none flex-col overflow-hidden p-5 sm:p-6">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="shrink-0 space-y-3 rounded-lg border border-border bg-muted/10 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="account-selector-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search accounts..."
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search tags..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="max-h-24 overflow-y-auto rounded-md border border-border bg-background p-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedTagCodes.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedTagCodes([])}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                    Clear
                  </button>
                ) : null}
                {visibleTags.length === 0 ? (
                  <span className="text-xs text-muted-foreground">No tags found.</span>
                ) : (
                  visibleTags.map((tag) => {
                    const selected = selectedTagCodes.includes(tag.tag_code);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.tag_code)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border transition-colors ${
                          selected
                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                            : 'border-border bg-muted/40 text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || '#9067c6' }} />
                        {tag.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-muted/10 p-2">
            {isLoading ? (
              <div className="flex h-full min-h-[7rem] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading accounts...
              </div>
            ) : filteredAccounts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No accounts found.</p>
            ) : (
              <div className="space-y-1.5">
                {filteredAccounts.map((acc) => {
                  const isHighlighted = highlightedId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setHighlightedId(acc.id)}
                      className={`w-full rounded-md border p-2 text-left transition-colors ${
                        isHighlighted
                          ? 'border-brand-primary bg-brand-primary/10'
                          : 'border-transparent bg-card hover:border-border hover:bg-muted/30'
                      }`}
                    >
                      <p className="truncate text-sm font-medium text-foreground">{acc.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {acc.account_code || `#${acc.id}`}
                        {acc.primary_contact_person ? ` · ${acc.primary_contact_person}` : ''}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(acc.tags || []).length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">No tags</span>
                        ) : (
                          (acc.tags || []).map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                              style={{
                                backgroundColor: tag.color ? `${tag.color}20` : undefined,
                                color: tag.color || undefined,
                              }}
                            >
                              {tag.name}
                            </span>
                          ))
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div>
              {allowClear ? (
                <Button type="button" variant="outline" onClick={clearSelection}>
                  Clear
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                onClick={confirmSelection}
                disabled={!highlighted}
              >
                Select account
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountSelectorDialog;
