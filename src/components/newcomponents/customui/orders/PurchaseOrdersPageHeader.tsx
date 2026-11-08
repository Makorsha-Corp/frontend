import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import OrderHubShellHeader from '@/components/newcomponents/customui/orders/OrderHubShellHeader';

export interface PurchaseOrdersPageHeaderProps {
  selectedOrderNumber: string | null;
  onClearSelection: () => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onAdd: () => void;
  headerToolbarExtras?: React.ReactNode;
}

const PurchaseOrdersPageHeader: React.FC<PurchaseOrdersPageHeaderProps> = ({
  selectedOrderNumber,
  onClearSelection,
  searchInput,
  onSearchInputChange,
  onAdd,
  headerToolbarExtras,
}) => {
  const { t } = useTranslation('orders');

  return (
    <OrderHubShellHeader
      icon={ShoppingCart}
      title={t('purchaseTitle')}
      selectedOrderLabel={selectedOrderNumber}
      onClearSelection={onClearSelection}
      backAriaLabel={t('backToPurchaseAria')}
      closeSelectionAriaLabel={t('closePurchaseAria')}
      searchInput={searchInput}
      onSearchInputChange={onSearchInputChange}
      searchPlaceholder={t('searchPurchasePlaceholder')}
      searchAriaLabel={t('searchPurchaseAria')}
      onAdd={onAdd}
      addButtonLabel={t('addPurchaseOrder')}
      addAriaLabel={t('addPurchaseAria')}
      helpGuideKind="purchase"
      headerToolbarExtras={headerToolbarExtras}
    />
  );
};

export default PurchaseOrdersPageHeader;
