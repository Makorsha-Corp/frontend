import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import {
  Boxes,
  Package,
  ClipboardList,
  Cog,
  ChevronRight,
  Building2,
  LayoutDashboard,
  BarChart3,
} from 'lucide-react';

type TemplateId = 'storage' | 'items' | 'orders' | 'machine' | 'project' | 'factory';

type TemplateDef = {
  id: TemplateId;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  primaryParamLabel: string;
};

const TEMPLATES: TemplateDef[] = [
  {
    id: 'storage',
    title: 'Storage',
    description: 'Inventory health across locations: value, turns, days-on-hand, dead stock, and shrink.',
    icon: Boxes,
    primaryParamLabel: 'Storage location / Warehouse',
  },
  {
    id: 'items',
    title: 'Items',
    description: 'Spend & pricing analytics: total spend, weighted avg unit cost, volatility, vendor mix.',
    icon: Package,
    primaryParamLabel: 'Item Name',
  },
  {
    id: 'orders',
    title: 'Orders',
    description: 'Purchase pipeline: open commitments, POs by status, received vs outstanding, vendor breakdown.',
    icon: ClipboardList,
    primaryParamLabel: '',
  },
  {
    id: 'machine',
    title: 'Machine',
    description: 'Maintenance cost & reliability: parts consumed, downtime, cost per operating hour.',
    icon: Cog,
    primaryParamLabel: 'Machine or Asset ID',
  },
  {
    id: 'project',
    title: 'Project',
    description: 'Budget vs actuals by phase: expenses, variances, drivers, and vendor/part attribution.',
    icon: LayoutDashboard,
    primaryParamLabel: 'Project or Component',
  },
  {
    id: 'factory',
    title: 'Factory',
    description: 'Factory/section cost overview: parts, maintenance, damaged goods, and department trends.',
    icon: Building2,
    primaryParamLabel: 'Factory or Section',
  },
];

type ParamState = {
  start?: string;
  end?: string;
  itemId?: string;
};

const BusinessLensPage: React.FC = () => {
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );

  useEffect(() => {
    document.title = 'BusinessLens — Choose a template';
  }, []);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TemplateDef | null>(null);
  const [params, setParams] = useState<ParamState>({});

  const { data: items = [], isLoading: loadingItems } = useGetItemsQuery(
    { skip: 0, limit: 100 },
    { skip: !open || selected?.id !== 'items' }
  );

  const itemOptions = React.useMemo(
    () => items.map((i) => ({ id: i.id, name: i.name })),
    [items]
  );

  const onTileClick = (t: TemplateDef) => {
    setSelected(t);
    setParams({});
    setOpen(true);
  };

  const onGenerate = () => {
    if (!selected) return;

    const searchParams = new URLSearchParams();
    if (params.start) searchParams.set('start', params.start);
    if (params.end) searchParams.set('end', params.end);
    if (selected.id === 'items' && params.itemId) {
      searchParams.set('itemId', params.itemId.trim());
    }

    const qs = searchParams.toString();
    navigate(`/businesslens/${selected.id}${qs ? `?${qs}` : ''}`);
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
                BusinessLens
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Centralized reporting for different aspects of your business. Pick a template to begin!
              </p>
            </div>
          </div>
        </div>

        {/* Template tiles */}
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => onTileClick(t)}
                className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-2xl"
              >
                <Card className="h-full transition hover:shadow-lg border-2 border-transparent hover:border-brand-primary/30 rounded-2xl w-full bg-card">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
                      <t.icon className="h-6 w-6" aria-hidden />
                    </div>
                    <CardTitle className="text-lg text-foreground">{t.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground flex items-start justify-between gap-2">
                    <p className="leading-relaxed pr-2">{t.description}</p>
                    <ChevronRight className="h-5 w-5 mt-1 opacity-60 group-hover:translate-x-1 transition shrink-0" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Params Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {selected ? `${selected.title} report` : 'Report'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill out the parameters and generate report
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {selected && selected.primaryParamLabel && (
              <div className="grid gap-2">
                <Label htmlFor="primary" className="text-foreground">
                  {selected.primaryParamLabel}
                </Label>
                {selected.id === 'items' ? (
                  <Select
                    value={params.itemId ?? ''}
                    onValueChange={(val) => setParams((p) => ({ ...p, itemId: val }))}
                  >
                    <SelectTrigger id="primary" className="bg-background border-input">
                      <SelectValue
                        placeholder={
                          loadingItems ? 'Loading items...' : 'Select an item'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 bg-card border-border">
                      {loadingItems ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading…</div>
                      ) : itemOptions.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No items found</div>
                      ) : (
                        itemOptions.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="primary"
                    placeholder={`Enter ${selected.primaryParamLabel.toLowerCase()}`}
                    className="bg-background border-input"
                    value={params.itemId ?? ''}
                    onChange={(e) => setParams((p) => ({ ...p, itemId: e.target.value }))}
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start" className="text-foreground">
                  Start date
                </Label>
                <Input
                  id="start"
                  type="date"
                  className="bg-background border-input"
                  value={params.start ?? ''}
                  onChange={(e) => setParams((p) => ({ ...p, start: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end" className="text-foreground">
                  End date
                </Label>
                <Input
                  id="end"
                  type="date"
                  className="bg-background border-input"
                  value={params.end ?? ''}
                  onChange={(e) => setParams((p) => ({ ...p, end: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-border">
              Cancel
            </Button>
            <Button
              className="bg-brand-primary hover:bg-brand-primary-hover"
              onClick={onGenerate}
            >
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessLensPage;
