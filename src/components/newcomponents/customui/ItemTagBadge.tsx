import React from 'react';
import { ItemTagInfo } from '@/types/item';
import { Badge } from '@/components/ui/badge';

interface ItemTagBadgeProps {
  tag: ItemTagInfo;
  size?: 'sm' | 'md';
}

const ItemTagBadge: React.FC<ItemTagBadgeProps> = ({ tag, size = 'sm' }) => {
  const bgColor = tag.color || '#9067c6';
  
  return (
    <Badge
      style={{ backgroundColor: bgColor }}
      className={`text-white ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}
    >
      {tag.icon && <span className="mr-1">{tag.icon}</span>}
      {tag.name}
    </Badge>
  );
};

export default ItemTagBadge;
