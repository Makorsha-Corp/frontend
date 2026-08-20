import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { ORDER_CHECKLIST_COPY } from './orderChecklistCopy';
import { useOrderChecklistIntroDismissed } from './useOrderChecklistIntroDismissed';

export interface OrderWorkflowChecklistIntroBannerProps {
  visible: boolean;
  className?: string;
}

export function OrderWorkflowChecklistIntroBanner({
  visible,
  className,
}: OrderWorkflowChecklistIntroBannerProps) {
  const { dismissed, dismiss } = useOrderChecklistIntroDismissed();

  if (!visible || dismissed) return null;

  return (
    <div
      aria-live="polite"
      className={cn(
        'mx-3 mt-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5',
        className
      )}
    >
      <div className="flex gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-card-foreground">
            {ORDER_CHECKLIST_COPY.banner.title}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {ORDER_CHECKLIST_COPY.banner.body}
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 py-0 text-xs text-brand-primary"
            onClick={dismiss}
          >
            {ORDER_CHECKLIST_COPY.banner.dismiss}
          </Button>
        </div>
      </div>
    </div>
  );
}
