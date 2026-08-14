import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface NavCollapsibleTriggerRowProps {
  expanded: boolean;
  isActive: boolean;
  title: string;
  label: string;
  icon: React.ReactNode;
  onToggle: () => void;
  inactiveClass: string;
  /** Optional trailing control (e.g. factory picker). Clicks do not toggle the section. */
  trailing?: React.ReactNode;
}

/**
 * Row click when section inactive → expand + run selectSection (navigate).
 * Row click when section active → toggle expand/collapse.
 * Chevron always toggles via CollapsibleTrigger (independent of active state).
 */
export function handleNavSectionRowClick(
  isSectionActive: boolean,
  sectionExpanded: boolean,
  setSectionExpanded: (open: boolean) => void,
  selectSection: () => void,
) {
  if (!isSectionActive) {
    setSectionExpanded(true);
    selectSection();
    return;
  }
  setSectionExpanded(!sectionExpanded);
}

/**
 * Full-width navbar collapsible header — click anywhere on the row to expand/collapse.
 * Chevron toggles independently; optional trailing slot for secondary actions.
 */
const NavCollapsibleTriggerRow: React.FC<NavCollapsibleTriggerRowProps> = ({
  expanded,
  isActive,
  title,
  label,
  icon,
  onToggle,
  inactiveClass,
  trailing,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      title={title}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-lg px-4 py-3 transition-all',
        isActive ? 'bg-brand-primary text-white' : inactiveClass,
      )}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {trailing ? (
        <div
          className="shrink-0"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {trailing}
        </div>
      ) : null}
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="shrink-0 p-1 text-white/80"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </CollapsibleTrigger>
    </div>
  );
};

export default NavCollapsibleTriggerRow;
