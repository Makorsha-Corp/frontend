import React from 'react';
import { Receipt } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import OrderHubShellHeader from '@/components/newcomponents/customui/orders/OrderHubShellHeader';

export interface ExpenseOrdersPageHeaderProps {
  selectedOrderNumber: string | null;
  onClearSelection: () => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onAdd: () => void;
  headerToolbarLeading?: React.ReactNode;
  headerToolbarExtras?: React.ReactNode;
}

const ExpenseOrdersPageHeader: React.FC<ExpenseOrdersPageHeaderProps> = ({
  selectedOrderNumber,
  onClearSelection,
  searchInput,
  onSearchInputChange,
  onAdd,
  headerToolbarLeading,
  headerToolbarExtras,
}) => {
  const { t } = useTranslation('orders');

  return (
    <OrderHubShellHeader
      icon={Receipt}
      title={t('expenseTitle')}
      selectedOrderLabel={selectedOrderNumber}
      onClearSelection={onClearSelection}
      backAriaLabel={t('backToExpenseAria')}
      closeSelectionAriaLabel={t('closeExpenseAria')}
      searchInput={searchInput}
      onSearchInputChange={onSearchInputChange}
      searchPlaceholder={t('searchExpensePlaceholder')}
      searchAriaLabel={t('searchExpenseAria')}
      onAdd={onAdd}
      addButtonLabel={t('addExpenseOrder')}
      addAriaLabel={t('addExpenseAria')}
      helpGuideKind="expense"
      headerToolbarLeading={headerToolbarLeading}
      headerToolbarExtras={headerToolbarExtras}
    />
  );
};

export default ExpenseOrdersPageHeader;
