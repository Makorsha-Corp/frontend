import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { workOrdersApi } from '@/features/workOrders/workOrdersApi';
import type { WorkOrder } from '@/types/workOrder';
import type { WorkOrderSheetBundle } from '@/types/workOrderSheet';

export interface TemplateMachinePair {
  templateId: number;
  machineId: number;
}

export function collectTemplateMachinePairs(bundles: WorkOrderSheetBundle[]): TemplateMachinePair[] {
  const seen = new Set<string>();
  const pairs: TemplateMachinePair[] = [];
  for (const bundle of bundles) {
    const templateId = bundle.order.work_order_template_id;
    const machineId = bundle.order.machine_id;
    if (!templateId || !machineId) continue;
    const key = `${templateId}:${machineId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ templateId, machineId });
  }
  return pairs;
}

/** Loads full recurring-program context for template+machine pairs visible on the current sheet page. */
export function useRecurrenceProgramOrdersForSheet(bundles: WorkOrderSheetBundle[]): WorkOrder[] {
  const dispatch = useAppDispatch();
  const [programOrders, setProgramOrders] = useState<WorkOrder[]>([]);
  const pairs = useMemo(() => collectTemplateMachinePairs(bundles), [bundles]);

  useEffect(() => {
    let cancelled = false;

    if (pairs.length === 0) {
      setProgramOrders([]);
      return undefined;
    }

    Promise.all(
      pairs.map(({ templateId, machineId }) =>
        dispatch(
          workOrdersApi.endpoints.getWorkOrders.initiate({
            work_order_template_id: templateId,
            machine_id: machineId,
            limit: 100,
            skip: 0,
          }),
        ).unwrap(),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        const byId = new Map<number, WorkOrder>();
        for (const list of results) {
          for (const order of list) {
            byId.set(order.id, order);
          }
        }
        setProgramOrders(Array.from(byId.values()));
      })
      .catch(() => {
        if (!cancelled) setProgramOrders([]);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, pairs]);

  return programOrders;
}
