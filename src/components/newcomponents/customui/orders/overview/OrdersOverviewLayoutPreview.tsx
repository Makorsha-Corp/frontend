import React from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import {
  KPI_STYLE_EMBEDDED,
  KPI_STYLE_LEGACY,
  KPI_STYLE_OPTIONS,
  KPI_STYLE_STANDALONE,
  PAGE_STRUCTURE_OPTIONS,
  FACTORY_DISPLAY_OPTIONS,
  STATUS_DISPLAY_OPTIONS,
  TYPE_NAV_STYLE_OPTIONS,
  type OrdersOverviewLayoutPreviewState,
} from './ordersOverviewLayoutModes';

interface OrdersOverviewLayoutPreviewProps {
  layout: OrdersOverviewLayoutPreviewState;
  onKpiStyleChange: (value: OrdersOverviewLayoutPreviewState['kpiStyle']) => void;
  onTypeNavStyleChange: (value: OrdersOverviewLayoutPreviewState['typeNavStyle']) => void;
  onPageStructureChange: (value: OrdersOverviewLayoutPreviewState['pageStructure']) => void;
  onStatusDisplayStyleChange: (
    value: OrdersOverviewLayoutPreviewState['statusDisplayStyle']
  ) => void;
  onFactoryDisplayStyleChange: (
    value: OrdersOverviewLayoutPreviewState['factoryDisplayStyle']
  ) => void;
  onReset: () => void;
}

function renderKpiGroups() {
  return (
    <>
      <SelectGroup>
        <SelectLabel>Embedded (recommended)</SelectLabel>
        {KPI_STYLE_EMBEDDED.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Standalone row</SelectLabel>
        {KPI_STYLE_STANDALONE.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Legacy</SelectLabel>
        {KPI_STYLE_LEGACY.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectGroup>
    </>
  );
}

const OrdersOverviewLayoutPreview: React.FC<OrdersOverviewLayoutPreviewProps> = ({
  layout,
  onKpiStyleChange,
  onTypeNavStyleChange,
  onPageStructureChange,
  onStatusDisplayStyleChange,
  onFactoryDisplayStyleChange,
  onReset,
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`gap-2 border-border bg-background ${appShellHeaderControlClass}`}
      >
        <Palette className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline">Layout preview</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-80 space-y-4">
      <div>
        <p className="text-sm font-semibold">Layout preview</p>
        <p className="text-xs text-muted-foreground mt-1">
          Mix and match layout options. Saved in this browser.
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">KPI placement</Label>
        <Select value={layout.kpiStyle} onValueChange={onKpiStyleChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{renderKpiGroups()}</SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {KPI_STYLE_OPTIONS.find((o) => o.id === layout.kpiStyle)?.description}
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Type navigation</Label>
        <Select value={layout.typeNavStyle} onValueChange={onTypeNavStyleChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_NAV_STYLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {TYPE_NAV_STYLE_OPTIONS.find((o) => o.id === layout.typeNavStyle)?.description}
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Status display</Label>
        <Select value={layout.statusDisplayStyle} onValueChange={onStatusDisplayStyleChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_DISPLAY_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {STATUS_DISPLAY_OPTIONS.find((o) => o.id === layout.statusDisplayStyle)?.description}
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Factory display</Label>
        <Select value={layout.factoryDisplayStyle} onValueChange={onFactoryDisplayStyleChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FACTORY_DISPLAY_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {FACTORY_DISPLAY_OPTIONS.find((o) => o.id === layout.factoryDisplayStyle)?.description}
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Page structure</Label>
        <Select value={layout.pageStructure} onValueChange={onPageStructureChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_STRUCTURE_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          {PAGE_STRUCTURE_OPTIONS.find((o) => o.id === layout.pageStructure)?.description}
        </p>
      </div>
      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onReset}>
        Reset to defaults
      </Button>
    </PopoverContent>
  </Popover>
);

export default OrdersOverviewLayoutPreview;
