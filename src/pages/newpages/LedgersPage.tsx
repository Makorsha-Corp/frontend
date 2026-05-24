import React, { useMemo, useState } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, {
  appShellHeaderIconTileClass,
  appShellHeaderLeftGroupClass,
  appShellHeaderTitleClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Loader2, RefreshCcw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetProjectComponentsQuery } from '@/features/projectComponents/projectComponentsApi';
import {
  useGetInventoryLedgerQuery,
  useGetInventoryBalanceQuery,
  useReconcileInventoryMutation,
  useGetMachineLedgerQuery,
  useGetMachineBalanceQuery,
  useReconcileMachineMutation,
  useGetProjectComponentLedgerQuery,
  useGetProjectComponentTotalCostQuery,
} from '@/features/ledgers/ledgersApi';
import { useGetProductLedgerQuery } from '@/features/products/productsApi';
import type {
  InventoryLedgerEntry,
  MachineLedgerEntry,
  ProjectComponentLedgerEntry,
} from '@/types/ledger';
import type { InventoryType } from '@/types/inventory';
import type { ProductLedgerEntry } from '@/types/product';

type LedgerScope =
  | 'storage'
  | 'damaged'
  | 'waste'
  | 'scrap'
  | 'machine'
  | 'project_component'
  | 'product';

type LedgerRow =
  | InventoryLedgerEntry
  | MachineLedgerEntry
  | ProjectComponentLedgerEntry
  | ProductLedgerEntry;

const scopeOptions: Array<{ value: LedgerScope; label: string }> = [
  { value: 'storage', label: 'Storage ledger' },
  { value: 'damaged', label: 'Damaged ledger' },
  { value: 'waste', label: 'Waste ledger' },
  { value: 'scrap', label: 'Scrap ledger' },
  { value: 'machine', label: 'Machine ledger' },
  { value: 'project_component', label: 'Project component ledger' },
  { value: 'product', label: 'Products (finished goods)' },
];

const inventoryTypeForScope = (scope: LedgerScope): InventoryType | null => {
  switch (scope) {
    case 'storage': return 'STORAGE';
    case 'damaged': return 'DAMAGED';
    case 'waste': return 'WASTE';
    case 'scrap': return 'SCRAP';
    default: return null;
  }
};

const isInventoryRow = (row: LedgerRow): row is InventoryLedgerEntry =>
  'inventory_type' in row;

const isMachineRow = (row: LedgerRow): row is MachineLedgerEntry =>
  'machine_id' in row;

const LedgersPage: React.FC = () => {
  const [scope, setScope] = useState<LedgerScope>('storage');
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [machineId, setMachineId] = useState<number | null>(null);
  const [itemId, setItemId] = useState<number | null>(null);
  const [projectComponentId, setProjectComponentId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false);

  // Backend caps: factories le=1000, machines le=1000, items le=100,
  // project_components le=100. Requesting above the cap returns 422 and the
  // hook silently falls back to []; keep request sizes within those caps.
  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 200 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: 500 });
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: 100 });
  const { data: projectComponents = [] } = useGetProjectComponentsQuery({ skip: 0, limit: 100 });

  const inventoryType = inventoryTypeForScope(scope);
  const isInventoryScope = inventoryType != null;
  const isMachineScope = scope === 'machine';
  const isProjectComponentScope = scope === 'project_component';
  const isProductScope = scope === 'product';
  // Scopes that surface the start/end-date + transaction-type filter inputs.
  const supportsDateFilters = !isProjectComponentScope;
  // Scopes that show a factory selector (inventory + product are factory-scoped).
  const showsFactorySelector = isInventoryScope || isProductScope;

  const factoryItemReady = factoryId != null && itemId != null;
  // List view: just picking a machine is enough; balance + reconcile still need both.
  const machineReady = machineId != null;
  const machineItemReady = machineId != null && itemId != null;
  const projectComponentReady = projectComponentId != null;

  // Unified inventory ledger (STORAGE / DAMAGED / WASTE / SCRAP).
  // All filters optional — listing works without picking factory/item.
  // Backend caps `limit` at le=100 for all ledger endpoints.
  const inventoryLedger = useGetInventoryLedgerQuery(
    {
      inventory_type: inventoryType ?? undefined,
      factory_id: factoryId ?? undefined,
      item_id: itemId ?? undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      transaction_type: transactionType || undefined,
      skip: 0,
      limit: 100,
    },
    { skip: !isInventoryScope }
  );
  const inventoryBalance = useGetInventoryBalanceQuery(
    {
      factory_id: factoryId ?? 0,
      item_id: itemId ?? 0,
      inventory_type: inventoryType ?? 'STORAGE',
    },
    { skip: !(isInventoryScope && factoryItemReady) }
  );

  const machineLedger = useGetMachineLedgerQuery(
    {
      machine_id: machineId ?? 0,
      item_id: itemId ?? undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      transaction_type: transactionType || undefined,
      skip: 0,
      limit: 100,
    },
    { skip: !(isMachineScope && machineReady) }
  );
  const machineBalance = useGetMachineBalanceQuery(
    { machine_id: machineId ?? 0, item_id: itemId ?? 0 },
    { skip: !(isMachineScope && machineItemReady) }
  );

  const projectComponentLedger = useGetProjectComponentLedgerQuery(
    {
      project_component_id: projectComponentId ?? 0,
      item_id: itemId ?? undefined,
      skip: 0,
      limit: 100,
    },
    { skip: !(isProjectComponentScope && projectComponentReady) }
  );
  const projectComponentTotalCost = useGetProjectComponentTotalCostQuery(projectComponentId ?? 0, {
    skip: !(isProjectComponentScope && projectComponentReady),
  });

  // Product (finished goods) ledger. All filters optional — omit any to broaden.
  const productLedger = useGetProductLedgerQuery(
    {
      factory_id: factoryId ?? undefined,
      item_id: itemId ?? undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      transaction_type: transactionType || undefined,
      skip: 0,
      limit: 100,
    },
    { skip: !isProductScope }
  );

  const [reconcileInventory, reconcileInventoryState] = useReconcileInventoryMutation();
  const [reconcileMachine, reconcileMachineState] = useReconcileMachineMutation();

  const rows: LedgerRow[] = useMemo(() => {
    if (isInventoryScope) return inventoryLedger.data ?? [];
    if (isMachineScope) return machineLedger.data ?? [];
    if (isProjectComponentScope) return projectComponentLedger.data ?? [];
    if (isProductScope) return productLedger.data ?? [];
    return [];
  }, [
    isInventoryScope,
    isMachineScope,
    isProjectComponentScope,
    isProductScope,
    inventoryLedger.data,
    machineLedger.data,
    projectComponentLedger.data,
    productLedger.data,
  ]);

  const balance = useMemo(() => {
    if (isInventoryScope) return factoryItemReady ? inventoryBalance.data : null;
    if (isMachineScope) return machineItemReady ? machineBalance.data : null;
    return null;
  }, [
    isInventoryScope,
    isMachineScope,
    factoryItemReady,
    machineItemReady,
    inventoryBalance.data,
    machineBalance.data,
  ]);

  const isLoading =
    inventoryLedger.isLoading ||
    machineLedger.isLoading ||
    projectComponentLedger.isLoading ||
    productLedger.isLoading;
  const isReconcileLoading =
    reconcileInventoryState.isLoading ||
    reconcileMachineState.isLoading;

  const handleReconcile = async () => {
    try {
      if (isInventoryScope && factoryItemReady && inventoryType) {
        const res = await reconcileInventory({
          factory_id: factoryId!,
          item_id: itemId!,
          inventory_type: inventoryType,
        }).unwrap();
        toast.success(String(res?.message || `${inventoryType.toLowerCase()} reconcile complete`));
        return;
      }
      if (isMachineScope && machineItemReady) {
        const res = await reconcileMachine({ machine_id: machineId!, item_id: itemId! }).unwrap();
        toast.success(String(res?.message || 'Machine reconcile complete'));
        return;
      }
      toast.error('Reconcile requires a factory + item (or machine + item) selection');
    } catch (error: unknown) {
      const e = error as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Reconcile failed');
    }
  };

  const canReconcile =
    (isInventoryScope && factoryItemReady) ||
    (isMachineScope && machineItemReady);

  if (!isLoadingFactories && factories.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <Toaster position="top-right" />
        <DashboardNavbar />
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-8 text-center bg-card">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6 shadow-sm">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">No Factories Set Up</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            You need to create a factory before viewing ledgers. Set up a factory to start tracking inventory and transactions.
          </p>
          <Button
            size="lg"
            className="bg-brand-primary hover:bg-brand-primary-hover shadow-md transition-all"
            onClick={() => setIsAddFactoryOpen(true)}
          >
            Create Your First Factory
          </Button>

          <AddFactoryDialog
            open={isAddFactoryOpen}
            onOpenChange={setIsAddFactoryOpen}
            factories={factories}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar />
      <div className="flex-1 min-w-0">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className={appShellHeaderLeftGroupClass}>
              <div className={appShellHeaderIconTileClass}>
                <BookOpen className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className={appShellHeaderTitleClass}>Ledgers</h1>
            </div>
            <Button onClick={handleReconcile} disabled={!canReconcile || isReconcileLoading} variant="outline" className="h-9">
              {isReconcileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Reconcile
            </Button>
          </div>
        </AppShellHeader>

        <div className="p-8 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <Select value={scope} onValueChange={(v) => setScope(v as LedgerScope)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ledger scope" />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showsFactorySelector && (
                <Select value={factoryId?.toString() ?? '__none__'} onValueChange={(v) => setFactoryId(v === '__none__' ? null : Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Factory (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All factories</SelectItem>
                    {factories.map((factory) => (
                      <SelectItem key={factory.id} value={factory.id.toString()}>
                        {factory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {isMachineScope && (
                <Select value={machineId?.toString() ?? '__none__'} onValueChange={(v) => setMachineId(v === '__none__' ? null : Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Machine" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select machine</SelectItem>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id.toString()}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {isProjectComponentScope && (
                <Select
                  value={projectComponentId?.toString() ?? '__none__'}
                  onValueChange={(v) => setProjectComponentId(v === '__none__' ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Project component" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select component</SelectItem>
                    {projectComponents.map((component) => (
                      <SelectItem key={component.id} value={component.id.toString()}>
                        {component.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={itemId?.toString() ?? '__none__'} onValueChange={(v) => setItemId(v === '__none__' ? null : Number(v))}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={isProjectComponentScope ? 'Item' : 'Item (optional)'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {isProjectComponentScope ? 'Select item' : 'All items'}
                  </SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {supportsDateFilters && (
                <>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  <Input
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    placeholder="Transaction type (optional)"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Entries</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{rows.length}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Balance Qty
                  {isInventoryScope && !factoryItemReady && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (pick factory + item)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{balance?.quantity ?? '—'}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Project Total Cost</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {isProjectComponentScope ? String(projectComponentTotalCost.data?.total_cost ?? '—') : '—'}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ledger entries</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading ledger entries...
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        {isInventoryScope && <TableHead>Type</TableHead>}
                        <TableHead>Transaction</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Before</TableHead>
                        <TableHead>After</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Performed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isInventoryScope ? 9 : 8} className="text-center text-muted-foreground py-8">
                            No ledger entries found for current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row) => {
                          const typeLabel = isInventoryRow(row)
                            ? row.inventory_type ?? '—'
                            : isMachineRow(row)
                              ? `Machine #${row.machine_id}`
                              : '—';
                          return (
                            <TableRow key={row.id}>
                              <TableCell>{row.id}</TableCell>
                              {isInventoryScope && (
                                <TableCell className="font-medium">{typeLabel}</TableCell>
                              )}
                              <TableCell>{row.transaction_type}</TableCell>
                              <TableCell>{row.quantity}</TableCell>
                              <TableCell>{row.qty_before}</TableCell>
                              <TableCell>{row.qty_after}</TableCell>
                              <TableCell>{row.unit_cost ?? '—'}</TableCell>
                              <TableCell>{row.total_cost ?? '—'}</TableCell>
                              <TableCell>{new Date(row.performed_at).toLocaleString()}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LedgersPage;
