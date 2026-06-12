import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Columns3,
  Rows2,
  PanelRight,
  ListTree,
  LayoutTemplate,
} from 'lucide-react';

export type ProjectLayoutMode =
  | 'classic'
  | 'treeNavigator'
  | 'threeColumn'
  | 'focusComponent'
  | 'overview'
  | 'stacked';

export interface ProjectLayoutOption {
  id: ProjectLayoutMode;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const PROJECT_LAYOUT_OPTIONS: ProjectLayoutOption[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Projects and components in a left rail, detail on the right',
    icon: LayoutTemplate,
  },
  {
    id: 'treeNavigator',
    label: 'Tree navigator',
    description: 'Expandable project tree with inline components',
    icon: ListTree,
  },
  {
    id: 'threeColumn',
    label: 'Three column',
    description: 'Projects, components, and detail in separate columns',
    icon: Columns3,
  },
  {
    id: 'focusComponent',
    label: 'Focus component',
    description: 'Full-width component workspace with collapsed navigator',
    icon: PanelRight,
  },
  {
    id: 'overview',
    label: 'Overview + workspace',
    description: 'Portfolio KPI strip above the classic layout',
    icon: LayoutDashboard,
  },
  {
    id: 'stacked',
    label: 'Stacked',
    description: 'Navigator strip on top, detail panel below',
    icon: Rows2,
  },
];

export const DEFAULT_PROJECT_LAYOUT: ProjectLayoutMode = 'classic';

export function getProjectLayoutOption(id: ProjectLayoutMode): ProjectLayoutOption {
  return PROJECT_LAYOUT_OPTIONS.find((o) => o.id === id) ?? PROJECT_LAYOUT_OPTIONS[0];
}
