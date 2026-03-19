import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { ListTodo, Trash2, CheckCircle2, Plus } from "lucide-react";
import toast from "react-hot-toast";

import {
  addProjectComponentTask,
  deleteProjectComponentTask,
  fetchProjectComponentNotes,
  fetchProjectComponentTasks,
  fetchProjectComponentTodoTasks,
  toggleProjectComponentTaskCompletion,
  completeMultipleProjectComponentTasks,
} from "@/services/ProjectComponentTaskService";

export type ProjectComponentTask = {
  created_at: string;
  description: string;
  id: number;
  is_completed: boolean;
  is_note: boolean;
  name: string;
  project_component_id: number;
  task_priority: "LOW" | "MEDIUM" | "HIGH" | null;
};

type Props = {
  ProjectComponentId: number;
};

type TabKey = "all" | "tasks" | "notes";

const priorityBadge = (p: ProjectComponentTask["task_priority"]) => {
  switch (p) {
    case "HIGH":
      return "bg-red-100 text-red-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "LOW":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// whole-number days, guarded, with pluralization
const timeElapsedDays = (iso: string) => {
  const start = new Date(iso).getTime();
  const diffMs = Date.now() - start;
  const days = Math.max(0, Math.floor(diffMs / 86_400_000)); // 86,400,000 ms = 1 day
  return `${days} day${days === 1 ? "" : "s"}`;
};

const ProjectComponentTasks: React.FC<Props> = ({ ProjectComponentId }) => {
  const [tab, setTab] = useState<TabKey>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<ProjectComponentTask[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Derived metrics for header (tasks vs notes)
  const tasksInView = useMemo(() => items.filter((t) => !t.is_note), [items]);
  const notesInView = useMemo(() => items.filter((t) => t.is_note), [items]);
  const tasksCompletedInView = useMemo(
    () => tasksInView.filter((t) => t.is_completed).length,
    [tasksInView]
  );

  // Selection helpers for bulk actions
  const selectedHasTask = useMemo(
    () => items.some((t) => !t.is_note && selectedIds.includes(t.id)),
    [items, selectedIds]
  );
  const showBulkComplete = selectedIds.length > 0 && selectedHasTask && tab !== "notes";

  const load = async () => {
    setLoading(true);
    try {
      let data: ProjectComponentTask[] = [];
      if (tab === "all") {
        data = await fetchProjectComponentTasks(ProjectComponentId, sortOrder);
      } else if (tab === "tasks") {
        data = await fetchProjectComponentTodoTasks(ProjectComponentId);
      } else {
        data = await fetchProjectComponentNotes(ProjectComponentId);
      }
      setItems(data || []);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ProjectComponentId, tab, sortOrder]);

  const handleToggle = async (id: number, next: boolean) => {
    // optimistic
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_completed: next } : t))
    );
    const ok = await toggleProjectComponentTaskCompletion(id, next);
    if (!ok) {
      // revert on failure
      setItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_completed: !next } : t))
      );
    }
  };

  const handleDelete = async (id: number) => {
    const before = items;
    setItems((prev) => prev.filter((t) => t.id !== id));
    const ok = await deleteProjectComponentTask(id);
    if (!ok) setItems(before);
  };

  const handleBulkComplete = async () => {
    if (selectedIds.length === 0) return;
    const taskIds = items
      .filter((t) => !t.is_note && selectedIds.includes(t.id))
      .map((t) => t.id);
    if (taskIds.length === 0) return; // button won't be visible anyway

    // optimistic
    setItems((prev) =>
      prev.map((t) => (taskIds.includes(t.id) ? { ...t, is_completed: true } : t))
    );
    const ok = await completeMultipleProjectComponentTasks(taskIds);
    if (!ok) await load();
    else setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const before = items;
    // optimistic
    setItems((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
    try {
      await Promise.all(selectedIds.map((id) => deleteProjectComponentTask(id)));
      setSelectedIds([]);
    } catch {
      setItems(before);
      toast.error("Failed to delete selected items");
    }
  };

  const toggleSelected = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const toggleAll = (checked: boolean) => setSelectedIds(checked ? items.map((t) => t.id) : []);

  return (
    <TooltipProvider>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Tasks
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {tab === "notes"
                ? `${notesInView.length} notes`
                : `${tasksCompletedInView} / ${tasksInView.length} tasks completed`}
            </div>
          </div>

          {/* Tabs + sorting + Add (bulk actions on Select All row) */}
          <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Select
                value={sortOrder}
                onValueChange={(v: "asc" | "desc") => setSortOrder(v)}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>

              {/* Add modal */}
              <AddTaskDialog
                isOpen={isAddOpen}
                setIsOpen={setIsAddOpen}
                onAdded={load}
                projectComponentId={ProjectComponentId}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg animate-pulse">
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">No tasks yet.</div>
          ) : (
            <div className="space-y-3">
              {/* Select all row with icon-only bulk actions */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(c) => toggleAll(Boolean(c))}
                  />
                  <span className="text-muted-foreground">Select all</span>
                </div>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-1">
                    {showBulkComplete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBulkComplete}
                            title="Complete selected"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Complete selected</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBulkDelete}
                          title="Delete selected"
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete selected</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>

              {items.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {/* Row select checkbox */}
                  <Checkbox
                    checked={selectedIds.includes(t.id)}
                    onCheckedChange={(c) => toggleSelected(t.id, Boolean(c))}
                  />

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={`font-medium text-sm break-words ${
                              t.is_completed ? "line-through text-green-600" : ""
                            }`}
                          >
                            {t.name}
                          </h4>

                          {!t.is_note && (
                            <Badge className={`text-xs ${priorityBadge(t.task_priority)}`}>
                              {t.task_priority ?? "LOW"}
                            </Badge>
                          )}
                          {t.is_note && <Badge variant="outline" className="text-xs">Note</Badge>}
                        </div>

                        {t.description && t.description.trim() !== "" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm text-muted-foreground mt-1 truncate max-w-[48ch]">
                                {t.description}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm whitespace-pre-line">
                              {t.description}
                            </TooltipContent>
                          </Tooltip>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
                          {!t.is_note && <span>Elapsed: {timeElapsedDays(t.created_at)}</span>}
                        </div>
                      </div>

                      {/* Right actions: Complete (tasks only, green when done) + Delete */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!t.is_note && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggle(t.id, !t.is_completed)}
                            title={t.is_completed ? "Mark incomplete" : "Mark complete"}
                            className={
                              t.is_completed
                                ? "border-green-300 bg-green-100 text-green-700 hover:bg-green-100"
                                : ""
                            }
                          >
                            <CheckCircle2
                              className={`h-4 w-4 ${t.is_completed ? "text-green-600" : ""}`}
                            />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-red-600"
                          onClick={() => handleDelete(t.id)}
                          title="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ProjectComponentTasks;

/** ----- Add dialog component ----- */
const AddTaskDialog: React.FC<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onAdded: () => Promise<void> | void;
  projectComponentId: number;
}> = ({ isOpen, setIsOpen, onAdded, projectComponentId }) => {
  const [adding, setAdding] = useState(false);
  const [isNote, setIsNote] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  const reset = () => {
    setIsNote(false);
    setName("");
    setDesc("");
    setPriority("MEDIUM");
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a task name");
      return;
    }
    setAdding(true);

    const ok = await addProjectComponentTask({
      name: trimmed,
      description: desc.trim(),
      is_note: isNote,
      is_completed: false,
      project_component_id: projectComponentId,
      task_priority: isNote ? null : priority,
    });

    setAdding(false);

    if (!ok) return;
    setIsOpen(false);
    reset();
    await onAdded();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>
            Create a todo or a note for this component.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="task-type">Make this a note</Label>
              <p className="text-xs text-muted-foreground">
                Notes don’t have priority and are informational only.
              </p>
            </div>
            <Switch
              id="task-type"
              checked={isNote}
              onCheckedChange={setIsNote}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-name">Name</Label>
            <Input
              id="task-name"
              placeholder={isNote ? "Write a note title..." : "What needs to be done?"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-desc">Description (optional)</Label>
            <Textarea
              id="task-desc"
              placeholder={isNote ? "Additional context for the note..." : "Details, links, acceptance criteria..."}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
            />
          </div>

          {!isNote && (
            <div className="grid gap-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v: "LOW" | "MEDIUM" | "HIGH") => setPriority(v)}
              >
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Choose priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={adding}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={adding}>
            {adding ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
