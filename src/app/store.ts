import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '@/features/auth/authSlice';
import { authApi } from '@/features/auth/authApi';
import { workspaceApi } from '@/features/workspaces/workspaceApi';
import { itemsApi } from '@/features/items/itemsApi';
import { itemTagsApi } from '@/features/items/itemTagsApi';
import { accountsApi } from '@/features/accounts/accountsApi';
import { accountTagsApi } from '@/features/accounts/accountTagsApi';
import { accountInvoicesApi } from '@/features/accountInvoices/accountInvoicesApi';
import { invoicePaymentsApi } from '@/features/invoicePayments/invoicePaymentsApi';
import { financialAuditLogsApi } from '@/features/financialAuditLogs/financialAuditLogsApi';
import { factoriesApi } from '@/features/factories/factoriesApi';
import { factorySectionsApi } from '@/features/factorySections/factorySectionsApi';
import { departmentsApi } from '@/features/departments/departmentsApi';
import { projectsApi } from '@/features/projects/projectsApi';
import { projectComponentsApi } from '@/features/projectComponents/projectComponentsApi';
import { projectComponentItemsApi } from '@/features/projectComponentItems/projectComponentItemsApi';
import { projectComponentTasksApi } from '@/features/projectComponentTasks/projectComponentTasksApi';
import { miscellaneousProjectCostsApi } from '@/features/miscellaneousProjectCosts/miscellaneousProjectCostsApi';
import { ledgersApi } from '@/features/ledgers/ledgersApi';
import { salesOrdersApi } from '@/features/salesOrders/salesOrdersApi';
import { salesDeliveriesApi } from '@/features/salesDeliveries/salesDeliveriesApi';
import { machinesApi } from '@/features/machines/machinesApi';
import { machineItemsApi } from '@/features/machineItems/machineItemsApi';
import { machineMaintenanceLogsApi } from '@/features/machineMaintenanceLogs/machineMaintenanceLogsApi';
import { productionApi } from '@/features/production/productionApi';
import { inventoryApi } from '@/features/inventory/inventoryApi';
import { productsApi } from '@/features/products/productsApi';
import { workOrdersApi } from '@/features/workOrders/workOrdersApi';
import { purchaseOrdersApi } from '@/features/purchaseOrders/purchaseOrdersApi';
import { transferOrdersApi } from '@/features/transferOrders/transferOrdersApi';
import { expenseOrdersApi } from '@/features/expenseOrders/expenseOrdersApi';
import { orderTemplatesApi } from '@/features/orderTemplates/orderTemplatesApi';
import { statusesApi } from '@/features/statuses/statusesApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [workspaceApi.reducerPath]: workspaceApi.reducer,
    [itemsApi.reducerPath]: itemsApi.reducer,
    [itemTagsApi.reducerPath]: itemTagsApi.reducer,
    [accountsApi.reducerPath]: accountsApi.reducer,
    [accountTagsApi.reducerPath]: accountTagsApi.reducer,
    [accountInvoicesApi.reducerPath]: accountInvoicesApi.reducer,
    [invoicePaymentsApi.reducerPath]: invoicePaymentsApi.reducer,
    [financialAuditLogsApi.reducerPath]: financialAuditLogsApi.reducer,
    [factoriesApi.reducerPath]: factoriesApi.reducer,
    [factorySectionsApi.reducerPath]: factorySectionsApi.reducer,
    [departmentsApi.reducerPath]: departmentsApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [projectComponentsApi.reducerPath]: projectComponentsApi.reducer,
    [projectComponentItemsApi.reducerPath]: projectComponentItemsApi.reducer,
    [projectComponentTasksApi.reducerPath]: projectComponentTasksApi.reducer,
    [miscellaneousProjectCostsApi.reducerPath]: miscellaneousProjectCostsApi.reducer,
    [ledgersApi.reducerPath]: ledgersApi.reducer,
    [salesOrdersApi.reducerPath]: salesOrdersApi.reducer,
    [salesDeliveriesApi.reducerPath]: salesDeliveriesApi.reducer,
    [machinesApi.reducerPath]: machinesApi.reducer,
    [machineItemsApi.reducerPath]: machineItemsApi.reducer,
    [machineMaintenanceLogsApi.reducerPath]: machineMaintenanceLogsApi.reducer,
    [productionApi.reducerPath]: productionApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [workOrdersApi.reducerPath]: workOrdersApi.reducer,
    [purchaseOrdersApi.reducerPath]: purchaseOrdersApi.reducer,
    [transferOrdersApi.reducerPath]: transferOrdersApi.reducer,
    [expenseOrdersApi.reducerPath]: expenseOrdersApi.reducer,
    [orderTemplatesApi.reducerPath]: orderTemplatesApi.reducer,
    [statusesApi.reducerPath]: statusesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      workspaceApi.middleware,
      itemsApi.middleware,
      itemTagsApi.middleware,
      accountsApi.middleware,
      accountTagsApi.middleware,
      accountInvoicesApi.middleware,
      invoicePaymentsApi.middleware,
      financialAuditLogsApi.middleware,
      factoriesApi.middleware,
      factorySectionsApi.middleware,
      departmentsApi.middleware,
      projectsApi.middleware,
      projectComponentsApi.middleware,
      projectComponentItemsApi.middleware,
      projectComponentTasksApi.middleware,
      miscellaneousProjectCostsApi.middleware,
      ledgersApi.middleware,
      salesOrdersApi.middleware,
      salesDeliveriesApi.middleware,
      machinesApi.middleware,
      machineItemsApi.middleware,
      machineMaintenanceLogsApi.middleware,
      productionApi.middleware,
      inventoryApi.middleware,
      productsApi.middleware,
      workOrdersApi.middleware,
      purchaseOrdersApi.middleware,
      transferOrdersApi.middleware,
      expenseOrdersApi.middleware,
      orderTemplatesApi.middleware,
      statusesApi.middleware,
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
