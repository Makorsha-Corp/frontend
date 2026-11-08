import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const DashboardQuickActionsStrip: React.FC<DashboardQuickActionsStripProps> = ({ isOwner }) => {
  const { t } = useTranslation('dashboard');

  const actions = useMemo(() => {
    const base = [
      { id: 'po', label: t('quickCreatePo'), href: '/orders/purchase', icon: ShoppingCart },
      { id: 'transfer', label: t('quickNewTransfer'), href: '/orders/transfer', icon: ArrowLeftRight },
      { id: 'expense', label: t('quickLogExpense'), href: '/orders/expense', icon: CreditCard },
      { id: 'project', label: t('quickNewProject'), href: '/project', icon: FolderKanban },
      { id: 'batch', label: t('quickStartBatch'), href: '/production', icon: Layers },
    ] as const;
    return isOwner
      ? [...base, { id: 'invite', label: t('quickInviteMember'), href: '/management', icon: UserPlus }]
      : [...base];
  }, [isOwner, t]);

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ id, label, href, icon: Icon }) => (
        <Button key={id} variant="outline" size="sm" className="border-border bg-card" asChild>
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
