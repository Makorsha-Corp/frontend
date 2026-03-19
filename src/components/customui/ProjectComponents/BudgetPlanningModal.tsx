import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

// Services
import { fetchProjectById, updateProject } from "@/services/ProjectsService";
import {
  fetchProjectComponentsByProjectId,
  updateProjectComponent,
} from "@/services/ProjectComponentService";
import type { ProjectComponent } from "@/types";

interface BudgetPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  /** refresh parent after save */
  onProjectUpdated?: () => void;
}

type Mode = "TOP_DOWN" | "BOTTOM_UP";

type ComponentBudgetRow = {
  id: number;
  name: string;
  budget: number | null; // allow null to display empty input
};

/** Numeric input without forced 0:
 * - empty => null
 * - digits only, non-negative
 * - mobile numeric keypad via inputMode
 */
function NumericField({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState<string>(value == null ? "" : String(value));

  useEffect(() => {
    setText(value == null ? "" : String(value));
  }, [value]);

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={placeholder}
      value={text}
      disabled={disabled}
      className={className}
      onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
      onChange={(e) => {
        const raw = e.target.value;
        const cleaned = raw.replace(/\D+/g, "");
        setText(cleaned);
        if (cleaned === "") onChange(null);
        else {
          const normalized = String(parseInt(cleaned, 10));
          setText(normalized);
          onChange(parseInt(normalized, 10));
        }
      }}
      onBlur={() => {
        if (text === "") return;
        const normalized = String(parseInt(text, 10));
        setText(normalized);
        onChange(parseInt(normalized, 10));
      }}
    />
  );
}

const BudgetPlanningModal: React.FC<BudgetPlanningModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onProjectUpdated,
}) => {
  const [mode, setMode] = useState<Mode>("TOP_DOWN");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState<ComponentBudgetRow[]>([]);
  const [projectBudget, setProjectBudget] = useState<number | null>(null); // used in TOP_DOWN

  // Bottom-up future pool (ALWAYS editable)
  const [futureAllocation, setFutureAllocation] = useState<number | null>(null);

  // fetch data when opened
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoading(true);
        const p = await fetchProjectById(projectId);
        const comps = await fetchProjectComponentsByProjectId(projectId);

        const mapped: ComponentBudgetRow[] = (comps as ProjectComponent[]).map((c) => ({
          id: c.id,
          name: c.name,
          budget: c.budget == null ? null : Number(c.budget),
        }));
        setRows(mapped);

        const allocatedNow = mapped.reduce(
          (sum, r) => sum + (Number.isFinite(r.budget as number) ? (r.budget as number) : 0),
          0
        );

        // Top-down project budget (for that mode)
        setProjectBudget(p?.budget == null ? null : Number(p.budget));

        // Bottom-up: initialize future pool
        // If project budget exists, prefill with (projectBudget - allocatedNow) but keep editable.
        // Clamp to >= 0 since we use a non-negative numeric field.
        if (p?.budget != null) {
          const initialFuture = Number(p.budget) - allocatedNow;
          setFutureAllocation(initialFuture > 0 ? initialFuture : 0);
        } else {
          setFutureAllocation(null);
        }

        // Default to TOP_DOWN each open
        setMode("TOP_DOWN");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, projectId]);

  const allocated = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + (Number.isFinite(r.budget as number) ? (r.budget as number) : 0),
        0
      ),
    [rows]
  );

  // --- TOP-DOWN: remaining = projectBudget - allocated ---
  const remainingTopDown = useMemo(() => {
    if (projectBudget == null) return null;
    return projectBudget - allocated;
  }, [projectBudget, allocated]);

  // --- BOTTOM-UP: always inferred = components + futureAllocation (editable future) ---
  const inferredTotalBottomUp = useMemo(
    () => allocated + (futureAllocation || 0),
    [allocated, futureAllocation]
  );

  const setCompBudget = (idx: number, value: number | null) => {
    setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, budget: value } : x)));
  };

  // --- Save handlers ---
  const saveTopDown = async () => {
    if (projectBudget == null || projectBudget < 0) {
      toast.error("Project budget must be a non-negative number.");
      return;
    }
    if (remainingTopDown != null && remainingTopDown < 0) {
      toast.error("Total allocated exceeds project budget. Increase the project budget or reduce allocations.");
      return;
    }
    setSaving(true);
    try {
      const okP = await updateProject(projectId, { budget: projectBudget });
      if (!okP) throw new Error("Failed to update project budget");
      await Promise.all(rows.map((r) => updateProjectComponent(r.id, { budget: r.budget })));
      toast.success("Budget plan saved");
      onProjectUpdated?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const saveBottomUp = async () => {
    setSaving(true);
    try {
      // Always set project budget to inferred total in bottom-up
      const total = inferredTotalBottomUp;
      const okP = await updateProject(projectId, { budget: total });
      if (!okP) throw new Error("Failed to set project budget");

      await Promise.all(rows.map((r) => updateProjectComponent(r.id, { budget: r.budget })));

      toast.success("Budgets saved");
      onProjectUpdated?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to save budgets");
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    !saving &&
    !loading &&
    (mode === "TOP_DOWN" ? projectBudget != null && projectBudget >= 0 : true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan Budget – {projectName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            {/* Mode Selector */}
            <div>
              <Label>Planning Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)} disabled={saving}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TOP_DOWN">Top-down Allocation</SelectItem>
                  <SelectItem value="BOTTOM_UP">Bottom-up Allocation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* --- TOP DOWN --- */}
            {mode === "TOP_DOWN" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set the overall <strong>Project Budget</strong>, then allocate to each component. If you exceed the budget,
                  increase it at the top level.
                </p>

                <div>
                  <Label>Project Budget</Label>
                  <NumericField
                    value={projectBudget}
                    onChange={setProjectBudget}
                    placeholder="Enter total budget"
                    disabled={saving}
                  />
                </div>

                <div className="space-y-3 border rounded-md p-3">
                  {/* Totals on top */}
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>Total Allocated: {allocated.toLocaleString()}</span>
                    <span
                      className={
                        remainingTopDown != null && remainingTopDown < 0
                          ? "text-red-600"
                          : remainingTopDown === 0
                          ? "text-green-600"
                          : "text-gray-600"
                      }
                    >
                      Remaining: {remainingTopDown == null ? "-" : remainingTopDown.toLocaleString()}
                    </span>
                  </div>

                  {/* Component rows */}
                  <div className="space-y-2">
                    {rows.map((r, idx) => (
                      <div key={r.id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm">{r.name}</span>
                        <NumericField
                          value={r.budget}
                          onChange={(v) => setCompBudget(idx, v)}
                          placeholder="0"
                          className="w-28 h-8 text-sm"
                          disabled={saving}
                        />
                      </div>
                    ))}
                  </div>

                  {remainingTopDown != null && remainingTopDown < 0 && (
                    <p className="text-xs text-red-600 mt-2">Budget exceeded — add more at the top level.</p>
                  )}
                </div>
              </div>
            )}

            {/* --- BOTTOM UP --- */}
            {mode === "BOTTOM_UP" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Edit <strong>component budgets</strong> and an optional <strong>Future Allocation</strong>.{" "}
                  The <strong>Inferred Project Total</strong> updates automatically.
                </p>

                <div className="space-y-3 border rounded-md p-3">
                  {/* Component rows */}
                  <div className="space-y-2">
                    {rows.map((r, idx) => (
                      <div key={r.id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm">{r.name}</span>
                        <NumericField
                          value={r.budget}
                          onChange={(v) => setCompBudget(idx, v)}
                          placeholder="0"
                          className="w-28 h-8 text-sm"
                          disabled={saving}
                        />
                      </div>
                    ))}

                    {/* Future Allocation (always editable) */}
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm italic text-muted-foreground">Future Allocation</span>
                      <NumericField
                        value={futureAllocation}
                        onChange={setFutureAllocation}
                        placeholder="0"
                        className="w-28 h-8 text-sm"
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>

                {/* Inferred total (always disabled) */}
                <div>
                  <Label>Inferred Project Total</Label>
                  <Input type="text" value={String(inferredTotalBottomUp)} disabled />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving || loading}>
            Cancel
          </Button>
          <Button
            onClick={mode === "TOP_DOWN" ? saveTopDown : saveBottomUp}
            disabled={!(!saving && !loading && (mode === "TOP_DOWN" ? projectBudget != null && projectBudget >= 0 : true))}
            aria-disabled={!(!saving && !loading && (mode === "TOP_DOWN" ? projectBudget != null && projectBudget >= 0 : true))}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetPlanningModal;
