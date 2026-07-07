import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SimilarItemMatch } from '@/types/item';

export interface ItemSimilarMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposedName: string;
  matches: SimilarItemMatch[];
  onUseExisting: (match: SimilarItemMatch) => void;
  onCreateAnyway: () => void;
  isResolving?: boolean;
}

function matchBadgeLabel(matchType: SimilarItemMatch['match_type']): string {
  return matchType === 'exact_normalized' ? 'Exact match' : 'Similar';
}

const ItemSimilarMatchDialog: React.FC<ItemSimilarMatchDialogProps> = ({
  open,
  onOpenChange,
  proposedName,
  matches,
  onUseExisting,
  onCreateAnyway,
  isResolving = false,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[min(32rem,94vw)] max-w-none">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Similar item already exists
        </DialogTitle>
        <DialogDescription className="text-left">
          A catalog item with a name like{' '}
          <span className="font-medium text-foreground">&quot;{proposedName}&quot;</span> may
          already exist. Did you mean one of these?
        </DialogDescription>
      </DialogHeader>

      <ul className="max-h-[16rem] space-y-2 overflow-y-auto rounded-lg border border-border p-2">
        {matches.map((match) => (
          <li
            key={match.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{match.name}</p>
              <p className="text-xs text-muted-foreground">
                {match.unit}
                {match.sku ? ` · SKU ${match.sku}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {matchBadgeLabel(match.match_type)}
              </span>
              <Button
                type="button"
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={isResolving}
                onClick={() => onUseExisting(match)}
              >
                Use this item
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" disabled={isResolving} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" variant="secondary" disabled={isResolving} onClick={onCreateAnyway}>
          Create anyway
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ItemSimilarMatchDialog;
