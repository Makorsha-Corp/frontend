import type { PurchaseOrder } from '@/types/purchaseOrder';

export interface PurchaseOrderDestinationLookups {
  factories: Array<{ id: number; name: string }>;
  machines: Array<{ id: number; name: string }>;
  projectComponents: Array<{
    id: number;
    name: string;
    project_id?: number;
    project_name?: string | null;
  }>;
}

export function resolvePurchaseOrderDestinationLabel(
  order: Pick<PurchaseOrder, 'destination_type' | 'destination_id'>,
  lookups: PurchaseOrderDestinationLookups,
): string {
  const { destination_type, destination_id } = order;

  if (destination_type === 'storage') {
    const factory = lookups.factories.find((f) => f.id === destination_id);
    return factory ? `Storage (${factory.name})` : 'Storage';
  }

  if (destination_type === 'machine') {
    const machine = lookups.machines.find((m) => m.id === destination_id);
    return machine ? `Machine (${machine.name})` : `Machine #${destination_id}`;
  }

  if (destination_type === 'project') {
    const component = lookups.projectComponents.find((c) => c.id === destination_id);
    if (component) {
      const projectName =
        component.project_name ??
        (component.project_id != null ? `Project #${component.project_id}` : null);
      if (projectName) {
        return `Project · ${projectName} / ${component.name}`;
      }
      return `Component · ${component.name}`;
    }
    return `Component #${destination_id}`;
  }

  return `${destination_type} #${destination_id}`;
}
