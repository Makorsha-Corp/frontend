import React from 'react';
import { useTranslation } from 'react-i18next';
import { ItemTagInfo } from '@/types/item';
import { Badge } from '@/components/ui/badge';
import { displayItemTagName } from '@/i18n/itemTagLabels';
import type { UiLanguage } from '@/i18n/uiLanguage';

interface ItemTagBadgeProps {
  tag: ItemTagInfo;
  size?: 'sm' | 'md';
}

const ItemTagBadge: React.FC<ItemTagBadgeProps> = ({ tag, size = 'sm' }) => {
  const { t, i18n } = useTranslation('misc');
  const bgColor = tag.color || '#9067c6';
  const label = displayItemTagName(tag, t, i18n.language as UiLanguage);

  return (
    <Badge
      style={{ backgroundColor: bgColor }}
      className={`text-white ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}
    >
      {label}
    </Badge>
  );
};

export default ItemTagBadge;
