import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  ArrowLeftRight,
  CreditCard,
  FolderKanban,
  Layers,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardQuickActionsStripProps {
  isOwner?: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Create PO', href: '/orders/purchase', icon: ShoppingCart },
  { label: 'New transfer', href: '/orders/transfer', icon: ArrowLeftRight },
  { label: 'Log expense', href: '/orders/expense', icon: CreditCard },
  { label: 'New project', href: '/project', icon: FolderKanban },
  { label: 'Start batch', href: '/production', icon: Layers },
] as const;

const DashboardQuickActionsStrip: React.FC<DashboardQuickActionsStripProps> = ({ isOwner }) => {
  const actions = isOwner
    ? [...QUICK_ACTIONS, { label: 'Invite member', href: '/management', icon: UserPlus }]
    : QUICK_ACTIONS;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, href, icon: Icon }) => (
        <Button key={label} variant="outline" size="sm" className="border-border bg-card" asChild>
          <Link to={href}>
            <Icon className="mr-1.5 h-4 w-4" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  );
};

export default DashboardQuickActionsStrip;
