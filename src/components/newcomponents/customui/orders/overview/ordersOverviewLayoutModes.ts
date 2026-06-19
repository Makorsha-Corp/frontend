export type OrdersOverviewKpiStyle =
  | 'hub-footer'
  | 'header-inline'
  | 'action-strip'
  | 'chart-context'
  | 'table-context'
  | 'none'
  | 'stat-cards'
  | 'hero-bar'
  | 'inline-chips'
  | 'focused-pair'
  | 'action-alerts';

export type OrdersOverviewTypeNavStyle =
  | 'cards'
  | 'segmented-nav'
  | 'compact-list'
  | 'icon-rail'
  | 'hidden';

export type OrdersOverviewPageStructure =
  | 'stacked'
  | 'analytics-first'
  | 'operations'
  | 'split-insights'
  | 'compact-insights';

export type OrdersOverviewStatusDisplayStyle =
  | 'chips'
  | 'filter-counts'
  | 'hidden'
  | 'card';

export type OrdersOverviewFactoryDisplayStyle = 'panel' | 'hub-highlight' | 'hidden';

export interface OrdersOverviewLayoutPreviewState {
  kpiStyle: OrdersOverviewKpiStyle;
  typeNavStyle: OrdersOverviewTypeNavStyle;
  pageStructure: OrdersOverviewPageStructure;
  statusDisplayStyle: OrdersOverviewStatusDisplayStyle;
  factoryDisplayStyle: OrdersOverviewFactoryDisplayStyle;
}

export const ORDERS_OVERVIEW_LAYOUT_STORAGE = {
  kpiStyle: 'ordersOverview.kpiStyle',
  typeNavStyle: 'ordersOverview.typeNavStyle',
  pageStructure: 'ordersOverview.pageStructure',
  statusDisplay: 'ordersOverview.statusDisplay',
  factoryDisplay: 'ordersOverview.factoryDisplay',
} as const;

export const DEFAULT_ORDERS_OVERVIEW_LAYOUT: OrdersOverviewLayoutPreviewState = {
  kpiStyle: 'hub-footer',
  typeNavStyle: 'cards',
  pageStructure: 'stacked',
  statusDisplayStyle: 'chips',
  factoryDisplayStyle: 'hidden',
};

export type KpiStyleOption = {
  id: OrdersOverviewKpiStyle;
  label: string;
  description: string;
  group: 'embedded' | 'standalone' | 'legacy';
};

export const KPI_STYLE_OPTIONS: KpiStyleOption[] = [
  {
    id: 'hub-footer',
    label: 'Hub footer',
    description: 'Muted summary strip under type navigation (recommended)',
    group: 'embedded',
  },
  {
    id: 'header-inline',
    label: 'Header inline',
    description: 'Metrics in page header subtitle',
    group: 'embedded',
  },
  {
    id: 'action-strip',
    label: 'Action strip',
    description: 'Alert pills after hubs; no total order count',
    group: 'embedded',
  },
  {
    id: 'chart-context',
    label: 'Chart context',
    description: 'Summaries in chart card subtitles',
    group: 'embedded',
  },
  {
    id: 'table-context',
    label: 'Table context',
    description: 'Summary in recent activity table subtitle',
    group: 'embedded',
  },
  {
    id: 'none',
    label: 'Hidden',
    description: 'No aggregate KPI UI; hub counts only',
    group: 'embedded',
  },
  {
    id: 'hero-bar',
    label: 'Hero summary',
    description: 'One full-width summary bar',
    group: 'standalone',
  },
  {
    id: 'inline-chips',
    label: 'Metric chips',
    description: 'Compact horizontal chips row',
    group: 'standalone',
  },
  {
    id: 'focused-pair',
    label: 'Focus pair',
    description: 'Two large metrics with collapsible extras',
    group: 'standalone',
  },
  {
    id: 'action-alerts',
    label: 'Action alerts',
    description: 'Full summary line plus alert pills',
    group: 'standalone',
  },
  {
    id: 'stat-cards',
    label: 'Legacy — stat cards',
    description: 'Six colored dashboard stat cards',
    group: 'legacy',
  },
];

export const KPI_STYLE_EMBEDDED = KPI_STYLE_OPTIONS.filter((o) => o.group === 'embedded');
export const KPI_STYLE_STANDALONE = KPI_STYLE_OPTIONS.filter((o) => o.group === 'standalone');
export const KPI_STYLE_LEGACY = KPI_STYLE_OPTIONS.filter((o) => o.group === 'legacy');

export const STANDALONE_KPI_STYLES: OrdersOverviewKpiStyle[] = [
  'hero-bar',
  'inline-chips',
  'focused-pair',
  'action-alerts',
  'stat-cards',
];

export const HUB_ADJACENT_KPI_STYLES: OrdersOverviewKpiStyle[] = ['hub-footer', 'action-strip'];

export function isStandaloneKpiStyle(style: OrdersOverviewKpiStyle): boolean {
  return STANDALONE_KPI_STYLES.includes(style);
}

export function isHubAdjacentKpiStyle(style: OrdersOverviewKpiStyle): boolean {
  return HUB_ADJACENT_KPI_STYLES.includes(style);
}

export const TYPE_NAV_STYLE_OPTIONS: Array<{
  id: OrdersOverviewTypeNavStyle;
  label: string;
  description: string;
}> = [
  { id: 'cards', label: 'Hub cards', description: 'Five-card grid with icons' },
  { id: 'segmented-nav', label: 'Segmented nav', description: 'Pill links with count badges' },
  { id: 'compact-list', label: 'Compact list', description: 'Single panel, table-style rows' },
  { id: 'icon-rail', label: 'Icon rail', description: 'Minimal icon row with counts' },
  { id: 'hidden', label: 'Hidden', description: 'No type nav; use sidebar and charts' },
];

export const PAGE_STRUCTURE_OPTIONS: Array<{
  id: OrdersOverviewPageStructure;
  label: string;
  description: string;
}> = [
  { id: 'stacked', label: 'Stacked', description: 'Type nav → insights → charts → table' },
  { id: 'analytics-first', label: 'Analytics first', description: 'Charts before insight panels' },
  { id: 'operations', label: 'Operations', description: 'Recent activity table moved up' },
  { id: 'split-insights', label: 'Split insights', description: 'Two-column insights with status pipeline' },
  { id: 'compact-insights', label: 'Compact insights', description: 'Merged tabs and compact chart row' },
];

export const STATUS_DISPLAY_OPTIONS: Array<{
  id: OrdersOverviewStatusDisplayStyle;
  label: string;
  description: string;
}> = [
  { id: 'chips', label: 'Status chips', description: 'Clickable chips under hub cards (recommended)' },
  { id: 'filter-counts', label: 'Filter counts', description: 'Counts in header status dropdown only' },
  { id: 'hidden', label: 'Hidden', description: 'No aggregate status breakdown UI' },
  { id: 'card', label: 'Legacy — pipeline card', description: 'Status pipeline card in charts row' },
];

export const FACTORY_DISPLAY_OPTIONS: Array<{
  id: OrdersOverviewFactoryDisplayStyle;
  label: string;
  description: string;
}> = [
  { id: 'hidden', label: 'Hidden', description: 'No factory ranking UI (default)' },
  {
    id: 'hub-highlight',
    label: 'Hub highlight',
    description: 'Top 3 factory chips under hub cards; click to filter',
  },
  {
    id: 'panel',
    label: 'Insights panel',
    description: 'Top factories leaderboard in insights row',
  },
];

const ALL_KPI_STYLES = new Set(KPI_STYLE_OPTIONS.map((o) => o.id));

function isKpiStyle(value: string): value is OrdersOverviewKpiStyle {
  return ALL_KPI_STYLES.has(value as OrdersOverviewKpiStyle);
}

function isTypeNavStyle(value: string): value is OrdersOverviewTypeNavStyle {
  return TYPE_NAV_STYLE_OPTIONS.some((o) => o.id === value);
}

function isPageStructure(value: string): value is OrdersOverviewPageStructure {
  return PAGE_STRUCTURE_OPTIONS.some((o) => o.id === value);
}

function isStatusDisplayStyle(value: string): value is OrdersOverviewStatusDisplayStyle {
  return STATUS_DISPLAY_OPTIONS.some((o) => o.id === value);
}

function isFactoryDisplayStyle(value: string): value is OrdersOverviewFactoryDisplayStyle {
  return FACTORY_DISPLAY_OPTIONS.some((o) => o.id === value);
}

export function readOrdersOverviewLayoutFromStorage(): OrdersOverviewLayoutPreviewState {
  if (typeof window === 'undefined') return DEFAULT_ORDERS_OVERVIEW_LAYOUT;
  const kpi = localStorage.getItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.kpiStyle);
  const typeNav = localStorage.getItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.typeNavStyle);
  const page = localStorage.getItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.pageStructure);
  const statusDisplay = localStorage.getItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.statusDisplay);
  const factoryDisplay = localStorage.getItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.factoryDisplay);
  return {
    kpiStyle: kpi && isKpiStyle(kpi) ? kpi : DEFAULT_ORDERS_OVERVIEW_LAYOUT.kpiStyle,
    typeNavStyle: typeNav && isTypeNavStyle(typeNav) ? typeNav : DEFAULT_ORDERS_OVERVIEW_LAYOUT.typeNavStyle,
    pageStructure:
      page && isPageStructure(page) ? page : DEFAULT_ORDERS_OVERVIEW_LAYOUT.pageStructure,
    statusDisplayStyle:
      statusDisplay && isStatusDisplayStyle(statusDisplay)
        ? statusDisplay
        : DEFAULT_ORDERS_OVERVIEW_LAYOUT.statusDisplayStyle,
    factoryDisplayStyle:
      factoryDisplay && isFactoryDisplayStyle(factoryDisplay)
        ? factoryDisplay
        : DEFAULT_ORDERS_OVERVIEW_LAYOUT.factoryDisplayStyle,
  };
}

export function persistOrdersOverviewLayout(state: OrdersOverviewLayoutPreviewState): void {
  localStorage.setItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.kpiStyle, state.kpiStyle);
  localStorage.setItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.typeNavStyle, state.typeNavStyle);
  localStorage.setItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.pageStructure, state.pageStructure);
  localStorage.setItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.statusDisplay, state.statusDisplayStyle);
  localStorage.setItem(ORDERS_OVERVIEW_LAYOUT_STORAGE.factoryDisplay, state.factoryDisplayStyle);
}
