import { useCallback, useState } from 'react';
import {
  DEFAULT_ORDERS_OVERVIEW_LAYOUT,
  persistOrdersOverviewLayout,
  readOrdersOverviewLayoutFromStorage,
  type OrdersOverviewKpiStyle,
  type OrdersOverviewLayoutPreviewState,
  type OrdersOverviewPageStructure,
  type OrdersOverviewFactoryDisplayStyle,
  type OrdersOverviewStatusDisplayStyle,
  type OrdersOverviewTypeNavStyle,
} from '@/components/newcomponents/customui/orders/overview/ordersOverviewLayoutModes';

export function useOrdersOverviewLayoutPreview() {
  const [layout, setLayoutState] = useState<OrdersOverviewLayoutPreviewState>(() =>
    readOrdersOverviewLayoutFromStorage()
  );

  const applyLayout = useCallback((next: OrdersOverviewLayoutPreviewState) => {
    setLayoutState(next);
    persistOrdersOverviewLayout(next);
  }, []);

  const setKpiStyle = useCallback(
    (kpiStyle: OrdersOverviewKpiStyle) => {
      setLayoutState((prev) => {
        const next = { ...prev, kpiStyle };
        persistOrdersOverviewLayout(next);
        return next;
      });
    },
    []
  );

  const setTypeNavStyle = useCallback(
    (typeNavStyle: OrdersOverviewTypeNavStyle) => {
      setLayoutState((prev) => {
        const next = { ...prev, typeNavStyle };
        persistOrdersOverviewLayout(next);
        return next;
      });
    },
    []
  );

  const setPageStructure = useCallback(
    (pageStructure: OrdersOverviewPageStructure) => {
      setLayoutState((prev) => {
        const next = { ...prev, pageStructure };
        persistOrdersOverviewLayout(next);
        return next;
      });
    },
    []
  );

  const setStatusDisplayStyle = useCallback(
    (statusDisplayStyle: OrdersOverviewStatusDisplayStyle) => {
      setLayoutState((prev) => {
        const next = { ...prev, statusDisplayStyle };
        persistOrdersOverviewLayout(next);
        return next;
      });
    },
    []
  );

  const setFactoryDisplayStyle = useCallback(
    (factoryDisplayStyle: OrdersOverviewFactoryDisplayStyle) => {
      setLayoutState((prev) => {
        const next = { ...prev, factoryDisplayStyle };
        persistOrdersOverviewLayout(next);
        return next;
      });
    },
    []
  );

  const resetLayout = useCallback(() => applyLayout(DEFAULT_ORDERS_OVERVIEW_LAYOUT), [applyLayout]);

  return {
    layout,
    setKpiStyle,
    setTypeNavStyle,
    setPageStructure,
    setStatusDisplayStyle,
    setFactoryDisplayStyle,
    resetLayout,
  };
}
