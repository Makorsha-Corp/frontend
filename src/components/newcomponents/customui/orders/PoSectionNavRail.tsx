import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PoMilestoneState } from './purchaseOrderMilestones';

export interface PoSectionNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  state: PoMilestoneState;
  onClick: () => void;
}

export interface PoSectionNavRailProps {
  sections: PoSectionNavItem[];
  activeSectionId: string | null;
  className?: string;
}

function circleClasses(state: PoMilestoneState, isActive: boolean): string {
  return cn(
    'relative z-10 flex shrink-0 items-center justify-center rounded-full transition-all duration-300',
    isActive ? 'h-10 w-10' : 'h-8 w-8',
    state === 'complete' && 'bg-green-600 text-white shadow-sm dark:bg-green-600',
    state === 'partial' &&
      'border-2 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    state === 'pending' &&
      'border-2 border-muted-foreground/30 bg-background text-muted-foreground',
    isActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
  );
}

function NavIconButton({
  section,
  isActive,
}: {
  section: PoSectionNavItem;
  isActive: boolean;
}) {
  const Icon = section.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={section.onClick}
          className="rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={section.label}
          aria-current={isActive ? 'location' : undefined}
        >
          <div className={circleClasses(section.state, isActive)}>
            <Icon className={cn(isActive ? 'h-[18px] w-[18px]' : 'h-4 w-4')} strokeWidth={2} />
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {section.label}
      </TooltipContent>
    </Tooltip>
  );
}

const PoSectionNavRail: React.FC<PoSectionNavRailProps> = ({
  sections,
  activeSectionId,
  className,
}) => (
  <TooltipProvider delayDuration={150}>
    <nav
      className={cn(
        'flex min-h-0 flex-col items-center px-1',
        className
      )}
      aria-label="Section navigation"
    >
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          {index > 0 && (
            <div className="w-px min-h-2 flex-1 shrink bg-muted-foreground/15" aria-hidden />
          )}
          <NavIconButton
            section={section}
            isActive={activeSectionId === section.id}
          />
        </React.Fragment>
      ))}
    </nav>
  </TooltipProvider>
);

export default PoSectionNavRail;
