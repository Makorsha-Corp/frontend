import type { AppDispatch } from '@/app/store';
import { accountInvoicesApi } from '@/features/accountInvoices/accountInvoicesApi';
import { expenseOrdersApi } from '@/features/expenseOrders/expenseOrdersApi';
import { machinesApi } from '@/features/machines/machinesApi';
import { projectsApi } from '@/features/projects/projectsApi';
import { purchaseOrdersApi } from '@/features/purchaseOrders/purchaseOrdersApi';
import { salesOrdersApi } from '@/features/salesOrders/salesOrdersApi';
import { transferOrdersApi } from '@/features/transferOrders/transferOrdersApi';
import { workOrdersApi } from '@/features/workOrders/workOrdersApi';
import type { AttachmentEntityType } from '@/types/attachment';

export function invalidateAttachmentEntityEvents(
  dispatch: AppDispatch,
  entityType: AttachmentEntityType,
  entityId: number,
): void {
  switch (entityType) {
    case 'purchase_order':
      dispatch(
        purchaseOrdersApi.util.invalidateTags([{ type: 'PurchaseOrderEvents', id: entityId }]),
      );
      break;
    case 'sales_order':
      dispatch(
        salesOrdersApi.util.invalidateTags([{ type: 'SalesOrderEvents', id: entityId }]),
      );
      break;
    case 'expense_order':
      dispatch(
        expenseOrdersApi.util.invalidateTags([{ type: 'ExpenseOrderEvents', id: entityId }]),
      );
      break;
    case 'transfer_order':
      dispatch(
        transferOrdersApi.util.invalidateTags([{ type: 'TransferOrderEvents', id: entityId }]),
      );
      break;
    case 'work_order':
      dispatch(
        workOrdersApi.util.invalidateTags([{ type: 'WorkOrderEvents', id: entityId }]),
      );
      break;
    case 'project':
      dispatch(
        projectsApi.util.invalidateTags([{ type: 'ProjectEvents', id: entityId }]),
      );
      break;
    case 'account_invoice':
      dispatch(
        accountInvoicesApi.util.invalidateTags([{ type: 'InvoiceEvent', id: entityId }]),
      );
      break;
    case 'machine':
      dispatch(
        machinesApi.util.invalidateTags([{ type: 'MachineActivity', id: entityId }]),
      );
      break;
    case 'project_component':
    case 'item':
    case 'scratch':
    case 'support_ticket':
      break;
    default:
      break;
  }
}

export function invalidateAttachmentEntityEventsFromLinks(
  dispatch: AppDispatch,
  links: Array<{ entity_type: AttachmentEntityType; entity_id: number }>,
): void {
  for (const link of links) {
    invalidateAttachmentEntityEvents(dispatch, link.entity_type, link.entity_id);
  }
}
