/**
 * Drop all workspace-scoped RTK caches when the active workspace changes.
 *
 * Query args usually omit workspace id (it lives in X-Workspace-ID). Without a
 * reset, lists keep the previous workspace's rows and detail fetches 404.
 */
import type { AppDispatch } from '@/app/store';
import { accountInvoicesApi } from '@/features/accountInvoices/accountInvoicesApi';
import { accountTagsApi } from '@/features/accounts/accountTagsApi';
import { accountsApi } from '@/features/accounts/accountsApi';
import { attachmentsApi } from '@/features/attachments/attachmentsApi';
import { calendarApi } from '@/features/calendar/calendarApi';
import { deliveryMethodsApi } from '@/features/deliveryMethods/deliveryMethodsApi';
import { departmentsApi } from '@/features/departments/departmentsApi';
import { discussionsApi } from '@/features/discussions/discussionsApi';
import { expenseOrdersApi } from '@/features/expenseOrders/expenseOrdersApi';
import { factoriesApi } from '@/features/factories/factoriesApi';
import { factorySectionsApi } from '@/features/factorySections/factorySectionsApi';
import { financialAuditLogsApi } from '@/features/financialAuditLogs/financialAuditLogsApi';
import { helpTicketsApi } from '@/features/helpTickets/helpTicketsApi';
import { inventoryApi } from '@/features/inventory/inventoryApi';
import { invoicePaymentsApi } from '@/features/invoicePayments/invoicePaymentsApi';
import { itemTagsApi } from '@/features/items/itemTagsApi';
import { itemsApi } from '@/features/items/itemsApi';
import { ledgersApi } from '@/features/ledgers/ledgersApi';
import { machineItemsApi } from '@/features/machineItems/machineItemsApi';
import { machineMaintenanceLogsApi } from '@/features/machineMaintenanceLogs/machineMaintenanceLogsApi';
import { machinesApi } from '@/features/machines/machinesApi';
import { miscellaneousProjectCostsApi } from '@/features/miscellaneousProjectCosts/miscellaneousProjectCostsApi';
import { mobileUploadApi } from '@/features/mobileUpload/mobileUploadApi';
import { notificationsApi } from '@/features/notifications/notificationsApi';
import { orderTemplatesApi } from '@/features/orderTemplates/orderTemplatesApi';
import { ordersOverviewApi } from '@/features/orders/ordersOverviewApi';
import { paymentsApi } from '@/features/payments/paymentsApi';
import { productionApi } from '@/features/production/productionApi';
import { productsApi } from '@/features/products/productsApi';
import { projectComponentItemsApi } from '@/features/projectComponentItems/projectComponentItemsApi';
import { projectComponentNotesApi } from '@/features/projectComponentNotes/projectComponentNotesApi';
import { projectComponentTasksApi } from '@/features/projectComponentTasks/projectComponentTasksApi';
import { projectComponentsApi } from '@/features/projectComponents/projectComponentsApi';
import { projectsApi } from '@/features/projects/projectsApi';
import { purchaseOrdersApi } from '@/features/purchaseOrders/purchaseOrdersApi';
import { salesDeliveriesApi } from '@/features/salesDeliveries/salesDeliveriesApi';
import { salesOrdersApi } from '@/features/salesOrders/salesOrdersApi';
import { statusesApi } from '@/features/statuses/statusesApi';
import { transferOrdersApi } from '@/features/transferOrders/transferOrdersApi';
import { workOrderTemplatesApi } from '@/features/workOrderTemplates/workOrderTemplatesApi';
import { workOrderTypesApi } from '@/features/workOrderTypes/workOrderTypesApi';
import { workOrdersApi } from '@/features/workOrders/workOrdersApi';

const workspaceScopedApis = [
  itemsApi,
  itemTagsApi,
  accountsApi,
  accountTagsApi,
  accountInvoicesApi,
  invoicePaymentsApi,
  financialAuditLogsApi,
  factoriesApi,
  factorySectionsApi,
  departmentsApi,
  projectsApi,
  projectComponentsApi,
  projectComponentItemsApi,
  projectComponentTasksApi,
  projectComponentNotesApi,
  miscellaneousProjectCostsApi,
  ledgersApi,
  salesOrdersApi,
  salesDeliveriesApi,
  deliveryMethodsApi,
  machinesApi,
  machineItemsApi,
  machineMaintenanceLogsApi,
  productionApi,
  inventoryApi,
  productsApi,
  workOrdersApi,
  workOrderTypesApi,
  workOrderTemplatesApi,
  purchaseOrdersApi,
  transferOrdersApi,
  expenseOrdersApi,
  orderTemplatesApi,
  statusesApi,
  ordersOverviewApi,
  discussionsApi,
  notificationsApi,
  paymentsApi,
  calendarApi,
  attachmentsApi,
  mobileUploadApi,
  helpTicketsApi,
] as const;

export function resetWorkspaceApiCache(dispatch: AppDispatch): void {
  for (const api of workspaceScopedApis) {
    dispatch(api.util.resetApiState());
  }
}
