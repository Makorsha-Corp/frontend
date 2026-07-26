import type { DueStatusRow } from '@/components/newcomponents/customui/DueStatusCard';
import { buildWorkOrderHref } from '@/lib/entityLinks';
import type { FactorySection } from '@/types/factorySection';
import type { MachineUpcomingWorkRow } from '@/types/machineUpcomingWork';

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseItemDate(isoDate: string): Date | null {
  const date = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : startOfLocalDay(date);
}

function formatDueDateLabel(isoDate: string): string {
  const date = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface SplitUpcomingWorkResult {
  overdueRows: DueStatusRow[];
  upcomingRows: DueStatusRow[];
  overdueCount: number;
  upcomingCount: number;
}

/** Split mapped due rows into overdue vs due within horizon (inclusive). */
export function splitUpcomingWorkByDueWindow(
  rows: MachineUpcomingWorkRow[],
  sectionById: Map<number, FactorySection>,
  withinDays = 7,
  factoryAbbrev?: string
): SplitUpcomingWorkResult {
  const today = startOfLocalDay(new Date());
  const horizonEnd = new Date(today);
  horizonEnd.setDate(horizonEnd.getDate() + withinDays);

  const allRows = mapUpcomingWorkToDueRowsWithMeta(rows, sectionById, factoryAbbrev, today);

  const overdueRows = allRows
    .filter((row) => row.isOverdue)
    .sort((a, b) => (a.dueDateIso ?? '').localeCompare(b.dueDateIso ?? ''));

  const upcomingRows = allRows
    .filter((row) => {
      if (row.isOverdue || !row.dueDateIso) return false;
      const itemDate = parseItemDate(row.dueDateIso);
      return itemDate != null && itemDate >= today && itemDate <= horizonEnd;
    })
    .sort((a, b) => (a.dueDateIso ?? '').localeCompare(b.dueDateIso ?? ''));

  return {
    overdueRows: stripDueDateIso(overdueRows),
    upcomingRows: stripDueDateIso(upcomingRows),
    overdueCount: overdueRows.length,
    upcomingCount: upcomingRows.length,
  };
}

function stripDueDateIso(rows: Array<DueStatusRow & { dueDateIso?: string }>): DueStatusRow[] {
  return rows.map(({ dueDateIso: _dueDateIso, ...row }) => row);
}

function mapUpcomingWorkToDueRowsWithMeta(
  rows: MachineUpcomingWorkRow[],
  sectionById: Map<number, FactorySection>,
  factoryAbbrev?: string,
  referenceDate: Date = startOfLocalDay(new Date())
): Array<DueStatusRow & { dueDateIso: string }> {
  const out: Array<DueStatusRow & { dueDateIso: string }> = [];

  for (const machineRow of rows) {
    const sectionLabel =
      machineRow.section_name ??
      (machineRow.factory_section_id != null
        ? sectionById.get(machineRow.factory_section_id)?.name ?? 'Section'
        : 'Unassigned');
    const factoryPrefix = factoryAbbrev ? `${factoryAbbrev} · ` : '';

    for (const item of machineRow.items) {
      const statusLabel =
        item.status === 'DRAFT'
          ? 'Draft'
          : item.status === 'IN_PROGRESS'
            ? 'In progress'
            : (item.status ?? 'Draft');
      const typeLabel = item.work_order_type_name ?? 'Work order';
      const dueDateIso = item.date.slice(0, 10);
      const itemDate = parseItemDate(dueDateIso);
      const isOverdue =
        item.status === 'IN_PROGRESS' && itemDate != null && itemDate < referenceDate;

      out.push({
        id: `work-order-${item.source_id}`,
        machineId: machineRow.machine_id,
        name: item.title || machineRow.name,
        dateLabel: formatDueDateLabel(item.date),
        contextLabel: `${factoryPrefix}${sectionLabel} · ${statusLabel} · ${typeLabel}`,
        href: buildWorkOrderHref(item.source_id, {
          machineId: machineRow.machine_id,
          factoryId: machineRow.factory_id,
        }),
        dueDateIso,
        isOverdue,
      });
    }
  }

  return out.sort((a, b) => a.dueDateIso.localeCompare(b.dueDateIso));
}

/** Map API rows to DueStatusCard rows (one card row per work item). */
export function mapUpcomingWorkToDueRows(
  rows: MachineUpcomingWorkRow[],
  sectionById: Map<number, FactorySection>,
  factoryAbbrev?: string,
  referenceDate: Date = startOfLocalDay(new Date())
): DueStatusRow[] {
  return stripDueDateIso(mapUpcomingWorkToDueRowsWithMeta(rows, sectionById, factoryAbbrev, referenceDate));
}

/** Attention-feed rows (one per machine, earliest date). */
export function mapUpcomingWorkToAttentionRows(
  rows: MachineUpcomingWorkRow[],
  sectionById: Map<number, FactorySection>
): Array<{ id: string; title: string; subtitle: string; sortKey: number; href: string }> {
  const today = startOfLocalDay(new Date());

  return rows.map((row) => {
    const section =
      row.factory_section_id != null ? sectionById.get(row.factory_section_id) : undefined;
    const sectionLabel = row.section_name ?? section?.name;
    const dateLabel = row.earliest_date.slice(0, 10);
    const countLabel = row.count > 1 ? ` · ${row.count} items` : '';
    const earliestDate = parseItemDate(dateLabel);
    const overdueSuffix =
      earliestDate != null && earliestDate < today ? ' · overdue' : '';
    return {
      id: `machine-work-${row.machine_id}`,
      title: row.name,
      subtitle: sectionLabel
        ? `${sectionLabel} · ${dateLabel}${overdueSuffix}${countLabel}`
        : `${dateLabel}${overdueSuffix}${countLabel}`,
      sortKey: earliestDate != null && earliestDate < today
        ? earliestDate.getTime() - 1_000_000_000_000
        : new Date(`${dateLabel}T00:00:00`).getTime(),
      href: section
        ? `/factories/${section.factory_id}/sections/${section.id}?machineId=${row.machine_id}`
        : `/factories/${row.factory_id}`,
    };
  });
}
