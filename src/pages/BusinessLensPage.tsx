// src/pages/businesslens/BusinessLens.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavigationBar from "@/components/customui/NavigationBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Boxes,
  Package,
  ClipboardList,
  Cog,
  ChevronRight,
  Search,
  Building2,
  LayoutDashboard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { fetchPartsForDropDown } from "@/services/PartsService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TemplateId = "storage" | "parts" | "orders" | "machine" | "project" | "factory";

type TemplateDef = {
  id: TemplateId;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  primaryParamLabel: string;
};

const TEMPLATES: TemplateDef[] = [
  { id: "storage", title: "Storage", description: "Inventory health across locations: value, turns, days-on-hand, dead stock, and shrink.", icon: Boxes, primaryParamLabel: "Storage location / Warehouse" },
  { id: "parts",   title: "Parts",   description: "Spend & pricing analytics: total spend, weighted avg unit cost, volatility, vendor mix.", icon: Package, primaryParamLabel: "Part Name" },
  { id: "orders",  title: "Orders",  description: "Purchase pipeline: open commitments, POs by status, received vs outstanding, vendor breakdown.", icon: ClipboardList, primaryParamLabel: "" },
  { id: "machine", title: "Machine", description: "Maintenance cost & reliability: parts consumed, downtime, cost per operating hour.", icon: Cog, primaryParamLabel: "Machine or Asset ID" },
  { id: "project", title: "Project", description: "Budget vs actuals by phase: expenses, variances, drivers, and vendor/part attribution.", icon: LayoutDashboard, primaryParamLabel: "Project or Component" },
  { id: "factory", title: "Factory", description: "Factory/section cost overview: parts, maintenance, damaged goods, and department trends.", icon: Building2, primaryParamLabel: "Factory or Section" },
];

type ParamState = {
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  partId?: string;  // ⬅️ NEW: used by Parts
};

const BusinessLens: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "BusinessLens — Choose a template";
  }, []);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TemplateDef | null>(null);
  const [params, setParams] = useState<ParamState>({});
  const [partOptions, setPartOptions] = useState<{ id: number; name: string }[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);

  const onTileClick = (t: TemplateDef) => {
    setSelected(t);
    setParams({});
    setOpen(true);
  };

  useEffect(() => {
    const loadParts = async () => {
      if (!open || selected?.id !== "parts") return;
      setLoadingParts(true);
      try {
        const data = await fetchPartsForDropDown(); // returns [{id, name}] or null
        setPartOptions(Array.isArray(data) ? data : []);
      } catch (e) {
        // toast already handled in service; no-op
        setPartOptions([]);
      } finally {
        setLoadingParts(false);
      }
    };
    loadParts();
  }, [open, selected]);


  const onGenerate = () => {
    if (!selected) return;

    const searchParams = new URLSearchParams();
    if (params.start) searchParams.set("start", params.start);
    if (params.end)   searchParams.set("end", params.end);

    // Prefer stable IDs where applicable:
    if (selected.id === "parts") {
      // Expect an ID (you can swap this input to an AsyncSelect later)
      if (params.partId) searchParams.set("partId", params.partId?params.partId.trim():"");
    }

    const qs = searchParams.toString();
    navigate(`/businesslens/${selected.id}${qs ? `?${qs}` : ""}`);
    setOpen(false);
  };

  return (
    <>
      <NavigationBar />
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cyan-700">BusinessLens</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Centralized reporting for different aspects of your business. Pick a template to begin!
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Template tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => onTileClick(t)}
              className="text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-2xl"
            >
              <Card className="h-full transition hover:shadow-lg border-2 border-transparent hover:border-cyan-200 rounded-2xl w-full">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
                    <t.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex items-start justify-between gap-2">
                  <p className="leading-relaxed pr-2">{t.description}</p>
                  <ChevronRight className="h-5 w-5 mt-1 opacity-60 group-hover:translate-x-1 transition" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Params Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{selected ? `${selected.title} report` : "Report"}</DialogTitle>
            <DialogDescription>
              Fill out the parameters and generate report
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Primary param */}
            {selected && (
            <div className="grid gap-2">
              <Label htmlFor="primary">{selected.primaryParamLabel}</Label>

              {selected.id === "parts" ? (
                <Select
                  value={params.partId ?? ""}
                  onValueChange={(val) => setParams((p) => ({ ...p, partId: val }))}
                >
                  <SelectTrigger id="primary">
                    <SelectValue placeholder={loadingParts ? "Loading parts..." : "Select a part"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {loadingParts ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading…</div>
                    ) : partOptions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No parts found</div>
                    ) : (
                      partOptions.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} 
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : <div></div>}
            </div>
          )}

            {/* Date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={params.start ?? ""} onChange={(e) => setParams((p) => ({ ...p, start: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">End date</Label>
                <Input id="end" type="date" value={params.end ?? ""} onChange={(e) => setParams((p) => ({ ...p, end: e.target.value }))} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-cyan-600" onClick={onGenerate}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BusinessLens;
