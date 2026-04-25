import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
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
  useGetStorageLedgerQuery,
  useGetStorageBalanceQuery,
  useReconcileStorageMutation,
  useGetMachineLedgerQuery,
  useGetMachineBalanceQuery,
  useReconcileMachineMutation,
  useGetDamagedLedgerQuery,
  useGetDamagedBalanceQuery,
  useReconcileDamagedMutation,
  useGetInventoryLedgerQuery,
  useGetInventoryBalanceQuery,
  useReconcileInventoryMutation,
  useGetProjectComponentLedgerQuery,
  useGetProjectComponentTotalCostQuery,
} from '@/features/ledgers/ledgersApi';

type LedgerScope = 'storage' | 'machine' | 'damaged' | 'inventory' | 'project_component';

const scopeOptions: Array<{ value: LedgerScope; label: string }> = [
  { value: 'storage', label: 'Storage ledger' },
  { value: 'machine', label: 'Machine ledger' },
  { value: 'damaged', label: 'Damaged ledger' },
  { value: 'inventory', label: 'Inventory ledger' },
  { value: 'project_component', label: 'Project component ledger' },
];

const LedgersPage: React.FC = () => {
  const [scope, setScope] = useState<LedgerScope>('storage');
  const [factoryId, setFactoryId] = useState<number | null>(null);
  const [machineId, setMachineId] = useState<number | null>(null);
  const [itemId, setItemId] = useState<number | null>(null);
  const [projectComponentId, setProjectComponentId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('');

  const navigate = useNavigate();
  const { data: factories = [], isLoading: isLoadingFactories } = useGetFactoriesQuery({ skip: 0, limit: 200 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: 500 });
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: 500 });
  const { data: projectComponents = [] } = useGetProjectComponentsQuery({ skip: 0, limit: 500 });

  const commonFactoryItemReady = factoryId != null && itemId != null;
  const machineItemReady = machineId != null && itemId != null;
  const projectComponentReady = projectComponentId != null;

  const storageLedger = useGetStorageLedgerQuery(
    {
      factory_id: factoryId ?? 0,
      item_id: itemId ?? 0,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      transaction_type: transactionType || undefined,
      skip: 0,
      limit: 200,
    },
    { skip: !(scope === 'storage' && commonFactoryItemReady) }
  );
  const storageBalance = useGetStorageBalanceQuery(
    { factory_id: factoryId ?? 0, item_id: itemId ?? 0 },
    { skip: !(scope === 'storage' && commonFactoryItemReady) }
  );

  const machineLedger = useGetMachineLedgerQuery(
    {
      machine_id: machineId ?? 0,
      item_id: itemId ?? 0,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      transaction_type: transactionType || undefined,
      skip: 0,
      limit: 200,
    },
    { skip: !(scope === 'machine' && machineItemReady) }
  );
  const machineBalance = useGetMachineBalanceQuery(
    { machine_id: machineId ?? 0, item_id: itemId ?? 0 },
    { skip: !(scope === 'machine' && machineItemReady) }
  );

  const damagedLedger = useGetDamagedLedgerQuery(
    {
      factory_id: factoryId ?? 0,
      item_id: itemId ?? 0,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      skip: 0,
      limit: 200,
    },
    { skip: !(scope === 'damaged' && commonFactoryItemReady) }
  );
  const damagedBalance = useGetDamagedBalanceQuery(
    { factory_id: factoryId ?? 0, item_id: itemId ?? 0 },
    { skip: !(scope === 'damaged' && commonFactoryItemReady) }
  );

  const inventoryLedger = useGetInventoryLedgerQuery(
    {
      factory_id: factoryId ?? 0,
      item_id: itemId ?? 0,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      transaction_type: transactionType || undefined,
      skip: 0,
      limit: 200,
    },
    { skip: !(scope === 'inventory' && commonFactoryItemReady) }
  );
  const inventoryBalance = useGetInventoryBalanceQuery(
    { factory_id: factoryId ?? 0, item_id: itemId ?? 0 },
    { skip: !(scope === 'inventory' && commonFactoryItemReady) }
  );

  const projectComponentLedger = useGetProjectComponentLedgerQuery(
    {
      project_component_id: projectComponentId ?? 0,
      item_id: itemId ?? undefined,
      skip: 0,
      limit: 200,
    },
    { skip: !(scope === 'project_component' && projectComponentReady) }
  );
  const projectComponentTotalCost = useGetProjectComponentTotalCostQuery(projectComponentId ?? 0, {
    skip: !(scope === 'project_component' && projectComponentReady),
  });

  const [reconcileStorage, reconcileStorageState] = useReconcileStorageMutation();
  const [reconcileMachine, reconcileMachineState] = useReconcileMachineMutation();
  const [reconcileDamaged, reconcileDamagedState] = useReconcileDamagedMutation();
  const [reconcileInventory, reconcileInventoryState] = useReconcileInventoryMutation();

  const rows = useMemo(() => {
    if (scope === 'storage') return storageLedger.data ?? [];
    if (scope === 'machine') return machineLedger.data ?? [];
    if (scope === 'damaged') return damagedLedger.data ?? [];
    if (scope === 'inventory') return inventoryLedger.data ?? [];
    return projectComponentLedger.data ?? [];
  }, [scope, storageLedger.data, machineLedger.data, damagedLedger.data, inventoryLedger.data, projectComponentLedger.data]);

  const balance = useMemo(() => {
    if (scope === 'storage') return storageBalance.data;
    if (scope === 'machine') return machineBalance.data;
    if (scope === 'damaged') return damagedBalance.data;
    if (scope === 'inventory') return inventoryBalance.data;
    return null;
  }, [scope, storageBalance.data, machineBalance.data, damagedBalance.data, inventoryBalance.data]);

  const isLoading = storageLedger.isLoading || machineLedger.isLoading || damagedLedger.isLoading || inventoryLedger.isLoading || projectComponentLedger.isLoading;
  const isReconcileLoading =
    reconcileStorageState.isLoading ||
    reconcileMachineState.isLoading ||
    reconcileDamagedState.isLoading ||
    reconcileInventoryState.isLoading;

  const handleReconcile = async () => {
    try {
      if (scope === 'storage' && commonFactoryItemReady) {
        const res = await reconcileStorage({ factory_id: factoryId!, item_id: itemId! }).unwrap();
        toast.success(String(res?.message || 'Storage reconcile complete'));
        return;
      }
      if (scope === 'machine' && machineItemReady) {
        const res = await reconcileMachine({ machine_id: machineId!, item_id: itemId! }).unwrap();
        toast.success(String(res?.message || 'Machine reconcile complete'));
        return;
      }
      if (scope === 'damaged' && commonFactoryItemReady) {
        const res = await reconcileDamaged({ factory_id: factoryId!, item_id: itemId! }).unwrap();
        toast.success(String(res?.message || 'Damaged reconcile complete'));
        return;
      }
      if (scope === 'inventory' && commonFactoryItemReady) {
        const res = await reconcileInventory({ factory_id: factoryId!, item_id: itemId! }).unwrap();
        toast.success(String(res?.message || 'Inventory reconcile complete'));
        return;
      }
      toast.error('Reconcile is not available for this selection');
    } catch (error: unknown) {
      const e = error as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Reconcile failed');
    }
  };

  const canReconcile =
    (scope === 'storage' && commonFactoryItemReady) ||
    (scope === 'machine' && machineItemReady) ||
    (scope === 'damaged' && commonFactoryItemReady) ||
    (scope === 'inventory' && commonFactoryItemReady);

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
            onClick={() => navigate('/factories')}
          >
            Create Your First Factory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar />
      <div className="flex-1 min-w-0">
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Ledgers</h1>
            </div>
            <Button onClick={handleReconcile} disabled={!canReconcile || isReconcileLoading} variant="outline" className="h-9">
              {isReconcileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Reconcile
            </Button>
          </div>
        </div>

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

              {(scope === 'storage' || scope === 'damaged' || scope === 'inventory') && (
                <Select value={factoryId?.toString() ?? '__none__'} onValueChange={(v) => setFactoryId(v === '__none__' ? null : Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Factory" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select factory</SelectItem>
                    {factories.map((factory) => (
                      <SelectItem key={factory.id} value={factory.id.toString()}>
                        {factory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {scope === 'machine' && (
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

              {scope === 'project_component' && (
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
                <SelectTrigger><SelectValue placeholder="Item" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select item</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(scope !== 'project_component') && (
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
              <CardHeader className="pb-2"><CardTitle className="text-sm">Balance Qty</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">{balance?.quantity ?? '—'}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Project Total Cost</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {scope === 'project_component' ? String(projectComponentTotalCost.data?.total_cost ?? '—') : '—'}
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
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No ledger entries found for current filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((row: any) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>{row.transaction_type}</TableCell>
                            <TableCell>{row.quantity}</TableCell>
                            <TableCell>{row.qty_before}</TableCell>
                            <TableCell>{row.qty_after}</TableCell>
                            <TableCell>{row.unit_cost ?? '—'}</TableCell>
                            <TableCell>{row.total_cost ?? '—'}</TableCell>
                            <TableCell>{new Date(row.performed_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
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
