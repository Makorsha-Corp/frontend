import type { LucideIcon } from 'lucide-react';
import { LayoutList, Minus, Sparkles, Square, TextCursorInput, PanelTop, LayoutTemplate } from 'lucide-react';

export type StorageTabSwitcherStyle = 'segmented' | 'underline' | 'ghost' | 'outline' | 'compact';

export type StorageTabSwitcherPlacement = 'header' | 'content';

export interface StorageTabSwitcherStyleOption {
  id: StorageTabSwitcherStyle;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const STORAGE_TAB_SWITCHER_STYLE_OPTIONS: StorageTabSwitcherStyleOption[] = [
  {
    id: 'underline',
    label: 'Underline',
    description: 'Flat header tabs with a bottom accent — blends into the shell',
    icon: Minus,
  },
  {
    id: 'ghost',
    label: 'Ghost',
    description: 'No container box; active tab gets a soft highlight',
    icon: Sparkles,
  },
  {
    id: 'segmented',
    label: 'Segmented',
    description: 'Classic muted pill control (original tabs look)',
    icon: LayoutList,
  },
  {
    id: 'outline',
    label: 'Outline chips',
    description: 'Separate bordered buttons with clear active fill',
    icon: Square,
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Icons and counts only — smallest footprint in the header',
    icon: TextCursorInput,
  },
];

export const DEFAULT_STORAGE_TAB_SWITCHER_STYLE: StorageTabSwitcherStyle = 'underline';

export interface StorageTabSwitcherPlacementOption {
  id: StorageTabSwitcherPlacement;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const STORAGE_TAB_SWITCHER_PLACEMENT_OPTIONS: StorageTabSwitcherPlacementOption[] = [
  {
    id: 'header',
    label: 'Header center',
    description: 'Switcher sits in the page header between title and controls',
    icon: PanelTop,
  },
  {
    id: 'content',
    label: 'Above KPI cards',
    description: 'Switcher centered above the KPI row in the main content area',
    icon: LayoutTemplate,
  },
];

export const DEFAULT_STORAGE_TAB_SWITCHER_PLACEMENT: StorageTabSwitcherPlacement = 'header';

const PLACEMENT_IDS = new Set(STORAGE_TAB_SWITCHER_PLACEMENT_OPTIONS.map((o) => o.id));

export function isStorageTabSwitcherPlacement(value: string): value is StorageTabSwitcherPlacement {
  return PLACEMENT_IDS.has(value as StorageTabSwitcherPlacement);
}

export function getStorageTabSwitcherPlacementOption(
  id: StorageTabSwitcherPlacement
): StorageTabSwitcherPlacementOption {
  return (
    STORAGE_TAB_SWITCHER_PLACEMENT_OPTIONS.find((o) => o.id === id) ??
    STORAGE_TAB_SWITCHER_PLACEMENT_OPTIONS[0]
  );
}

const STYLE_IDS = new Set(STORAGE_TAB_SWITCHER_STYLE_OPTIONS.map((o) => o.id));

export function isStorageTabSwitcherStyle(value: string): value is StorageTabSwitcherStyle {
  return STYLE_IDS.has(value as StorageTabSwitcherStyle);
}

export function getStorageTabSwitcherStyleOption(id: StorageTabSwitcherStyle): StorageTabSwitcherStyleOption {
  return STORAGE_TAB_SWITCHER_STYLE_OPTIONS.find((o) => o.id === id) ?? STORAGE_TAB_SWITCHER_STYLE_OPTIONS[0];
}

export const STORAGE_TAB_SWITCHER_STYLE_STORAGE_KEY = 'storage_tab_switcher_style';
export const STORAGE_TAB_SWITCHER_PLACEMENT_STORAGE_KEY = 'storage_tab_switcher_placement';

export function loadStorageTabSwitcherStyle(): StorageTabSwitcherStyle {
  if (typeof window === 'undefined') return DEFAULT_STORAGE_TAB_SWITCHER_STYLE;
  const saved = localStorage.getItem(STORAGE_TAB_SWITCHER_STYLE_STORAGE_KEY);
  if (saved && isStorageTabSwitcherStyle(saved)) return saved;
  return DEFAULT_STORAGE_TAB_SWITCHER_STYLE;
}

export function saveStorageTabSwitcherStyle(style: StorageTabSwitcherStyle): void {
  localStorage.setItem(STORAGE_TAB_SWITCHER_STYLE_STORAGE_KEY, style);
}

export function loadStorageTabSwitcherPlacement(): StorageTabSwitcherPlacement {
  if (typeof window === 'undefined') return DEFAULT_STORAGE_TAB_SWITCHER_PLACEMENT;
  const saved = localStorage.getItem(STORAGE_TAB_SWITCHER_PLACEMENT_STORAGE_KEY);
  if (saved && isStorageTabSwitcherPlacement(saved)) return saved;
  return DEFAULT_STORAGE_TAB_SWITCHER_PLACEMENT;
}

export function saveStorageTabSwitcherPlacement(placement: StorageTabSwitcherPlacement): void {
  localStorage.setItem(STORAGE_TAB_SWITCHER_PLACEMENT_STORAGE_KEY, placement);
}
