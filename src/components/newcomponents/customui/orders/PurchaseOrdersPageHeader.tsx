import React from 'react';
import { ShoppingCart } from 'lucide-react';

import OrderHubShellHeader from '@/components/newcomponents/customui/orders/OrderHubShellHeader';

export interface PurchaseOrdersPageHeaderProps {
  selectedOrderNumber: string | null;
  onClearSelection: () => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onAdd: () => void;
}

const PurchaseOrdersPageHeader: React.FC<PurchaseOrdersPageHeaderProps> = ({
  selectedOrderNumber,
  onClearSelection,
  searchInput,
  onSearchInputChange,
  onAdd,
}) => (
  <OrderHubShellHeader
    icon={ShoppingCart}
    title="Purchase Orders"
    selectedOrderLabel={selectedOrderNumber}
    onClearSelection={onClearSelection}
    backAriaLabel="Back to purchase orders"
    closeSelectionAriaLabel="Close purchase order"
    searchInput={searchInput}
    onSearchInputChange={onSearchInputChange}
    searchPlaceholder="Search by PO# or supplier..."
    searchAriaLabel="Search purchase orders"
    onAdd={onAdd}
    addButtonLabel="Add Purchase Order"
    addAriaLabel="Add purchase order"
  />
);

export default PurchaseOrdersPageHeader;
