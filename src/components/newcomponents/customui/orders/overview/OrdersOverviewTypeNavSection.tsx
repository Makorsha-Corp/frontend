import React from 'react';
import type { OrdersOverviewTypeNavStyle } from '../../ordersOverviewLayoutModes';
import type { CountsByTypeRow } from '@/pages/newpages/orders/ordersOverviewData';
import HubTypeCards from './variants/hubs/HubTypeCards';
import HubSegmentedNav from './variants/hubs/HubSegmentedNav';
import HubCompactList from './variants/hubs/HubCompactList';
import HubIconRail from './variants/hubs/HubIconRail';

interface OrdersOverviewTypeNavSectionProps {
  typeNavStyle: OrdersOverviewTypeNavStyle;
  countsByType: CountsByTypeRow[];
}

const OrdersOverviewTypeNavSection: React.FC<OrdersOverviewTypeNavSectionProps> = ({
  typeNavStyle,
  countsByType,
}) => {
  switch (typeNavStyle) {
    case 'segmented-nav':
      return <HubSegmentedNav countsByType={countsByType} />;
    case 'compact-list':
      return <HubCompactList countsByType={countsByType} />;
    case 'icon-rail':
      return <HubIconRail countsByType={countsByType} />;
    case 'hidden':
      return null;
    case 'cards':
    default:
      return <HubTypeCards countsByType={countsByType} />;
  }
};

export default OrdersOverviewTypeNavSection;
