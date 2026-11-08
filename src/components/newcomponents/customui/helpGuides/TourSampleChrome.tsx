import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HELP_GUIDE_SAMPLE_ROW_ATTR } from '@/features/helpGuides/helpGuideSession';

export interface TourSampleListRowProps {
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
}

export const TourSampleListRow: React.FC<TourSampleListRowProps> = ({
  title,
  subtitle,
  selected,
  onSelect,
}) => (
  <button
    type="button"
    data-help-tour={HELP_GUIDE_SAMPLE_ROW_ATTR}
    onClick={onSelect}
    className={cn(
      'flex w-full flex-col items-start gap-1 border-b border-dashed border-brand-primary/40 bg-brand-primary/5 px-4 py-3 text-left',
      selected && 'border-l-2 border-l-brand-primary bg-brand-primary/10',
    )}
  >
    <span className="flex items-center gap-2">
      <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wide">
        Sample
      </Badge>
      <span className="text-sm font-medium text-card-foreground">{title}</span>
    </span>
    <span className="text-xs text-muted-foreground">{subtitle}</span>
  </button>
);

export interface TourSampleSection {
  id: string;
  title: string;
  body: string;
}

export interface TourSampleDetailProps {
  helpTour: string;
  title: string;
  sections: TourSampleSection[];
}

/** Local preview only. No API reads or writes. */
export const TourSampleDetail: React.FC<TourSampleDetailProps> = ({ helpTour, title, sections }) => (
  <div data-help-tour={helpTour} className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-6">
    <div className="flex items-center gap-2">
      <Badge variant="secondary">Sample</Badge>
      <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
    </div>
    <p className="text-sm text-muted-foreground">
      Preview for this walkthrough. It is not saved and does not change orders, counts, or inventory.
    </p>
    {sections.map((section) => (
      <section key={section.id} id={section.id} className="rounded-md border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground">{section.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{section.body}</p>
      </section>
    ))}
    <section id="order-discussion" className="rounded-md border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-card-foreground">Discussion and files</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Team notes and attachments would show here on a real order.
      </p>
    </section>
  </div>
);
