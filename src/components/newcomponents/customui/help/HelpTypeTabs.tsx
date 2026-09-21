import React from 'react';
import { LifeBuoy, MessageSquare } from 'lucide-react';

import AppShellHeaderEmphasisTabs from '@/components/newcomponents/customui/AppShellHeaderEmphasisTabs';
import type { HelpTicketType } from '@/types/helpTicket';

const HELP_TYPE_TABS = [
  { value: 'support', label: 'Support', icon: LifeBuoy },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare },
] as const;

interface HelpTypeTabsProps {
  value: HelpTicketType;
  onValueChange: (value: HelpTicketType) => void;
  className?: string;
  compact?: boolean;
}

const HelpTypeTabs: React.FC<HelpTypeTabsProps> = ({
  value,
  onValueChange,
  className,
  compact = false,
}) => (
  <AppShellHeaderEmphasisTabs
    value={value}
    onValueChange={(nextValue) => onValueChange(nextValue as HelpTicketType)}
    tabs={[...HELP_TYPE_TABS]}
    layoutId="help-type-tabs"
    width="help"
    className={className}
    compact={compact}
  />
);

export default HelpTypeTabs;
