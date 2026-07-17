import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import { resolveFactoryId } from '@/hooks/useGlobalFactoryContext';

export interface ResolveFactoryIdFromWorkOrderContextParams {
  factoryId?: number | null;
  machineId?: number | string | null;
  sectionId?: number | string | null;
  machines?: Machine[];
  sections?: FactorySection[];
  globalFactoryId?: number | null;
}

export function resolveFactoryIdFromWorkOrderContext({
  factoryId,
  machineId,
  sectionId,
  machines = [],
  sections = [],
  globalFactoryId,
}: ResolveFactoryIdFromWorkOrderContextParams): number | undefined {
  if (factoryId != null && Number.isFinite(Number(factoryId))) {
    return Number(factoryId);
  }

  const sectionNum =
    sectionId != null && sectionId !== '' && !Number.isNaN(Number(sectionId))
      ? Number(sectionId)
      : undefined;

  if (sectionNum != null) {
    const section = sections.find((s) => s.id === sectionNum);
    if (section?.factory_id != null) return section.factory_id;
  }

  const machineNum =
    machineId != null && machineId !== '' && !Number.isNaN(Number(machineId))
      ? Number(machineId)
      : undefined;

  if (machineNum != null) {
    const machine = machines.find((m) => m.id === machineNum);
    if (machine) {
      const section = sections.find((s) => s.id === machine.factory_section_id);
      if (section?.factory_id != null) return section.factory_id;
    }
  }

  return resolveFactoryId(undefined, globalFactoryId ?? null);
}
