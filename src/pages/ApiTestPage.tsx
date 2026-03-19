import React, { useState } from 'react';
import { useLoginMutation, useRegisterMutation } from '@/features/auth/authApi';
import { useGetWorkspacesQuery, useCreateWorkspaceMutation } from '@/features/workspaces/workspaceApi';
import { useGetItemsQuery, useCreateItemMutation, useUpdateItemMutation, useDeleteItemMutation } from '@/features/items/itemsApi';
import { useGetTagsQuery, useCreateTagMutation, useDeleteTagMutation } from '@/features/items/itemTagsApi';
import { useGetAccountsQuery, useCreateAccountMutation, useUpdateAccountMutation, useDeleteAccountMutation } from '@/features/accounts/accountsApi';
import { useGetTagsQuery as useGetAccountTagsQuery, useCreateTagMutation as useCreateAccountTagMutation, useDeleteTagMutation as useDeleteAccountTagMutation } from '@/features/accounts/accountTagsApi';
import { useGetFactoriesQuery, useCreateFactoryMutation, useUpdateFactoryMutation, useDeleteFactoryMutation } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery, useCreateFactorySectionMutation, useUpdateFactorySectionMutation, useDeleteFactorySectionMutation } from '@/features/factorySections/factorySectionsApi';
import { useGetDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentMutation, useDeleteDepartmentMutation } from '@/features/departments/departmentsApi';
import { useGetProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from '@/features/projects/projectsApi';
import { useGetProjectComponentsQuery, useCreateProjectComponentMutation, useUpdateProjectComponentMutation, useDeleteProjectComponentMutation } from '@/features/projectComponents/projectComponentsApi';
import { useGetProjectComponentItemsQuery, useCreateProjectComponentItemMutation, useUpdateProjectComponentItemMutation, useDeleteProjectComponentItemMutation } from '@/features/projectComponentItems/projectComponentItemsApi';
import { useGetProjectComponentTasksQuery, useCreateProjectComponentTaskMutation, useUpdateProjectComponentTaskMutation, useDeleteProjectComponentTaskMutation } from '@/features/projectComponentTasks/projectComponentTasksApi';
import { useGetMiscellaneousProjectCostsQuery, useCreateMiscellaneousProjectCostMutation, useUpdateMiscellaneousProjectCostMutation, useDeleteMiscellaneousProjectCostMutation } from '@/features/miscellaneousProjectCosts/miscellaneousProjectCostsApi';
import { useGetAccountInvoicesQuery, useCreateAccountInvoiceMutation, useUpdateAccountInvoiceMutation, useDeleteAccountInvoiceMutation } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetInvoicePaymentsByInvoiceQuery, useCreateInvoicePaymentMutation, useDeleteInvoicePaymentMutation } from '@/features/invoicePayments/invoicePaymentsApi';
import { useGetSalesOrdersQuery, useGetSalesOrderByIdQuery, useCreateSalesOrderMutation, useUpdateSalesOrderMutation, useGetSalesOrderItemsQuery, useGetSalesOrderDeliveriesQuery } from '@/features/salesOrders/salesOrdersApi';
import { useGetSalesDeliveriesQuery, useGetSalesDeliveryByIdQuery, useCreateSalesDeliveryMutation, useCompleteSalesDeliveryMutation, useGetSalesDeliveryItemsQuery } from '@/features/salesDeliveries/salesDeliveriesApi';
import {
  useGetProductionLinesQuery, useCreateProductionLineMutation, useUpdateProductionLineMutation, useDeleteProductionLineMutation,
  useGetProductionFormulasQuery, useCreateProductionFormulaMutation, useDeleteProductionFormulaMutation,
  useGetFormulaItemsQuery, useAddFormulaItemMutation, useRemoveFormulaItemMutation,
  useGetProductionBatchesQuery, useCreateProductionBatchMutation, useStartBatchMutation, useCompleteBatchMutation, useCancelBatchMutation,
  useGetBatchItemsQuery, useAddBatchItemMutation, useUpdateBatchItemMutation,
} from '@/features/production/productionApi';
import { useGetMachinesQuery, useCreateMachineMutation, useUpdateMachineMutation, useDeleteMachineMutation, useGetMachineEventsQuery, useCreateMachineEventMutation } from '@/features/machines/machinesApi';
import { useGetMachineItemsQuery, useCreateMachineItemMutation, useUpdateMachineItemMutation, useDeleteMachineItemMutation } from '@/features/machineItems/machineItemsApi';
import { useGetMachineMaintenanceLogsQuery, useCreateMachineMaintenanceLogMutation, useUpdateMachineMaintenanceLogMutation, useDeleteMachineMaintenanceLogMutation } from '@/features/machineMaintenanceLogs/machineMaintenanceLogsApi';
import { useGetInventoryListQuery, useCreateInventoryMutation, useUpdateInventoryMutation, useDeleteInventoryMutation, useGetInventoryLedgerQuery } from '@/features/inventory/inventoryApi';
import { useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation, useGetProductLedgerQuery } from '@/features/products/productsApi';
import { useGetWorkOrdersQuery, useCreateWorkOrderMutation, useUpdateWorkOrderMutation, useDeleteWorkOrderMutation, useGetWorkOrderItemsQuery, useAddWorkOrderItemMutation, useRemoveWorkOrderItemMutation } from '@/features/workOrders/workOrdersApi';
import { useGetPurchaseOrdersQuery, useCreatePurchaseOrderMutation, useUpdatePurchaseOrderMutation, useDeletePurchaseOrderMutation, useGetPurchaseOrderItemsQuery, useAddPurchaseOrderItemMutation, useRemovePurchaseOrderItemMutation } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetTransferOrdersQuery, useCreateTransferOrderMutation, useUpdateTransferOrderMutation, useDeleteTransferOrderMutation, useGetTransferOrderItemsQuery, useAddTransferOrderItemMutation, useRemoveTransferOrderItemMutation } from '@/features/transferOrders/transferOrdersApi';
import { useGetExpenseOrdersQuery, useCreateExpenseOrderMutation, useUpdateExpenseOrderMutation, useDeleteExpenseOrderMutation, useGetExpenseOrderItemsQuery, useAddExpenseOrderItemMutation, useRemoveExpenseOrderItemMutation } from '@/features/expenseOrders/expenseOrdersApi';
import { useGetOrderTemplatesQuery, useCreateOrderTemplateMutation, useUpdateOrderTemplateMutation, useDeleteOrderTemplateMutation, useGetOrderTemplateItemsQuery, useAddOrderTemplateItemMutation, useRemoveOrderTemplateItemMutation } from '@/features/orderTemplates/orderTemplatesApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setCredentials, setWorkspace, logout as logoutAction } from '@/features/auth/authSlice';
import toast, { Toaster } from 'react-hot-toast';
import type { Item } from '@/types/item';
import type { Account } from '@/types/account';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Department } from '@/types/department';
import type { Project } from '@/types/project';
import type { ProjectComponent } from '@/types/projectComponent';
import type { ProjectComponentItem } from '@/types/projectComponentItem';
import type { ProjectComponentTask } from '@/types/projectComponentTask';
import type { MiscellaneousProjectCost } from '@/types/miscellaneousProjectCost';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { InvoicePayment } from '@/types/invoicePayment';
import type { SalesOrder } from '@/types/salesOrder';
import type { SalesDelivery } from '@/types/salesDelivery';
import type { ProductionLine, ProductionFormula, ProductionBatch } from '@/types/production';
import type { Machine, MachineEventType } from '@/types/machine';
import type { MachineItem } from '@/types/machineItem';
import type { MachineMaintenanceLog, MaintenanceType } from '@/types/machineMaintenanceLog';
import type { Inventory, InventoryType } from '@/types/inventory';
import type { Product } from '@/types/product';
import type { WorkOrder, WorkType, WorkOrderPriority, WorkOrderStatus } from '@/types/workOrder';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import type { TransferOrder } from '@/types/transferOrder';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { OrderTemplate } from '@/types/orderTemplate';

const ApiTestPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, token, workspace, isAuthenticated } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration state
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerWorkspaceName, setRegisterWorkspaceName] = useState('');
  const [registerPosition, setRegisterPosition] = useState('');

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  // Items state
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemUnit, setItemUnit] = useState('pcs');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tag management state
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6B7280');
  const [managingTagsForItem, setManagingTagsForItem] = useState<Item | null>(null);
  const [itemTagIds, setItemTagIds] = useState<number[]>([]);

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [createWorkspace, { isLoading: isCreatingWorkspace }] = useCreateWorkspaceMutation();
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useGetWorkspacesQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Items API hooks
  const { data: items, isLoading: isLoadingItems, refetch: refetchItems } = useGetItemsQuery(
    { skip: 0, limit: 50, search: searchQuery || undefined },
    { skip: !workspace }
  );
  const [createItem, { isLoading: isCreatingItem }] = useCreateItemMutation();
  const [updateItem, { isLoading: isUpdatingItem }] = useUpdateItemMutation();
  const [deleteItem, { isLoading: isDeletingItem }] = useDeleteItemMutation();

  // Tags API hooks
  const { data: tags, isLoading: isLoadingTags } = useGetTagsQuery(undefined, {
    skip: !workspace
  });
  const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();
  const [deleteTag, { isLoading: isDeletingTag }] = useDeleteTagMutation();

  // Accounts state
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountAddress, setAccountAddress] = useState('');
  const [accountSelectedTagIds, setAccountSelectedTagIds] = useState<number[]>([]);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');

  // Account Tag management state
  const [showAccountTagManager, setShowAccountTagManager] = useState(false);
  const [newAccountTagName, setNewAccountTagName] = useState('');
  const [newAccountTagDescription, setNewAccountTagDescription] = useState('');
  const [newAccountTagColor, setNewAccountTagColor] = useState('#6B7280');

  // Accounts API hooks
  const { data: accounts, isLoading: isLoadingAccounts, refetch: refetchAccounts } = useGetAccountsQuery(
    { skip: 0, limit: 50, search: accountSearchQuery || undefined },
    { skip: !workspace }
  );
  const [createAccount, { isLoading: isCreatingAccount }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: isUpdatingAccount }] = useUpdateAccountMutation();
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();

  // Account Tags API hooks
  const { data: accountTags, isLoading: isLoadingAccountTags } = useGetAccountTagsQuery(undefined, {
    skip: !workspace
  });
  const [createAccountTag, { isLoading: isCreatingAccountTag }] = useCreateAccountTagMutation();
  const [deleteAccountTag, { isLoading: isDeletingAccountTag }] = useDeleteAccountTagMutation();

  // Factories state
  const [factoryName, setFactoryName] = useState('');
  const [factoryAbbreviation, setFactoryAbbreviation] = useState('');
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  const [factorySearchQuery, setFactorySearchQuery] = useState('');

  // Factories API hooks
  const { data: factories, isLoading: isLoadingFactories, refetch: refetchFactories } = useGetFactoriesQuery(
    { skip: 0, limit: 50, search: factorySearchQuery || undefined },
    { skip: !workspace }
  );
  const [createFactory, { isLoading: isCreatingFactory }] = useCreateFactoryMutation();
  const [updateFactory, { isLoading: isUpdatingFactory }] = useUpdateFactoryMutation();
  const [deleteFactory, { isLoading: isDeletingFactory }] = useDeleteFactoryMutation();

  // Factory Sections state
  const [sectionName, setSectionName] = useState('');
  const [sectionFactoryId, setSectionFactoryId] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<FactorySection | null>(null);
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');
  const [sectionFilterFactoryId, setSectionFilterFactoryId] = useState<number | null>(null);

  // Factory Sections API hooks
  const { data: sections, isLoading: isLoadingSections, refetch: refetchSections } = useGetFactorySectionsQuery(
    {
      skip: 0,
      limit: 50,
      search: sectionSearchQuery || undefined,
      factory_id: sectionFilterFactoryId || undefined
    },
    { skip: !workspace }
  );
  const [createSection, { isLoading: isCreatingSection }] = useCreateFactorySectionMutation();
  const [updateSection, { isLoading: isUpdatingSection }] = useUpdateFactorySectionMutation();
  const [deleteSection, { isLoading: isDeletingSection }] = useDeleteFactorySectionMutation();

  // Departments state
  const [departmentName, setDepartmentName] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState('');

  // Departments API hooks
  const { data: departments, isLoading: isLoadingDepartments, refetch: refetchDepartments } = useGetDepartmentsQuery(
    { skip: 0, limit: 50, search: departmentSearchQuery || undefined },
    { skip: !workspace }
  );
  const [createDepartment, { isLoading: isCreatingDepartment }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdatingDepartment }] = useUpdateDepartmentMutation();
  const [deleteDepartment, { isLoading: isDeletingDepartment }] = useDeleteDepartmentMutation();

  // Projects state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [projectFactoryId, setProjectFactoryId] = useState('');
  const [projectPriority, setProjectPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [projectStatus, setProjectStatus] = useState<'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'>('PLANNING');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Projects API hooks
  const { data: projects, isLoading: isLoadingProjects, refetch: refetchProjects } = useGetProjectsQuery(
    { skip: 0, limit: 50 },
    { skip: !workspace }
  );
  const [createProject, { isLoading: isCreatingProject }] = useCreateProjectMutation();
  const [updateProject, { isLoading: isUpdatingProject }] = useUpdateProjectMutation();
  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteProjectMutation();

  // Project Components state
  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentProjectId, setComponentProjectId] = useState('');
  const [componentBudget, setComponentBudget] = useState('');
  const [componentDeadline, setComponentDeadline] = useState('');
  const [componentStatus, setComponentStatus] = useState<'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'>('PLANNING');
  const [editingComponent, setEditingComponent] = useState<ProjectComponent | null>(null);
  const [filterComponentProjectId, setFilterComponentProjectId] = useState<number | null>(null);

  // Project Components API hooks
  const { data: projectComponents, isLoading: isLoadingComponents, refetch: refetchComponents } = useGetProjectComponentsQuery(
    { skip: 0, limit: 50, project_id: filterComponentProjectId || undefined },
    { skip: !workspace }
  );
  const [createComponent, { isLoading: isCreatingComponent }] = useCreateProjectComponentMutation();
  const [updateComponent, { isLoading: isUpdatingComponent }] = useUpdateProjectComponentMutation();
  const [deleteComponent, { isLoading: isDeletingComponent }] = useDeleteProjectComponentMutation();

  // Project Component Items state
  const [componentItemComponentId, setComponentItemComponentId] = useState('');
  const [componentItemItemId, setComponentItemItemId] = useState('');
  const [componentItemQty, setComponentItemQty] = useState('');
  const [editingComponentItem, setEditingComponentItem] = useState<ProjectComponentItem | null>(null);
  const [filterComponentItemComponentId, setFilterComponentItemComponentId] = useState<number | null>(null);

  // Project Component Items API hooks
  const { data: projectComponentItems, isLoading: isLoadingComponentItems, refetch: refetchComponentItems } = useGetProjectComponentItemsQuery(
    { skip: 0, limit: 50, project_component_id: filterComponentItemComponentId || undefined },
    { skip: !workspace }
  );
  const [createComponentItem, { isLoading: isCreatingComponentItem }] = useCreateProjectComponentItemMutation();
  const [updateComponentItem, { isLoading: isUpdatingComponentItem }] = useUpdateProjectComponentItemMutation();
  const [deleteComponentItem, { isLoading: isDeletingComponentItem }] = useDeleteProjectComponentItemMutation();

  // Project Component Tasks state
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskComponentId, setTaskComponentId] = useState('');
  const [taskIsNote, setTaskIsNote] = useState(false);
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [editingTask, setEditingTask] = useState<ProjectComponentTask | null>(null);
  const [filterTaskComponentId, setFilterTaskComponentId] = useState<number | null>(null);

  // Project Component Tasks API hooks
  const { data: projectComponentTasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useGetProjectComponentTasksQuery(
    { skip: 0, limit: 50, project_component_id: filterTaskComponentId || undefined },
    { skip: !workspace }
  );
  const [createTask, { isLoading: isCreatingTask }] = useCreateProjectComponentTaskMutation();
  const [updateTask, { isLoading: isUpdatingTask }] = useUpdateProjectComponentTaskMutation();
  const [deleteTask, { isLoading: isDeletingTask }] = useDeleteProjectComponentTaskMutation();

  // Miscellaneous Project Costs state
  const [costName, setCostName] = useState('');
  const [costDescription, setCostDescription] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [costProjectId, setCostProjectId] = useState('');
  const [costComponentId, setCostComponentId] = useState('');
  const [editingCost, setEditingCost] = useState<MiscellaneousProjectCost | null>(null);
  const [filterCostProjectId, setFilterCostProjectId] = useState<number | null>(null);
  const [filterCostComponentId, setFilterCostComponentId] = useState<number | null>(null);

  // Miscellaneous Project Costs API hooks
  const { data: miscellaneousCosts, isLoading: isLoadingCosts, refetch: refetchCosts } = useGetMiscellaneousProjectCostsQuery(
    {
      skip: 0,
      limit: 50,
      project_id: filterCostProjectId || undefined,
      project_component_id: filterCostComponentId || undefined
    },
    { skip: !workspace }
  );
  const [createCost, { isLoading: isCreatingCost }] = useCreateMiscellaneousProjectCostMutation();
  const [updateCost, { isLoading: isUpdatingCost }] = useUpdateMiscellaneousProjectCostMutation();
  const [deleteCost, { isLoading: isDeletingCost }] = useDeleteMiscellaneousProjectCostMutation();

  // Invoice state
  const [invoiceAccountId, setInvoiceAccountId] = useState('');
  const [invoiceType, setInvoiceType] = useState<'payable' | 'receivable'>('payable');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [editingInvoice, setEditingInvoice] = useState<AccountInvoice | null>(null);
  const [selectedInvoiceForPayments, setSelectedInvoiceForPayments] = useState<AccountInvoice | null>(null);

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Invoices API hooks
  const { data: invoices, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useGetAccountInvoicesQuery(
    { skip: 0, limit: 50 },
    { skip: !workspace }
  );
  const [createInvoice, { isLoading: isCreatingInvoice }] = useCreateAccountInvoiceMutation();
  const [updateInvoice, { isLoading: isUpdatingInvoice }] = useUpdateAccountInvoiceMutation();
  const [deleteInvoice, { isLoading: isDeletingInvoice }] = useDeleteAccountInvoiceMutation();

  // Payments API hooks
  const { data: payments, isLoading: isLoadingPayments, refetch: refetchPayments } = useGetInvoicePaymentsByInvoiceQuery(
    { invoice_id: selectedInvoiceForPayments?.id || 0 },
    { skip: !selectedInvoiceForPayments }
  );
  const [createPayment, { isLoading: isCreatingPayment }] = useCreateInvoicePaymentMutation();
  const [deletePayment, { isLoading: isDeletingPayment }] = useDeleteInvoicePaymentMutation();

  // Sales Orders state
  const [salesOrderAccountId, setSalesOrderAccountId] = useState('');
  const [salesOrderFactoryId, setSalesOrderFactoryId] = useState('');
  const [salesOrderDate, setSalesOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesOrderQuotationDate, setSalesOrderQuotationDate] = useState('');
  const [salesOrderExpectedDeliveryDate, setSalesOrderExpectedDeliveryDate] = useState('');
  const [salesOrderNotes, setSalesOrderNotes] = useState('');
  const [salesOrderItems, setSalesOrderItems] = useState<Array<{ item_id: number; quantity_ordered: number; unit_price: number; notes?: string }>>([]);
  // Note: total_amount is calculated automatically from items
  const [salesOrderItemId, setSalesOrderItemId] = useState('');
  const [salesOrderItemQty, setSalesOrderItemQty] = useState('');
  const [salesOrderItemPrice, setSalesOrderItemPrice] = useState('');
  const [salesOrderItemNotes, setSalesOrderItemNotes] = useState('');
  const [editingSalesOrder, setEditingSalesOrder] = useState<SalesOrder | null>(null);
  const [selectedSalesOrderForDetails, setSelectedSalesOrderForDetails] = useState<SalesOrder | null>(null);

  // Sales Deliveries state
  const [deliverySalesOrderId, setDeliverySalesOrderId] = useState('');
  const [deliveryScheduledDate, setDeliveryScheduledDate] = useState('');
  const [deliveryTrackingNumber, setDeliveryTrackingNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryItems, setDeliveryItems] = useState<Array<{ sales_order_item_id: number; quantity_delivered: number; notes?: string }>>([]);
  const [deliveryItemSalesOrderItemId, setDeliveryItemSalesOrderItemId] = useState('');
  const [deliveryItemQty, setDeliveryItemQty] = useState('');
  const [deliveryItemNotes, setDeliveryItemNotes] = useState('');
  const [selectedDeliveryForDetails, setSelectedDeliveryForDetails] = useState<SalesDelivery | null>(null);
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState<'planned' | 'delivered' | 'cancelled' | ''>('');

  // Sales Orders API hooks
  const { data: salesOrders, isLoading: isLoadingSalesOrders, refetch: refetchSalesOrders } = useGetSalesOrdersQuery(
    { skip: 0, limit: 50 },
    { skip: !workspace }
  );
  const [createSalesOrder, { isLoading: isCreatingSalesOrder }] = useCreateSalesOrderMutation();
  const [updateSalesOrder, { isLoading: isUpdatingSalesOrder }] = useUpdateSalesOrderMutation();

  // Sales Deliveries API hooks
  const { data: salesDeliveries, isLoading: isLoadingSalesDeliveries, refetch: refetchSalesDeliveries } = useGetSalesDeliveriesQuery(
    { skip: 0, limit: 50, delivery_status: filterDeliveryStatus || undefined },
    { skip: !workspace }
  );
  const [createSalesDelivery, { isLoading: isCreatingSalesDelivery }] = useCreateSalesDeliveryMutation();
  const [completeSalesDelivery, { isLoading: isCompletingSalesDelivery }] = useCompleteSalesDeliveryMutation();

  // Conditional queries for selected sales order/delivery details
  const { data: selectedSalesOrderItems, refetch: refetchSelectedSalesOrderItems } = useGetSalesOrderItemsQuery(
    selectedSalesOrderForDetails?.id || 0,
    { skip: !selectedSalesOrderForDetails }
  );
  const { data: selectedSalesOrderDeliveries, refetch: refetchSelectedSalesOrderDeliveries } = useGetSalesOrderDeliveriesQuery(
    selectedSalesOrderForDetails?.id || 0,
    { skip: !selectedSalesOrderForDetails }
  );
  const { data: selectedDeliveryItems, refetch: refetchSelectedDeliveryItems } = useGetSalesDeliveryItemsQuery(
    selectedDeliveryForDetails?.id || 0,
    { skip: !selectedDeliveryForDetails }
  );

  // ─── Production Module State ─────────────────────────────────────
  // Production Lines
  const [prodLineName, setProdLineName] = useState('');
  const [prodLineDescription, setProdLineDescription] = useState('');
  const [prodLineFactoryId, setProdLineFactoryId] = useState('');
  const [prodLineMachineId, setProdLineMachineId] = useState('');
  const [editingProdLine, setEditingProdLine] = useState<ProductionLine | null>(null);

  // Production Formulas
  const [formulaCode, setFormulaCode] = useState('');
  const [formulaName, setFormulaName] = useState('');
  const [formulaDescription, setFormulaDescription] = useState('');
  const [formulaDuration, setFormulaDuration] = useState('');
  const [formulaIsDefault, setFormulaIsDefault] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<ProductionFormula | null>(null);

  // Formula Items (for adding to selected formula)
  const [fiItemId, setFiItemId] = useState('');
  const [fiRole, setFiRole] = useState<'input' | 'output' | 'waste' | 'byproduct'>('input');
  const [fiQuantity, setFiQuantity] = useState('');
  const [fiUnit, setFiUnit] = useState('');

  // Production Batches
  const [batchLineId, setBatchLineId] = useState('');
  const [batchFormulaId, setBatchFormulaId] = useState('');
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchShift, setBatchShift] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [batchFilterStatus, setBatchFilterStatus] = useState('');

  // Batch workflow
  const [startTargetQty, setStartTargetQty] = useState('');
  const [completeActualQty, setCompleteActualQty] = useState('');
  const [completeActualDuration, setCompleteActualDuration] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [cancelNotes, setCancelNotes] = useState('');

  // Batch Items (for adding to selected batch)
  const [biItemId, setBiItemId] = useState('');
  const [biRole, setBiRole] = useState<'input' | 'output' | 'waste' | 'byproduct'>('input');
  const [biExpectedQty, setBiExpectedQty] = useState('');
  const [biActualQty, setBiActualQty] = useState('');

  // ─── Production API Hooks ────────────────────────────────────────
  const { data: productionLines, isLoading: isLoadingProdLines, refetch: refetchProdLines } = useGetProductionLinesQuery(
    { skip: 0, limit: 50 },
    { skip: !workspace }
  );
  const [createProdLine, { isLoading: isCreatingProdLine }] = useCreateProductionLineMutation();
  const [updateProdLine] = useUpdateProductionLineMutation();
  const [deleteProdLine] = useDeleteProductionLineMutation();

  const { data: productionFormulas, isLoading: isLoadingFormulas, refetch: refetchFormulas } = useGetProductionFormulasQuery(
    { skip: 0, limit: 50 },
    { skip: !workspace }
  );
  const [createFormula, { isLoading: isCreatingFormula }] = useCreateProductionFormulaMutation();
  const [deleteFormula] = useDeleteProductionFormulaMutation();

  const { data: formulaItems, refetch: refetchFormulaItems } = useGetFormulaItemsQuery(
    { formulaId: selectedFormula?.id || 0 },
    { skip: !selectedFormula }
  );
  const [addFormulaItem] = useAddFormulaItemMutation();
  const [removeFormulaItem] = useRemoveFormulaItemMutation();

  const { data: productionBatches, isLoading: isLoadingBatches, refetch: refetchBatches } = useGetProductionBatchesQuery(
    { skip: 0, limit: 50, status: batchFilterStatus || undefined },
    { skip: !workspace }
  );
  const [createBatch, { isLoading: isCreatingBatch }] = useCreateProductionBatchMutation();
  const [startBatch] = useStartBatchMutation();
  const [completeBatch] = useCompleteBatchMutation();
  const [cancelBatch] = useCancelBatchMutation();

  const { data: batchItems, refetch: refetchBatchItems } = useGetBatchItemsQuery(
    { batchId: selectedBatch?.id || 0 },
    { skip: !selectedBatch }
  );
  const [addBatchItem] = useAddBatchItemMutation();
  const [updateBatchItem] = useUpdateBatchItemMutation();

  // Track actual quantities being edited for batch items (key = batch_item_id, value = actual_qty string)
  const [batchItemActualQtys, setBatchItemActualQtys] = useState<Record<number, string>>({});

  // ─── Machines Module State ──────────────────────────────────────
  const [machineName, setMachineName] = useState('');
  const [machineSectionId, setMachineSectionId] = useState('');
  const [machineModelNumber, setMachineModelNumber] = useState('');
  const [machineManufacturer, setMachineManufacturer] = useState('');
  const [machineMaintenanceDate, setMachineMaintenanceDate] = useState('');
  const [machineMaintenanceNote, setMachineMaintenanceNote] = useState('');
  const [machineNote, setMachineNote] = useState('');
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [machineSearchQuery, setMachineSearchQuery] = useState('');
  const [machineFilterSectionId, setMachineFilterSectionId] = useState('');
  const [machineFilterRunning, setMachineFilterRunning] = useState('');

  // Machine Events state
  const [selectedMachineForEvents, setSelectedMachineForEvents] = useState<Machine | null>(null);
  const [eventType, setEventType] = useState<MachineEventType>('IDLE');
  const [eventNote, setEventNote] = useState('');

  // ─── Machines API Hooks ─────────────────────────────────────────
  const { data: machines, isLoading: isLoadingMachines, refetch: refetchMachines } = useGetMachinesQuery(
    {
      skip: 0,
      limit: 50,
      search: machineSearchQuery || undefined,
      factory_section_id: machineFilterSectionId ? parseInt(machineFilterSectionId) : undefined,
      is_running: machineFilterRunning === '' ? undefined : machineFilterRunning === 'true',
    },
    { skip: !workspace }
  );
  const [createMachine, { isLoading: isCreatingMachine }] = useCreateMachineMutation();
  const [updateMachine, { isLoading: isUpdatingMachine }] = useUpdateMachineMutation();
  const [deleteMachine, { isLoading: isDeletingMachine }] = useDeleteMachineMutation();

  const { data: machineEvents, isLoading: isLoadingMachineEvents, refetch: refetchMachineEvents } = useGetMachineEventsQuery(
    { machine_id: selectedMachineForEvents?.id || 0, skip: 0, limit: 50 },
    { skip: !selectedMachineForEvents }
  );
  const [createMachineEvent, { isLoading: isCreatingMachineEvent }] = useCreateMachineEventMutation();

  // Machine Items state
  const [machineItemMachineId, setMachineItemMachineId] = useState('');
  const [machineItemItemId, setMachineItemItemId] = useState('');
  const [machineItemQty, setMachineItemQty] = useState('0');
  const [machineItemReqQty, setMachineItemReqQty] = useState('');
  const [machineItemDefectiveQty, setMachineItemDefectiveQty] = useState('');
  const [selectedMachineForItems, setSelectedMachineForItems] = useState<Machine | null>(null);
  const [editingMachineItem, setEditingMachineItem] = useState<MachineItem | null>(null);

  // Machine Items API hooks
  const { data: machineItems, isLoading: isLoadingMachineItems } = useGetMachineItemsQuery(
    { machine_id: selectedMachineForItems?.id, skip: 0, limit: 100 },
    { skip: !selectedMachineForItems }
  );
  const [createMachineItem, { isLoading: isCreatingMachineItem }] = useCreateMachineItemMutation();
  const [updateMachineItem, { isLoading: isUpdatingMachineItem }] = useUpdateMachineItemMutation();
  const [deleteMachineItem, { isLoading: isDeletingMachineItem }] = useDeleteMachineItemMutation();

  // Machine Maintenance Logs state
  const [selectedMachineForMaintenance, setSelectedMachineForMaintenance] = useState<Machine | null>(null);
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('PREVENTIVE');
  const [maintenanceDate, setMaintenanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintenanceSummary, setMaintenanceSummary] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenancePerformedBy, setMaintenancePerformedBy] = useState('');
  const [editingMaintenanceLog, setEditingMaintenanceLog] = useState<MachineMaintenanceLog | null>(null);
  const [filterMaintenanceType, setFilterMaintenanceType] = useState<MaintenanceType | ''>('');

  // Machine Maintenance Logs API hooks
  const { data: maintenanceLogs, isLoading: isLoadingMaintenanceLogs } = useGetMachineMaintenanceLogsQuery(
    {
      machine_id: selectedMachineForMaintenance?.id,
      maintenance_type: filterMaintenanceType || undefined,
      skip: 0, limit: 100,
    },
    { skip: !selectedMachineForMaintenance }
  );
  const [createMaintenanceLog, { isLoading: isCreatingMaintenanceLog }] = useCreateMachineMaintenanceLogMutation();
  const [updateMaintenanceLog, { isLoading: isUpdatingMaintenanceLog }] = useUpdateMachineMaintenanceLogMutation();
  const [deleteMaintenanceLog, { isLoading: isDeletingMaintenanceLog }] = useDeleteMachineMaintenanceLogMutation();

  // Unified Inventory state
  const [invItemId, setInvItemId] = useState('');
  const [invFactoryId, setInvFactoryId] = useState('');
  const [invType, setInvType] = useState<InventoryType>('STORAGE');
  const [invQty, setInvQty] = useState('0');
  const [invAvgPrice, setInvAvgPrice] = useState('');
  const [invNote, setInvNote] = useState('');
  const [editingInv, setEditingInv] = useState<Inventory | null>(null);
  const [filterInvType, setFilterInvType] = useState<InventoryType | ''>('');
  const [filterInvFactoryId, setFilterInvFactoryId] = useState('');
  const [showInvLedger, setShowInvLedger] = useState(false);

  // Inventory API hooks
  const { data: inventoryList, isLoading: isLoadingInventory } = useGetInventoryListQuery({
    inventory_type: filterInvType || undefined,
    factory_id: filterInvFactoryId ? parseInt(filterInvFactoryId) : undefined,
    skip: 0, limit: 100,
  });
  const { data: inventoryLedger, isLoading: isLoadingInvLedger } = useGetInventoryLedgerQuery(
    { inventory_type: filterInvType || undefined, skip: 0, limit: 50 },
    { skip: !showInvLedger }
  );
  const [createInventory, { isLoading: isCreatingInventory }] = useCreateInventoryMutation();
  const [updateInventory, { isLoading: isUpdatingInventory }] = useUpdateInventoryMutation();
  const [deleteInventory, { isLoading: isDeletingInventory }] = useDeleteInventoryMutation();

  // Products state
  const [prodItemId, setProdItemId] = useState('');
  const [prodFactoryId, setProdFactoryId] = useState('');
  const [prodQty, setProdQty] = useState('0');
  const [prodAvgCost, setProdAvgCost] = useState('');
  const [prodSellingPrice, setProdSellingPrice] = useState('');
  const [prodMinOrderQty, setProdMinOrderQty] = useState('');
  const [prodAvailableForSale, setProdAvailableForSale] = useState(false);
  const [prodNote, setProdNote] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterProdFactoryId, setFilterProdFactoryId] = useState('');
  const [filterProdAvailable, setFilterProdAvailable] = useState<string>('');
  const [showProdLedger, setShowProdLedger] = useState(false);

  // Products API hooks
  const { data: productsList, isLoading: isLoadingProducts } = useGetProductsQuery({
    factory_id: filterProdFactoryId ? parseInt(filterProdFactoryId) : undefined,
    is_available_for_sale: filterProdAvailable === '' ? undefined : filterProdAvailable === 'true',
    skip: 0, limit: 100,
  });
  const { data: productLedger, isLoading: isLoadingProdLedger } = useGetProductLedgerQuery(
    { skip: 0, limit: 50 },
    { skip: !showProdLedger }
  );
  const [createProduct, { isLoading: isCreatingProduct }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeletingProduct }] = useDeleteProductMutation();

  // Work Orders state
  const [woTitle, setWoTitle] = useState('');
  const [woDescription, setWoDescription] = useState('');
  const [woWorkType, setWoWorkType] = useState<WorkType>('MAINTENANCE');
  const [woPriority, setWoPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [woFactoryId, setWoFactoryId] = useState('');
  const [woMachineId, setWoMachineId] = useState('');
  const [woStartDate, setWoStartDate] = useState('');
  const [woEndDate, setWoEndDate] = useState('');
  const [woCost, setWoCost] = useState('');
  const [woAssignedTo, setWoAssignedTo] = useState('');
  const [woNotes, setWoNotes] = useState('');
  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);
  const [selectedWoId, setSelectedWoId] = useState<number | null>(null);
  const [filterWoType, setFilterWoType] = useState<WorkType | ''>('');
  const [filterWoStatus, setFilterWoStatus] = useState<WorkOrderStatus | ''>('');
  const [woItemId, setWoItemId] = useState('');
  const [woItemQty, setWoItemQty] = useState('1');

  // Work Orders API hooks
  const { data: workOrders, isLoading: isLoadingWorkOrders } = useGetWorkOrdersQuery({
    work_type: filterWoType || undefined,
    status: filterWoStatus || undefined,
    skip: 0, limit: 100,
  });
  const { data: woItems, isLoading: isLoadingWoItems } = useGetWorkOrderItemsQuery(
    selectedWoId!, { skip: !selectedWoId }
  );
  const [createWorkOrder, { isLoading: isCreatingWo }] = useCreateWorkOrderMutation();
  const [updateWorkOrder, { isLoading: isUpdatingWo }] = useUpdateWorkOrderMutation();
  const [deleteWorkOrder, { isLoading: isDeletingWo }] = useDeleteWorkOrderMutation();
  const [addWoItem, { isLoading: isAddingWoItem }] = useAddWorkOrderItemMutation();
  const [removeWoItem] = useRemoveWorkOrderItemMutation();

  // Purchase Orders state
  const [poAccountId, setPoAccountId] = useState('');
  const [poDestType, setPoDestType] = useState('storage');
  const [poDestId, setPoDestId] = useState('');
  const [poNote, setPoNote] = useState('');
  const [poDescription, setPoDescription] = useState('');
  const [poInternalNote, setPoInternalNote] = useState('');
  const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
  const [poItemItemId, setPoItemItemId] = useState('');
  const [poItemQty, setPoItemQty] = useState('1');
  const [poItemPrice, setPoItemPrice] = useState('0');

  // Purchase Orders API hooks
  const { data: purchaseOrders, isLoading: isLoadingPO } = useGetPurchaseOrdersQuery({
    skip: 0, limit: 100,
  });
  const { data: poItems } = useGetPurchaseOrderItemsQuery(selectedPoId!, { skip: !selectedPoId });
  const [createPO] = useCreatePurchaseOrderMutation();
  const [updatePO] = useUpdatePurchaseOrderMutation();
  const [deletePO] = useDeletePurchaseOrderMutation();
  const [addPOItem] = useAddPurchaseOrderItemMutation();
  const [removePOItem] = useRemovePurchaseOrderItemMutation();

  // Transfer Orders state
  const [toSrcType, setToSrcType] = useState('storage');
  const [toSrcId, setToSrcId] = useState('');
  const [toDestType, setToDestType] = useState('machine');
  const [toDestId, setToDestId] = useState('');
  const [toNote, setToNote] = useState('');
  const [toDescription, setToDescription] = useState('');
  const [selectedToId, setSelectedToId] = useState<number | null>(null);
  const [toItemItemId, setToItemItemId] = useState('');
  const [toItemQty, setToItemQty] = useState('1');

  // Transfer Orders API hooks
  const { data: transferOrders, isLoading: isLoadingTO } = useGetTransferOrdersQuery({
    skip: 0, limit: 100,
  });
  const { data: toItems } = useGetTransferOrderItemsQuery(selectedToId!, { skip: !selectedToId });
  const [createTO] = useCreateTransferOrderMutation();
  const [updateTO] = useUpdateTransferOrderMutation();
  const [deleteTO] = useDeleteTransferOrderMutation();
  const [addTOItem] = useAddTransferOrderItemMutation();
  const [removeTOItem] = useRemoveTransferOrderItemMutation();

  // Expense Orders state
  const [eoCategory, setEoCategory] = useState('utilities');
  const [eoNote, setEoNote] = useState('');
  const [eoAccountId, setEoAccountId] = useState('');
  const [eoExpenseDate, setEoExpenseDate] = useState('');
  const [eoDueDate, setEoDueDate] = useState('');
  const [eoDescription, setEoDescription] = useState('');
  const [eoInternalNote, setEoInternalNote] = useState('');
  const [eoFilterCategory, setEoFilterCategory] = useState('');
  const [selectedEoId, setSelectedEoId] = useState<number | null>(null);
  const [eoItemDesc, setEoItemDesc] = useState('');
  const [eoItemQty, setEoItemQty] = useState('1');
  const [eoItemPrice, setEoItemPrice] = useState('0');
  const [eoItemUnit, setEoItemUnit] = useState('');

  // Expense Orders API hooks
  const { data: expenseOrders, isLoading: isLoadingEO } = useGetExpenseOrdersQuery({
    expense_category: eoFilterCategory || undefined, skip: 0, limit: 100,
  });
  const { data: eoItems } = useGetExpenseOrderItemsQuery(selectedEoId!, { skip: !selectedEoId });
  const [createEO] = useCreateExpenseOrderMutation();
  const [updateEO] = useUpdateExpenseOrderMutation();
  const [deleteEO] = useDeleteExpenseOrderMutation();
  const [addEOItem] = useAddExpenseOrderItemMutation();
  const [removeEOItem] = useRemoveExpenseOrderItemMutation();

  // Order Templates state
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplCategory, setTplCategory] = useState('');
  const [tplAccountId, setTplAccountId] = useState('');
  const [tplIsRecurring, setTplIsRecurring] = useState(false);
  const [tplRecurrenceType, setTplRecurrenceType] = useState('');
  const [tplRecurrenceDay, setTplRecurrenceDay] = useState('');
  const [tplAutoApprove, setTplAutoApprove] = useState(false);
  const [tplNotes, setTplNotes] = useState('');
  const [tplFilterCategory, setTplFilterCategory] = useState('');
  const [selectedTplId, setSelectedTplId] = useState<number | null>(null);
  const [tplItemDesc, setTplItemDesc] = useState('');
  const [tplItemQty, setTplItemQty] = useState('1');
  const [tplItemPrice, setTplItemPrice] = useState('0');
  const [tplItemUnit, setTplItemUnit] = useState('');

  // Order Templates API hooks
  const { data: orderTemplates, isLoading: isLoadingTPL } = useGetOrderTemplatesQuery({
    expense_category: tplFilterCategory || undefined, skip: 0, limit: 100,
  });
  const { data: tplItems } = useGetOrderTemplateItemsQuery(selectedTplId!, { skip: !selectedTplId });
  const [createTPL] = useCreateOrderTemplateMutation();
  const [updateTPL] = useUpdateOrderTemplateMutation();
  const [deleteTPL] = useDeleteOrderTemplateMutation();
  const [addTPLItem] = useAddOrderTemplateItemMutation();
  const [removeTPLItem] = useRemoveOrderTemplateItemMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login({ email, password }).unwrap();

      // Store user and token (NO workspace yet - user selects after)
      dispatch(setCredentials({
        user: result.user,
        token: result.access_token,
      }));

      toast.success(`Login successful! Welcome ${result.user.name}. Select a workspace below.`);
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Login failed';
      toast.error(errorMessage);
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        workspace_name: registerWorkspaceName || undefined,
        position: registerPosition || undefined,
      }).unwrap();

      dispatch(setCredentials({
        user: result.user,
        token: result.access_token,
        workspace: result.workspace,
      }));

      toast.success(`Registration successful! Welcome ${result.user.name}. Workspace "${result.workspace.name}" created.`);
      setShowRegister(false);
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterWorkspaceName('');
      setRegisterPosition('');
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Registration failed';
      toast.error(errorMessage);
      console.error('Registration error:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    toast.success('Logged out successfully');
  };

  const handleSelectWorkspace = (selectedWorkspace: any) => {
    dispatch(setWorkspace({
      id: selectedWorkspace.id,
      name: selectedWorkspace.name,
      role: selectedWorkspace.role,
      status: 'active', // Default to active since user can access it
    }));
    toast.success(`Switched to workspace: ${selectedWorkspace.name}`);
  };

  const handleWorkspaceNameChange = (name: string) => {
    setWorkspaceName(name);
    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    setWorkspaceSlug(slug);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspaceName || !workspaceSlug) {
      toast.error('Please provide workspace name and slug');
      return;
    }

    try {
      const result = await createWorkspace({
        name: workspaceName,
        slug: workspaceSlug,
      }).unwrap();

      toast.success(`Workspace "${result.name}" created successfully!`);
      setWorkspaceName('');
      setWorkspaceSlug('');
      setShowCreateWorkspace(false);
    } catch (error: any) {
      console.error('Create workspace error - FULL ERROR:', error);
      console.error('Error data:', error.data);
      console.error('Error status:', error.status);
      const errorMessage = error.data?.detail || error.data?.message || 'Failed to create workspace';
      toast.error(errorMessage);
    }
  };

  // Items handlers
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName || !itemUnit) {
      toast.error('Please provide item name and unit');
      return;
    }

    try {
      const result = await createItem({
        name: itemName,
        description: itemDescription || null,
        unit: itemUnit,
        tag_ids: selectedTagIds,
      }).unwrap();

      toast.success(`Item "${result.name}" created successfully!`);
      setItemName('');
      setItemDescription('');
      setItemUnit('pcs');
      setSelectedTagIds([]);
      refetchItems();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to create item';
      toast.error(errorMessage);
      console.error('Create item error:', error);
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemUnit(item.unit);
    setSelectedTagIds(item.tags?.map(t => t.id) || []);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingItem) return;

    try {
      const result = await updateItem({
        id: editingItem.id,
        data: {
          name: itemName,
          description: itemDescription || null,
          unit: itemUnit,
          tag_ids: selectedTagIds,
        },
      }).unwrap();

      toast.success(`Item "${result.name}" updated successfully!`);
      setEditingItem(null);
      setItemName('');
      setItemDescription('');
      setItemUnit('pcs');
      setSelectedTagIds([]);
      refetchItems();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to update item';
      toast.error(errorMessage);
      console.error('Update item error:', error);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      await deleteItem(item.id).unwrap();
      toast.success(`Item "${item.name}" deleted successfully!`);
      refetchItems();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete item';
      toast.error(errorMessage);
      console.error('Delete item error:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setItemName('');
    setItemDescription('');
    setItemUnit('pcs');
    setSelectedTagIds([]);
  };

  // Tag handlers
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTagName) {
      toast.error('Please provide tag name');
      return;
    }

    try {
      await createTag({
        name: newTagName,
        description: newTagDescription || undefined,
        color: newTagColor,
      }).unwrap();

      toast.success(`Tag "${newTagName}" created successfully!`);
      setNewTagName('');
      setNewTagDescription('');
      setNewTagColor('#6B7280');
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to create tag';
      toast.error(errorMessage);
      console.error('Create tag error:', error);
    }
  };

  const handleDeleteTag = async (tagId: number, tagName: string, isSystemTag: boolean) => {
    if (isSystemTag) {
      toast.error('System tags cannot be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      return;
    }

    try {
      await deleteTag(tagId).unwrap();
      toast.success(`Tag "${tagName}" deleted successfully!`);
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete tag';
      toast.error(errorMessage);
      console.error('Delete tag error:', error);
    }
  };

  const handleManageItemTags = (item: Item) => {
    setManagingTagsForItem(item);
    setItemTagIds(item.tags?.map(t => t.id) || []);
  };

  const handleSaveItemTags = async () => {
    if (!managingTagsForItem) return;

    try {
      await updateItem({
        id: managingTagsForItem.id,
        data: {
          tag_ids: itemTagIds,
        },
      }).unwrap();

      toast.success(`Tags updated for "${managingTagsForItem.name}"`);
      setManagingTagsForItem(null);
      setItemTagIds([]);
      refetchItems();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to update tags';
      toast.error(errorMessage);
      console.error('Update tags error:', error);
    }
  };

  // Account handlers
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountName) {
      toast.error('Please provide account name');
      return;
    }

    try {
      await createAccount({
        name: accountName,
        primary_email: accountEmail || undefined,
        primary_phone: accountPhone || undefined,
        address: accountAddress || undefined,
        tag_ids: accountSelectedTagIds,
      }).unwrap();

      toast.success(`Account "${accountName}" created successfully!`);
      setAccountName('');
      setAccountEmail('');
      setAccountPhone('');
      setAccountAddress('');
      setAccountSelectedTagIds([]);
      refetchAccounts();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to create account';
      toast.error(errorMessage);
      console.error('Create account error:', error);
    }
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setAccountName(account.name);
    setAccountEmail(account.primary_email || '');
    setAccountPhone(account.primary_phone || '');
    setAccountAddress(account.address || '');
    setAccountSelectedTagIds(account.tags?.map(t => t.id) || []);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAccount) return;

    try {
      await updateAccount({
        id: editingAccount.id,
        data: {
          name: accountName || undefined,
          primary_email: accountEmail || undefined,
          primary_phone: accountPhone || undefined,
          address: accountAddress || undefined,
          tag_ids: accountSelectedTagIds,
        },
      }).unwrap();

      toast.success(`Account "${accountName}" updated successfully!`);
      handleCancelAccountEdit();
      refetchAccounts();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to update account';
      toast.error(errorMessage);
      console.error('Update account error:', error);
    }
  };

  const handleDeleteAccount = async (account: Account) => {
    if (!confirm(`Are you sure you want to delete "${account.name}"?`)) {
      return;
    }

    try {
      await deleteAccount(account.id).unwrap();
      toast.success(`Account "${account.name}" deleted successfully!`);
      refetchAccounts();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete account';
      toast.error(errorMessage);
      console.error('Delete account error:', error);
    }
  };

  const handleCancelAccountEdit = () => {
    setEditingAccount(null);
    setAccountName('');
    setAccountEmail('');
    setAccountPhone('');
    setAccountAddress('');
    setAccountSelectedTagIds([]);
  };

  // Account Tag handlers
  const handleCreateAccountTag = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccountTagName) {
      toast.error('Please provide tag name');
      return;
    }

    try {
      await createAccountTag({
        name: newAccountTagName,
        description: newAccountTagDescription || undefined,
        color: newAccountTagColor,
      }).unwrap();

      toast.success(`Account tag "${newAccountTagName}" created successfully!`);
      setNewAccountTagName('');
      setNewAccountTagDescription('');
      setNewAccountTagColor('#6B7280');
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to create account tag';
      toast.error(errorMessage);
      console.error('Create account tag error:', error);
    }
  };

  const handleDeleteAccountTag = async (tagId: number, tagName: string, isSystemTag: boolean) => {
    if (isSystemTag) {
      toast.error('System tags cannot be deleted');
      return;
    }

    if (!confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      return;
    }

    try {
      await deleteAccountTag(tagId).unwrap();
      toast.success(`Account tag "${tagName}" deleted successfully!`);
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete account tag';
      toast.error(errorMessage);
      console.error('Delete account tag error:', error);
    }
  };

  // Factory handlers
  const handleCreateFactory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!factoryName || !factoryAbbreviation) {
      toast.error('Please provide factory name and abbreviation');
      return;
    }

    try {
      await createFactory({
        name: factoryName,
        abbreviation: factoryAbbreviation,
      }).unwrap();
      toast.success(`Factory "${factoryName}" created successfully!`);
      setFactoryName('');
      setFactoryAbbreviation('');
      refetchFactories();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to create factory';
      toast.error(errorMessage);
      console.error('Create factory error:', error);
    }
  };

  const handleEditFactory = (factory: Factory) => {
    setEditingFactory(factory);
    setFactoryName(factory.name);
    setFactoryAbbreviation(factory.abbreviation);
  };

  const handleUpdateFactory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingFactory || !factoryName || !factoryAbbreviation) {
      toast.error('Please provide factory name and abbreviation');
      return;
    }

    try {
      await updateFactory({
        id: editingFactory.id,
        data: {
          name: factoryName,
          abbreviation: factoryAbbreviation,
        },
      }).unwrap();
      toast.success(`Factory "${factoryName}" updated successfully!`);
      handleCancelFactoryEdit();
      refetchFactories();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to update factory';
      toast.error(errorMessage);
      console.error('Update factory error:', error);
    }
  };

  const handleCancelFactoryEdit = () => {
    setEditingFactory(null);
    setFactoryName('');
    setFactoryAbbreviation('');
  };

  const handleDeleteFactory = async (factory: Factory) => {
    if (!confirm(`Are you sure you want to delete "${factory.name}"?`)) {
      return;
    }

    try {
      await deleteFactory(factory.id).unwrap();
      toast.success(`Factory "${factory.name}" deleted successfully!`);
      refetchFactories();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete factory';
      toast.error(errorMessage);
      console.error('Delete factory error:', error);
    }
  };

  // Factory Section handlers
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sectionName || !sectionFactoryId) {
      toast.error('Please provide section name and select a factory');
      return;
    }

    try {
      await createSection({
        name: sectionName,
        factory_id: sectionFactoryId,
      }).unwrap();
      toast.success(`Section "${sectionName}" created successfully!`);
      setSectionName('');
      setSectionFactoryId(null);
      refetchSections();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to create section';
      toast.error(errorMessage);
      console.error('Create section error:', error);
    }
  };

  const handleEditSection = (section: FactorySection) => {
    setEditingSection(section);
    setSectionName(section.name);
    setSectionFactoryId(section.factory_id);
  };

  const handleUpdateSection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSection || !sectionName || !sectionFactoryId) {
      toast.error('Please provide section name and select a factory');
      return;
    }

    try {
      await updateSection({
        id: editingSection.id,
        data: {
          name: sectionName,
          factory_id: sectionFactoryId,
        },
      }).unwrap();
      toast.success(`Section "${sectionName}" updated successfully!`);
      handleCancelSectionEdit();
      refetchSections();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to update section';
      toast.error(errorMessage);
      console.error('Update section error:', error);
    }
  };

  const handleCancelSectionEdit = () => {
    setEditingSection(null);
    setSectionName('');
    setSectionFactoryId(null);
  };

  const handleDeleteSection = async (section: FactorySection) => {
    if (!confirm(`Are you sure you want to delete "${section.name}"?`)) {
      return;
    }

    try {
      await deleteSection(section.id).unwrap();
      toast.success(`Section "${section.name}" deleted successfully!`);
      refetchSections();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete section';
      toast.error(errorMessage);
      console.error('Delete section error:', error);
    }
  };

  // Department handlers
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentName.trim()) {
      toast.error('Please enter department name');
      return;
    }

    try {
      if (editingDepartment) {
        // Update existing department
        await updateDepartment({
          id: editingDepartment.id,
          data: { name: departmentName }
        }).unwrap();
        toast.success(`Department "${departmentName}" updated successfully!`);
        setEditingDepartment(null);
      } else {
        // Create new department
        await createDepartment({ name: departmentName }).unwrap();
        toast.success(`Department "${departmentName}" created successfully!`);
      }

      // Reset form
      setDepartmentName('');
      refetchDepartments();
    } catch (error: any) {
      const errorMessage = error.data?.detail || `Failed to ${editingDepartment ? 'update' : 'create'} department`;
      toast.error(errorMessage);
      console.error('Department error:', error);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name);
  };

  const handleCancelEditDepartment = () => {
    setEditingDepartment(null);
    setDepartmentName('');
  };

  const handleDeleteDepartment = async (department: Department) => {
    if (!confirm(`Are you sure you want to delete "${department.name}"?`)) {
      return;
    }

    try {
      await deleteDepartment(department.id).unwrap();
      toast.success(`Department "${department.name}" deleted successfully!`);
      refetchDepartments();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete department';
      toast.error(errorMessage);
      console.error('Delete department error:', error);
    }
  };

  // Project handlers
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim() || !projectDescription.trim() || !projectFactoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const projectData = {
        factory_id: parseInt(projectFactoryId),
        name: projectName,
        description: projectDescription,
        budget: projectBudget ? parseFloat(projectBudget) : null,
        deadline: projectDeadline ? `${projectDeadline}T00:00:00` : null,
        priority: projectPriority,
        status: projectStatus
      };

      if (editingProject) {
        // Update existing project
        await updateProject({
          id: editingProject.id,
          data: projectData
        }).unwrap();
        toast.success(`Project "${projectName}" updated successfully!`);
        setEditingProject(null);
      } else {
        // Create new project
        await createProject(projectData).unwrap();
        toast.success(`Project "${projectName}" created successfully!`);
      }

      // Reset form
      setProjectName('');
      setProjectDescription('');
      setProjectBudget('');
      setProjectDeadline('');
      setProjectFactoryId('');
      setProjectPriority('MEDIUM');
      setProjectStatus('PLANNING');
      refetchProjects();
    } catch (error: any) {
      const errorMessage = error.data?.detail || `Failed to ${editingProject ? 'update' : 'create'} project`;
      toast.error(errorMessage);
      console.error('Project error:', error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description);
    setProjectBudget(project.budget?.toString() || '');
    setProjectDeadline(project.deadline ? project.deadline.split('T')[0] : '');
    setProjectFactoryId(project.factory_id.toString());
    setProjectPriority(project.priority);
    setProjectStatus(project.status);
  };

  const handleCancelEditProject = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setProjectBudget('');
    setProjectDeadline('');
    setProjectFactoryId('');
    setProjectPriority('MEDIUM');
    setProjectStatus('PLANNING');
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    try {
      await deleteProject(project.id).unwrap();
      toast.success(`Project "${project.name}" deleted successfully!`);
      refetchProjects();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete project';
      toast.error(errorMessage);
      console.error('Delete project error:', error);
    }
  };

  // Project Component handlers
  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!componentName.trim() || !componentProjectId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const componentData = {
        project_id: parseInt(componentProjectId),
        name: componentName,
        description: componentDescription || null,
        budget: componentBudget ? parseFloat(componentBudget) : null,
        deadline: componentDeadline ? `${componentDeadline}T00:00:00` : null,
        status: componentStatus
      };

      if (editingComponent) {
        await updateComponent({
          id: editingComponent.id,
          data: componentData
        }).unwrap();
        toast.success(`Component "${componentName}" updated successfully!`);
        setEditingComponent(null);
      } else {
        await createComponent(componentData).unwrap();
        toast.success(`Component "${componentName}" created successfully!`);
        // Set filter to show components of the project we just created for
        setFilterComponentProjectId(parseInt(componentProjectId));
      }

      setComponentName('');
      setComponentDescription('');
      setComponentProjectId('');
      setComponentBudget('');
      setComponentDeadline('');
      setComponentStatus('PLANNING');
      refetchComponents();
    } catch (error: any) {
      const errorMessage = error.data?.detail || `Failed to ${editingComponent ? 'update' : 'create'} component`;
      toast.error(errorMessage);
      console.error('Component error:', error);
    }
  };

  const handleEditComponent = (component: ProjectComponent) => {
    setEditingComponent(component);
    setComponentName(component.name);
    setComponentDescription(component.description || '');
    setComponentProjectId(component.project_id.toString());
    setComponentBudget(component.budget?.toString() || '');
    setComponentDeadline(component.deadline ? component.deadline.split('T')[0] : '');
    setComponentStatus(component.status);
  };

  const handleCancelEditComponent = () => {
    setEditingComponent(null);
    setComponentName('');
    setComponentDescription('');
    setComponentProjectId('');
    setComponentBudget('');
    setComponentDeadline('');
    setComponentStatus('PLANNING');
  };

  const handleDeleteComponent = async (component: ProjectComponent) => {
    if (!confirm(`Are you sure you want to delete "${component.name}"?`)) {
      return;
    }

    try {
      await deleteComponent(component.id).unwrap();
      toast.success(`Component "${component.name}" deleted successfully!`);
      refetchComponents();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete component';
      toast.error(errorMessage);
      console.error('Delete component error:', error);
    }
  };

  // Project Component Item handlers
  const handleCreateComponentItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!componentItemComponentId || !componentItemItemId || !componentItemQty) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const itemData = {
        project_component_id: parseInt(componentItemComponentId),
        item_id: parseInt(componentItemItemId),
        qty: parseInt(componentItemQty)
      };

      if (editingComponentItem) {
        await updateComponentItem({
          id: editingComponentItem.id,
          data: { qty: parseInt(componentItemQty) }
        }).unwrap();
        toast.success('Component item updated successfully!');
        setEditingComponentItem(null);
      } else {
        await createComponentItem(itemData).unwrap();
        toast.success('Component item created successfully!');
        // Set filter to show items of the component we just created for
        setFilterComponentItemComponentId(parseInt(componentItemComponentId));
      }

      setComponentItemComponentId('');
      setComponentItemItemId('');
      setComponentItemQty('');
      refetchComponentItems();
    } catch (error: any) {
      const errorMessage = error.data?.detail || `Failed to ${editingComponentItem ? 'update' : 'create'} component item`;
      toast.error(errorMessage);
      console.error('Component item error:', error);
    }
  };

  const handleEditComponentItem = (item: ProjectComponentItem) => {
    setEditingComponentItem(item);
    setComponentItemComponentId(item.project_component_id.toString());
    setComponentItemItemId(item.item_id.toString());
    setComponentItemQty(item.qty.toString());
  };

  const handleCancelEditComponentItem = () => {
    setEditingComponentItem(null);
    setComponentItemComponentId('');
    setComponentItemItemId('');
    setComponentItemQty('');
  };

  const handleDeleteComponentItem = async (item: ProjectComponentItem) => {
    if (!confirm(`Are you sure you want to delete this component item?`)) {
      return;
    }

    try {
      await deleteComponentItem(item.id).unwrap();
      toast.success('Component item deleted successfully!');
      refetchComponentItems();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete component item';
      toast.error(errorMessage);
      console.error('Delete component item error:', error);
    }
  };

  // Project Component Task handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim() || !taskDescription.trim() || !taskComponentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const taskData = {
        project_component_id: parseInt(taskComponentId),
        name: taskName,
        description: taskDescription,
        is_note: taskIsNote,
        task_priority: taskPriority
      };

      if (editingTask) {
        await updateTask({
          id: editingTask.id,
          data: taskData
        }).unwrap();
        toast.success(`Task "${taskName}" updated successfully!`);
        setEditingTask(null);
      } else {
        await createTask(taskData).unwrap();
        toast.success(`Task "${taskName}" created successfully!`);
        // Set filter to show tasks of the component we just created for
        setFilterTaskComponentId(parseInt(taskComponentId));
      }

      setTaskName('');
      setTaskDescription('');
      setTaskComponentId('');
      setTaskIsNote(false);
      setTaskPriority('MEDIUM');
      refetchTasks();
    } catch (error: any) {
      const errorMessage = error.data?.detail || `Failed to ${editingTask ? 'update' : 'create'} task`;
      toast.error(errorMessage);
      console.error('Task error:', error);
    }
  };

  const handleEditTask = (task: ProjectComponentTask) => {
    setEditingTask(task);
    setTaskName(task.name);
    setTaskDescription(task.description);
    setTaskComponentId(task.project_component_id.toString());
    setTaskIsNote(task.is_note);
    setTaskPriority(task.task_priority || 'MEDIUM');
  };

  const handleCancelEditTask = () => {
    setEditingTask(null);
    setTaskName('');
    setTaskDescription('');
    setTaskComponentId('');
    setTaskIsNote(false);
    setTaskPriority('MEDIUM');
  };

  const handleDeleteTask = async (task: ProjectComponentTask) => {
    if (!confirm(`Are you sure you want to delete "${task.name}"?`)) {
      return;
    }

    try {
      await deleteTask(task.id).unwrap();
      toast.success(`Task "${task.name}" deleted successfully!`);
      refetchTasks();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete task';
      toast.error(errorMessage);
      console.error('Delete task error:', error);
    }
  };

  const handleToggleTaskComplete = async (task: ProjectComponentTask) => {
    try {
      await updateTask({
        id: task.id,
        data: { is_completed: !task.is_completed }
      }).unwrap();
      toast.success(`Task marked as ${!task.is_completed ? 'completed' : 'incomplete'}!`);
      refetchTasks();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to update task';
      toast.error(errorMessage);
      console.error('Toggle task error:', error);
    }
  };

  // Miscellaneous Cost handlers
  const handleCreateCost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!costName.trim() || !costAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const costData = {
        name: costName,
        description: costDescription || null,
        amount: parseFloat(costAmount),
        project_id: costProjectId ? parseInt(costProjectId) : null,
        project_component_id: costComponentId ? parseInt(costComponentId) : null
      };

      if (editingCost) {
        await updateCost({
          id: editingCost.id,
          data: costData
        }).unwrap();
        toast.success(`Cost "${costName}" updated successfully!`);
        setEditingCost(null);
      } else {
        await createCost(costData).unwrap();
        toast.success(`Cost "${costName}" created successfully!`);
        // Set filter to show costs we just created
        if (costComponentId) {
          setFilterCostComponentId(parseInt(costComponentId));
        } else if (costProjectId) {
          setFilterCostProjectId(parseInt(costProjectId));
          setFilterCostComponentId(null);
        }
      }

      setCostName('');
      setCostDescription('');
      setCostAmount('');
      setCostProjectId('');
      setCostComponentId('');
      refetchCosts();
    } catch (error: any) {
      const errorMessage = error.data?.detail || `Failed to ${editingCost ? 'update' : 'create'} cost`;
      toast.error(errorMessage);
      console.error('Cost error:', error);
    }
  };

  const handleEditCost = (cost: MiscellaneousProjectCost) => {
    setEditingCost(cost);
    setCostName(cost.name);
    setCostDescription(cost.description || '');
    setCostAmount(cost.amount.toString());
    setCostProjectId(cost.project_id?.toString() || '');
    setCostComponentId(cost.project_component_id?.toString() || '');
  };

  const handleCancelEditCost = () => {
    setEditingCost(null);
    setCostName('');
    setCostDescription('');
    setCostAmount('');
    setCostProjectId('');
    setCostComponentId('');
  };

  const handleDeleteCost = async (cost: MiscellaneousProjectCost) => {
    if (!confirm(`Are you sure you want to delete "${cost.name}"?`)) {
      return;
    }

    try {
      await deleteCost(cost.id).unwrap();
      toast.success(`Cost "${cost.name}" deleted successfully!`);
      refetchCosts();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete cost';
      toast.error(errorMessage);
      console.error('Delete cost error:', error);
    }
  };

  // Invoice handlers
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceAccountId || !invoiceAmount || !invoiceDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const invoiceData = {
        account_id: parseInt(invoiceAccountId),
        invoice_type: invoiceType,
        invoice_amount: parseFloat(invoiceAmount),
        invoice_number: invoiceNumber || undefined,
        invoice_date: invoiceDate,
        due_date: dueDate || undefined,
        description: invoiceDescription || undefined,
      };

      if (editingInvoice) {
        await updateInvoice({
          id: editingInvoice.id,
          data: invoiceData
        }).unwrap();
        toast.success('Invoice updated successfully!');
        setEditingInvoice(null);
      } else {
        await createInvoice(invoiceData).unwrap();
        toast.success('Invoice created successfully!');
      }

      // Reset form
      setInvoiceAccountId('');
      setInvoiceType('payable');
      setInvoiceAmount('');
      setInvoiceNumber('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setInvoiceDescription('');
      refetchInvoices();
    } catch (error: any) {
      const errorMessage = error.data?.detail || `Failed to ${editingInvoice ? 'update' : 'create'} invoice`;
      toast.error(errorMessage);
      console.error('Invoice error:', error);
    }
  };

  const handleEditInvoice = (invoice: AccountInvoice) => {
    setEditingInvoice(invoice);
    setInvoiceAccountId(invoice.account_id.toString());
    setInvoiceType(invoice.invoice_type);
    setInvoiceAmount(invoice.invoice_amount.toString());
    setInvoiceNumber(invoice.invoice_number || '');
    setInvoiceDate(invoice.invoice_date);
    setDueDate(invoice.due_date || '');
    setInvoiceDescription(invoice.description || '');
  };

  const handleCancelEditInvoice = () => {
    setEditingInvoice(null);
    setInvoiceAccountId('');
    setInvoiceType('payable');
    setInvoiceAmount('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setInvoiceDescription('');
  };

  const handleDeleteInvoice = async (invoice: AccountInvoice) => {
    if (invoice.paid_amount > 0) {
      toast.error('Cannot delete invoice with existing payments');
      return;
    }

    if (!confirm(`Are you sure you want to delete invoice #${invoice.invoice_number || invoice.id}?`)) {
      return;
    }

    try {
      await deleteInvoice(invoice.id).unwrap();
      toast.success('Invoice deleted successfully!');
      refetchInvoices();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete invoice';
      toast.error(errorMessage);
      console.error('Delete invoice error:', error);
    }
  };

  const handleViewPayments = (invoice: AccountInvoice) => {
    setSelectedInvoiceForPayments(invoice);
  };

  const handleClosePayments = () => {
    setSelectedInvoiceForPayments(null);
  };

  // Payment handlers
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvoiceForPayments || !paymentAmount || !paymentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createPayment({
        invoice_id: selectedInvoiceForPayments.id,
        payment_amount: parseFloat(paymentAmount),
        payment_date: paymentDate,
        payment_method: paymentMethod || undefined,
        payment_reference: paymentReference || undefined,
        notes: paymentNotes || undefined,
      }).unwrap();
      toast.success('Payment recorded successfully!');

      // Reset form
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('');
      setPaymentReference('');
      setPaymentNotes('');
      refetchPayments();
      refetchInvoices(); // Refresh invoices to show updated status
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to record payment';
      toast.error(errorMessage);
      console.error('Payment error:', error);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      await deletePayment(paymentId).unwrap();
      toast.success('Payment deleted successfully!');
      refetchPayments();
      refetchInvoices(); // Refresh invoices to show updated status
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to delete payment';
      toast.error(errorMessage);
      console.error('Delete payment error:', error);
    }
  };

  // Sales Order handlers
  const handleAddSalesOrderItem = () => {
    if (!salesOrderItemId || !salesOrderItemQty || !salesOrderItemPrice) {
      toast.error('Please fill in all item fields');
      return;
    }

    const newItem = {
      item_id: parseInt(salesOrderItemId),
      quantity_ordered: parseFloat(salesOrderItemQty),
      unit_price: parseFloat(salesOrderItemPrice),
      notes: salesOrderItemNotes || undefined,
    };

    setSalesOrderItems([...salesOrderItems, newItem]);
    setSalesOrderItemId('');
    setSalesOrderItemQty('');
    setSalesOrderItemPrice('');
    setSalesOrderItemNotes('');
    toast.success('Item added to order');
  };

  const handleRemoveSalesOrderItem = (index: number) => {
    setSalesOrderItems(salesOrderItems.filter((_, i) => i !== index));
  };

  const handleCreateSalesOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!salesOrderAccountId || !salesOrderFactoryId || salesOrderItems.length === 0) {
      toast.error('Please fill in all required fields and add at least one item');
      return;
    }

    try {
      await createSalesOrder({
        order: {
          account_id: parseInt(salesOrderAccountId),
          factory_id: parseInt(salesOrderFactoryId),
          order_date: salesOrderDate,
          quotation_sent_date: salesOrderQuotationDate || undefined,
          expected_delivery_date: salesOrderExpectedDeliveryDate || undefined,
          notes: salesOrderNotes || undefined,
        },
        items: salesOrderItems,
      }).unwrap();
      toast.success('Sales order created successfully!');

      // Reset form
      setSalesOrderAccountId('');
      setSalesOrderFactoryId('');
      setSalesOrderDate(new Date().toISOString().split('T')[0]);
      setSalesOrderQuotationDate('');
      setSalesOrderExpectedDeliveryDate('');
      setSalesOrderNotes('');
      setSalesOrderItems([]);
      refetchSalesOrders();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to create sales order';
      toast.error(errorMessage);
      console.error('Sales order error:', error);
    }
  };

  const handleViewSalesOrderDetails = (order: SalesOrder) => {
    setSelectedSalesOrderForDetails(order);
  };

  const handleCloseSalesOrderDetails = () => {
    setSelectedSalesOrderForDetails(null);
  };

  // Sales Delivery handlers
  const handleAddDeliveryItem = () => {
    if (!deliveryItemSalesOrderItemId || !deliveryItemQty) {
      toast.error('Please fill in Sales Order Item ID and Quantity');
      return;
    }

    const newItem = {
      sales_order_item_id: parseInt(deliveryItemSalesOrderItemId),
      quantity_delivered: parseFloat(deliveryItemQty),
      notes: deliveryItemNotes || undefined,
      // Note: item_id will be derived from sales_order_item by backend
    };

    setDeliveryItems([...deliveryItems, newItem]);
    setDeliveryItemSalesOrderItemId('');
    setDeliveryItemQty('');
    setDeliveryItemNotes('');
    toast.success('Item added to delivery');
  };

  const handleRemoveDeliveryItem = (index: number) => {
    setDeliveryItems(deliveryItems.filter((_, i) => i !== index));
  };

  const handleCreateSalesDelivery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliverySalesOrderId || deliveryItems.length === 0) {
      toast.error('Please select a sales order and add at least one item');
      return;
    }

    try {
      await createSalesDelivery({
        delivery: {
          sales_order_id: parseInt(deliverySalesOrderId),
          scheduled_date: deliveryScheduledDate || undefined,
          tracking_number: deliveryTrackingNumber || undefined,
          notes: deliveryNotes || undefined,
        },
        items: deliveryItems,
      }).unwrap();
      toast.success('Sales delivery created successfully!');

      // Reset form
      setDeliverySalesOrderId('');
      setDeliveryScheduledDate('');
      setDeliveryTrackingNumber('');
      setDeliveryNotes('');
      setDeliveryItems([]);
      refetchSalesDeliveries();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to create delivery';
      toast.error(errorMessage);
      console.error('Delivery error:', error);
    }
  };

  const handleCompleteDelivery = async (deliveryId: number) => {
    if (!confirm('Are you sure you want to mark this delivery as completed? This will update inventory.')) {
      return;
    }

    try {
      const result = await completeSalesDelivery(deliveryId).unwrap();
      toast.success('Delivery completed successfully!');
      if (result.messages && result.messages.length > 0) {
        result.messages.forEach((msg: string) => toast.info(msg));
      }
      refetchSalesDeliveries();
      refetchSalesOrders();
    } catch (error: any) {
      const errorMessage = error.data?.detail || 'Failed to complete delivery';
      toast.error(errorMessage);
      console.error('Complete delivery error:', error);
    }
  };

  const handleViewDeliveryDetails = (delivery: SalesDelivery) => {
    setSelectedDeliveryForDetails(delivery);
  };

  const handleCloseDeliveryDetails = () => {
    setSelectedDeliveryForDetails(null);
  };

  // Helper function to get factory name by ID
  const getFactoryName = (factoryId: number): string => {
    const factory = factories?.find(f => f.id === factoryId);
    return factory ? factory.name : 'Unknown Factory';
  };

  // Helper function to get account name by ID
  const getAccountName = (accountId: number): string => {
    const account = accounts?.find(a => a.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  // Helper function to get item name by ID
  const getItemName = (itemId: number): string => {
    const item = items?.find(i => i.id === itemId);
    return item ? item.name : 'Unknown Item';
  };

  const getLineName = (lineId: number): string => {
    const line = productionLines?.find(l => l.id === lineId);
    return line ? line.name : `Line #${lineId}`;
  };

  const getFormulaName = (formulaId: number): string => {
    const formula = productionFormulas?.find(f => f.id === formulaId);
    return formula ? `${formula.formula_code} - ${formula.name}` : `Formula #${formulaId}`;
  };

  // ─── Machine Handlers ────────────────────────────────────────────
  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName || !machineSectionId) {
      toast.error('Please provide machine name and select a factory section');
      return;
    }
    try {
      await createMachine({
        name: machineName,
        factory_section_id: parseInt(machineSectionId),
        model_number: machineModelNumber || undefined,
        manufacturer: machineManufacturer || undefined,
        next_maintenance_schedule: machineMaintenanceDate || undefined,
        next_maintenance_note: machineMaintenanceNote || undefined,
        note: machineNote || undefined,
      }).unwrap();
      toast.success(`Machine "${machineName}" created!`);
      handleCancelMachineEdit();
      refetchMachines();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create machine');
    }
  };

  const handleEditMachine = (machine: Machine) => {
    setEditingMachine(machine);
    setMachineName(machine.name);
    setMachineSectionId(machine.factory_section_id.toString());
    setMachineModelNumber(machine.model_number || '');
    setMachineManufacturer(machine.manufacturer || '');
    setMachineMaintenanceDate(machine.next_maintenance_schedule || '');
    setMachineMaintenanceNote(machine.next_maintenance_note || '');
    setMachineNote(machine.note || '');
  };

  const handleUpdateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachine) return;
    try {
      await updateMachine({
        id: editingMachine.id,
        data: {
          name: machineName || undefined,
          factory_section_id: machineSectionId ? parseInt(machineSectionId) : undefined,
          model_number: machineModelNumber || undefined,
          manufacturer: machineManufacturer || undefined,
          next_maintenance_schedule: machineMaintenanceDate || undefined,
          next_maintenance_note: machineMaintenanceNote || undefined,
          note: machineNote || undefined,
        },
      }).unwrap();
      toast.success(`Machine "${machineName}" updated!`);
      handleCancelMachineEdit();
      refetchMachines();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to update machine');
    }
  };

  const handleCancelMachineEdit = () => {
    setEditingMachine(null);
    setMachineName('');
    setMachineSectionId('');
    setMachineModelNumber('');
    setMachineManufacturer('');
    setMachineMaintenanceDate('');
    setMachineMaintenanceNote('');
    setMachineNote('');
  };

  const handleDeleteMachine = async (machine: Machine) => {
    if (!confirm(`Are you sure you want to delete "${machine.name}"?`)) return;
    try {
      await deleteMachine(machine.id).unwrap();
      toast.success(`Machine "${machine.name}" deleted!`);
      if (selectedMachineForEvents?.id === machine.id) {
        setSelectedMachineForEvents(null);
      }
      refetchMachines();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to delete machine');
    }
  };

  const handleCreateMachineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineForEvents) return;
    try {
      await createMachineEvent({
        machine_id: selectedMachineForEvents.id,
        data: {
          machine_id: selectedMachineForEvents.id,
          event_type: eventType,
          note: eventNote || undefined,
        },
      }).unwrap();
      toast.success(`Event "${eventType}" created for "${selectedMachineForEvents.name}"`);
      setEventNote('');
      refetchMachineEvents();
      refetchMachines();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create event');
    }
  };

  // ─── Machine Maintenance Log Handlers ────────────────────────
  const resetMaintenanceForm = () => {
    setMaintenanceType('PREVENTIVE');
    setMaintenanceDate(new Date().toISOString().split('T')[0]);
    setMaintenanceSummary('');
    setMaintenanceCost('');
    setMaintenancePerformedBy('');
    setEditingMaintenanceLog(null);
  };

  const handleCreateMaintenanceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachineForMaintenance) return;
    try {
      await createMaintenanceLog({
        machine_id: selectedMachineForMaintenance.id,
        maintenance_type: maintenanceType,
        maintenance_date: maintenanceDate,
        summary: maintenanceSummary,
        cost: maintenanceCost ? parseFloat(maintenanceCost) : undefined,
        performed_by: maintenancePerformedBy || undefined,
      }).unwrap();
      toast.success('Maintenance log created!');
      resetMaintenanceForm();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create maintenance log');
    }
  };

  const handleEditMaintenanceLog = (log: MachineMaintenanceLog) => {
    setEditingMaintenanceLog(log);
    setMaintenanceType(log.maintenance_type);
    setMaintenanceDate(log.maintenance_date);
    setMaintenanceSummary(log.summary);
    setMaintenanceCost(log.cost?.toString() || '');
    setMaintenancePerformedBy(log.performed_by || '');
  };

  const handleUpdateMaintenanceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaintenanceLog) return;
    try {
      await updateMaintenanceLog({
        id: editingMaintenanceLog.id,
        data: {
          maintenance_type: maintenanceType,
          maintenance_date: maintenanceDate,
          summary: maintenanceSummary,
          cost: maintenanceCost ? parseFloat(maintenanceCost) : undefined,
          performed_by: maintenancePerformedBy || undefined,
        },
      }).unwrap();
      toast.success('Maintenance log updated!');
      resetMaintenanceForm();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to update maintenance log');
    }
  };

  const handleDeleteMaintenanceLog = async (log: MachineMaintenanceLog) => {
    if (!confirm(`Delete maintenance log from ${log.maintenance_date}?`)) return;
    try {
      await deleteMaintenanceLog(log.id).unwrap();
      toast.success('Maintenance log deleted!');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to delete maintenance log');
    }
  };

  // ─── Unified Inventory Handlers ──────────────────────────────
  const resetInvForm = () => {
    setInvItemId('');
    setInvFactoryId('');
    setInvType('STORAGE');
    setInvQty('0');
    setInvAvgPrice('');
    setInvNote('');
    setEditingInv(null);
  };

  const handleCreateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInventory({
        item_id: parseInt(invItemId),
        factory_id: parseInt(invFactoryId),
        inventory_type: invType,
        qty: parseInt(invQty),
        avg_price: invAvgPrice ? parseFloat(invAvgPrice) : undefined,
        note: invNote || undefined,
      }).unwrap();
      toast.success('Inventory record created!');
      resetInvForm();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create inventory');
    }
  };

  const handleEditInventory = (inv: Inventory) => {
    setEditingInv(inv);
    setInvQty(inv.qty.toString());
    setInvAvgPrice(inv.avg_price?.toString() || '');
    setInvNote(inv.note || '');
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInv) return;
    try {
      await updateInventory({
        id: editingInv.id,
        data: {
          qty: parseInt(invQty),
          avg_price: invAvgPrice ? parseFloat(invAvgPrice) : undefined,
          note: invNote || undefined,
        },
      }).unwrap();
      toast.success('Inventory updated!');
      resetInvForm();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to update inventory');
    }
  };

  const handleDeleteInventory = async (inv: Inventory) => {
    if (!confirm(`Delete inventory record #${inv.id}?`)) return;
    try {
      await deleteInventory(inv.id).unwrap();
      toast.success('Inventory deleted!');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to delete inventory');
    }
  };

  // ─── Products Handlers ──────────────────────────────────────
  const resetProdForm = () => {
    setProdItemId('');
    setProdFactoryId('');
    setProdQty('0');
    setProdAvgCost('');
    setProdSellingPrice('');
    setProdMinOrderQty('');
    setProdAvailableForSale(false);
    setProdNote('');
    setEditingProduct(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct({
        item_id: parseInt(prodItemId),
        factory_id: parseInt(prodFactoryId),
        qty: parseInt(prodQty),
        avg_cost: prodAvgCost ? parseFloat(prodAvgCost) : undefined,
        selling_price: prodSellingPrice ? parseFloat(prodSellingPrice) : undefined,
        min_order_qty: prodMinOrderQty ? parseInt(prodMinOrderQty) : undefined,
        is_available_for_sale: prodAvailableForSale,
        note: prodNote || undefined,
      }).unwrap();
      toast.success('Product created!');
      resetProdForm();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create product');
    }
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdQty(prod.qty.toString());
    setProdAvgCost(prod.avg_cost?.toString() || '');
    setProdSellingPrice(prod.selling_price?.toString() || '');
    setProdMinOrderQty(prod.min_order_qty?.toString() || '');
    setProdAvailableForSale(prod.is_available_for_sale);
    setProdNote(prod.note || '');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateProduct({
        id: editingProduct.id,
        data: {
          qty: parseInt(prodQty),
          avg_cost: prodAvgCost ? parseFloat(prodAvgCost) : undefined,
          selling_price: prodSellingPrice ? parseFloat(prodSellingPrice) : undefined,
          min_order_qty: prodMinOrderQty ? parseInt(prodMinOrderQty) : undefined,
          is_available_for_sale: prodAvailableForSale,
          note: prodNote || undefined,
        },
      }).unwrap();
      toast.success('Product updated!');
      resetProdForm();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!confirm(`Delete product record #${prod.id}?`)) return;
    try {
      await deleteProduct(prod.id).unwrap();
      toast.success('Product deleted!');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to delete product');
    }
  };

  // ─── Work Orders Handlers ────────────────────────────────────
  const resetWoForm = () => {
    setWoTitle('');
    setWoDescription('');
    setWoWorkType('MAINTENANCE');
    setWoPriority('MEDIUM');
    setWoFactoryId('');
    setWoMachineId('');
    setWoStartDate('');
    setWoEndDate('');
    setWoCost('');
    setWoAssignedTo('');
    setWoNotes('');
    setEditingWo(null);
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorkOrder({
        work_type: woWorkType,
        title: woTitle,
        description: woDescription || undefined,
        priority: woPriority,
        factory_id: parseInt(woFactoryId),
        machine_id: woMachineId ? parseInt(woMachineId) : undefined,
        start_date: woStartDate || undefined,
        end_date: woEndDate || undefined,
        cost: woCost ? parseFloat(woCost) : undefined,
        assigned_to: woAssignedTo || undefined,
        notes: woNotes || undefined,
      }).unwrap();
      toast.success('Work order created!');
      resetWoForm();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create work order');
    }
  };

  const handleEditWorkOrder = (wo: WorkOrder) => {
    setEditingWo(wo);
    setWoTitle(wo.title);
    setWoDescription(wo.description || '');
    setWoWorkType(wo.work_type);
    setWoPriority(wo.priority);
    setWoMachineId(wo.machine_id?.toString() || '');
    setWoStartDate(wo.start_date || '');
    setWoEndDate(wo.end_date || '');
    setWoCost(wo.cost?.toString() || '');
    setWoAssignedTo(wo.assigned_to || '');
    setWoNotes(wo.notes || '');
  };

  const handleUpdateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWo) return;
    try {
      await updateWorkOrder({
        id: editingWo.id,
        data: {
          work_type: woWorkType,
          title: woTitle,
          description: woDescription || undefined,
          priority: woPriority,
          machine_id: woMachineId ? parseInt(woMachineId) : undefined,
          start_date: woStartDate || undefined,
          end_date: woEndDate || undefined,
          cost: woCost ? parseFloat(woCost) : undefined,
          assigned_to: woAssignedTo || undefined,
          notes: woNotes || undefined,
        },
      }).unwrap();
      toast.success('Work order updated!');
      resetWoForm();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to update work order');
    }
  };

  const handleDeleteWorkOrder = async (wo: WorkOrder) => {
    if (!confirm(`Delete work order ${wo.work_order_number}?`)) return;
    try {
      await deleteWorkOrder(wo.id).unwrap();
      toast.success('Work order deleted!');
      if (selectedWoId === wo.id) setSelectedWoId(null);
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to delete work order');
    }
  };

  const handleApproveOrder = async (wo: WorkOrder) => {
    try {
      await updateWorkOrder({ id: wo.id, data: { order_approved: true } }).unwrap();
      toast.success('Order approved!');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to approve order');
    }
  };

  const handleApproveCost = async (wo: WorkOrder) => {
    try {
      await updateWorkOrder({ id: wo.id, data: { cost_approved: true } }).unwrap();
      toast.success('Cost approved!');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to approve cost');
    }
  };

  const handleUpdateWoStatus = async (wo: WorkOrder, newStatus: WorkOrderStatus) => {
    try {
      await updateWorkOrder({ id: wo.id, data: { status: newStatus } }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to update status');
    }
  };

  const handleAddWoItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoId) return;
    try {
      await addWoItem({
        woId: selectedWoId,
        data: { item_id: parseInt(woItemId), quantity: parseInt(woItemQty) },
      }).unwrap();
      toast.success('Item added to work order!');
      setWoItemId('');
      setWoItemQty('1');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to add item');
    }
  };

  const handleRemoveWoItem = async (itemId: number) => {
    try {
      await removeWoItem(itemId).unwrap();
      toast.success('Item removed!');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to remove item');
    }
  };

  // ─── Machine Items Handlers ──────────────────────────────────
  const handleCreateMachineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMachineItem({
        machine_id: machineItemMachineId ? parseInt(machineItemMachineId) : selectedMachineForItems!.id,
        item_id: parseInt(machineItemItemId),
        qty: parseInt(machineItemQty),
        req_qty: machineItemReqQty ? parseInt(machineItemReqQty) : undefined,
        defective_qty: machineItemDefectiveQty ? parseInt(machineItemDefectiveQty) : undefined,
      }).unwrap();
      toast.success('Machine item created!');
      setMachineItemMachineId('');
      setMachineItemItemId('');
      setMachineItemQty('0');
      setMachineItemReqQty('');
      setMachineItemDefectiveQty('');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create machine item');
    }
  };

  const handleEditMachineItem = (mi: MachineItem) => {
    setEditingMachineItem(mi);
    setMachineItemQty(mi.qty.toString());
    setMachineItemReqQty(mi.req_qty?.toString() || '');
    setMachineItemDefectiveQty(mi.defective_qty?.toString() || '');
  };

  const handleUpdateMachineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMachineItem) return;
    try {
      await updateMachineItem({
        id: editingMachineItem.id,
        data: {
          qty: parseInt(machineItemQty),
          req_qty: machineItemReqQty ? parseInt(machineItemReqQty) : undefined,
          defective_qty: machineItemDefectiveQty ? parseInt(machineItemDefectiveQty) : undefined,
        },
      }).unwrap();
      toast.success('Machine item updated!');
      setEditingMachineItem(null);
      setMachineItemQty('0');
      setMachineItemReqQty('');
      setMachineItemDefectiveQty('');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to update machine item');
    }
  };

  const handleCancelMachineItemEdit = () => {
    setEditingMachineItem(null);
    setMachineItemQty('0');
    setMachineItemReqQty('');
    setMachineItemDefectiveQty('');
  };

  const handleDeleteMachineItem = async (mi: MachineItem) => {
    if (!confirm(`Are you sure you want to remove item #${mi.item_id} from machine #${mi.machine_id}?`)) return;
    try {
      await deleteMachineItem(mi.id).unwrap();
      toast.success('Machine item removed!');
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to delete machine item');
    }
  };

  const getSectionName = (sectionId: number): string => {
    const section = sections?.find(s => s.id === sectionId);
    return section ? section.name : `Section #${sectionId}`;
  };

  // ─── Production Line Handlers ──────────────────────────────────
  const handleCreateProdLine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProdLine({
        name: prodLineName,
        factory_id: parseInt(prodLineFactoryId),
        machine_id: prodLineMachineId ? parseInt(prodLineMachineId) : undefined,
        description: prodLineDescription || undefined,
      }).unwrap();
      toast.success('Production line created!');
      setProdLineName(''); setProdLineDescription(''); setProdLineFactoryId(''); setProdLineMachineId('');
      refetchProdLines();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create production line');
    }
  };

  const handleDeleteProdLine = async (id: number) => {
    try {
      await deleteProdLine(id).unwrap();
      toast.success('Production line deleted');
      refetchProdLines();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to delete');
    }
  };

  // ─── Production Formula Handlers ───────────────────────────────
  const handleCreateFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFormula({
        formula_code: formulaCode,
        name: formulaName,
        description: formulaDescription || undefined,
        estimated_duration_minutes: formulaDuration ? parseInt(formulaDuration) : undefined,
        is_default: formulaIsDefault,
      }).unwrap();
      toast.success('Formula created!');
      setFormulaCode(''); setFormulaName(''); setFormulaDescription('');
      setFormulaDuration(''); setFormulaIsDefault(false);
      refetchFormulas();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create formula');
    }
  };

  const handleDeleteFormula = async (id: number) => {
    try {
      await deleteFormula(id).unwrap();
      toast.success('Formula deleted');
      if (selectedFormula?.id === id) setSelectedFormula(null);
      refetchFormulas();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to delete');
    }
  };

  const handleAddFormulaItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormula) return;
    try {
      await addFormulaItem({
        formulaId: selectedFormula.id,
        data: {
          formula_id: selectedFormula.id,
          item_id: parseInt(fiItemId),
          item_role: fiRole,
          quantity: parseInt(fiQuantity),
          unit: fiUnit || undefined,
        },
      }).unwrap();
      toast.success('Item added to formula!');
      setFiItemId(''); setFiQuantity(''); setFiUnit('');
      refetchFormulaItems();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to add formula item');
    }
  };

  const handleRemoveFormulaItem = async (id: number) => {
    try {
      await removeFormulaItem(id).unwrap();
      toast.success('Formula item removed');
      refetchFormulaItems();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to remove');
    }
  };

  // ─── Production Batch Handlers ─────────────────────────────────
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBatch({
        production_line_id: parseInt(batchLineId),
        formula_id: batchFormulaId ? parseInt(batchFormulaId) : undefined,
        batch_date: batchDate,
        shift: batchShift || undefined,
        notes: batchNotes || undefined,
      }).unwrap();
      toast.success('Batch created!');
      setBatchLineId(''); setBatchFormulaId(''); setBatchShift(''); setBatchNotes('');
      refetchBatches();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to create batch');
    }
  };

  const handleStartBatch = async (batchId: number) => {
    try {
      const updatedBatch = await startBatch({
        id: batchId,
        data: { target_output_quantity: startTargetQty ? parseInt(startTargetQty) : undefined },
      }).unwrap();
      toast.success('Batch started! Items populated from formula.');
      setStartTargetQty('');
      setBatchItemActualQtys({}); // Clear any previous edits
      refetchBatches();
      // Auto-select this batch to show the populated items
      setSelectedBatch(updatedBatch);
      // Refetch batch items after a short delay to ensure cache is updated
      setTimeout(() => refetchBatchItems(), 100);
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to start batch');
    }
  };

  // Handler to update actual quantity for a batch item
  const handleUpdateBatchItemActualQty = async (batchItemId: number) => {
    const actualQtyStr = batchItemActualQtys[batchItemId];
    if (actualQtyStr === undefined || actualQtyStr === '') {
      toast.error('Please enter an actual quantity');
      return;
    }
    try {
      await updateBatchItem({
        id: batchItemId,
        data: { actual_quantity: parseInt(actualQtyStr) },
      }).unwrap();
      toast.success('Actual quantity updated');
      refetchBatchItems();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to update');
    }
  };

  // Handler to update all batch item actual quantities at once
  const handleSaveAllActualQuantities = async () => {
    const entries = Object.entries(batchItemActualQtys).filter(([_, val]) => val !== '');
    if (entries.length === 0) {
      toast.error('No actual quantities entered');
      return;
    }
    try {
      for (const [idStr, qtyStr] of entries) {
        await updateBatchItem({
          id: parseInt(idStr),
          data: { actual_quantity: parseInt(qtyStr) },
        }).unwrap();
      }
      toast.success(`Updated ${entries.length} item(s)`);
      refetchBatchItems();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to save quantities');
    }
  };

  const handleCompleteBatch = async (batchId: number) => {
    try {
      await completeBatch({
        id: batchId,
        data: {
          actual_output_quantity: completeActualQty ? parseInt(completeActualQty) : undefined,
          actual_duration_minutes: completeActualDuration ? parseInt(completeActualDuration) : undefined,
          notes: completeNotes || undefined,
        },
      }).unwrap();
      toast.success('Batch completed!');
      setCompleteActualQty(''); setCompleteActualDuration(''); setCompleteNotes('');
      refetchBatches();
      if (selectedBatch?.id === batchId) refetchBatchItems();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to complete batch');
    }
  };

  const handleCancelBatch = async (batchId: number) => {
    try {
      await cancelBatch({
        id: batchId,
        data: { notes: cancelNotes || undefined },
      }).unwrap();
      toast.success('Batch cancelled');
      setCancelNotes('');
      refetchBatches();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to cancel batch');
    }
  };

  const handleAddBatchItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;
    try {
      await addBatchItem({
        batchId: selectedBatch.id,
        data: {
          batch_id: selectedBatch.id,
          item_id: parseInt(biItemId),
          item_role: biRole,
          expected_quantity: biExpectedQty ? parseInt(biExpectedQty) : undefined,
          actual_quantity: biActualQty ? parseInt(biActualQty) : undefined,
        },
      }).unwrap();
      toast.success('Item added to batch!');
      setBiItemId(''); setBiExpectedQty(''); setBiActualQty('');
      refetchBatchItems();
    } catch (error: any) {
      toast.error(error.data?.detail || 'Failed to add batch item');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">API Connection Test</h1>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-medium mr-2">API URL:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                {import.meta.env.VITE_API_URL || 'Not configured'}
              </code>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-2">Authentication:</span>
              <span className={`px-2 py-1 rounded text-sm ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
              </span>
            </div>
            {token && (
              <div className="flex items-center">
                <span className="font-medium mr-2">Token:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {token.substring(0, 20)}...
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Login / Register Forms */}
        {!isAuthenticated && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            {/* Toggle between Login and Register */}
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setShowRegister(false)}
                className={`px-4 py-2 rounded-md font-medium ${!showRegister ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Login
              </button>
              <button
                onClick={() => setShowRegister(true)}
                className={`px-4 py-2 rounded-md font-medium ${showRegister ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {!showRegister && (
              <>
                <h2 className="text-xl font-semibold mb-4">Login Test</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoggingIn ? 'Logging in...' : 'Test Login'}
                  </button>
                </form>
              </>
            )}

            {/* Register Form */}
            {showRegister && (
              <>
                <h2 className="text-xl font-semibold mb-4">Register Test</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 8 chars)</label>
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter password"
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name *</label>
                    <input
                      type="text"
                      value={registerWorkspaceName}
                      onChange={(e) => setRegisterWorkspaceName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="My Company"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">A new workspace will be created and you will be the owner.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position (optional)</label>
                    <input
                      type="text"
                      value={registerPosition}
                      onChange={(e) => setRegisterPosition(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Manager, Engineer, etc."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? 'Registering...' : 'Test Register'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* User Info */}
        {isAuthenticated && user && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Permission:</span>
                  <p className="text-gray-900">{user.permission}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <p className="text-gray-900">{user.position}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}

        {/* Workspaces */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Workspaces</h2>
              <button
                onClick={() => setShowCreateWorkspace(!showCreateWorkspace)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                {showCreateWorkspace ? 'Cancel' : '+ Create Workspace'}
              </button>
            </div>

            {/* Create Workspace Form */}
            {showCreateWorkspace && (
              <form onSubmit={handleCreateWorkspace} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-3">Create New Workspace</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="My Company"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (auto-generated)
                    </label>
                    <input
                      type="text"
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="my-company"
                      pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                      title="Lowercase letters, numbers, and hyphens only"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lowercase letters, numbers, and hyphens only
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingWorkspace}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isCreatingWorkspace ? 'Creating...' : 'Create Workspace'}
                  </button>
                </div>
              </form>
            )}

            {isLoadingWorkspaces ? (
              <p className="text-gray-600">Loading workspaces...</p>
            ) : workspaces && workspaces.length > 0 ? (
              <div className="space-y-3">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{ws.name}</h3>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>Slug: <span className="font-medium text-gray-900">{ws.slug}</span></p>
                          <p>Role: <span className="font-medium text-gray-900">{ws.role}</span></p>
                          <p>Subscription: <span className="font-medium text-gray-900">{ws.subscription_status}</span></p>
                          {ws.is_owner && (
                            <p className="text-blue-600 font-medium">👑 Owner</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${workspace?.id === ws.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {workspace?.id === ws.id ? 'Active' : 'Available'}
                        </span>
                        {workspace?.id !== ws.id && (
                          <button
                            onClick={() => handleSelectWorkspace(ws)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No workspaces found</p>
            )}
          </div>
        )}

        {/* Items Section (Parts/Inventory Management) */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Items Management (Active Workspace: {workspace.name})
              </h2>
              <button
                onClick={() => setShowTagManager(!showTagManager)}
                className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                {showTagManager ? 'Hide' : 'Manage'} Tags
              </button>
            </div>

            {/* Tag Management Section */}
            {showTagManager && (
              <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h3 className="font-semibold mb-3 text-indigo-900">Tag Management</h3>

                {/* Create Tag Form */}
                <form onSubmit={handleCreateTag} className="mb-4 p-3 bg-white rounded border border-indigo-100">
                  <h4 className="text-sm font-medium mb-2">Create New Tag</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="Tag Name (e.g., Hardware)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <textarea
                        value={newTagDescription}
                        onChange={(e) => setNewTagDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <button
                        type="submit"
                        disabled={isCreatingTag}
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                      >
                        {isCreatingTag ? 'Creating...' : 'Create Tag'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Tags List */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Existing Tags</h4>
                  {isLoadingTags ? (
                    <p className="text-sm text-gray-600">Loading tags...</p>
                  ) : tags && tags.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                        >
                          <span
                            className="text-sm px-2 py-1 rounded-full text-white flex-1 text-center"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          >
                            {tag.name}
                            {tag.is_system_tag && <span className="ml-1 text-xs">(System)</span>}
                          </span>
                          {!tag.is_system_tag && (
                            <button
                              onClick={() => handleDeleteTag(tag.id, tag.name, tag.is_system_tag)}
                              className="ml-2 text-red-600 hover:text-red-800 text-xs"
                              title="Delete tag"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No tags available</p>
                  )}
                </div>
              </div>
            )}

            {/* Create/Edit Item Form */}
            <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">{editingItem ? 'Edit Item' : 'Create New Item'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Cotton Yarn"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="L">Liters (L)</option>
                    <option value="m">Meters (m)</option>
                    <option value="box">Box</option>
                    <option value="set">Set</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Brief description"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (Select all that apply)
                  </label>
                  {isLoadingTags ? (
                    <p className="text-sm text-gray-500">Loading tags...</p>
                  ) : tags && tags.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {tags.map((tag) => (
                        <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTagIds.includes(tag.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTagIds([...selectedTagIds, tag.id]);
                              } else {
                                setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id));
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span
                            className="text-sm px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          >
                            {tag.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tags available</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={isCreatingItem || isUpdatingItem}
                  className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {editingItem ? (isUpdatingItem ? 'Updating...' : 'Update Item') : (isCreatingItem ? 'Creating...' : 'Create Item')}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Search items by name..."
              />
            </div>

            {/* Items List */}
            <div>
              <h3 className="font-semibold mb-3">Items List</h3>
              {isLoadingItems ? (
                <p className="text-gray-600">Loading items...</p>
              ) : items && items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.name}</h4>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          <p>Unit: <span className="font-medium text-gray-900">{item.unit}</span></p>
                          {item.description && <p>Description: <span className="text-gray-700">{item.description}</span></p>}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="text-xs px-2 py-1 rounded-full text-white"
                                  style={{ backgroundColor: tag.color || '#6B7280' }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs">
                            Status: <span className={`font-medium ${item.is_active ? 'text-green-600' : 'text-red-600'}`}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleManageItemTags(item)}
                          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                        >
                          Tags
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          disabled={isDeletingItem}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No items found. Create your first item above!</p>
              )}
            </div>
          </div>
        )}

        {/* Accounts Section */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Accounts Management (Active Workspace: {workspace.name})
              </h2>
              <button
                onClick={() => setShowAccountTagManager(!showAccountTagManager)}
                className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
              >
                {showAccountTagManager ? 'Hide' : 'Manage'} Account Tags
              </button>
            </div>

            {/* Account Tag Management Section */}
            {showAccountTagManager && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold mb-3 text-purple-900">Account Tag Management</h3>

                {/* Create Account Tag Form */}
                <form onSubmit={handleCreateAccountTag} className="mb-4 p-3 bg-white rounded border border-purple-100">
                  <h4 className="text-sm font-medium mb-2">Create New Account Tag</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        value={newAccountTagName}
                        onChange={(e) => setNewAccountTagName(e.target.value)}
                        placeholder="Tag Name (e.g., Supplier)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <textarea
                        value={newAccountTagDescription}
                        onChange={(e) => setNewAccountTagDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newAccountTagColor}
                        onChange={(e) => setNewAccountTagColor(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <button
                        type="submit"
                        disabled={isCreatingAccountTag}
                        className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 text-sm"
                      >
                        {isCreatingAccountTag ? 'Creating...' : 'Create Tag'}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Account Tags List */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Existing Account Tags</h4>
                  {isLoadingAccountTags ? (
                    <p className="text-sm text-gray-600">Loading account tags...</p>
                  ) : accountTags && accountTags.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {accountTags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                        >
                          <span
                            className="text-sm px-2 py-1 rounded-full text-white flex-1 text-center"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          >
                            {tag.name}
                            {tag.is_system_tag && <span className="ml-1 text-xs">(System)</span>}
                          </span>
                          {!tag.is_system_tag && (
                            <button
                              onClick={() => handleDeleteAccountTag(tag.id, tag.name, tag.is_system_tag)}
                              className="ml-2 text-red-600 hover:text-red-800 text-xs"
                              title="Delete tag"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No account tags available</p>
                  )}
                </div>
              </div>
            )}

            {/* Create/Edit Account Form */}
            <form onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">{editingAccount ? 'Edit Account' : 'Create New Account'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., ABC Suppliers"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., contact@abc.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={accountPhone}
                    onChange={(e) => setAccountPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., +1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={accountAddress}
                    onChange={(e) => setAccountAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 123 Main St, City"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  {accountTags && accountTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {accountTags.map((tag) => (
                        <label key={tag.id} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accountSelectedTagIds.includes(tag.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAccountSelectedTagIds([...accountSelectedTagIds, tag.id]);
                              } else {
                                setAccountSelectedTagIds(accountSelectedTagIds.filter(id => id !== tag.id));
                              }
                            }}
                            className="mr-1"
                          />
                          <span
                            className="text-xs px-2 py-1 rounded-full text-white"
                            style={{ backgroundColor: tag.color || '#6B7280' }}
                          >
                            {tag.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tags available. Create tags first.</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={editingAccount ? isUpdatingAccount : isCreatingAccount}
                  className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {editingAccount ? (isUpdatingAccount ? 'Updating...' : 'Update Account') : (isCreatingAccount ? 'Creating...' : 'Create Account')}
                </button>
                {editingAccount && (
                  <button
                    type="button"
                    onClick={handleCancelAccountEdit}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Search accounts by name..."
              />
            </div>

            {/* Accounts List */}
            <div>
              <h3 className="font-semibold mb-3">Accounts List</h3>
              {isLoadingAccounts ? (
                <p className="text-gray-600">Loading accounts...</p>
              ) : accounts && accounts.length > 0 ? (
                <div className="space-y-2">
                  {accounts.map((account) => (
                    <div key={account.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{account.name}</h4>
                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                          {account.primary_email && <p>Email: <span className="font-medium text-gray-900">{account.primary_email}</span></p>}
                          {account.primary_phone && <p>Phone: <span className="font-medium text-gray-900">{account.primary_phone}</span></p>}
                          {account.address && <p>Address: <span className="text-gray-700">{account.address}</span></p>}
                          {account.tags && account.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {account.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="text-xs px-2 py-1 rounded-full text-white"
                                  style={{ backgroundColor: tag.color || '#6B7280' }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs">
                            Status: <span className={`font-medium ${account.is_active ? 'text-green-600' : 'text-red-600'}`}>
                              {account.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditAccount(account)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account)}
                          disabled={isDeletingAccount}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No accounts found. Create your first account above!</p>
              )}
            </div>
          </div>
        )}

        {/* Factories Section */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Factories Management (Active Workspace: {workspace.name})
            </h2>

            {/* Create/Edit Factory Form */}
            <form onSubmit={editingFactory ? handleUpdateFactory : handleCreateFactory} className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Factory Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    placeholder="Factory Name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Abbreviation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={factoryAbbreviation}
                    onChange={(e) => setFactoryAbbreviation(e.target.value)}
                    placeholder="Abbreviation (e.g., F1, F2)"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingFactory || isUpdatingFactory}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {editingFactory ? 'Update Factory' : 'Create Factory'}
                </button>
                {editingFactory && (
                  <button
                    type="button"
                    onClick={handleCancelFactoryEdit}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={factorySearchQuery}
                onChange={(e) => setFactorySearchQuery(e.target.value)}
                placeholder="Search factories by name or abbreviation..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Factories List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Factories List</h3>
              {isLoadingFactories ? (
                <p className="text-gray-600">Loading factories...</p>
              ) : factories && factories.length > 0 ? (
                <div className="space-y-3">
                  {factories.map((factory) => (
                    <div
                      key={factory.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {factory.name}
                            <span className="ml-2 text-sm text-gray-500">({factory.abbreviation})</span>
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {factory.id}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditFactory(factory)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFactory(factory)}
                            disabled={isDeletingFactory}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No factories found. Create your first factory above!</p>
              )}
            </div>
          </div>
        )}

        {/* Factory Sections Section */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Factory Sections Management (Active Workspace: {workspace.name})
            </h2>

            {/* Create/Edit Factory Section Form */}
            <form onSubmit={editingSection ? handleUpdateSection : handleCreateSection} className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="Section Name (e.g., Spinning, Weaving)"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Factory <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={sectionFactoryId || ''}
                    onChange={(e) => setSectionFactoryId(e.target.value ? Number(e.target.value) : null)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a factory...</option>
                    {factories && factories.map(factory => (
                      <option key={factory.id} value={factory.id}>
                        {factory.name} ({factory.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingSection || isUpdatingSection}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {editingSection ? 'Update Section' : 'Create Section'}
                </button>
                {editingSection && (
                  <button
                    type="button"
                    onClick={handleCancelSectionEdit}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Search and Filter */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <input
                  type="text"
                  value={sectionSearchQuery}
                  onChange={(e) => setSectionSearchQuery(e.target.value)}
                  placeholder="Search sections by name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <select
                  value={sectionFilterFactoryId || ''}
                  onChange={(e) => setSectionFilterFactoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Factories</option>
                  {factories && factories.map(factory => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name} ({factory.abbreviation})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sections List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Factory Sections List</h3>
              {isLoadingSections ? (
                <p className="text-gray-600">Loading sections...</p>
              ) : sections && sections.length > 0 ? (
                <div className="space-y-3">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {section.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Factory: {getFactoryName(section.factory_id)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {section.id}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSection(section)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSection(section)}
                            disabled={isDeletingSection}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No sections found. Create your first section above!</p>
              )}
            </div>
          </div>
        )}

        {/* Departments Management */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Departments Management (Active Workspace: {workspace.name})
            </h2>

            {/* Create/Update Department Form */}
            <form onSubmit={handleCreateDepartment} className="mb-6">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Finance, Production, HR"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingDepartment || isUpdatingDepartment}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isCreatingDepartment || isUpdatingDepartment
                    ? (editingDepartment ? 'Updating...' : 'Creating...')
                    : (editingDepartment ? 'Update Department' : 'Create Department')}
                </button>
                {editingDepartment && (
                  <button
                    type="button"
                    onClick={handleCancelEditDepartment}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                value={departmentSearchQuery}
                onChange={(e) => setDepartmentSearchQuery(e.target.value)}
                placeholder="Search departments by name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Departments List */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Departments</h3>
              {isLoadingDepartments ? (
                <p className="text-gray-600">Loading departments...</p>
              ) : departments && departments.length > 0 ? (
                <div className="space-y-2">
                  {departments.map((department) => (
                    <div key={department.id} className="border border-gray-200 rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{department.name}</p>
                          <p className="text-xs text-gray-500">ID: {department.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditDepartment(department)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(department)}
                            disabled={isDeletingDepartment}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No departments found. Create your first department above!</p>
              )}
            </div>
          </div>
        )}

        {/* Projects Management */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Projects Management (Active Workspace: {workspace.name})
            </h2>

            {/* Create/Update Project Form */}
            <form onSubmit={handleCreateProject} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., New Factory Building"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Factory *
                  </label>
                  <select
                    value={projectFactoryId}
                    onChange={(e) => setProjectFactoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a factory</option>
                    {factories?.map((factory) => (
                      <option key={factory.id} value={factory.id}>
                        {factory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Project description"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 100000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={projectDeadline}
                    onChange={(e) => setProjectDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={projectPriority}
                    onChange={(e) => setProjectPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingProject || isUpdatingProject}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isCreatingProject || isUpdatingProject
                    ? (editingProject ? 'Updating...' : 'Creating...')
                    : (editingProject ? 'Update Project' : 'Create Project')}
                </button>
                {editingProject && (
                  <button
                    type="button"
                    onClick={handleCancelEditProject}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Projects List */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Projects</h3>
              {isLoadingProjects ? (
                <p className="text-gray-600">Loading projects...</p>
              ) : projects && projects.length > 0 ? (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{project.name}</p>
                            <span className={`px-2 py-0.5 text-xs rounded ${project.status === 'completed' ? 'bg-green-100 text-green-800' :
                              project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                                  project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                              }`}>
                              {project.status}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded ${project.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              project.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                project.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                              }`}>
                              {project.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>ID: {project.id}</span>
                            <span>Factory: {project.factory_id}</span>
                            {project.budget && <span>Budget: ${project.budget.toLocaleString()}</span>}
                            {project.deadline && <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project)}
                            disabled={isDeletingProject}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No projects found. Create your first project above!</p>
              )}
            </div>
          </div>
        )}

        {/* Project Components Management */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Project Components Management (Active Workspace: {workspace.name})
            </h2>

            {/* Create/Update Component Form */}
            <form onSubmit={handleCreateComponent} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component Name *
                  </label>
                  <input
                    type="text"
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project *
                  </label>
                  <select
                    value={componentProjectId}
                    onChange={(e) => setComponentProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={componentDescription}
                    onChange={(e) => setComponentDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={componentBudget}
                    onChange={(e) => setComponentBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={componentDeadline}
                    onChange={(e) => setComponentDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={componentStatus}
                    onChange={(e) => setComponentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingComponent || isUpdatingComponent}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {editingComponent ? 'Update Component' : 'Create Component'}
                </button>
                {editingComponent && (
                  <button
                    type="button"
                    onClick={handleCancelEditComponent}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Filter */}
            <div className="mb-4">
              <select
                value={filterComponentProjectId || ''}
                onChange={(e) => setFilterComponentProjectId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Projects</option>
                {projects?.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Components List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Components ({projectComponents?.length || 0})</h3>
              {isLoadingComponents ? (
                <p className="text-gray-600">Loading components...</p>
              ) : projectComponents && projectComponents.length > 0 ? (
                <div className="space-y-3">
                  {projectComponents.map((component) => (
                    <div key={component.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{component.name}</p>
                          <p className="text-sm text-gray-600 mb-2">{component.description}</p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>ID: {component.id}</span>
                            <span>Project: {component.project_id}</span>
                            <span>Status: {component.status}</span>
                            {component.budget && <span>Budget: ${component.budget.toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditComponent(component)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComponent(component)}
                            disabled={isDeletingComponent}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No components found. Create your first component above!</p>
              )}
            </div>
          </div>
        )}

        {/* Project Component Items Management */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Project Component Items Management (Active Workspace: {workspace.name})
            </h2>

            {/* Create/Update Component Item Form */}
            <form onSubmit={handleCreateComponentItem} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component *
                  </label>
                  <select
                    value={componentItemComponentId}
                    onChange={(e) => setComponentItemComponentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a component</option>
                    {projectComponents?.map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item *
                  </label>
                  <select
                    value={componentItemItemId}
                    onChange={(e) => setComponentItemItemId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select an item</option>
                    {items?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={componentItemQty}
                    onChange={(e) => setComponentItemQty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingComponentItem || isUpdatingComponentItem}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {editingComponentItem ? 'Update Item' : 'Create Item'}
                </button>
                {editingComponentItem && (
                  <button
                    type="button"
                    onClick={handleCancelEditComponentItem}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Filter */}
            <div className="mb-4">
              <select
                value={filterComponentItemComponentId || ''}
                onChange={(e) => setFilterComponentItemComponentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Components</option>
                {projectComponents?.map(component => (
                  <option key={component.id} value={component.id}>
                    {component.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Component Items List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Component Items ({projectComponentItems?.length || 0})</h3>
              {isLoadingComponentItems ? (
                <p className="text-gray-600">Loading component items...</p>
              ) : projectComponentItems && projectComponentItems.length > 0 ? (
                <div className="space-y-3">
                  {projectComponentItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex gap-4 text-sm text-gray-700">
                            <span>ID: {item.id}</span>
                            <span>Component: {item.project_component_id}</span>
                            <span>Item: {item.item_id}</span>
                            <span className="font-medium">Qty: {item.qty}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditComponentItem(item)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteComponentItem(item)}
                            disabled={isDeletingComponentItem}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No component items found. Create your first component item above!</p>
              )}
            </div>
          </div>
        )}

        {/* Project Component Tasks Management */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Project Component Tasks Management (Active Workspace: {workspace.name})
            </h2>

            {/* Create/Update Task Form */}
            <form onSubmit={handleCreateTask} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component *
                  </label>
                  <select
                    value={taskComponentId}
                    onChange={(e) => setTaskComponentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a component</option>
                    {projectComponents?.map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskIsNote}
                      onChange={(e) => setTaskIsNote(e.target.checked)}
                      className="mr-2 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Is Note</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingTask || isUpdatingTask}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                {editingTask && (
                  <button
                    type="button"
                    onClick={handleCancelEditTask}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Filter */}
            <div className="mb-4">
              <select
                value={filterTaskComponentId || ''}
                onChange={(e) => setFilterTaskComponentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Components</option>
                {projectComponents?.map(component => (
                  <option key={component.id} value={component.id}>
                    {component.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tasks List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tasks ({projectComponentTasks?.length || 0})</h3>
              {isLoadingTasks ? (
                <p className="text-gray-600">Loading tasks...</p>
              ) : projectComponentTasks && projectComponentTasks.length > 0 ? (
                <div className="space-y-3">
                  {projectComponentTasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="checkbox"
                              checked={task.is_completed}
                              onChange={() => handleToggleTaskComplete(task)}
                              className="h-4 w-4"
                            />
                            <p className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.name}
                            </p>
                            {task.is_note && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Note</span>}
                            {task.task_priority && (
                              <span className={`px-2 py-0.5 text-xs rounded ${task.task_priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                                task.task_priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                  task.task_priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {task.task_priority}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>ID: {task.id}</span>
                            <span>Component: {task.project_component_id}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task)}
                            disabled={isDeletingTask}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No tasks found. Create your first task above!</p>
              )}
            </div>
          </div>
        )}

        {/* Miscellaneous Project Costs Management */}
        {workspace && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Miscellaneous Project Costs Management (Active Workspace: {workspace.name})
            </h2>

            {/* Create/Update Cost Form */}
            <form onSubmit={handleCreateCost} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Name *
                  </label>
                  <input
                    type="text"
                    value={costName}
                    onChange={(e) => setCostName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costAmount}
                    onChange={(e) => setCostAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={costDescription}
                    onChange={(e) => setCostDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project (optional)
                  </label>
                  <select
                    value={costProjectId}
                    onChange={(e) => setCostProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {projects?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component (optional)
                  </label>
                  <select
                    value={costComponentId}
                    onChange={(e) => setCostComponentId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {projectComponents?.map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreatingCost || isUpdatingCost}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {editingCost ? 'Update Cost' : 'Create Cost'}
                </button>
                {editingCost && (
                  <button
                    type="button"
                    onClick={handleCancelEditCost}
                    className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <select
                  value={filterCostProjectId || ''}
                  onChange={(e) => setFilterCostProjectId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Projects</option>
                  {projects?.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterCostComponentId || ''}
                  onChange={(e) => setFilterCostComponentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Components</option>
                  {projectComponents?.map(component => (
                    <option key={component.id} value={component.id}>
                      {component.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Costs List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Costs ({miscellaneousCosts?.length || 0})</h3>
              {isLoadingCosts ? (
                <p className="text-gray-600">Loading costs...</p>
              ) : miscellaneousCosts && miscellaneousCosts.length > 0 ? (
                <div className="space-y-3">
                  {miscellaneousCosts.map((cost) => (
                    <div key={cost.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{cost.name}</p>
                            <span className="px-2 py-1 text-sm bg-green-100 text-green-800 rounded font-medium">
                              ${cost.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{cost.description}</p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>ID: {cost.id}</span>
                            {cost.project_id && <span>Project: {cost.project_id}</span>}
                            {cost.project_component_id && <span>Component: {cost.project_component_id}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditCost(cost)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCost(cost)}
                            disabled={isDeletingCost}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No costs found. Create your first cost above!</p>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
            <li>Enter your email and password from the backend</li>
            <li>Click "Test Login" to authenticate with the FastAPI backend</li>
            <li>If successful, you'll see your user info and workspaces</li>
            <li>Click "Select" on a workspace to activate it for API calls</li>
            <li>Click "+ Create Workspace" to create a new workspace</li>
            <li>Once a workspace is selected, test Items APIs: Create, Edit, Delete, Search</li>
            <li>Check the browser console for detailed request/response data</li>
          </ol>
        </div>
      </div>

      {/* Tag Management Modal */}
      {managingTagsForItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Manage Tags: {managingTagsForItem.name}
              </h3>
              <button
                onClick={() => {
                  setManagingTagsForItem(null);
                  setItemTagIds([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Select tags to assign to this item:
              </p>
              {isLoadingTags ? (
                <p className="text-sm text-gray-500">Loading tags...</p>
              ) : tags && tags.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tags.map((tag) => (
                    <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={itemTagIds.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setItemTagIds([...itemTagIds, tag.id]);
                          } else {
                            setItemTagIds(itemTagIds.filter(id => id !== tag.id));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span
                        className="text-sm px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: tag.color || '#6B7280' }}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tags available</p>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setManagingTagsForItem(null);
                  setItemTagIds([]);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItemTags}
                disabled={isUpdatingItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {isUpdatingItem ? 'Saving...' : 'Save Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Invoices Section */}
      {workspace && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Invoices (Active Workspace: {workspace.name})
          </h2>

          {/* Create/Update Invoice Form */}
          <form onSubmit={handleCreateInvoice} className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-3 text-blue-900">{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
                <select
                  value={invoiceAccountId}
                  onChange={(e) => setInvoiceAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Account</option>
                  {accounts?.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type *</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value as 'payable' | 'receivable')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="payable">Payable (We Owe)</option>
                  <option value="receivable">Receivable (They Owe)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 1000.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., INV-2025-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date *</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Invoice description"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={isCreatingInvoice || isUpdatingInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isCreatingInvoice || isUpdatingInvoice ? 'Saving...' : editingInvoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
              {editingInvoice && (
                <button
                  type="button"
                  onClick={handleCancelEditInvoice}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Invoices List */}
          <div>
            <h3 className="font-semibold mb-3">Invoices</h3>
            {isLoadingInvoices ? (
              <p className="text-gray-600">Loading invoices...</p>
            ) : invoices && invoices.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {invoices.map((invoice) => {
                  const account = accounts?.find(a => a.id === invoice.account_id);
                  return (
                    <div key={invoice.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">
                            {invoice.invoice_type === 'payable' ? '📤 Payable' : '📥 Receivable'} - {account?.name || 'Unknown Account'}
                          </h4>
                          <p className="text-sm text-gray-600">Invoice #: {invoice.invoice_number || invoice.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleViewPayments(invoice)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Payments
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice)}
                            disabled={invoice.paid_amount > 0}
                            className="text-red-600 hover:text-red-800 text-sm disabled:text-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <span className="ml-1 font-medium">${invoice.invoice_amount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Paid:</span>
                          <span className="ml-1 font-medium">${invoice.paid_amount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Outstanding:</span>
                          <span className="ml-1 font-medium">${invoice.outstanding_amount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              invoice.payment_status === 'overdue' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {invoice.payment_status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-gray-600">Invoice Date:</span>
                          <span className="ml-1">{invoice.invoice_date}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Due Date:</span>
                          <span className="ml-1">{invoice.due_date || 'N/A'}</span>
                        </div>
                      </div>
                      {invoice.description && (
                        <p className="text-sm text-gray-600 mt-2">{invoice.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600">No invoices found</p>
            )}
          </div>
        </div>
      )}

      {/* Payments Modal */}
      {selectedInvoiceForPayments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Payments for Invoice #{selectedInvoiceForPayments.invoice_number || selectedInvoiceForPayments.id}
              </h2>
              <button
                onClick={handleClosePayments}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Invoice Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-1 font-semibold">${selectedInvoiceForPayments.invoice_amount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Paid:</span>
                  <span className="ml-1 font-semibold text-green-600">${selectedInvoiceForPayments.paid_amount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Outstanding:</span>
                  <span className="ml-1 font-semibold text-red-600">${selectedInvoiceForPayments.outstanding_amount}</span>
                </div>
              </div>
            </div>

            {/* Add Payment Form */}
            {selectedInvoiceForPayments.outstanding_amount > 0 && (
              <form onSubmit={handleCreatePayment} className="mb-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold mb-3 text-green-900">Record New Payment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      max={selectedInvoiceForPayments.outstanding_amount}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., 500.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Bank Transfer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., CHQ-12345"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Payment notes"
                      rows={2}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isCreatingPayment}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isCreatingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </form>
            )}

            {/* Payments List */}
            <div>
              <h3 className="font-semibold mb-3">Payment History</h3>
              {isLoadingPayments ? (
                <p className="text-gray-600">Loading payments...</p>
              ) : payments && payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-green-600">${payment.payment_amount}</p>
                          <p className="text-sm text-gray-600">Date: {payment.payment_date}</p>
                          {payment.payment_method && (
                            <p className="text-sm text-gray-600">Method: {payment.payment_method}</p>
                          )}
                          {payment.payment_reference && (
                            <p className="text-sm text-gray-600">Ref: {payment.payment_reference}</p>
                          )}
                          {payment.notes && (
                            <p className="text-sm text-gray-600 italic">Note: {payment.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No payments recorded yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Management Section */}
      {workspace && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sales Management (Active Workspace: {workspace.name})
          </h2>

          {/* Sales Orders Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Sales Orders</h3>

            {/* Create Sales Order Form */}
            <form onSubmit={handleCreateSalesOrder} className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-900">Create New Sales Order</h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Account *</label>
                  <select
                    value={salesOrderAccountId}
                    onChange={(e) => setSalesOrderAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Customer</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factory *</label>
                  <select
                    value={salesOrderFactoryId}
                    onChange={(e) => setSalesOrderFactoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Factory</option>
                    {factories?.map((factory) => (
                      <option key={factory.id} value={factory.id}>
                        {factory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    value={salesOrderDate}
                    onChange={(e) => setSalesOrderDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Sent Date</label>
                  <input
                    type="date"
                    value={salesOrderQuotationDate}
                    onChange={(e) => setSalesOrderQuotationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={salesOrderExpectedDeliveryDate}
                    onChange={(e) => setSalesOrderExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={salesOrderNotes}
                    onChange={(e) => setSalesOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Order notes"
                  />
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h5 className="font-medium mb-3">Order Items</h5>

                {/* Add Item Form */}
                <div className="grid grid-cols-5 gap-3 mb-3">
                  <div>
                    <select
                      value={salesOrderItemId}
                      onChange={(e) => setSalesOrderItemId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select Item</option>
                      {items?.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={salesOrderItemQty}
                      onChange={(e) => setSalesOrderItemQty(e.target.value)}
                      placeholder="Quantity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={salesOrderItemPrice}
                      onChange={(e) => setSalesOrderItemPrice(e.target.value)}
                      placeholder="Unit Price"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={salesOrderItemNotes}
                      onChange={(e) => setSalesOrderItemNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddSalesOrderItem}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {salesOrderItems.length > 0 && (
                  <div className="space-y-2">
                    {salesOrderItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
                        <div className="flex-1">
                          <span className="font-medium">{getItemName(item.item_id)}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            Qty: {item.quantity_ordered} × ${item.unit_price} = ${(item.quantity_ordered * item.unit_price).toFixed(2)}
                          </span>
                          {item.notes && <span className="text-xs text-gray-500 ml-2">({item.notes})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSalesOrderItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isCreatingSalesOrder}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isCreatingSalesOrder ? 'Creating...' : 'Create Sales Order'}
              </button>
            </form>

            {/* Sales Orders List */}
            <div>
              <h4 className="font-medium mb-3">Sales Orders List</h4>
              {isLoadingSalesOrders ? (
                <p className="text-gray-600">Loading sales orders...</p>
              ) : salesOrders && salesOrders.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {salesOrders.map((order) => (
                    <div key={order.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-blue-600">
                            {order.sales_order_number || `Order #${order.id}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Customer: {getAccountName(order.account_id)} | Factory: {getFactoryName(order.factory_id)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total: ${order.total_amount} | Delivered: {order.is_fully_delivered ? 'Yes' : 'No'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Order Date: {order.order_date}
                            {order.expected_delivery_date && ` | Expected: ${order.expected_delivery_date}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewSalesOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No sales orders found</p>
              )}
            </div>
          </div>

          {/* Sales Deliveries Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Sales Deliveries</h3>

            {/* Filter by Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filterDeliveryStatus}
                onChange={(e) => setFilterDeliveryStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Create Sales Delivery Form */}
            <form onSubmit={handleCreateSalesDelivery} className="mb-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-green-900">Create New Delivery</h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Order *</label>
                  <select
                    value={deliverySalesOrderId}
                    onChange={(e) => setDeliverySalesOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Sales Order</option>
                    {salesOrders?.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.sales_order_number || `Order #${order.id}`} - {getAccountName(order.account_id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={deliveryScheduledDate}
                    onChange={(e) => setDeliveryScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={deliveryTrackingNumber}
                    onChange={(e) => setDeliveryTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., TRACK-12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Delivery notes"
                  />
                </div>
              </div>

              {/* Delivery Items */}
              <div className="border-t pt-4">
                <h5 className="font-medium mb-3">Delivery Items</h5>
                <p className="text-sm text-gray-600 mb-3">
                  Items must reference a Sales Order Item ID from the parent order.
                </p>

                {/* Add Item Form */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <input
                      type="number"
                      value={deliveryItemSalesOrderItemId}
                      onChange={(e) => setDeliveryItemSalesOrderItemId(e.target.value)}
                      placeholder="Sales Order Item ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={deliveryItemQty}
                      onChange={(e) => setDeliveryItemQty(e.target.value)}
                      placeholder="Quantity"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={deliveryItemNotes}
                      onChange={(e) => setDeliveryItemNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddDeliveryItem}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {deliveryItems.length > 0 && (
                  <div className="space-y-2">
                    {deliveryItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white border rounded">
                        <div className="flex-1">
                          <span className="font-medium">Sales Order Item #{item.sales_order_item_id}</span>
                          <span className="text-sm text-gray-600 ml-2">
                            Qty: {item.quantity_delivered}
                          </span>
                          {item.notes && <span className="text-xs text-gray-500 ml-2">({item.notes})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliveryItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isCreatingSalesDelivery}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isCreatingSalesDelivery ? 'Creating...' : 'Create Delivery'}
              </button>
            </form>

            {/* Sales Deliveries List */}
            <div>
              <h4 className="font-medium mb-3">Deliveries List</h4>
              {isLoadingSalesDeliveries ? (
                <p className="text-gray-600">Loading deliveries...</p>
              ) : salesDeliveries && salesDeliveries.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {salesDeliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-green-600">
                            {delivery.delivery_number || `Delivery #${delivery.id}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: <span className={`px-2 py-0.5 rounded text-xs ${delivery.delivery_status === 'delivered' ? 'bg-green-100 text-green-800' :
                              delivery.delivery_status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {delivery.delivery_status.toUpperCase()}
                            </span>
                          </p>
                          {delivery.scheduled_date && (
                            <p className="text-xs text-gray-500">Scheduled: {delivery.scheduled_date}</p>
                          )}
                          {delivery.actual_delivery_date && (
                            <p className="text-xs text-gray-500">Delivered: {delivery.actual_delivery_date}</p>
                          )}
                          {delivery.tracking_number && (
                            <p className="text-xs text-gray-500">Tracking: {delivery.tracking_number}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleViewDeliveryDetails(delivery)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            View Details
                          </button>
                          {delivery.delivery_status === 'planned' && (
                            <button
                              onClick={() => handleCompleteDelivery(delivery.id)}
                              disabled={isCompletingSalesDelivery}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No deliveries found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Order Details Modal */}
      {selectedSalesOrderForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Sales Order Details: {selectedSalesOrderForDetails.sales_order_number || `#${selectedSalesOrderForDetails.id}`}
              </h2>
              <button
                onClick={handleCloseSalesOrderDetails}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Order Summary */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <span className="ml-1 font-semibold">{getAccountName(selectedSalesOrderForDetails.account_id)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="ml-1 font-semibold">${selectedSalesOrderForDetails.total_amount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Fully Delivered:</span>
                  <span className={`ml-1 font-semibold ${selectedSalesOrderForDetails.is_fully_delivered ? 'text-green-600' : 'text-orange-600'}`}>
                    {selectedSalesOrderForDetails.is_fully_delivered ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h3 className="font-semibold mb-3">Order Items</h3>
              {selectedSalesOrderItems && selectedSalesOrderItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedSalesOrderItems.map((item: any) => (
                    <div key={item.id} className="border rounded p-3 bg-gray-50">
                      <p className="font-medium">{getItemName(item.item_id)}</p>
                      <p className="text-sm text-gray-600">
                        Ordered: {item.quantity_ordered} | Delivered: {item.quantity_delivered} |
                        Remaining: {item.quantity_ordered - item.quantity_delivered}
                      </p>
                      <p className="text-sm text-gray-600">
                        Unit Price: ${item.unit_price} | Total: ${item.line_total}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Loading items...</p>
              )}
            </div>

            {/* Deliveries */}
            <div>
              <h3 className="font-semibold mb-3">Deliveries</h3>
              {selectedSalesOrderDeliveries && selectedSalesOrderDeliveries.length > 0 ? (
                <div className="space-y-2">
                  {selectedSalesOrderDeliveries.map((delivery: any) => (
                    <div key={delivery.id} className="border rounded p-3 bg-gray-50">
                      <p className="font-medium text-green-600">
                        {delivery.delivery_number || `Delivery #${delivery.id}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Status: {delivery.delivery_status}
                        {delivery.scheduled_date && ` | Scheduled: ${delivery.scheduled_date}`}
                        {delivery.actual_delivery_date && ` | Delivered: ${delivery.actual_delivery_date}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No deliveries yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Details Modal */}
      {selectedDeliveryForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Delivery Details: {selectedDeliveryForDetails.delivery_number || `#${selectedDeliveryForDetails.id}`}
              </h2>
              <button
                onClick={handleCloseDeliveryDetails}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Delivery Summary */}
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded text-xs ${selectedDeliveryForDetails.delivery_status === 'delivered' ? 'bg-green-100 text-green-800' :
                    selectedDeliveryForDetails.delivery_status === 'planned' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                    {selectedDeliveryForDetails.delivery_status.toUpperCase()}
                  </span>
                </div>
                {selectedDeliveryForDetails.tracking_number && (
                  <div>
                    <span className="text-gray-600">Tracking:</span>
                    <span className="ml-1 font-semibold">{selectedDeliveryForDetails.tracking_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Items */}
            <div>
              <h3 className="font-semibold mb-3">Delivery Items</h3>
              {selectedDeliveryItems && selectedDeliveryItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedDeliveryItems.map((item: any) => (
                    <div key={item.id} className="border rounded p-3 bg-gray-50">
                      <p className="font-medium">{getItemName(item.item_id)}</p>
                      <p className="text-sm text-gray-600">
                        Quantity Delivered: {item.quantity_delivered}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-600 italic">Note: {item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Loading items...</p>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Sales Management Section */}
      {workspace && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sales Management (Active Workspace: {workspace.name})
          </h2>

          {/* Create Sales Order Form */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-3 text-blue-900">Create Sales Order</h3>
            <form onSubmit={handleCreateSalesOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Account *
                  </label>
                  <select
                    value={salesOrderAccountId}
                    onChange={(e) => setSalesOrderAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Factory *
                  </label>
                  <select
                    value={salesOrderFactoryId}
                    onChange={(e) => setSalesOrderFactoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Factory</option>
                    {factories?.map((factory) => (
                      <option key={factory.id} value={factory.id}>
                        {factory.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Date
                  </label>
                  <input
                    type="date"
                    value={salesOrderDate}
                    onChange={(e) => setSalesOrderDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quotation Sent Date
                  </label>
                  <input
                    type="date"
                    value={salesOrderQuotationDate}
                    onChange={(e) => setSalesOrderQuotationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={salesOrderExpectedDeliveryDate}
                    onChange={(e) => setSalesOrderExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={salesOrderNotes}
                  onChange={(e) => setSalesOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Order Items</h4>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <select
                    value={salesOrderItemId}
                    onChange={(e) => setSalesOrderItemId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Item</option>
                    {items?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantity"
                    value={salesOrderItemQty}
                    onChange={(e) => setSalesOrderItemQty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={salesOrderItemPrice}
                    onChange={(e) => setSalesOrderItemPrice(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSalesOrderItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Item
                  </button>
                </div>

                {salesOrderItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {salesOrderItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">
                          Item #{item.item_id} - Qty: {item.quantity_ordered} @ ${item.unit_price}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSalesOrderItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isCreatingSalesOrder}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isCreatingSalesOrder ? 'Creating...' : 'Create Sales Order'}
              </button>
            </form>
          </div>

          {/* Sales Orders List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Sales Orders</h3>
            {isLoadingSalesOrders ? (
              <p className="text-gray-600">Loading sales orders...</p>
            ) : salesOrders && salesOrders.length > 0 ? (
              <div className="space-y-2">
                {salesOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{order.sales_order_number}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${order.is_fully_delivered
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {order.is_fully_delivered ? 'Fully Delivered' : 'Pending Delivery'}
                          </span>
                          {order.is_invoiced && (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                              Invoiced
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Account: #{order.account_id} | Factory: #{order.factory_id}
                        </p>
                        <p className="text-sm text-gray-600">
                          Order Date: {new Date(order.order_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          Total: ${order.total_amount}
                        </p>
                        {order.notes && (
                          <p className="text-sm text-gray-600 mt-1">Notes: {order.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleViewSalesOrderDetails(order)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No sales orders found</p>
            )}
          </div>

          {/* Create Sales Delivery Form */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-3 text-green-900">Create Sales Delivery</h3>
            <form onSubmit={handleCreateSalesDelivery} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Order *
                  </label>
                  <select
                    value={deliverySalesOrderId}
                    onChange={(e) => setDeliverySalesOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Sales Order</option>
                    {salesOrders?.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.sales_order_number} - ${order.total_amount}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={deliveryScheduledDate}
                    onChange={(e) => setDeliveryScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={deliveryTrackingNumber}
                  onChange={(e) => setDeliveryTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              {/* Delivery Items */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Delivery Items</h4>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="Sales Order Item ID"
                    value={deliveryItemSalesOrderItemId}
                    onChange={(e) => setDeliveryItemSalesOrderItemId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantity"
                    value={deliveryItemQty}
                    onChange={(e) => setDeliveryItemQty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliveryItem}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add Item
                  </button>
                </div>

                {deliveryItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {deliveryItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">
                          Order Item #{item.sales_order_item_id} - Item #{item.item_id} - Qty: {item.quantity_delivered}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliveryItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isCreatingSalesDelivery}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isCreatingSalesDelivery ? 'Creating...' : 'Create Delivery'}
              </button>
            </form>
          </div>

          {/* Sales Deliveries List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Sales Deliveries</h3>
              <select
                value={filterDeliveryStatus}
                onChange={(e) => setFilterDeliveryStatus(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {isLoadingSalesDeliveries ? (
              <p className="text-gray-600">Loading deliveries...</p>
            ) : salesDeliveries && salesDeliveries.length > 0 ? (
              <div className="space-y-2">
                {salesDeliveries.map((delivery) => (
                  <div key={delivery.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{delivery.delivery_number}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${delivery.delivery_status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : delivery.delivery_status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {delivery.delivery_status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Sales Order: #{delivery.sales_order_id}
                        </p>
                        {delivery.scheduled_date && (
                          <p className="text-sm text-gray-600">
                            Scheduled: {new Date(delivery.scheduled_date).toLocaleDateString()}
                          </p>
                        )}
                        {delivery.actual_delivery_date && (
                          <p className="text-sm text-gray-600">
                            Delivered: {new Date(delivery.actual_delivery_date).toLocaleDateString()}
                          </p>
                        )}
                        {delivery.tracking_number && (
                          <p className="text-sm text-gray-600">
                            Tracking: {delivery.tracking_number}
                          </p>
                        )}
                        {delivery.notes && (
                          <p className="text-sm text-gray-600 mt-1">Notes: {delivery.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {delivery.delivery_status === 'planned' && (
                          <button
                            onClick={() => handleCompleteDelivery(delivery.id)}
                            disabled={isCompletingSalesDelivery}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:bg-gray-400"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDeliveryDetails(delivery)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No deliveries found</p>
            )}
          </div>
        </div>
      )}

      {/* Sales Order Details Modal */}
      {selectedSalesOrderForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">
                Sales Order Details: {selectedSalesOrderForDetails.sales_order_number}
              </h3>
              <button
                onClick={handleCloseSalesOrderDetails}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm"><strong>Account:</strong> #{selectedSalesOrderForDetails.account_id}</p>
              <p className="text-sm"><strong>Factory:</strong> #{selectedSalesOrderForDetails.factory_id}</p>
              <p className="text-sm"><strong>Order Date:</strong> {new Date(selectedSalesOrderForDetails.order_date).toLocaleDateString()}</p>
              <p className="text-sm"><strong>Total Amount:</strong> ${selectedSalesOrderForDetails.total_amount}</p>
              <p className="text-sm"><strong>Status:</strong> {selectedSalesOrderForDetails.is_fully_delivered ? 'Fully Delivered' : 'Pending Delivery'}</p>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Order Items</h4>
              {selectedSalesOrderItems && selectedSalesOrderItems.length > 0 ? (
                <div className="space-y-1">
                  {selectedSalesOrderItems.map((item) => (
                    <div key={item.id} className="border rounded p-2 text-sm">
                      <p><strong>Item:</strong> #{item.item_id}</p>
                      <p><strong>Ordered:</strong> {item.quantity_ordered} | <strong>Delivered:</strong> {item.quantity_delivered}</p>
                      <p><strong>Unit Price:</strong> ${item.unit_price} | <strong>Total:</strong> ${item.line_total}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No items found</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Deliveries</h4>
              {selectedSalesOrderDeliveries && selectedSalesOrderDeliveries.length > 0 ? (
                <div className="space-y-1">
                  {selectedSalesOrderDeliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded p-2 text-sm">
                      <p><strong>{delivery.delivery_number}</strong> - {delivery.delivery_status}</p>
                      {delivery.scheduled_date && (
                        <p>Scheduled: {new Date(delivery.scheduled_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No deliveries found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Details Modal */}
      {selectedDeliveryForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">
                Delivery Details: {selectedDeliveryForDetails.delivery_number}
              </h3>
              <button
                onClick={handleCloseDeliveryDetails}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm"><strong>Sales Order:</strong> #{selectedDeliveryForDetails.sales_order_id}</p>
              <p className="text-sm"><strong>Status:</strong> {selectedDeliveryForDetails.delivery_status}</p>
              {selectedDeliveryForDetails.scheduled_date && (
                <p className="text-sm"><strong>Scheduled:</strong> {new Date(selectedDeliveryForDetails.scheduled_date).toLocaleDateString()}</p>
              )}
              {selectedDeliveryForDetails.actual_delivery_date && (
                <p className="text-sm"><strong>Delivered:</strong> {new Date(selectedDeliveryForDetails.actual_delivery_date).toLocaleDateString()}</p>
              )}
              {selectedDeliveryForDetails.tracking_number && (
                <p className="text-sm"><strong>Tracking:</strong> {selectedDeliveryForDetails.tracking_number}</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Delivery Items</h4>
              {selectedDeliveryItems && selectedDeliveryItems.length > 0 ? (
                <div className="space-y-1">
                  {selectedDeliveryItems.map((item) => (
                    <div key={item.id} className="border rounded p-2 text-sm">
                      <p><strong>Item:</strong> #{item.item_id}</p>
                      <p><strong>Sales Order Item:</strong> #{item.sales_order_item_id}</p>
                      <p><strong>Quantity Delivered:</strong> {item.quantity_delivered}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No items found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCTION MODULE TESTING
          ═══════════════════════════════════════════════════════════════ */}
      {workspace && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Production Module (Active Workspace: {workspace.name})
          </h2>

          {/* ─── Production Lines Section ─────────────────────────── */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Production Lines</h3>

            <form onSubmit={handleCreateProdLine} className="mb-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-green-900">Create Production Line</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={prodLineName} onChange={(e) => setProdLineName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" required placeholder="e.g., Yarn Line 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factory *</label>
                  <select value={prodLineFactoryId} onChange={(e) => setProdLineFactoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Select Factory</option>
                    {factories?.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Machine ID (optional)</label>
                  <input type="number" value={prodLineMachineId} onChange={(e) => setProdLineMachineId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Leave empty for standalone" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" value={prodLineDescription} onChange={(e) => setProdLineDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Optional description" />
                </div>
              </div>
              <button type="submit" disabled={isCreatingProdLine}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
                {isCreatingProdLine ? 'Creating...' : 'Create Production Line'}
              </button>
            </form>

            <div>
              <h4 className="font-medium mb-3">Production Lines List</h4>
              {isLoadingProdLines ? (
                <p className="text-gray-600">Loading...</p>
              ) : productionLines && productionLines.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {productionLines.map((line) => (
                    <div key={line.id} className="border rounded p-3 bg-gray-50 flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-green-700">{line.name}</p>
                        <p className="text-sm text-gray-600">
                          Factory: {getFactoryName(line.factory_id)}
                          {line.machine_id && ` | Machine: #${line.machine_id}`}
                          {' | '}{line.is_active ? '✓ Active' : '✗ Inactive'}
                        </p>
                        {line.description && <p className="text-xs text-gray-500">{line.description}</p>}
                      </div>
                      <button onClick={() => handleDeleteProdLine(line.id)}
                        className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No production lines found</p>
              )}
            </div>
          </div>

          {/* ─── Production Formulas Section ──────────────────────── */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-purple-900 mb-4">Production Formulas</h3>

            <form onSubmit={handleCreateFormula} className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-purple-900">Create Production Formula</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formula Code *</label>
                  <input type="text" value={formulaCode} onChange={(e) => setFormulaCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" required placeholder="e.g., YARN-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={formulaName} onChange={(e) => setFormulaName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" required placeholder="e.g., Cotton Yarn Formula" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Est. Duration (minutes)</label>
                  <input type="number" value={formulaDuration} onChange={(e) => setFormulaDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Optional" />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formulaIsDefault} onChange={(e) => setFormulaIsDefault(e.target.checked)} />
                    <span className="text-sm font-medium text-gray-700">Set as default formula</span>
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={formulaDescription} onChange={(e) => setFormulaDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={2} placeholder="Optional" />
                </div>
              </div>
              <button type="submit" disabled={isCreatingFormula}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400">
                {isCreatingFormula ? 'Creating...' : 'Create Formula'}
              </button>
            </form>

            <div className="mb-4">
              <h4 className="font-medium mb-3">Formulas List</h4>
              {isLoadingFormulas ? (
                <p className="text-gray-600">Loading...</p>
              ) : productionFormulas && productionFormulas.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {productionFormulas.map((formula) => (
                    <div key={formula.id} className="border rounded p-3 bg-gray-50 flex justify-between items-start">
                      <div className="flex-1 cursor-pointer" onClick={() => setSelectedFormula(selectedFormula?.id === formula.id ? null : formula)}>
                        <p className="font-semibold text-purple-700">
                          {formula.formula_code} - {formula.name}
                          {formula.is_default && <span className="ml-2 text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Default</span>}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formula.estimated_duration_minutes && `~${formula.estimated_duration_minutes} min | `}
                          v{formula.version}
                          {' | '}{formula.is_active ? '✓ Active' : '✗ Inactive'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedFormula(selectedFormula?.id === formula.id ? null : formula)}
                          className="text-blue-600 hover:text-blue-800 text-sm">
                          {selectedFormula?.id === formula.id ? 'Close' : 'Items'}
                        </button>
                        <button onClick={() => handleDeleteFormula(formula.id)}
                          className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No formulas found</p>
              )}
            </div>

            {/* Formula Items Panel */}
            {selectedFormula && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold mb-3 text-purple-900">
                  Items for: {selectedFormula.formula_code} - {selectedFormula.name}
                </h4>

                <form onSubmit={handleAddFormulaItem} className="grid grid-cols-5 gap-3 mb-4">
                  <select value={fiItemId} onChange={(e) => setFiItemId(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm" required>
                    <option value="">Select Item</option>
                    {items?.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
                  </select>
                  <select value={fiRole} onChange={(e) => setFiRole(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="input">Input</option>
                    <option value="output">Output</option>
                    <option value="waste">Waste</option>
                    <option value="byproduct">Byproduct</option>
                  </select>
                  <input type="number" value={fiQuantity} onChange={(e) => setFiQuantity(e.target.value)}
                    placeholder="Quantity" className="px-3 py-2 border border-gray-300 rounded-md text-sm" required />
                  <input type="text" value={fiUnit} onChange={(e) => setFiUnit(e.target.value)}
                    placeholder="Unit (kg, L...)" className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                  <button type="submit" className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 text-sm">
                    Add
                  </button>
                </form>

                {formulaItems && formulaItems.length > 0 ? (
                  <div className="space-y-1">
                    {formulaItems.map((fi) => (
                      <div key={fi.id} className="flex items-center justify-between p-2 bg-white border rounded text-sm">
                        <div>
                          <span className={`font-medium px-2 py-0.5 rounded text-xs mr-2 ${
                            fi.item_role === 'input' ? 'bg-blue-100 text-blue-800' :
                            fi.item_role === 'output' ? 'bg-green-100 text-green-800' :
                            fi.item_role === 'waste' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>{fi.item_role}</span>
                          {getItemName(fi.item_id)} - Qty: {fi.quantity}{fi.unit ? ` ${fi.unit}` : ''}
                          {fi.is_optional && ' (optional)'}
                        </div>
                        <button onClick={() => handleRemoveFormulaItem(fi.id)}
                          className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No items in this formula yet</p>
                )}
              </div>
            )}
          </div>

          {/* ─── Production Batches Section ───────────────────────── */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">Production Batches</h3>

            <form onSubmit={handleCreateBatch} className="mb-6 p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-orange-900">Create Production Batch</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Production Line *</label>
                  <select value={batchLineId} onChange={(e) => setBatchLineId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Select Line</option>
                    {productionLines?.filter(l => l.is_active).map((line) => (
                      <option key={line.id} value={line.id}>{line.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formula (optional)</label>
                  <select value={batchFormulaId} onChange={(e) => setBatchFormulaId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">No formula (simple mode)</option>
                    {productionFormulas?.filter(f => f.is_active).map((f) => (
                      <option key={f.id} value={f.id}>{f.formula_code} - {f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Date *</label>
                  <input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select value={batchShift} onChange={(e) => setBatchShift(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">No shift</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={batchNotes} onChange={(e) => setBatchNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={2} placeholder="Optional" />
                </div>
              </div>
              <button type="submit" disabled={isCreatingBatch}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400">
                {isCreatingBatch ? 'Creating...' : 'Create Batch (Draft)'}
              </button>
            </form>

            {/* Batch Filter */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium">Filter by status:</span>
              <select value={batchFilterStatus} onChange={(e) => { setBatchFilterStatus(e.target.value); }}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={() => refetchBatches()} className="text-blue-600 hover:text-blue-800 text-sm">Refresh</button>
            </div>

            {/* Batches List */}
            <div className="mb-4">
              <h4 className="font-medium mb-3">Batches List</h4>
              {isLoadingBatches ? (
                <p className="text-gray-600">Loading...</p>
              ) : productionBatches && productionBatches.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {productionBatches.map((batch) => (
                    <div key={batch.id} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 cursor-pointer" onClick={() => setSelectedBatch(selectedBatch?.id === batch.id ? null : batch)}>
                          <p className="font-semibold text-orange-700">
                            {batch.batch_number}
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                              batch.status === 'draft' ? 'bg-gray-200 text-gray-800' :
                              batch.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
                              batch.status === 'completed' ? 'bg-green-200 text-green-800' :
                              'bg-red-200 text-red-800'
                            }`}>{batch.status}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Line: {getLineName(batch.production_line_id)}
                            {batch.formula_id && ` | Formula: ${getFormulaName(batch.formula_id)}`}
                            {' | '}{batch.batch_date}
                            {batch.shift && ` | ${batch.shift}`}
                          </p>
                          {batch.status === 'completed' && (
                            <p className="text-sm text-gray-600">
                              Expected: {batch.expected_output_quantity ?? 'N/A'} | Actual: {batch.actual_output_quantity ?? 'N/A'}
                              {batch.efficiency_percentage != null && ` | Efficiency: ${batch.efficiency_percentage}%`}
                              {batch.output_variance_percentage != null && ` | Variance: ${batch.output_variance_percentage}%`}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {batch.status === 'draft' && (
                            <button onClick={() => handleStartBatch(batch.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium">Start</button>
                          )}
                          {batch.status === 'in_progress' && (
                            <button onClick={() => handleCompleteBatch(batch.id)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium">Complete</button>
                          )}
                          {(batch.status === 'draft' || batch.status === 'in_progress') && (
                            <button onClick={() => handleCancelBatch(batch.id)}
                              className="text-red-600 hover:text-red-800 text-sm">Cancel</button>
                          )}
                          <button onClick={() => setSelectedBatch(selectedBatch?.id === batch.id ? null : batch)}
                            className="text-gray-600 hover:text-gray-800 text-sm">
                            {selectedBatch?.id === batch.id ? 'Close' : 'Items'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No batches found</p>
              )}
            </div>

            {/* Batch Workflow Controls */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-orange-50 rounded-lg">
              <div>
                <h5 className="font-medium text-sm mb-2">Start Batch Options</h5>
                <p className="text-xs text-gray-500 mb-2">When starting a batch with a formula, items will be auto-populated based on the target quantity.</p>
                <input type="number" value={startTargetQty} onChange={(e) => setStartTargetQty(e.target.value)}
                  placeholder="Target output qty (optional)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                <p className="text-xs text-gray-400 mt-1">Leave empty to use formula's base output quantity</p>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Complete Batch Options</h5>
                <p className="text-xs text-gray-500 mb-2">Enter final actuals when completing a batch. Variance will be calculated.</p>
                <input type="number" value={completeActualQty} onChange={(e) => setCompleteActualQty(e.target.value)}
                  placeholder="Actual output qty" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-1" />
                <input type="number" value={completeActualDuration} onChange={(e) => setCompleteActualDuration(e.target.value)}
                  placeholder="Actual duration (min)" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-1" />
                <input type="text" value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Completion notes" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Cancel Batch Options</h5>
                <input type="text" value={cancelNotes} onChange={(e) => setCancelNotes(e.target.value)}
                  placeholder="Cancellation reason" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>

            {/* Batch Items Panel */}
            {selectedBatch && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="mb-4">
                  <h4 className="font-semibold text-orange-900">
                    Batch: {selectedBatch.batch_number}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      selectedBatch.status === 'draft' ? 'bg-gray-200 text-gray-800' :
                      selectedBatch.status === 'in_progress' ? 'bg-blue-200 text-blue-800' :
                      selectedBatch.status === 'completed' ? 'bg-green-200 text-green-800' :
                      'bg-red-200 text-red-800'
                    }`}>{selectedBatch.status}</span>
                  </h4>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedBatch.formula_id && (
                      <span className="mr-4">Formula: <strong>{getFormulaName(selectedBatch.formula_id)}</strong></span>
                    )}
                    {selectedBatch.expected_output_quantity && (
                      <span className="mr-4">Expected Output: <strong>{selectedBatch.expected_output_quantity}</strong></span>
                    )}
                    {selectedBatch.actual_output_quantity && (
                      <span>Actual Output: <strong>{selectedBatch.actual_output_quantity}</strong></span>
                    )}
                  </div>
                  {selectedBatch.status === 'in_progress' && selectedBatch.formula_id && (
                    <p className="text-xs text-blue-700 mt-2 bg-blue-50 p-2 rounded">
                      Enter actual quantities for each item below, then click "Save All Actual Quantities"
                    </p>
                  )}
                </div>

                {/* Manual Add Form - only for simple mode (no formula) or to add extra items */}
                {(selectedBatch.status === 'draft' || selectedBatch.status === 'in_progress') && !selectedBatch.formula_id && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Simple mode: Add items manually</p>
                    <form onSubmit={handleAddBatchItem} className="grid grid-cols-5 gap-3">
                      <select value={biItemId} onChange={(e) => setBiItemId(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm" required>
                        <option value="">Select Item</option>
                        {items?.map((item) => (<option key={item.id} value={item.id}>{item.name}</option>))}
                      </select>
                      <select value={biRole} onChange={(e) => setBiRole(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                        <option value="input">Input</option>
                        <option value="output">Output</option>
                        <option value="waste">Waste</option>
                        <option value="byproduct">Byproduct</option>
                      </select>
                      <input type="number" value={biExpectedQty} onChange={(e) => setBiExpectedQty(e.target.value)}
                        placeholder="Expected Qty" className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                      <input type="number" value={biActualQty} onChange={(e) => setBiActualQty(e.target.value)}
                        placeholder="Actual Qty" className="px-3 py-2 border border-gray-300 rounded-md text-sm" />
                      <button type="submit" className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm">
                        Add
                      </button>
                    </form>
                  </div>
                )}

                {batchItems && batchItems.length > 0 ? (
                  <div className="space-y-2">
                    {/* Save All Button for in_progress batches */}
                    {selectedBatch.status === 'in_progress' && (
                      <div className="flex justify-end mb-2">
                        <button onClick={handleSaveAllActualQuantities}
                          className="bg-orange-600 text-white py-1 px-4 rounded-md hover:bg-orange-700 text-sm">
                          Save All Actual Quantities
                        </button>
                      </div>
                    )}

                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 border-b pb-1">
                      <div className="col-span-1">Role</div>
                      <div className="col-span-4">Item</div>
                      <div className="col-span-2 text-center">Expected</div>
                      <div className="col-span-3 text-center">Actual</div>
                      <div className="col-span-2 text-center">Variance</div>
                    </div>

                    {batchItems.map((bi) => (
                      <div key={bi.id} className="grid grid-cols-12 gap-2 p-2 bg-white border rounded text-sm items-center">
                        <div className="col-span-1">
                          <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                            bi.item_role === 'input' ? 'bg-blue-100 text-blue-800' :
                            bi.item_role === 'output' ? 'bg-green-100 text-green-800' :
                            bi.item_role === 'waste' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>{bi.item_role}</span>
                        </div>
                        <div className="col-span-4 font-medium">{getItemName(bi.item_id)}</div>
                        <div className="col-span-2 text-center text-gray-600">
                          {bi.expected_quantity ?? '-'}
                        </div>
                        <div className="col-span-3 text-center">
                          {selectedBatch.status === 'in_progress' ? (
                            <input
                              type="number"
                              value={batchItemActualQtys[bi.id] ?? (bi.actual_quantity?.toString() || '')}
                              onChange={(e) => setBatchItemActualQtys(prev => ({ ...prev, [bi.id]: e.target.value }))}
                              placeholder="Enter actual"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            />
                          ) : (
                            <span className="text-gray-600">{bi.actual_quantity ?? '-'}</span>
                          )}
                        </div>
                        <div className="col-span-2 text-center">
                          {bi.variance_quantity != null ? (
                            <span className={bi.variance_quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {bi.variance_quantity > 0 ? '+' : ''}{bi.variance_quantity}
                              {bi.variance_percentage != null && ` (${bi.variance_percentage}%)`}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    {selectedBatch.status === 'draft' && selectedBatch.formula_id
                      ? 'Click "Start" on this batch to auto-populate items from the formula.'
                      : selectedBatch.status === 'draft'
                      ? 'Add items manually using the form above, or attach a formula.'
                      : 'No items in this batch.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ==================== MACHINES MODULE ==================== */}
      {workspace && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Machines Management (Active Workspace: {workspace.name})
          </h2>

          {/* Create/Edit Machine Form */}
          <form onSubmit={editingMachine ? handleUpdateMachine : handleCreateMachine} className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">{editingMachine ? 'Edit Machine' : 'Create Machine'}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Machine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  placeholder="e.g., Loom A1, Spinner B3"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Factory Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={machineSectionId}
                  onChange={(e) => setMachineSectionId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a section...</option>
                  {sections && sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name} (Factory: {getFactoryName(section.factory_id)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
                <input
                  type="text"
                  value={machineModelNumber}
                  onChange={(e) => setMachineModelNumber(e.target.value)}
                  placeholder="e.g., XJ-2000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                <input
                  type="text"
                  value={machineManufacturer}
                  onChange={(e) => setMachineManufacturer(e.target.value)}
                  placeholder="e.g., Toyota, Rieter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance Date</label>
                <input
                  type="date"
                  value={machineMaintenanceDate}
                  onChange={(e) => setMachineMaintenanceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Note</label>
                <input
                  type="text"
                  value={machineMaintenanceNote}
                  onChange={(e) => setMachineMaintenanceNote(e.target.value)}
                  placeholder="e.g., Replace bearings"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={machineNote}
                onChange={(e) => setMachineNote(e.target.value)}
                placeholder="General notes about this machine..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreatingMachine || isUpdatingMachine}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {editingMachine ? 'Update Machine' : 'Create Machine'}
              </button>
              {editingMachine && (
                <button
                  type="button"
                  onClick={handleCancelMachineEdit}
                  className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Search and Filters */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <input
                type="text"
                value={machineSearchQuery}
                onChange={(e) => setMachineSearchQuery(e.target.value)}
                placeholder="Search by name, model, manufacturer..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={machineFilterSectionId}
                onChange={(e) => setMachineFilterSectionId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sections</option>
                {sections && sections.map(section => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={machineFilterRunning}
                onChange={(e) => setMachineFilterRunning(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Running</option>
                <option value="false">Not Running</option>
              </select>
            </div>
          </div>

          {/* Machines List */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Machines List</h3>
            {isLoadingMachines ? (
              <p className="text-gray-600">Loading machines...</p>
            ) : machines && machines.length > 0 ? (
              <div className="space-y-3">
                {machines.map((machine) => (
                  <div
                    key={machine.id}
                    className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                      machine.is_deleted ? 'border-red-200 bg-red-50 opacity-60' :
                      machine.is_running ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{machine.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            machine.is_running
                              ? 'bg-green-200 text-green-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {machine.is_running ? 'RUNNING' : 'STOPPED'}
                          </span>
                          {machine.is_deleted && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800">DELETED</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Section: {getSectionName(machine.factory_section_id)}
                        </p>
                        {(machine.model_number || machine.manufacturer) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {machine.manufacturer && `Manufacturer: ${machine.manufacturer}`}
                            {machine.manufacturer && machine.model_number && ' | '}
                            {machine.model_number && `Model: ${machine.model_number}`}
                          </p>
                        )}
                        {machine.next_maintenance_schedule && (
                          <p className="text-sm text-orange-600 mt-1">
                            Next maintenance: {machine.next_maintenance_schedule}
                            {machine.next_maintenance_note && ` - ${machine.next_maintenance_note}`}
                          </p>
                        )}
                        {machine.note && (
                          <p className="text-sm text-gray-400 mt-1 italic">Note: {machine.note}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">ID: {machine.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMachineForEvents(machine);
                            setTimeout(() => refetchMachineEvents(), 100);
                          }}
                          className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                        >
                          Events
                        </button>
                        {!machine.is_deleted && (
                          <>
                            <button
                              onClick={() => handleEditMachine(machine)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMachine(machine)}
                              disabled={isDeletingMachine}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No machines found. Create your first machine above!</p>
            )}
          </div>

          {/* Machine Events Panel */}
          {selectedMachineForEvents && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-purple-900">
                  Events for: {selectedMachineForEvents.name}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedMachineForEvents.is_running
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {selectedMachineForEvents.is_running ? 'RUNNING' : 'STOPPED'}
                  </span>
                </h3>
                <button
                  onClick={() => setSelectedMachineForEvents(null)}
                  className="text-gray-500 hover:text-gray-700 text-lg"
                >
                  &times;
                </button>
              </div>

              {/* Create Event Form */}
              <form onSubmit={handleCreateMachineEvent} className="mb-4 p-3 bg-white rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Create Status Change Event</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as MachineEventType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="IDLE">IDLE</option>
                      <option value="RUNNING">RUNNING</option>
                      <option value="OFF">OFF</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
                    <input
                      type="text"
                      value={eventNote}
                      onChange={(e) => setEventNote(e.target.value)}
                      placeholder="Reason for status change..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isCreatingMachineEvent}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 text-sm"
                    >
                      Create Event
                    </button>
                  </div>
                </div>
              </form>

              {/* Events List */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Event History (newest first)</h4>
                {isLoadingMachineEvents ? (
                  <p className="text-gray-600 text-sm">Loading events...</p>
                ) : machineEvents && machineEvents.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {machineEvents.map((event) => (
                      <div key={event.id} className="p-3 bg-white rounded border border-gray-200 text-sm">
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            event.event_type === 'RUNNING' ? 'bg-green-200 text-green-800' :
                            event.event_type === 'IDLE' ? 'bg-yellow-200 text-yellow-800' :
                            event.event_type === 'MAINTENANCE' ? 'bg-orange-200 text-orange-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {event.event_type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.started_at).toLocaleString()}
                          </span>
                        </div>
                        {event.note && (
                          <p className="text-gray-600 mt-1">{event.note}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {event.initiated_by ? `By user #${event.initiated_by}` : 'System initiated'}
                          {' | '}ID: {event.id}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No events recorded for this machine yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ MACHINE ITEMS SECTION ═══════════════════════ */}
      {workspace && (
        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            Machine Items (Active Workspace: {workspace.name})
          </h2>

          {/* Machine Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Machine to view/manage items:</label>
            <select
              value={selectedMachineForItems?.id || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value);
                const machine = machines?.find(m => m.id === id) || null;
                setSelectedMachineForItems(machine);
                setEditingMachineItem(null);
              }}
              className="border rounded px-3 py-2 w-full max-w-md"
            >
              <option value="">-- Select a machine --</option>
              {machines?.map((m) => (
                <option key={m.id} value={m.id}>{m.name} (ID: {m.id})</option>
              ))}
            </select>
          </div>

          {selectedMachineForItems && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create / Edit Form */}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {editingMachineItem ? `Edit Machine Item #${editingMachineItem.id}` : 'Assign Item to Machine'}
                </h3>
                <form onSubmit={editingMachineItem ? handleUpdateMachineItem : handleCreateMachineItem} className="mb-4 p-3 bg-white rounded-lg">
                  {!editingMachineItem && (
                    <>
                      <div className="mb-2">
                        <label className="block text-sm font-medium">Machine ID</label>
                        <input
                          type="number"
                          value={machineItemMachineId || selectedMachineForItems.id}
                          onChange={(e) => setMachineItemMachineId(e.target.value)}
                          className="border rounded px-3 py-1 w-full"
                          required
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium">Item</label>
                        <select
                          value={machineItemItemId}
                          onChange={(e) => setMachineItemItemId(e.target.value)}
                          className="border rounded px-3 py-1 w-full"
                          required
                        >
                          <option value="">-- Select Item --</option>
                          {items?.map((item) => (
                            <option key={item.id} value={item.id}>{item.name} (ID: {item.id})</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  <div className="mb-2">
                    <label className="block text-sm font-medium">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={machineItemQty}
                      onChange={(e) => setMachineItemQty(e.target.value)}
                      className="border rounded px-3 py-1 w-full"
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium">Required Qty (optional)</label>
                    <input
                      type="number"
                      min="0"
                      value={machineItemReqQty}
                      onChange={(e) => setMachineItemReqQty(e.target.value)}
                      className="border rounded px-3 py-1 w-full"
                      placeholder="Leave empty if not tracked"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm font-medium">Defective Qty (optional)</label>
                    <input
                      type="number"
                      min="0"
                      value={machineItemDefectiveQty}
                      onChange={(e) => setMachineItemDefectiveQty(e.target.value)}
                      className="border rounded px-3 py-1 w-full"
                      placeholder="Leave empty if not tracked"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-amber-600 text-white px-4 py-1 rounded hover:bg-amber-700"
                      disabled={isCreatingMachineItem || isUpdatingMachineItem}
                    >
                      {editingMachineItem
                        ? (isUpdatingMachineItem ? 'Updating...' : 'Update')
                        : (isCreatingMachineItem ? 'Assigning...' : 'Assign Item')}
                    </button>
                    {editingMachineItem && (
                      <button
                        type="button"
                        onClick={handleCancelMachineItemEdit}
                        className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Items on "{selectedMachineForItems.name}"
                </h3>
                {isLoadingMachineItems ? (
                  <p className="text-gray-600">Loading machine items...</p>
                ) : machineItems && machineItems.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {machineItems.map((mi) => (
                      <div key={mi.id} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{getItemName(mi.item_id)}</p>
                            <p className="text-sm text-gray-600">
                              Qty: <span className="font-bold">{mi.qty}</span>
                              {mi.req_qty !== null && (
                                <span className={mi.qty < mi.req_qty ? ' text-red-600' : ' text-green-600'}>
                                  {' '}/ Required: {mi.req_qty}
                                </span>
                              )}
                              {mi.defective_qty !== null && mi.defective_qty > 0 && (
                                <span className="text-orange-600"> | Defective: {mi.defective_qty}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">ID: {mi.id} | Item ID: {mi.item_id} | Machine ID: {mi.machine_id}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditMachineItem(mi)}
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMachineItem(mi)}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                              disabled={isDeletingMachineItem}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No items assigned to this machine yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ MACHINE MAINTENANCE LOGS SECTION ═══════════════════════ */}
      {workspace && (
        <div className="mt-6 p-4 bg-rose-50 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            Machine Maintenance Logs (Active Workspace: {workspace.name})
          </h2>

          {/* Machine Selector */}
          <div className="mb-4 flex gap-4 items-end">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium mb-1">Select Machine:</label>
              <select
                value={selectedMachineForMaintenance?.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const machine = machines?.find(m => m.id === id) || null;
                  setSelectedMachineForMaintenance(machine);
                  resetMaintenanceForm();
                }}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="">-- Select a machine --</option>
                {machines?.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} (ID: {m.id})</option>
                ))}
              </select>
            </div>
            {selectedMachineForMaintenance && (
              <div>
                <label className="block text-sm font-medium mb-1">Filter by Type:</label>
                <select
                  value={filterMaintenanceType}
                  onChange={(e) => setFilterMaintenanceType(e.target.value as MaintenanceType | '')}
                  className="border rounded px-3 py-2"
                >
                  <option value="">All Types</option>
                  <option value="PREVENTIVE">Preventive</option>
                  <option value="REPAIR">Repair</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="INSPECTION">Inspection</option>
                </select>
              </div>
            )}
          </div>

          {selectedMachineForMaintenance && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create / Edit Form */}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {editingMaintenanceLog ? `Edit Log #${editingMaintenanceLog.id}` : 'New Maintenance Log'}
                </h3>
                <form onSubmit={editingMaintenanceLog ? handleUpdateMaintenanceLog : handleCreateMaintenanceLog} className="mb-4 p-3 bg-white rounded-lg space-y-2">
                  <div>
                    <label className="block text-sm font-medium">Type *</label>
                    <select
                      value={maintenanceType}
                      onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                      className="border rounded px-3 py-1 w-full"
                      required
                    >
                      <option value="PREVENTIVE">Preventive</option>
                      <option value="REPAIR">Repair</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="INSPECTION">Inspection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Date *</label>
                    <input
                      type="date"
                      value={maintenanceDate}
                      onChange={(e) => setMaintenanceDate(e.target.value)}
                      className="border rounded px-3 py-1 w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Summary *</label>
                    <textarea
                      value={maintenanceSummary}
                      onChange={(e) => setMaintenanceSummary(e.target.value)}
                      className="border rounded px-3 py-1 w-full"
                      rows={3}
                      placeholder="Describe the maintenance work done..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Cost (optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={maintenanceCost}
                      onChange={(e) => setMaintenanceCost(e.target.value)}
                      className="border rounded px-3 py-1 w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Performed By (optional)</label>
                    <input
                      type="text"
                      value={maintenancePerformedBy}
                      onChange={(e) => setMaintenancePerformedBy(e.target.value)}
                      className="border rounded px-3 py-1 w-full"
                      placeholder="Name of person who did the maintenance"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-rose-600 text-white px-4 py-1 rounded hover:bg-rose-700"
                      disabled={isCreatingMaintenanceLog || isUpdatingMaintenanceLog}
                    >
                      {editingMaintenanceLog
                        ? (isUpdatingMaintenanceLog ? 'Updating...' : 'Update Log')
                        : (isCreatingMaintenanceLog ? 'Creating...' : 'Create Log')}
                    </button>
                    {editingMaintenanceLog && (
                      <button
                        type="button"
                        onClick={resetMaintenanceForm}
                        className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Logs List */}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Maintenance History for "{selectedMachineForMaintenance.name}"
                </h3>
                {isLoadingMaintenanceLogs ? (
                  <p className="text-gray-600">Loading logs...</p>
                ) : maintenanceLogs && maintenanceLogs.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {maintenanceLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                log.maintenance_type === 'PREVENTIVE' ? 'bg-blue-200 text-blue-800' :
                                log.maintenance_type === 'REPAIR' ? 'bg-red-200 text-red-800' :
                                log.maintenance_type === 'EMERGENCY' ? 'bg-orange-200 text-orange-800' :
                                'bg-purple-200 text-purple-800'
                              }`}>
                                {log.maintenance_type}
                              </span>
                              <span className="text-sm text-gray-600">{log.maintenance_date}</span>
                            </div>
                            <p className="text-sm">{log.summary}</p>
                            <div className="text-xs text-gray-400 mt-1">
                              {log.performed_by && <span>By: {log.performed_by} | </span>}
                              {log.cost && <span>Cost: ${Number(log.cost).toFixed(2)} | </span>}
                              ID: {log.id}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleEditMaintenanceLog(log)}
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMaintenanceLog(log)}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                              disabled={isDeletingMaintenanceLog}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No maintenance logs for this machine yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          UNIFIED INVENTORY SECTION (teal theme)
          ═══════════════════════════════════════════════════════════════ */}
      {isAuthenticated && workspace && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-teal-800 mb-3">Unified Inventory (STORAGE / DAMAGED / WASTE / SCRAP)</h2>

          {/* Filters */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <select
              value={filterInvType}
              onChange={(e) => setFilterInvType(e.target.value as InventoryType | '')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All Types</option>
              <option value="STORAGE">STORAGE</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="WASTE">WASTE</option>
              <option value="SCRAP">SCRAP</option>
            </select>
            <input
              type="text"
              placeholder="Filter by Factory ID"
              value={filterInvFactoryId}
              onChange={(e) => setFilterInvFactoryId(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-40"
            />
            <button
              onClick={() => setShowInvLedger(!showInvLedger)}
              className={`text-sm px-3 py-1 rounded ${showInvLedger ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-700'}`}
            >
              {showInvLedger ? 'Hide Ledger' : 'Show Ledger'}
            </button>
          </div>

          {/* Create / Edit Form */}
          <form onSubmit={editingInv ? handleUpdateInventory : handleCreateInventory} className="mb-4 p-3 bg-white rounded-lg space-y-2">
            <h3 className="font-semibold text-teal-700">{editingInv ? `Edit Inventory #${editingInv.id}` : 'Create Inventory Record'}</h3>
            {!editingInv && (
              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Item ID" value={invItemId} onChange={(e) => setInvItemId(e.target.value)} className="border rounded px-2 py-1 text-sm" required />
                <input type="number" placeholder="Factory ID" value={invFactoryId} onChange={(e) => setInvFactoryId(e.target.value)} className="border rounded px-2 py-1 text-sm" required />
                <select value={invType} onChange={(e) => setInvType(e.target.value as InventoryType)} className="border rounded px-2 py-1 text-sm">
                  <option value="STORAGE">STORAGE</option>
                  <option value="DAMAGED">DAMAGED</option>
                  <option value="WASTE">WASTE</option>
                  <option value="SCRAP">SCRAP</option>
                </select>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <input type="number" placeholder="Qty" value={invQty} onChange={(e) => setInvQty(e.target.value)} className="border rounded px-2 py-1 text-sm" required />
              <input type="text" placeholder="Avg Price" value={invAvgPrice} onChange={(e) => setInvAvgPrice(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <input type="text" placeholder="Note" value={invNote} onChange={(e) => setInvNote(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isCreatingInventory || isUpdatingInventory} className="bg-teal-600 text-white px-4 py-1 rounded text-sm hover:bg-teal-700">
                {editingInv ? 'Update' : 'Create'}
              </button>
              {editingInv && (
                <button type="button" onClick={resetInvForm} className="bg-gray-400 text-white px-4 py-1 rounded text-sm">Cancel</button>
              )}
            </div>
          </form>

          {/* Inventory List */}
          {isLoadingInventory ? (
            <p className="text-teal-600">Loading inventory...</p>
          ) : inventoryList && inventoryList.length > 0 ? (
            <div className="space-y-2 mb-4">
              <h3 className="font-semibold text-teal-700">Records ({inventoryList.length})</h3>
              {inventoryList.map((inv) => (
                <div key={inv.id} className="bg-white border rounded p-2 flex justify-between items-center">
                  <div className="text-sm">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                      inv.inventory_type === 'STORAGE' ? 'bg-blue-100 text-blue-700' :
                      inv.inventory_type === 'DAMAGED' ? 'bg-red-100 text-red-700' :
                      inv.inventory_type === 'WASTE' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{inv.inventory_type}</span>
                    Item:{inv.item_id} | Factory:{inv.factory_id} | Qty:{inv.qty}
                    {inv.avg_price && <span> | Avg:${Number(inv.avg_price).toFixed(2)}</span>}
                    <span className="text-gray-400 ml-2">#{inv.id}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditInventory(inv)} className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1">Edit</button>
                    <button onClick={() => handleDeleteInventory(inv)} disabled={isDeletingInventory} className="text-red-600 hover:text-red-800 text-sm px-2 py-1">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">No inventory records found.</p>
          )}

          {/* Ledger */}
          {showInvLedger && (
            <div className="border-t pt-3">
              <h3 className="font-semibold text-teal-700 mb-2">Inventory Ledger</h3>
              {isLoadingInvLedger ? (
                <p className="text-teal-600">Loading ledger...</p>
              ) : inventoryLedger && inventoryLedger.length > 0 ? (
                <div className="space-y-1">
                  {inventoryLedger.map((entry) => (
                    <div key={entry.id} className="bg-white border rounded p-2 text-xs">
                      <span className="font-medium">{entry.transaction_type}</span> |
                      Type:{entry.inventory_type} | Item:{entry.item_id} | Factory:{entry.factory_id} |
                      Qty:{entry.qty_before} → {entry.qty_after} ({entry.quantity})
                      {entry.notes && <span className="text-gray-500 ml-1">- {entry.notes}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No ledger entries.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCTS SECTION (indigo theme)
          ═══════════════════════════════════════════════════════════════ */}
      {isAuthenticated && workspace && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-indigo-800 mb-3">Products (Finished Goods)</h2>

          {/* Filters */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <input
              type="text"
              placeholder="Filter by Factory ID"
              value={filterProdFactoryId}
              onChange={(e) => setFilterProdFactoryId(e.target.value)}
              className="border rounded px-2 py-1 text-sm w-40"
            />
            <select
              value={filterProdAvailable}
              onChange={(e) => setFilterProdAvailable(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All</option>
              <option value="true">Available for Sale</option>
              <option value="false">Not Available</option>
            </select>
            <button
              onClick={() => setShowProdLedger(!showProdLedger)}
              className={`text-sm px-3 py-1 rounded ${showProdLedger ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'}`}
            >
              {showProdLedger ? 'Hide Ledger' : 'Show Ledger'}
            </button>
          </div>

          {/* Create / Edit Form */}
          <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct} className="mb-4 p-3 bg-white rounded-lg space-y-2">
            <h3 className="font-semibold text-indigo-700">{editingProduct ? `Edit Product #${editingProduct.id}` : 'Create Product'}</h3>
            {!editingProduct && (
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Item ID" value={prodItemId} onChange={(e) => setProdItemId(e.target.value)} className="border rounded px-2 py-1 text-sm" required />
                <input type="number" placeholder="Factory ID" value={prodFactoryId} onChange={(e) => setProdFactoryId(e.target.value)} className="border rounded px-2 py-1 text-sm" required />
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              <input type="number" placeholder="Qty" value={prodQty} onChange={(e) => setProdQty(e.target.value)} className="border rounded px-2 py-1 text-sm" required />
              <input type="text" placeholder="Avg Cost" value={prodAvgCost} onChange={(e) => setProdAvgCost(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <input type="text" placeholder="Selling Price" value={prodSellingPrice} onChange={(e) => setProdSellingPrice(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <input type="number" placeholder="Min Order Qty" value={prodMinOrderQty} onChange={(e) => setProdMinOrderQty(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Note" value={prodNote} onChange={(e) => setProdNote(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={prodAvailableForSale} onChange={(e) => setProdAvailableForSale(e.target.checked)} />
                Available for Sale (QC Passed)
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isCreatingProduct || isUpdatingProduct} className="bg-indigo-600 text-white px-4 py-1 rounded text-sm hover:bg-indigo-700">
                {editingProduct ? 'Update' : 'Create'}
              </button>
              {editingProduct && (
                <button type="button" onClick={resetProdForm} className="bg-gray-400 text-white px-4 py-1 rounded text-sm">Cancel</button>
              )}
            </div>
          </form>

          {/* Products List */}
          {isLoadingProducts ? (
            <p className="text-indigo-600">Loading products...</p>
          ) : productsList && productsList.length > 0 ? (
            <div className="space-y-2 mb-4">
              <h3 className="font-semibold text-indigo-700">Products ({productsList.length})</h3>
              {productsList.map((prod) => (
                <div key={prod.id} className="bg-white border rounded p-2 flex justify-between items-center">
                  <div className="text-sm">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                      prod.is_available_for_sale ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>{prod.is_available_for_sale ? 'FOR SALE' : 'QC PENDING'}</span>
                    Item:{prod.item_id} | Factory:{prod.factory_id} | Qty:{prod.qty}
                    {prod.avg_cost && <span> | Cost:${Number(prod.avg_cost).toFixed(2)}</span>}
                    {prod.selling_price && <span> | Price:${Number(prod.selling_price).toFixed(2)}</span>}
                    {prod.min_order_qty && <span> | MOQ:{prod.min_order_qty}</span>}
                    <span className="text-gray-400 ml-2">#{prod.id}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditProduct(prod)} className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1">Edit</button>
                    <button onClick={() => handleDeleteProduct(prod)} disabled={isDeletingProduct} className="text-red-600 hover:text-red-800 text-sm px-2 py-1">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">No product records found.</p>
          )}

          {/* Ledger */}
          {showProdLedger && (
            <div className="border-t pt-3">
              <h3 className="font-semibold text-indigo-700 mb-2">Product Ledger</h3>
              {isLoadingProdLedger ? (
                <p className="text-indigo-600">Loading ledger...</p>
              ) : productLedger && productLedger.length > 0 ? (
                <div className="space-y-1">
                  {productLedger.map((entry) => (
                    <div key={entry.id} className="bg-white border rounded p-2 text-xs">
                      <span className="font-medium">{entry.transaction_type}</span> |
                      Item:{entry.item_id} | Factory:{entry.factory_id} |
                      Qty:{entry.qty_before} → {entry.qty_after} ({entry.quantity})
                      {entry.notes && <span className="text-gray-500 ml-1">- {entry.notes}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No ledger entries.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          WORK ORDERS SECTION (orange theme)
          ═══════════════════════════════════════════════════════════════ */}
      {isAuthenticated && workspace && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h2 className="text-xl font-bold text-orange-800 mb-3">Work Orders</h2>

          {/* Filters */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <select value={filterWoType} onChange={(e) => setFilterWoType(e.target.value as WorkType | '')} className="border rounded px-2 py-1 text-sm">
              <option value="">All Types</option>
              {['MAINTENANCE', 'INSPECTION', 'INSTALLATION', 'REPAIR', 'CALIBRATION', 'OVERHAUL', 'FABRICATION', 'OTHER'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={filterWoStatus} onChange={(e) => setFilterWoStatus(e.target.value as WorkOrderStatus | '')} className="border rounded px-2 py-1 text-sm">
              <option value="">All Statuses</option>
              {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Create / Edit Form */}
          <form onSubmit={editingWo ? handleUpdateWorkOrder : handleCreateWorkOrder} className="mb-4 p-3 bg-white rounded-lg space-y-2">
            <h3 className="font-semibold text-orange-700">{editingWo ? `Edit ${editingWo.work_order_number}` : 'Create Work Order'}</h3>
            <div className="grid grid-cols-3 gap-2">
              <input type="text" placeholder="Title" value={woTitle} onChange={(e) => setWoTitle(e.target.value)} className="border rounded px-2 py-1 text-sm" required />
              <select value={woWorkType} onChange={(e) => setWoWorkType(e.target.value as WorkType)} className="border rounded px-2 py-1 text-sm">
                {['MAINTENANCE', 'INSPECTION', 'INSTALLATION', 'REPAIR', 'CALIBRATION', 'OVERHAUL', 'FABRICATION', 'OTHER'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select value={woPriority} onChange={(e) => setWoPriority(e.target.value as WorkOrderPriority)} className="border rounded px-2 py-1 text-sm">
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {!editingWo && <input type="number" placeholder="Factory ID" value={woFactoryId} onChange={(e) => setWoFactoryId(e.target.value)} className="border rounded px-2 py-1 text-sm" required />}
              <input type="number" placeholder="Machine ID (opt)" value={woMachineId} onChange={(e) => setWoMachineId(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <input type="date" placeholder="Start" value={woStartDate} onChange={(e) => setWoStartDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <input type="date" placeholder="End" value={woEndDate} onChange={(e) => setWoEndDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="text" placeholder="Cost" value={woCost} onChange={(e) => setWoCost(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <input type="text" placeholder="Assigned To" value={woAssignedTo} onChange={(e) => setWoAssignedTo(e.target.value)} className="border rounded px-2 py-1 text-sm" />
              <input type="text" placeholder="Notes" value={woNotes} onChange={(e) => setWoNotes(e.target.value)} className="border rounded px-2 py-1 text-sm" />
            </div>
            <input type="text" placeholder="Description" value={woDescription} onChange={(e) => setWoDescription(e.target.value)} className="border rounded px-2 py-1 text-sm w-full" />
            <div className="flex gap-2">
              <button type="submit" disabled={isCreatingWo || isUpdatingWo} className="bg-orange-600 text-white px-4 py-1 rounded text-sm hover:bg-orange-700">
                {editingWo ? 'Update' : 'Create'}
              </button>
              {editingWo && <button type="button" onClick={resetWoForm} className="bg-gray-400 text-white px-4 py-1 rounded text-sm">Cancel</button>}
            </div>
          </form>

          {/* Work Orders List */}
          {isLoadingWorkOrders ? (
            <p className="text-orange-600">Loading work orders...</p>
          ) : workOrders && workOrders.length > 0 ? (
            <div className="space-y-2 mb-4">
              <h3 className="font-semibold text-orange-700">Work Orders ({workOrders.length})</h3>
              {workOrders.map((wo) => (
                <div key={wo.id} className={`bg-white border rounded p-3 ${selectedWoId === wo.id ? 'ring-2 ring-orange-400' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="text-sm flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-500">{wo.work_order_number}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          wo.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          wo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          wo.status === 'APPROVED' ? 'bg-teal-100 text-teal-700' :
                          wo.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          wo.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{wo.status}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          wo.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                          wo.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          wo.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>{wo.priority}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{wo.work_type}</span>
                      </div>
                      <div className="font-medium">{wo.title}</div>
                      <div className="text-gray-500 text-xs">
                        Factory:{wo.factory_id}
                        {wo.machine_id && <span> | Machine:{wo.machine_id}</span>}
                        {wo.cost && <span> | Cost:${Number(wo.cost).toFixed(2)}</span>}
                        {wo.assigned_to && <span> | Assigned:{wo.assigned_to}</span>}
                        {wo.start_date && <span> | {wo.start_date}</span>}
                        {wo.end_date && <span> - {wo.end_date}</span>}
                      </div>
                      <div className="text-xs mt-1">
                        <span className={wo.order_approved ? 'text-green-600' : 'text-gray-400'}>
                          Order:{wo.order_approved ? 'Approved' : 'Pending'}
                        </span>
                        <span className="mx-1">|</span>
                        <span className={wo.cost_approved ? 'text-green-600' : 'text-gray-400'}>
                          Cost:{wo.cost_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleEditWorkOrder(wo)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1">Edit</button>
                        <button onClick={() => setSelectedWoId(selectedWoId === wo.id ? null : wo.id)} className="text-orange-600 hover:text-orange-800 text-xs px-2 py-1">
                          {selectedWoId === wo.id ? 'Hide Items' : 'Items'}
                        </button>
                        <button onClick={() => handleDeleteWorkOrder(wo)} disabled={isDeletingWo} className="text-red-600 hover:text-red-800 text-xs px-2 py-1">Delete</button>
                      </div>
                      <div className="flex gap-1">
                        {!wo.order_approved && <button onClick={() => handleApproveOrder(wo)} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded hover:bg-green-200">Approve Order</button>}
                        {!wo.cost_approved && <button onClick={() => handleApproveCost(wo)} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded hover:bg-green-200">Approve Cost</button>}
                      </div>
                      <select
                        value={wo.status}
                        onChange={(e) => handleUpdateWoStatus(wo, e.target.value as WorkOrderStatus)}
                        className="border rounded px-1 py-0.5 text-xs"
                      >
                        {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Work Order Items (expanded) */}
                  {selectedWoId === wo.id && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-xs font-semibold text-orange-700 mb-2">Items for {wo.work_order_number}</h4>
                      <form onSubmit={handleAddWoItem} className="flex gap-2 mb-2">
                        <input type="number" placeholder="Item ID" value={woItemId} onChange={(e) => setWoItemId(e.target.value)} className="border rounded px-2 py-1 text-xs w-24" required />
                        <input type="number" placeholder="Qty" value={woItemQty} onChange={(e) => setWoItemQty(e.target.value)} className="border rounded px-2 py-1 text-xs w-16" required />
                        <button type="submit" disabled={isAddingWoItem} className="bg-orange-500 text-white px-3 py-1 rounded text-xs">Add</button>
                      </form>
                      {isLoadingWoItems ? (
                        <p className="text-xs text-gray-500">Loading items...</p>
                      ) : woItems && woItems.length > 0 ? (
                        <div className="space-y-1">
                          {woItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-orange-50 rounded px-2 py-1 text-xs">
                              <span>Item:{item.item_id} | Qty:{item.quantity} {item.notes && `| ${item.notes}`}</span>
                              <button onClick={() => handleRemoveWoItem(item.id)} className="text-red-500 hover:text-red-700">Remove</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No items added yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No work orders found.</p>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* PURCHASE ORDERS (blue theme) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isAuthenticated && workspace && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-bold mb-4 text-blue-800">Purchase Orders</h2>

          {/* Create Form */}
          <div className="bg-blue-50 rounded p-3 mb-4">
            <h3 className="text-sm font-semibold mb-2 text-blue-700">Create Purchase Order</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input value={poAccountId} onChange={(e) => setPoAccountId(e.target.value)} placeholder="Account ID" className="border rounded px-2 py-1 text-sm" />
              <select value={poDestType} onChange={(e) => setPoDestType(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="storage">Storage</option>
                <option value="machine">Machine</option>
                <option value="project">Project</option>
              </select>
              <input value={poDestId} onChange={(e) => setPoDestId(e.target.value)} placeholder="Dest ID" className="border rounded px-2 py-1 text-sm" />
              <input value={poDescription} onChange={(e) => setPoDescription(e.target.value)} placeholder="Description" className="border rounded px-2 py-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              <input value={poNote} onChange={(e) => setPoNote(e.target.value)} placeholder="Order Note" className="border rounded px-2 py-1 text-sm" />
              <input value={poInternalNote} onChange={(e) => setPoInternalNote(e.target.value)} placeholder="Internal Note" className="border rounded px-2 py-1 text-sm" />
              <button
                onClick={async () => {
                  try {
                    await createPO({
                      account_id: parseInt(poAccountId),
                      destination_type: poDestType,
                      destination_id: parseInt(poDestId),
                      description: poDescription || undefined,
                      order_note: poNote || undefined,
                      internal_note: poInternalNote || undefined,
                      current_status_id: 1,
                    }).unwrap();
                    toast.success('Purchase order created');
                    setPoAccountId(''); setPoDestId(''); setPoNote(''); setPoDescription(''); setPoInternalNote('');
                  } catch (err: any) { toast.error(err.data?.detail || 'Failed'); }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >Create PO</button>
            </div>
          </div>

          {/* List */}
          {isLoadingPO ? <p>Loading...</p> : purchaseOrders && purchaseOrders.length > 0 ? (
            <div className="space-y-2">
              {purchaseOrders.map((po: PurchaseOrder) => (
                <div key={po.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-blue-700">{po.po_number}</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{po.destination_type}</span>
                      <span className="ml-2 text-xs text-gray-500">Total: ${Number(po.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedPoId(selectedPoId === po.id ? null : po.id)} className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded">Items</button>
                      <button onClick={async () => { try { await deletePO(po.id).unwrap(); toast.success('Deleted'); } catch { toast.error('Failed'); } }} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">Del</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Dest: {po.destination_type}:{po.destination_id} | Account: {po.account_id} | Status: {po.current_status_id} | Subtotal: ${Number(po.subtotal).toFixed(2)}
                    {po.description && <> | Desc: {po.description}</>}
                    {po.order_note && <> | Note: {po.order_note}</>}
                    {po.internal_note && <> | Internal: {po.internal_note}</>}
                    {po.order_workflow_id && <> | Workflow: {po.order_workflow_id}</>}
                    {po.invoice_id && <> | Invoice: {po.invoice_id}</>}
                    <br />Created: {new Date(po.created_at).toLocaleString()} by #{po.created_by}
                    {po.updated_at && <> | Updated: {new Date(po.updated_at).toLocaleString()}</>}
                  </div>
                  {selectedPoId === po.id && (
                    <div className="mt-2 border-t pt-2">
                      <div className="flex gap-2 mb-2">
                        <input value={poItemItemId} onChange={(e) => setPoItemItemId(e.target.value)} placeholder="Item ID" className="border rounded px-2 py-1 text-xs w-20" />
                        <input value={poItemQty} onChange={(e) => setPoItemQty(e.target.value)} placeholder="Qty" className="border rounded px-2 py-1 text-xs w-16" />
                        <input value={poItemPrice} onChange={(e) => setPoItemPrice(e.target.value)} placeholder="Price" className="border rounded px-2 py-1 text-xs w-20" />
                        <button onClick={async () => {
                          try {
                            await addPOItem({ poId: po.id, data: { item_id: parseInt(poItemItemId), quantity_ordered: parseFloat(poItemQty), unit_price: parseFloat(poItemPrice) } }).unwrap();
                            toast.success('Item added'); setPoItemItemId(''); setPoItemQty('1'); setPoItemPrice('0');
                          } catch { toast.error('Failed'); }
                        }} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Add</button>
                      </div>
                      {poItems && poItems.length > 0 ? (
                        <div className="space-y-1">
                          {poItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-blue-50 rounded px-2 py-1 text-xs">
                              <span>#{item.line_number} Item:{item.item_id} | Ordered:{Number(item.quantity_ordered)} Received:{Number(item.quantity_received)} @ ${Number(item.unit_price)} = ${Number(item.line_subtotal).toFixed(2)}{item.notes ? ` | ${item.notes}` : ''}</span>
                              <button onClick={async () => { try { await removePOItem(item.id).unwrap(); toast.success('Removed'); } catch { toast.error('Failed'); } }} className="text-red-500 hover:text-red-700">X</button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-500">No items.</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">No purchase orders found.</p>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TRANSFER ORDERS (green theme) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isAuthenticated && workspace && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-bold mb-4 text-green-800">Transfer Orders</h2>

          {/* Create Form */}
          <div className="bg-green-50 rounded p-3 mb-4">
            <h3 className="text-sm font-semibold mb-2 text-green-700">Create Transfer Order</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <select value={toSrcType} onChange={(e) => setToSrcType(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="storage">Storage</option>
                <option value="machine">Machine</option>
                <option value="damaged">Damaged</option>
              </select>
              <input value={toSrcId} onChange={(e) => setToSrcId(e.target.value)} placeholder="Source ID" className="border rounded px-2 py-1 text-sm" />
              <select value={toDestType} onChange={(e) => setToDestType(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="machine">Machine</option>
                <option value="storage">Storage</option>
                <option value="project">Project</option>
                <option value="damaged">Damaged</option>
              </select>
              <input value={toDestId} onChange={(e) => setToDestId(e.target.value)} placeholder="Dest ID" className="border rounded px-2 py-1 text-sm" />
              <input value={toDescription} onChange={(e) => setToDescription(e.target.value)} placeholder="Description" className="border rounded px-2 py-1 text-sm" />
              <input value={toNote} onChange={(e) => setToNote(e.target.value)} placeholder="Note" className="border rounded px-2 py-1 text-sm" />
            </div>
            <button
              onClick={async () => {
                try {
                  await createTO({
                    source_location_type: toSrcType,
                    source_location_id: parseInt(toSrcId),
                    destination_location_type: toDestType,
                    destination_location_id: parseInt(toDestId),
                    description: toDescription || undefined,
                    note: toNote || undefined,
                    current_status_id: 1,
                  }).unwrap();
                  toast.success('Transfer order created');
                  setToSrcId(''); setToDestId(''); setToNote(''); setToDescription('');
                } catch (err: any) { toast.error(err.data?.detail || 'Failed'); }
              }}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 mt-2"
            >Create TO</button>
          </div>

          {/* List */}
          {isLoadingTO ? <p>Loading...</p> : transferOrders && transferOrders.length > 0 ? (
            <div className="space-y-2">
              {transferOrders.map((to: TransferOrder) => (
                <div key={to.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-green-700">{to.transfer_number}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedToId(selectedToId === to.id ? null : to.id)} className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded">Items</button>
                      <button onClick={async () => { try { await deleteTO(to.id).unwrap(); toast.success('Deleted'); } catch { toast.error('Failed'); } }} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">Del</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {to.source_location_type}:{to.source_location_id} → {to.destination_location_type}:{to.destination_location_id} | Status: {to.current_status_id}
                    {to.description && <> | Desc: {to.description}</>}
                    {to.note && <> | Note: {to.note}</>}
                    <br />Date: {to.order_date} | Created: {new Date(to.created_at).toLocaleString()} by #{to.created_by}
                    {to.updated_at && <> | Updated: {new Date(to.updated_at).toLocaleString()}</>}
                    {to.completed_by && <> | Completed by #{to.completed_by} at {to.completed_at ? new Date(to.completed_at).toLocaleString() : ''}</>}
                  </div>
                  {selectedToId === to.id && (
                    <div className="mt-2 border-t pt-2">
                      <div className="flex gap-2 mb-2">
                        <input value={toItemItemId} onChange={(e) => setToItemItemId(e.target.value)} placeholder="Item ID" className="border rounded px-2 py-1 text-xs w-20" />
                        <input value={toItemQty} onChange={(e) => setToItemQty(e.target.value)} placeholder="Qty" className="border rounded px-2 py-1 text-xs w-16" />
                        <button onClick={async () => {
                          try {
                            await addTOItem({ toId: to.id, data: { item_id: parseInt(toItemItemId), quantity: parseFloat(toItemQty) } }).unwrap();
                            toast.success('Item added'); setToItemItemId(''); setToItemQty('1');
                          } catch { toast.error('Failed'); }
                        }} className="text-xs bg-green-500 text-white px-2 py-1 rounded">Add</button>
                      </div>
                      {toItems && toItems.length > 0 ? (
                        <div className="space-y-1">
                          {toItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-green-50 rounded px-2 py-1 text-xs">
                              <span>#{item.line_number} Item:{item.item_id} | Qty:{Number(item.quantity)} | {item.approved ? 'Approved' : 'Pending'} {item.transferred_by ? `| By: ${item.transferred_by}` : ''}{item.notes ? ` | ${item.notes}` : ''}</span>
                              <button onClick={async () => { try { await removeTOItem(item.id).unwrap(); toast.success('Removed'); } catch { toast.error('Failed'); } }} className="text-red-500 hover:text-red-700">X</button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-500">No items.</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">No transfer orders found.</p>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* EXPENSE ORDERS (rose theme) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isAuthenticated && workspace && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-rose-500">
          <h2 className="text-xl font-bold mb-4 text-rose-800">Expense Orders</h2>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <select value={eoFilterCategory} onChange={(e) => setEoFilterCategory(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="">All Categories</option>
              <option value="utilities">Utilities</option>
              <option value="payroll">Payroll</option>
              <option value="rent">Rent</option>
              <option value="services">Services</option>
              <option value="maintenance">Maintenance</option>
              <option value="insurance">Insurance</option>
              <option value="misc">Misc</option>
            </select>
          </div>

          {/* Create Form */}
          <div className="bg-rose-50 rounded p-3 mb-4">
            <h3 className="text-sm font-semibold mb-2 text-rose-700">Create Expense Order</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <select value={eoCategory} onChange={(e) => setEoCategory(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="utilities">Utilities</option>
                <option value="payroll">Payroll</option>
                <option value="rent">Rent</option>
                <option value="services">Services</option>
                <option value="maintenance">Maintenance</option>
                <option value="insurance">Insurance</option>
                <option value="misc">Misc</option>
              </select>
              <input value={eoAccountId} onChange={(e) => setEoAccountId(e.target.value)} placeholder="Account ID" className="border rounded px-2 py-1 text-sm" />
              <input value={eoExpenseDate} onChange={(e) => setEoExpenseDate(e.target.value)} placeholder="Expense Date (YYYY-MM-DD)" className="border rounded px-2 py-1 text-sm" />
              <input value={eoDueDate} onChange={(e) => setEoDueDate(e.target.value)} placeholder="Due Date (YYYY-MM-DD)" className="border rounded px-2 py-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <input value={eoDescription} onChange={(e) => setEoDescription(e.target.value)} placeholder="Description" className="border rounded px-2 py-1 text-sm" />
              <input value={eoNote} onChange={(e) => setEoNote(e.target.value)} placeholder="Expense Note" className="border rounded px-2 py-1 text-sm" />
              <input value={eoInternalNote} onChange={(e) => setEoInternalNote(e.target.value)} placeholder="Internal Note" className="border rounded px-2 py-1 text-sm" />
              <button
                onClick={async () => {
                  try {
                    await createEO({
                      expense_category: eoCategory,
                      account_id: eoAccountId ? parseInt(eoAccountId) : undefined,
                      expense_date: eoExpenseDate || undefined,
                      due_date: eoDueDate || undefined,
                      description: eoDescription || undefined,
                      expense_note: eoNote || undefined,
                      internal_note: eoInternalNote || undefined,
                      current_status_id: 1,
                    }).unwrap();
                    toast.success('Expense order created');
                    setEoNote(''); setEoAccountId(''); setEoExpenseDate(''); setEoDueDate(''); setEoDescription(''); setEoInternalNote('');
                  } catch (err: any) { toast.error(err.data?.detail || 'Failed'); }
                }}
                className="bg-rose-600 text-white px-3 py-1 rounded text-sm hover:bg-rose-700"
              >Create EO</button>
            </div>
          </div>

          {/* List */}
          {isLoadingEO ? <p>Loading...</p> : expenseOrders && expenseOrders.length > 0 ? (
            <div className="space-y-2">
              {expenseOrders.map((eo: ExpenseOrder) => (
                <div key={eo.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-rose-700">{eo.expense_number}</span>
                      <span className="ml-2 text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded">{eo.expense_category}</span>
                      <span className="ml-2 text-xs text-gray-500">Total: ${Number(eo.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedEoId(selectedEoId === eo.id ? null : eo.id)} className="text-xs bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded">Items</button>
                      <button onClick={async () => { try { await deleteEO(eo.id).unwrap(); toast.success('Deleted'); } catch { toast.error('Failed'); } }} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">Del</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Date: {eo.expense_date} | Status: {eo.current_status_id} | Subtotal: ${Number(eo.subtotal).toFixed(2)}
                    {eo.account_id && <> | Account: {eo.account_id}</>}
                    {eo.due_date && <> | Due: {eo.due_date}</>}
                    {eo.description && <> | Desc: {eo.description}</>}
                    {eo.expense_note && <> | Note: {eo.expense_note}</>}
                    {eo.internal_note && <> | Internal: {eo.internal_note}</>}
                    {eo.order_template_id && <> | Template: {eo.order_template_id}</>}
                    {eo.order_workflow_id && <> | Workflow: {eo.order_workflow_id}</>}
                    {eo.invoice_id && <> | Invoice: {eo.invoice_id}</>}
                    {eo.approved_by && <> | Approved by #{eo.approved_by}</>}
                    <br />Created: {new Date(eo.created_at).toLocaleString()} by #{eo.created_by}
                    {eo.updated_at && <> | Updated: {new Date(eo.updated_at).toLocaleString()}</>}
                  </div>
                  {selectedEoId === eo.id && (
                    <div className="mt-2 border-t pt-2">
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <input value={eoItemDesc} onChange={(e) => setEoItemDesc(e.target.value)} placeholder="Description" className="border rounded px-2 py-1 text-xs flex-1 min-w-[100px]" />
                        <input value={eoItemQty} onChange={(e) => setEoItemQty(e.target.value)} placeholder="Qty" className="border rounded px-2 py-1 text-xs w-16" />
                        <input value={eoItemUnit} onChange={(e) => setEoItemUnit(e.target.value)} placeholder="Unit" className="border rounded px-2 py-1 text-xs w-16" />
                        <input value={eoItemPrice} onChange={(e) => setEoItemPrice(e.target.value)} placeholder="Price" className="border rounded px-2 py-1 text-xs w-20" />
                        <button onClick={async () => {
                          try {
                            await addEOItem({ eoId: eo.id, data: { description: eoItemDesc || undefined, quantity: parseFloat(eoItemQty), unit: eoItemUnit || undefined, unit_price: parseFloat(eoItemPrice) } }).unwrap();
                            toast.success('Item added'); setEoItemDesc(''); setEoItemQty('1'); setEoItemPrice('0'); setEoItemUnit('');
                          } catch { toast.error('Failed'); }
                        }} className="text-xs bg-rose-500 text-white px-2 py-1 rounded">Add</button>
                      </div>
                      {eoItems && eoItems.length > 0 ? (
                        <div className="space-y-1">
                          {eoItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-rose-50 rounded px-2 py-1 text-xs">
                              <span>#{item.line_number} {item.description || '(no description)'} | Qty:{Number(item.quantity)} {item.unit || ''} {item.unit_price ? `@ $${Number(item.unit_price)}` : ''} {item.line_subtotal ? `= $${Number(item.line_subtotal).toFixed(2)}` : ''} | {item.approved ? 'Approved' : 'Pending'}{item.notes ? ` | ${item.notes}` : ''}</span>
                              <button onClick={async () => { try { await removeEOItem(item.id).unwrap(); toast.success('Removed'); } catch { toast.error('Failed'); } }} className="text-red-500 hover:text-red-700">X</button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-500">No items.</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">No expense orders found.</p>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ORDER TEMPLATES (violet theme) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isAuthenticated && workspace && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-violet-500">
          <h2 className="text-xl font-bold mb-4 text-violet-800">Order Templates</h2>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <select value={tplFilterCategory} onChange={(e) => setTplFilterCategory(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="">All Categories</option>
              <option value="utilities">Utilities</option>
              <option value="payroll">Payroll</option>
              <option value="rent">Rent</option>
              <option value="services">Services</option>
              <option value="maintenance">Maintenance</option>
              <option value="misc">Misc</option>
            </select>
          </div>

          {/* Create Form */}
          <div className="bg-violet-50 rounded p-3 mb-4">
            <h3 className="text-sm font-semibold mb-2 text-violet-700">Create Expense Template</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Template Name" className="border rounded px-2 py-1 text-sm" />
              <select value={tplCategory} onChange={(e) => setTplCategory(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="">No Category</option>
                <option value="utilities">Utilities</option>
                <option value="payroll">Payroll</option>
                <option value="rent">Rent</option>
                <option value="services">Services</option>
                <option value="maintenance">Maintenance</option>
                <option value="misc">Misc</option>
              </select>
              <input value={tplAccountId} onChange={(e) => setTplAccountId(e.target.value)} placeholder="Account ID" className="border rounded px-2 py-1 text-sm" />
              <input value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} placeholder="Description" className="border rounded px-2 py-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={tplIsRecurring} onChange={(e) => setTplIsRecurring(e.target.checked)} /> Recurring</label>
              {tplIsRecurring && (
                <>
                  <select value={tplRecurrenceType} onChange={(e) => setTplRecurrenceType(e.target.value)} className="border rounded px-2 py-1 text-sm">
                    <option value="">Recurrence Type</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                  <input value={tplRecurrenceDay} onChange={(e) => setTplRecurrenceDay(e.target.value)} placeholder="Recurrence Day" className="border rounded px-2 py-1 text-sm" />
                </>
              )}
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={tplAutoApprove} onChange={(e) => setTplAutoApprove(e.target.checked)} /> Auto-approve</label>
              <input value={tplNotes} onChange={(e) => setTplNotes(e.target.value)} placeholder="Notes" className="border rounded px-2 py-1 text-sm" />
            </div>
            <button
              onClick={async () => {
                try {
                  await createTPL({
                    template_name: tplName,
                    expense_category: tplCategory || undefined,
                    account_id: tplAccountId ? parseInt(tplAccountId) : undefined,
                    description: tplDesc || undefined,
                    is_recurring: tplIsRecurring,
                    recurrence_type: tplRecurrenceType || undefined,
                    recurrence_day: tplRecurrenceDay ? parseInt(tplRecurrenceDay) : undefined,
                    auto_approve: tplAutoApprove,
                    notes: tplNotes || undefined,
                  }).unwrap();
                  toast.success('Template created');
                  setTplName(''); setTplDesc(''); setTplCategory(''); setTplAccountId(''); setTplIsRecurring(false); setTplRecurrenceType(''); setTplRecurrenceDay(''); setTplAutoApprove(false); setTplNotes('');
                } catch (err: any) { toast.error(err.data?.detail || 'Failed'); }
              }}
              className="bg-violet-600 text-white px-3 py-1 rounded text-sm hover:bg-violet-700 mt-2"
            >Create Template</button>
          </div>

          {/* List */}
          {isLoadingTPL ? <p>Loading...</p> : orderTemplates && orderTemplates.length > 0 ? (
            <div className="space-y-2">
              {orderTemplates.map((tpl: OrderTemplate) => (
                <div key={tpl.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-violet-700">{tpl.template_name}</span>
                      {tpl.expense_category && <span className="ml-2 text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded">{tpl.expense_category}</span>}
                      {tpl.is_recurring && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Recurring</span>}
                      {!tpl.is_active && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedTplId(selectedTplId === tpl.id ? null : tpl.id)} className="text-xs bg-violet-100 hover:bg-violet-200 px-2 py-1 rounded">Items</button>
                      <button onClick={async () => { try { await deleteTPL(tpl.id).unwrap(); toast.success('Deleted'); } catch { toast.error('Failed'); } }} className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded">Del</button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {tpl.description || 'No description'}
                    {tpl.account_id && <> | Account: {tpl.account_id}</>}
                    {tpl.is_recurring && <> | {tpl.recurrence_type} (day {tpl.recurrence_day}){tpl.recurrence_interval && tpl.recurrence_interval > 1 ? ` every ${tpl.recurrence_interval}` : ''}</>}
                    {tpl.auto_approve && <> | Auto-approve</>}
                    {tpl.next_generation_date && <> | Next: {tpl.next_generation_date}</>}
                    {tpl.notes && <> | Notes: {tpl.notes}</>}
                    <br />Created: {new Date(tpl.created_at).toLocaleString()}{tpl.created_by ? ` by #${tpl.created_by}` : ''}
                    {tpl.updated_at && <> | Updated: {new Date(tpl.updated_at).toLocaleString()}</>}
                  </div>
                  {selectedTplId === tpl.id && (
                    <div className="mt-2 border-t pt-2">
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <input value={tplItemDesc} onChange={(e) => setTplItemDesc(e.target.value)} placeholder="Description" className="border rounded px-2 py-1 text-xs flex-1 min-w-[100px]" />
                        <input value={tplItemQty} onChange={(e) => setTplItemQty(e.target.value)} placeholder="Qty" className="border rounded px-2 py-1 text-xs w-16" />
                        <input value={tplItemUnit} onChange={(e) => setTplItemUnit(e.target.value)} placeholder="Unit" className="border rounded px-2 py-1 text-xs w-16" />
                        <input value={tplItemPrice} onChange={(e) => setTplItemPrice(e.target.value)} placeholder="Price" className="border rounded px-2 py-1 text-xs w-20" />
                        <button onClick={async () => {
                          try {
                            await addTPLItem({ tplId: tpl.id, data: { description: tplItemDesc || undefined, quantity: parseFloat(tplItemQty), unit: tplItemUnit || undefined, unit_price: parseFloat(tplItemPrice) } }).unwrap();
                            toast.success('Item added'); setTplItemDesc(''); setTplItemQty('1'); setTplItemPrice('0'); setTplItemUnit('');
                          } catch { toast.error('Failed'); }
                        }} className="text-xs bg-violet-500 text-white px-2 py-1 rounded">Add</button>
                      </div>
                      {tplItems && tplItems.length > 0 ? (
                        <div className="space-y-1">
                          {tplItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-violet-50 rounded px-2 py-1 text-xs">
                              <span>#{item.line_number} {item.description || '(no description)'} | Qty:{Number(item.quantity)} {item.unit ? item.unit : ''} {item.unit_price ? `@ $${Number(item.unit_price)}` : ''} {item.line_subtotal ? `= $${Number(item.line_subtotal)}` : ''}{item.notes ? ` | ${item.notes}` : ''}</span>
                              <button onClick={async () => { try { await removeTPLItem(item.id).unwrap(); toast.success('Removed'); } catch { toast.error('Failed'); } }} className="text-red-500 hover:text-red-700">X</button>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-xs text-gray-500">No items.</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500">No order templates found.</p>}
        </div>
      )}

    </div>
  );
};

export default ApiTestPage;
