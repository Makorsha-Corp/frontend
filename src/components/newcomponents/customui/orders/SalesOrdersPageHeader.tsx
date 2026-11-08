import React from 'react';
import { ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import OrderHubShellHeader from '@/components/newcomponents/customui/orders/OrderHubShellHeader';

export interface SalesOrdersPageHeaderProps {
  selectedOrderNumber: string | null;
  onClearSelection: () => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onAdd: () => void;
}

const SalesOrdersPageHeader: React.FC<SalesOrdersPageHeaderProps> = ({
  selectedOrderNumber,
  onClearSelection,
  searchInput,
  onSearchInputChange,
  onAdd,
}) => {
  const { t } = useTranslation('orders');

  return (
    <OrderHubShellHeader
      icon={ClipboardList}
      title={t('salesTitle')}
      selectedOrderLabel={selectedOrderNumber}
      onClearSelection={onClearSelection}
      backAriaLabel={t('backToSalesAria')}
      closeSelectionAriaLabel={t('closeSalesAria')}
      searchInput={searchInput}
      onSearchInputChange={onSearchInputChange}
      searchPlaceholder={t('searchSalesPlaceholder')}
      searchAriaLabel={t('searchSalesAria')}
      onAdd={onAdd}
      addButtonLabel={t('addSalesOrder')}
      addAriaLabel={t('addSalesAria')}
    />
  );
};

export default SalesOrdersPageHeader;
