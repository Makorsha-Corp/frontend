import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
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

interface DeadlinePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  /** Call to refresh parent UI after save */
  onProjectUpdated?: () => void;
}

type Row = { id: number; name: string; deadline: string }; // "YYYY-MM-DD" or ""

function parseISODate(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v + (v.length === 10 ? "T00:00:00Z" : ""));
  return isNaN(d.getTime()) ? null : d;
}
function isAfter(a?: string, b?: string) {
  const da = parseISODate(a || "");
  const db = parseISODate(b || "");
  if (!da || !db) return false;
  return da.getTime() > db.getTime();
}
// normalize anything like "2025-09-20T00:00:00Z" -> "2025-09-20"
function toDateInput(value?: string | null): string {
  if (!value) return "";
  const m = value.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : "";
}
function maxISO(dates: string[]): string | null {
  const parsed = dates.map(parseISODate).filter(Boolean) as Date[];
  if (parsed.length === 0) return null;
  const latest = new Date(Math.max(...parsed.map((d) => d.getTime())));
  return latest.toISOString().slice(0, 10);
}

const DeadlinePlanningModal: React.FC<DeadlinePlanningModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onProjectUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [projectDeadline, setProjectDeadline] = useState<string>(""); // empty => null on save
  const [rows, setRows] = useState<Row[]>([]);

  // Load current values on open
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        setLoading(true);
        const p = await fetchProjectById(projectId);
        const comps = await fetchProjectComponentsByProjectId(projectId);
        setProjectDeadline(toDateInput(p?.deadline));
        setRows(
          (comps as ProjectComponent[]).map((c) => ({
            id: c.id,
            name: c.name,
            deadline: toDateInput(c.deadline),
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, projectId]);

  const componentDeadlines = useMemo(
    () => rows.map((r) => r.deadline).filter(Boolean) as string[],
    [rows]
  );
  const latestComponentDeadline = useMemo(
    () => maxISO(componentDeadlines),
    [componentDeadlines]
  );

  const showSync =
    !!latestComponentDeadline &&
    (!projectDeadline || isAfter(latestComponentDeadline, projectDeadline));

  const componentsBeyondProject = useMemo(() => {
    if (!projectDeadline) return 0;
    return rows.reduce((acc, r) => {
      if (r.deadline && isAfter(r.deadline, projectDeadline)) return acc + 1;
      return acc;
    }, 0);
  }, [projectDeadline, rows]);

  const hasRequirementsIssue = Boolean(projectDeadline) && componentsBeyondProject > 0;

  const handleSync = () => {
    if (latestComponentDeadline) setProjectDeadline(latestComponentDeadline);
  };

  const handleSave = async () => {
    if (projectDeadline && rows.some((r) => r.deadline && isAfter(r.deadline, projectDeadline))) {
      toast.error("Some component deadlines exceed the project deadline. Adjust dates or Sync the project deadline.");
      return;
    }

    setSaving(true);
    try {
      const okP = await updateProject(projectId, { deadline: projectDeadline || null });

      const results = await Promise.all(
        rows.map((r) => updateProjectComponent(r.id, { deadline: r.deadline || null }))
      );
      const okC = results.every(Boolean);

      if (okP && okC) {
        toast.success("Deadlines saved");
        onProjectUpdated?.();
        onClose();
      } else {
        toast.error("Some updates failed. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Plan Deadlines – {projectName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a <strong>Project Deadline</strong> and component deadlines. Components must be on/before the project
              deadline. If you set component deadlines first, use <strong>Sync</strong> to auto-fill the project
              deadline to the latest component deadline.
            </p>

            {/* Project Deadline + Sync */}
            <div>
              <Label className="mb-1 block">Project Deadline</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={projectDeadline}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  className="flex-1"
                  disabled={saving}
                />
                {showSync && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSync}
                    title="Set project deadline to the latest component deadline"
                    aria-label="Sync project deadline with components"
                    disabled={saving}
                  >
                    Sync
                  </Button>
                )}
              </div>
            </div>

            {/* Component Deadlines */}
            <div className="space-y-3 border rounded-md p-3">
              <div className="text-sm font-medium">Component Deadlines</div>
              <div className="space-y-2">
                {rows.map((r, idx) => {
                  const exceeds = !!projectDeadline && !!r.deadline && isAfter(r.deadline, projectDeadline);
                  return (
                    <div key={r.id} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                      <span className="text-sm">{r.name}</span>
                      <Input
                        type="date"
                        value={r.deadline}
                        onChange={(e) =>
                          setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, deadline: e.target.value } : x)))
                        }
                        className={exceeds ? "border-red-300" : ""}
                        disabled={saving}
                      />
                      {exceeds && (
                        <p className="col-span-full text-xs text-red-600">
                          This component exceeds the project deadline — extend the project deadline (use Sync) or pick
                          an earlier date.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Warning */}
            {hasRequirementsIssue && (
              <div className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-md p-2">
                Some component deadlines exceed the project deadline. Adjust component dates or update the project
                deadline (Sync can auto-set it).
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving || loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading || !!hasRequirementsIssue}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeadlinePlanningModal;
