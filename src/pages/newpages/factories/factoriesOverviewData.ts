import type { DueStatusRow } from '@/components/newcomponents/customui/DueStatusCard';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Inventory } from '@/types/inventory';
import type { InventoryLedgerEntry } from '@/types/inventory';
import type { Machine } from '@/types/machine';
import type { ProductionBatch, ProductionLine } from '@/types/production';
import type { MachineUpcomingWorkRow } from '@/types/machineUpcomingWork';
import { splitUpcomingWorkByDueWindow } from '@/lib/machineUpcomingWork';
import { getMachineVisualKind } from '@/lib/machineVisualStatus';
import { factoryHubLink } from '@/pages/newpages/factories/factoriesOverviewConstants';

export interface MachineStatusCounts {
  total: number;
  running: number;
  idle: number;
  off: number;
  maintenance: number;
}

export function countMachineStatus(machines: Machine[]): MachineStatusCounts {
  let running = 0;
  let maintenance = 0;
  let idle = 0;
  let off = 0;

  for (const m of machines) {
    const kind = getMachineVisualKind(m);
    if (kind === 'running') running += 1;
    else if (kind === 'maintenance') maintenance += 1;
    else if (kind === 'idle') idle += 1;
    else off += 1;
  }

  return { total: machines.length, running, idle, off, maintenance };
}

export interface StorageTopItemRow {
  name: string;
  qty: number;
  unit: string | null;
}

export interface StorageCardSnapshot {
  skusWithStock: number;
  totalUnits: number;
  estimatedValue: number;
  topItems: StorageTopItemRow[];
}

export interface ProductionInProgressRow {
  batchNumber: string;
  lineName: string | null;
}

export interface ProductionCardSnapshot {
  inProgressCount: number;
  draftCount: number;
  activeLineCount: number;
  inProgressBatches: ProductionInProgressRow[];
}

export function buildStorageCardSnapshot(inventory: Inventory[]): StorageCardSnapshot {
  const stocked = inventory.filter((row) => row.qty > 0);
  const totalUnits = stocked.reduce((sum, row) => sum + row.qty, 0);
  const estimatedValue = stocked.reduce(
    (sum, row) => sum + row.qty * (row.avg_price ?? 0),
    0
  );
  const topItems = [...stocked]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3)
    .map((row) => ({
      name: row.item_name?.trim() || `Item #${row.item_id}`,
      qty: row.qty,
      unit: row.item_unit ?? null,
    }));

  return {
    skusWithStock: stocked.length,
    totalUnits,
    estimatedValue,
    topItems,
  };
}

export interface FactoryCardSnapshot {
  running: number;
  totalMachines: number;
  storageSkus: number;
  productionInProgress: number;
  overdueCount: number;
  upcomingCount: number;
}

export function buildFactoryCardSnapshots(
  factories: Factory[],
  machines: Machine[],
  inventory: Inventory[],
  batches: ProductionBatch[],
  lines: ProductionLine[],
  upcomingWork: MachineUpcomingWorkRow[]
): Map<number, FactoryCardSnapshot> {
  const lineFactoryById = new Map(lines.map((line) => [line.id, line.factory_id]));

  const machinesByFactory = new Map<number, Machine[]>();
  for (const machine of machines) {
    const list = machinesByFactory.get(machine.factory_id) ?? [];
    list.push(machine);
    machinesByFactory.set(machine.factory_id, list);
  }

  const inventoryByFactory = new Map<number, Inventory[]>();
  for (const row of inventory) {
    const list = inventoryByFactory.get(row.factory_id) ?? [];
    list.push(row);
    inventoryByFactory.set(row.factory_id, list);
  }

  const inProgressByFactory = new Map<number, number>();
  for (const batch of batches) {
    if (batch.status !== 'in_progress') continue;
    const factoryId = lineFactoryById.get(batch.production_line_id);
    if (factoryId == null) continue;
    inProgressByFactory.set(factoryId, (inProgressByFactory.get(factoryId) ?? 0) + 1);
  }

  const upcomingByFactory = new Map<number, MachineUpcomingWorkRow[]>();
  for (const row of upcomingWork) {
    const list = upcomingByFactory.get(row.factory_id) ?? [];
    list.push(row);
    upcomingByFactory.set(row.factory_id, list);
  }

  const map = new Map<number, FactoryCardSnapshot>();
  for (const factory of factories) {
    const factoryMachines = machinesByFactory.get(factory.id) ?? [];
    const status = countMachineStatus(factoryMachines);
    const factoryInventory = inventoryByFactory.get(factory.id) ?? [];
    const factoryUpcoming = upcomingByFactory.get(factory.id) ?? [];
    const { overdueCount, upcomingCount } = splitUpcomingWorkByDueWindow(
      factoryUpcoming,
      new Map(),
      7,
      factory.abbreviation
    );

    map.set(factory.id, {
      running: status.running,
      totalMachines: status.total,
      storageSkus: factoryInventory.filter((row) => row.qty > 0).length,
      productionInProgress: inProgressByFactory.get(factory.id) ?? 0,
      overdueCount,
      upcomingCount,
    });
  }

  return map;
}

export function buildProductionCardSnapshot(
  batches: ProductionBatch[],
  lines: ProductionLine[]
): ProductionCardSnapshot {
  const lineById = new Map(lines.map((line) => [line.id, line]));
  const inProgress = batches.filter((b) => b.status === 'in_progress');
  const draftCount = batches.filter((b) => b.status === 'draft').length;
  const activeLineCount = lines.filter((l) => l.is_active).length;

  const inProgressBatches = inProgress.slice(0, 3).map((batch) => ({
    batchNumber: batch.batch_number,
    lineName: lineById.get(batch.production_line_id)?.name ?? null,
  }));

  return {
    inProgressCount: inProgress.length,
    draftCount,
    activeLineCount,
    inProgressBatches,
  };
}

export interface FactoryAttentionLinkRow {
  id: string;
  name: string;
  contextLabel: string;
  href: string;
  secondaryLabel?: string;
}

export interface FactoryAttentionGroups {
  maintenanceDue: DueStatusRow[];
  idle: FactoryAttentionLinkRow[];
  off: FactoryAttentionLinkRow[];
  unassigned: FactoryAttentionLinkRow[];
  draftBatches: FactoryAttentionLinkRow[];
}

function machineSectionLabel(
  machine: Machine,
  sectionById: Map<number, FactorySection>
): string {
  if (machine.factory_section_id == null) return 'Unassigned';
  return (
    sectionById.get(machine.factory_section_id)?.name ??
    machine.factory_section_name ??
    `Section ${machine.factory_section_id}`
  );
}

function machineHref(machine: Machine, factoryId: number): string {
  if (machine.factory_section_id != null) {
    return `/factories/${factoryId}/sections/${machine.factory_section_id}`;
  }
  return factoryHubLink('/machines', String(factoryId));
}

export function buildFactoryAttentionItems(
  factoryId: number,
  machines: Machine[],
  maintenanceDueRows: DueStatusRow[],
  batches: ProductionBatch[],
  lines: ProductionLine[],
  sectionById: Map<number, FactorySection>
): FactoryAttentionGroups {
  const lineById = new Map(lines.map((line) => [line.id, line]));

  const idle = machines
    .filter((machine) => getMachineVisualKind(machine) === 'idle')
    .map((machine) => ({
      id: `idle-${machine.id}`,
      name: machine.name,
      contextLabel: machineSectionLabel(machine, sectionById),
      href: machineHref(machine, factoryId),
    }));

  const off = machines
    .filter((machine) => getMachineVisualKind(machine) === 'off')
    .map((machine) => ({
      id: `off-${machine.id}`,
      name: machine.name,
      contextLabel: machineSectionLabel(machine, sectionById),
      href: machineHref(machine, factoryId),
    }));

  const unassigned = machines
    .filter((machine) => machine.factory_section_id == null)
    .map((machine) => ({
      id: `unassigned-${machine.id}`,
      name: machine.name,
      contextLabel: 'No section assigned',
      href: machineHref(machine, factoryId),
    }));

  const draftBatches = batches
    .filter((batch) => batch.status === 'draft')
    .map((batch) => ({
      id: `draft-${batch.id}`,
      name: batch.batch_number,
      contextLabel: lineById.get(batch.production_line_id)?.name ?? 'Production line',
      href: factoryHubLink('/production', String(factoryId)),
    }));

  return {
    maintenanceDue: maintenanceDueRows,
    idle,
    off,
    unassigned,
    draftBatches,
  };
}

export function factoryAttentionHasItems(groups: FactoryAttentionGroups): boolean {
  return (
    groups.maintenanceDue.length > 0 ||
    groups.idle.length > 0 ||
    groups.off.length > 0 ||
    groups.unassigned.length > 0 ||
    groups.draftBatches.length > 0
  );
}

export interface FactoryActivityItem {
  id: string;
  timestamp: Date;
  description: string;
  subtext: string;
  href?: string;
}

const ACTIVITY_HORIZON_DAYS = 7;
const ACTIVITY_LIMIT = 10;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isOnOrAfter(date: Date, since: Date): boolean {
  return date.getTime() >= since.getTime();
}

function formatMachineStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'RUNNING':
      return 'Running';
    case 'MAINTENANCE':
      return 'Maintenance';
    case 'IDLE':
      return 'Idle';
    case 'OFF':
      return 'Off';
    default:
      return status ?? 'Status updated';
  }
}

function formatTransactionLabel(transactionType: string): string {
  return transactionType.replace(/_/g, ' ');
}

export function buildFactoryActivityFeed(
  factoryId: number,
  machines: Machine[],
  ledgerEntries: InventoryLedgerEntry[],
  batches: ProductionBatch[],
  lines: ProductionLine[],
  inventory: Inventory[],
  sectionById: Map<number, FactorySection>,
  horizonDays = ACTIVITY_HORIZON_DAYS,
  limit = ACTIVITY_LIMIT
): FactoryActivityItem[] {
  const since = new Date(Date.now() - horizonDays * 24 * 60 * 60 * 1000);
  const itemNameById = new Map(inventory.map((row) => [row.item_id, row.item_name?.trim() || `Item #${row.item_id}`]));
  const lineById = new Map(lines.map((line) => [line.id, line]));
  const items: FactoryActivityItem[] = [];

  for (const machine of machines) {
    const timestamp = parseDate(machine.latest_status_at);
    if (!timestamp || !isOnOrAfter(timestamp, since)) continue;
    if (!machine.latest_status_type) continue;

    items.push({
      id: `machine-status-${machine.id}-${timestamp.getTime()}`,
      timestamp,
      description: `${machine.name} → ${formatMachineStatusLabel(machine.latest_status_type)}`,
      subtext: machineSectionLabel(machine, sectionById),
      href: machineHref(machine, factoryId),
    });
  }

  for (const entry of ledgerEntries) {
    const timestamp = parseDate(entry.performed_at);
    if (!timestamp || !isOnOrAfter(timestamp, since)) continue;

    const itemName = itemNameById.get(entry.item_id) ?? `Item #${entry.item_id}`;
    const sign = entry.quantity >= 0 ? '+' : '';
    items.push({
      id: `ledger-${entry.id}`,
      timestamp,
      description: `Storage: ${sign}${entry.quantity} ${itemName}`,
      subtext: formatTransactionLabel(entry.transaction_type),
      href: factoryHubLink('/ledgers', String(factoryId)),
    });
  }

  for (const batch of batches) {
    const lineName = lineById.get(batch.production_line_id)?.name ?? 'Production line';
    const productionHref = factoryHubLink('/production', String(factoryId));

    const startedAt = parseDate(batch.started_at);
    if (
      startedAt &&
      isOnOrAfter(startedAt, since) &&
      (batch.status === 'in_progress' || batch.status === 'completed')
    ) {
      items.push({
        id: `batch-started-${batch.id}`,
        timestamp: startedAt,
        description: `Batch ${batch.batch_number} started`,
        subtext: lineName,
        href: productionHref,
      });
    }

    const completedAt = parseDate(batch.completed_at);
    if (completedAt && isOnOrAfter(completedAt, since) && batch.status === 'completed') {
      items.push({
        id: `batch-completed-${batch.id}`,
        timestamp: completedAt,
        description: `Batch ${batch.batch_number} completed`,
        subtext: lineName,
        href: productionHref,
      });
    }

    const updatedAt = parseDate(batch.updated_at);
    if (updatedAt && isOnOrAfter(updatedAt, since) && batch.status === 'cancelled') {
      items.push({
        id: `batch-cancelled-${batch.id}`,
        timestamp: updatedAt,
        description: `Batch ${batch.batch_number} cancelled`,
        subtext: lineName,
        href: productionHref,
      });
    }
  }

  return items
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}
