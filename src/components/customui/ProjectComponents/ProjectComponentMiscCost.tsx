import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  addMiscProjectCost,
  deleteMiscProjectCost,
  fetchMiscProjectCosts,
  updateMiscProjectCost,
} from "@/services/MiscellaneousProjectCostServices";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

type MiscProjectCost = {
  id: number;
  name: string;
  amount: number;
  description: string | null;
  created_at: string;
  project_id: number | null;
  project_component_id: number | null;
};

type Props = {
  projectId: number;
  projectComponentId: number;
  className?: string;
  onMiscCostUpdated?: () => void;
};

// ---- centralize copy here ----
const COST_TITLE = "Supplemental Expenses";
const COST_SINGULAR = "supplemental expense"; // used in dialog copy

const currency = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(n);

const ProjectComponentMiscCosts: React.FC<Props> = ({
  projectId,
  projectComponentId,
  className,
  onMiscCostUpdated,
}) => {
  const [items, setItems] = useState<MiscProjectCost[]>([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MiscProjectCost | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setEditing(null);
    setName("");
    setAmount("");
    setDescription("");
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchMiscProjectCosts(projectId, projectComponentId);
      setItems((data || []) as MiscProjectCost[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && projectComponentId) {
      load();
    } else {
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectComponentId]);

  const total = useMemo(
    () => (items || []).reduce((sum, it) => sum + (it.amount || 0), 0),
    [items]
  );

  const onAddClick = () => {
    resetForm();
    setOpen(true);
  };

  const onEditClick = (it: MiscProjectCost) => {
    setEditing(it);
    setName(it.name || "");
    setAmount(it.amount ? String(it.amount) : "");
    setDescription(it.description || "");
    setOpen(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) {
      toast.error("Amount must be a valid non-negative number");
      return;
    }

    const payload: Partial<MiscProjectCost> = {
      project_id: projectId,
      project_component_id: projectComponentId,
      name: name.trim(),
      amount: num,
      description: description.trim() ? description.trim() : null,
    };

    let ok = false;
    if (editing) {
      ok = await updateMiscProjectCost(editing.id, {
        name: payload.name!,
        amount: payload.amount!,
        description: payload.description ?? null,
      });
    } else {
      ok = await addMiscProjectCost(payload);
    }

    if (ok) {
      setOpen(false);
      resetForm();
      await load();
      onMiscCostUpdated?.();
    }
  };

  const remove = async (id: number) => {
    const ok = await deleteMiscProjectCost(id);
    if (ok) {
      await load();
      onMiscCostUpdated?.();
    }
  };

  return (
    <Card className={`${className ?? ""} h-full flex flex-col`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base sm:text-lg">{COST_TITLE}</CardTitle>
          <div className="text-xs text-muted-foreground mt-1">
            {items.length} expense{items.length !== 1 ? "s" : ""} • {currency(total)}
          </div>
        </div>
        <Button size="sm" onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </CardHeader>

      <Separator />

      {/* Scrollable list area */}
      <CardContent className="pt-4 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-1">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No supplemental expenses yet.</div>
          ) : (
            <TooltipProvider delayDuration={150}>
              <ul className="space-y-3">
                {items.map((it) => {
                  const when = it.created_at
                    ? new Date(it.created_at).toLocaleDateString()
                    : "";
                  return (
                    <li
                      key={it.id}
                      className="border rounded-lg p-3 flex items-center justify-between gap-3 h-20"
                    >
                      {/* Left: name + one-line desc with ellipsis */}
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate" title={it.name}>
                            {it.name}
                          </span>
                          {when && <Badge variant="secondary">{when}</Badge>}
                        </div>

                        {it.description && it.description.trim() !== "" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-muted-foreground mt-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                {it.description}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start" className="max-w-xs break-words">
                              {it.description}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Right: amount + actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold">
                          {currency(it.amount || 0)}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEditClick(it)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(it.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </TooltipProvider>
          )}
        </div>
      </CardContent>

      {/* Create / Edit Modal */}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : (setOpen(false), resetForm()))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${COST_SINGULAR}` : `Add ${COST_SINGULAR}`}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Update the ${COST_SINGULAR} details.`
                : `Create a new ${COST_SINGULAR} for this project component.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="misc-name">Name</Label>
              <Input
                id="misc-name"
                placeholder="e.g., Delivery surcharge"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="misc-amount">Amount (BDT)</Label>
              <Input
                id="misc-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="e.g., 1500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="misc-description">Description (optional)</Label>
              <Textarea
                id="misc-description"
                placeholder="Add details about this expense…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-y"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? "Save changes" : "Add expense"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectComponentMiscCosts;
