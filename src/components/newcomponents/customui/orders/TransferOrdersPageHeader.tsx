import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import OrderHubShellHeader from '@/components/newcomponents/customui/orders/OrderHubShellHeader';

export interface TransferOrdersPageHeaderProps {
  selectedOrderNumber: string | null;
  onClearSelection: () => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onAdd: () => void;
  headerToolbarExtras?: React.ReactNode;
}

const TransferOrdersPageHeader: React.FC<TransferOrdersPageHeaderProps> = ({
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
      icon={ArrowLeftRight}
      title={t('transferTitle')}
      selectedOrderLabel={selectedOrderNumber}
      onClearSelection={onClearSelection}
      backAriaLabel={t('backToTransferAria')}
      closeSelectionAriaLabel={t('closeTransferAria')}
      searchInput={searchInput}
      onSearchInputChange={onSearchInputChange}
      searchPlaceholder={t('searchTransferPlaceholder')}
      searchAriaLabel={t('searchTransferAria')}
      onAdd={onAdd}
      addButtonLabel={t('addTransferOrder')}
      addAriaLabel={t('addTransferAria')}
      helpGuideKind="transfer"
      headerToolbarExtras={headerToolbarExtras}
    />
  );
};

export default TransferOrdersPageHeader;
