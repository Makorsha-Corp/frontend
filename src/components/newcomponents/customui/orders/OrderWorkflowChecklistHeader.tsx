import { CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';
import { ORDER_CHECKLIST_COPY } from './orderChecklistCopy';

export interface OrderWorkflowChecklistHeaderProps {
  title: string;
  showSubtitle?: boolean;
  className?: string;
}

export function OrderWorkflowChecklistHeader({
  title,
  showSubtitle = true,
  className,
}: OrderWorkflowChecklistHeaderProps) {
  return (
    <CardHeader className={cn('pb-4 shrink-0', className)}>
      <CardTitle className="text-base flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        {title}
      </CardTitle>
      {showSubtitle ? (
        <p className="text-sm text-muted-foreground mt-1">{ORDER_CHECKLIST_COPY.subtitle}</p>
      ) : null}
    </CardHeader>
  );
}
