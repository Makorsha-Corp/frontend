import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getProjectLayoutOption, type ProjectLayoutMode } from './projectLayoutModes';

interface LayoutPreviewBadgeProps {
  layout: ProjectLayoutMode;
}

const LayoutPreviewBadge: React.FC<LayoutPreviewBadgeProps> = ({ layout }) => {
  if (layout === 'classic') return null;
  const option = getProjectLayoutOption(layout);
  return (
    <div className="shrink-0 px-1 pb-2">
      <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
        Layout preview · {option.label}
      </Badge>
    </div>
  );
};

export default LayoutPreviewBadge;
