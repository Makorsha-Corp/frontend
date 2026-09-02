import { Edit3, Eraser, PencilLine, type LucideIcon } from 'lucide-react';

export interface MarkupEventVisual {
  icon: LucideIcon;
  wrap: string;
  color: string;
}

export const MARKUP_EVENT_VISUALS: Record<string, MarkupEventVisual> = {
  markup_saved: {
    icon: PencilLine,
    wrap: 'bg-brand-primary/10',
    color: 'text-brand-primary',
  },
  markup_updated: {
    icon: Edit3,
    wrap: 'bg-blue-100 dark:bg-blue-900/30',
    color: 'text-blue-600 dark:text-blue-400',
  },
  markup_cleared: {
    icon: Eraser,
    wrap: 'bg-red-100 dark:bg-red-900/30',
    color: 'text-red-600 dark:text-red-400',
  },
  default: {
    icon: PencilLine,
    wrap: 'bg-muted',
    color: 'text-muted-foreground',
  },
};
