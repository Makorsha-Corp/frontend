import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Columns2,
  Rows2,
  PanelLeft,
  PanelRight,
  LayoutList,
} from 'lucide-react';

export type StorageLayoutMode =
  | 'stacked'
  | 'sideBySide'
  | 'tabs'
  | 'focusStorage'
  | 'focusProducts'
  | 'overview';

export interface StorageLayoutOption {
  id: StorageLayoutMode;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const STORAGE_LAYOUT_OPTIONS: StorageLayoutOption[] = [
  {
    id: 'stacked',
    label: 'Stacked',
    description: 'Storage on top, products below — full width each',
    icon: Rows2,
  },
  {
    id: 'sideBySide',
    label: 'Side by side',
    description: 'Two columns on wide screens',
    icon: Columns2,
  },
  {
    id: 'tabs',
    label: 'Tabs',
    description: 'One section at a time, full width',
    icon: LayoutList,
  },
  {
    id: 'focusStorage',
    label: 'Focus storage',
    description: 'Storage fills the view; products as a summary bar',
    icon: PanelLeft,
  },
  {
    id: 'focusProducts',
    label: 'Focus products',
    description: 'Products fills the view; storage as a summary bar',
    icon: PanelRight,
  },
  {
    id: 'overview',
    label: 'Overview + tables',
    description: 'KPI dashboard on top, both tables below',
    icon: LayoutDashboard,
  },
];

export const DEFAULT_STORAGE_LAYOUT: StorageLayoutMode = 'tabs';

export function getStorageLayoutOption(id: StorageLayoutMode): StorageLayoutOption {
  return STORAGE_LAYOUT_OPTIONS.find((o) => o.id === id) ?? STORAGE_LAYOUT_OPTIONS[0];
}
