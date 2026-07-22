import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pencil,
  Plus,
  Trash2,
  Check,
  Circle,
  Package,
  DollarSign,
  FileText,
  ListTodo,
  Paperclip,
  Flag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Project } from '@/types/project';
import type { ProjectComponent } from '@/types/projectComponent';
import type { ProjectComponentNote } from '@/types/projectComponentNote';
import type { ProjectComponentTask } from '@/types/projectComponentTask';
import type { ProjectComponentTotalCostResponse } from '@/types/ledger';
import { formatCurrency, formatProjectStatus, getStatusBadge } from '../projectsPageUtils';
import { cn } from '@/lib/utils';

interface ComponentWorkspacePanelProps {
  selectedProject: Project | null;
  selectedComponent: ProjectComponent | undefined;
  componentsCount: number;
  totalCost: ProjectComponentTotalCostResponse | undefined;
  leftGroupTab: 'items' | 'misc';
  rightGroupTab: 'notes' | 'tasks' | 'documents';
  componentItems: { id: number; item_id: number; qty: number }[];
  miscCosts: { id: number; name: string; amount: number }[];
  componentNotes: ProjectComponentNote[];
  tasks: ProjectComponentTask[];
  onEditProject: () => void;
  onEditComponent: () => void;
  onLeftGroupTabChange: (tab: 'items' | 'misc') => void;
  onRightGroupTabChange: (tab: 'notes' | 'tasks' | 'documents') => void;
  onLeftGroupAdd: () => void;
  onAddNote: () => void;
  onAddTask: () => void;
  onOpenNote: (note: ProjectComponentNote) => void;
  onDeleteNote: (note: ProjectComponentNote) => void;
  onToggleTask: (taskId: number, isCompleted: boolean) => void;
  onDeleteTask: (task: ProjectComponentTask) => void;
  getItemName: (itemId: number) => string;
  className?: string;
}

const ComponentWorkspacePanel: React.FC<ComponentWorkspacePanelProps> = ({
  selectedProject,
  selectedComponent,
  componentsCount,
  totalCost,
  leftGroupTab,
  rightGroupTab,
  componentItems,
  miscCosts,
  componentNotes,
  tasks,
  onEditProject,
  onEditComponent,
  onLeftGroupTabChange,
  onRightGroupTabChange,
  onLeftGroupAdd,
  onAddNote,
  onAddTask,
  onOpenNote,
  onDeleteNote,
  onToggleTask,
  onDeleteTask,
  getItemName,
  className,
}) => {
  if (!selectedComponent) {
    return (
      <Card className={cn('border-border', className)}>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Component not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-4', className)}>
      <Card className="shrink-0 border-border">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            <div className="rounded-lg bg-muted/10 p-4 lg:col-span-7">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Project</p>
                    <h2 className="truncate text-lg font-semibold text-card-foreground">
                      {selectedProject?.name ?? 'Unknown Project'}
                    </h2>
                    {selectedProject?.description ? (
                      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{selectedProject.description}</p>
                    ) : null}
                  </div>
                  {selectedProject && (
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={onEditProject}
                        aria-label="Edit project"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <span
                        className={cn(
                          'whitespace-nowrap rounded px-2 py-1 text-xs',
                          getStatusBadge(selectedProject.status ?? 'PLANNING')
                        )}
                      >
                        {formatProjectStatus(selectedProject.status)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  {selectedProject?.budget != null && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Budget</p>
                      <p className="font-medium tabular-nums text-card-foreground">
                        {formatCurrency(selectedProject.budget)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Start Date</p>
                    <p className="font-medium tabular-nums text-card-foreground">
                      {selectedProject?.start_date
                        ? new Date(selectedProject.start_date).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Deadline</p>
                    <p className="font-medium tabular-nums text-card-foreground">
                      {selectedProject?.deadline
                        ? new Date(selectedProject.deadline).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Components</p>
                    <p className="font-medium tabular-nums text-card-foreground">{componentsCount}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-muted/10 p-4 lg:col-span-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Component</p>
                    <h3 className="truncate text-base font-semibold text-card-foreground">{selectedComponent.name}</h3>
                    {selectedComponent.description ? (
                      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{selectedComponent.description}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={onEditComponent}
                      aria-label="Edit component"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <span
                      className={cn(
                        'whitespace-nowrap rounded px-2 py-1 text-xs',
                        getStatusBadge(selectedComponent.status ?? 'PLANNING')
                      )}
                    >
                      {formatProjectStatus(selectedComponent.status)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Start Date</p>
                    <p className="font-medium tabular-nums text-card-foreground">
                      {selectedComponent.start_date
                        ? new Date(selectedComponent.start_date).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Deadline</p>
                    <p className="font-medium tabular-nums text-card-foreground">
                      {selectedComponent.deadline
                        ? new Date(selectedComponent.deadline).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-semibold tabular-nums text-brand-primary">
                      {totalCost ? formatCurrency(Number(totalCost.total_cost)) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="flex min-h-0 flex-col overflow-hidden border-border lg:col-span-7">
          <Tabs
            value={leftGroupTab}
            onValueChange={(v) => onLeftGroupTabChange(v as 'items' | 'misc')}
            className="flex h-full min-h-0 w-full flex-col overflow-hidden"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
              <TabsList className="h-9 flex-1 justify-start">
                  <TabsTrigger value="items" className="gap-1.5">
                    <Package className="h-4 w-4" />
                    Items ({componentItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="misc" className="gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    Misc Costs ({miscCosts.length})
                  </TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={onLeftGroupAdd}
                aria-label="Add to items and costs"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <TabsContent
              value="items"
              className="m-0 mt-0 min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain p-4"
            >
              {componentItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet.</p>
              ) : (
                <div className="space-y-2">
                  {componentItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-muted/40"
                    >
                      <span className="truncate text-card-foreground">{getItemName(item.item_id)}</span>
                      <span className="ml-2 shrink-0 text-muted-foreground">× {item.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="misc"
              className="m-0 mt-0 min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-x-contain p-4"
            >
              {miscCosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No misc costs yet.</p>
              ) : (
                <div className="space-y-2">
                  {miscCosts.map((cost) => (
                    <div
                      key={cost.id}
                      className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-muted/40"
                    >
                      <span className="text-card-foreground">{cost.name}</span>
                      <span className="font-medium">{formatCurrency(cost.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden border-border lg:col-span-5">
          <Tabs
            value={rightGroupTab}
            onValueChange={(v) => onRightGroupTabChange(v as 'notes' | 'tasks' | 'documents')}
            className="flex h-full min-h-0 w-full flex-col"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
              <TabsList className="h-9 flex-1 justify-start">
                  <TabsTrigger value="notes" className="gap-1.5">
                    <FileText className="h-4 w-4" />
                    Notes ({componentNotes.length})
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="gap-1.5">
                    <ListTodo className="h-4 w-4" />
                    Tasks ({tasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="gap-1.5">
                    <Paperclip className="h-4 w-4" />
                    Documents
                  </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="notes" className="m-0 min-h-0 flex-1 overflow-y-auto p-4">
              {componentNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                  <Button variant="outline" size="sm" onClick={onAddNote}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="h-8" onClick={onAddNote}>
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Add Note
                    </Button>
                  </div>
                  {componentNotes.map((note) => (
                    <div
                      key={note.id}
                      className="group flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenNote(note)}
                        className="min-w-0 flex-1 rounded-sm text-left transition-opacity hover:opacity-80"
                      >
                        <p className="truncate font-medium text-card-foreground">{note.name}</p>
                        {note.description && note.description !== note.name && (
                          <p className="mt-1 line-clamp-2 text-muted-foreground">{note.description}</p>
                        )}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteNote(note)}
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="tasks" className="m-0 min-h-0 flex-1 overflow-y-auto p-4">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                  <Button variant="outline" size="sm" onClick={onAddTask}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="mb-2 flex justify-end">
                    <Button variant="outline" size="sm" className="h-8" onClick={onAddTask}>
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Add Task
                    </Button>
                  </div>
                  {tasks.map((task) => (
                    <div key={task.id} className="group flex items-center gap-2 rounded p-2 hover:bg-muted/50">
                      <button type="button" onClick={() => onToggleTask(task.id, task.is_completed)} className="shrink-0">
                        {task.is_completed ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <span
                        className={cn(
                          'flex-1 truncate text-sm',
                          task.is_completed ? 'text-muted-foreground line-through' : 'text-card-foreground'
                        )}
                      >
                        {task.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteTask(task)}
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="documents" className="m-0 min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <Flag className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Attachments and documents support coming soon.</p>
                <Button variant="outline" size="sm" onClick={() => toast('Documents add flow coming soon', { icon: 'ℹ️' })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ComponentWorkspacePanel;
