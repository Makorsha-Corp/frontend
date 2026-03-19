import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/app/hooks';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetProjectsQuery, useDeleteProjectMutation } from '@/features/projects/projectsApi';
import { useGetProjectComponentsQuery, useDeleteProjectComponentMutation } from '@/features/projectComponents/projectComponentsApi';
import { useGetProjectComponentTasksQuery, useCreateProjectComponentTaskMutation, useUpdateProjectComponentTaskMutation, useDeleteProjectComponentTaskMutation } from '@/features/projectComponentTasks/projectComponentTasksApi';
import { useGetProjectComponentItemsQuery } from '@/features/projectComponentItems/projectComponentItemsApi';
import { useGetMiscellaneousProjectCostsQuery } from '@/features/miscellaneousProjectCosts/miscellaneousProjectCostsApi';
import { useGetProjectComponentTotalCostQuery } from '@/features/ledgers/ledgersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Project } from '@/types/project';
import type { ProjectComponent } from '@/types/projectComponent';
import type { ProjectStatus } from '@/types/project';
import {
  FolderKanban,
  FolderOpen,
  Settings,
  Search,
  Plus,
  Loader2,
  Trash2,
  Check,
  Circle,
  Package,
  DollarSign,
  ListTodo,
  FileText,
  Calendar,
  Paperclip,
  Users,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddProjectDialog from '@/components/newcomponents/customui/AddProjectDialog';
import AddProjectComponentDialog from '@/components/newcomponents/customui/AddProjectComponentDialog';
import AddProjectComponentTaskDialog from '@/components/newcomponents/customui/AddProjectComponentTaskDialog';
import toast, { Toaster } from 'react-hot-toast';

const PROJECT_STATUSES: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

const ProjectsPage: React.FC = () => {
  const { factory: globalFactory } = useAppSelector((state) => state.auth);
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [factoryId, setFactoryId] = useState<number | null>(() => globalFactory?.id ?? null);
  // Sync with global factory when it changes (e.g. user selects or clears in navbar)
  useEffect(() => {
    setFactoryId(globalFactory?.id ?? null);
  }, [globalFactory?.id]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectData, setSelectedProjectData] = useState<Project | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const { data: projects = [], isLoading: loadingProjects } = useGetProjectsQuery(
    {
      skip: 0,
      limit: 200,
      factory_id: factoryId ?? undefined,
      project_status: statusFilter === 'all' ? undefined : statusFilter,
    },
    { skip: false }
  );
  const { data: componentsData, isLoading: loadingComponents } = useGetProjectComponentsQuery(
    { skip: 0, limit: 100, project_id: selectedProjectId ?? undefined },
    { skip: !selectedProjectId }
  );
  const components = Array.isArray(componentsData) ? componentsData : [];
  const { data: tasks = [] } = useGetProjectComponentTasksQuery(
    { skip: 0, limit: 100, project_component_id: selectedComponentId ?? undefined },
    { skip: !selectedComponentId }
  );
  const { data: componentItems = [] } = useGetProjectComponentItemsQuery(
    { skip: 0, limit: 100, project_component_id: selectedComponentId ?? undefined },
    { skip: !selectedComponentId }
  );
  const { data: miscCosts = [] } = useGetMiscellaneousProjectCostsQuery(
    {
      skip: 0,
      limit: 100,
      project_component_id: selectedComponentId ?? undefined,
    },
    { skip: !selectedComponentId }
  );
  const { data: totalCost } = useGetProjectComponentTotalCostQuery(
    selectedComponentId ?? 0,
    { skip: !selectedComponentId }
  );
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: false });

  const [deleteProject, { isLoading: isDeletingProject }] = useDeleteProjectMutation();
  const [deleteComponent, { isLoading: isDeletingComponent }] = useDeleteProjectComponentMutation();
  const [updateTask] = useUpdateProjectComponentTaskMutation();

  const selectedProject =
    selectedProjectData ?? projects.find((p) => p.id === selectedProjectId) ?? null;

  const filteredProjects = React.useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  const selectedComponent = components.find((c) => c.id === selectedComponentId);

  const handleFactoryChange = (value: string) => {
    const id = value ? parseInt(value, 10) : null;
    setFactoryId(id);
    setSelectedProjectId(null);
    setSelectedProjectData(null);
    setSelectedComponentId(null);
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProjectId(project.id);
    setSelectedProjectData(project);
    setSelectedComponentId(null);
  };

  const handleComponentSelect = (component: ProjectComponent) => {
    setSelectedComponentId(component.id);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`Deactivate project "${project.name}"?`)) return;
    try {
      await deleteProject(project.id).unwrap();
      toast.success('Project deactivated');
      setSelectedProjectId(null);
      setSelectedProjectData(null);
      setSelectedComponentId(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to deactivate project');
    }
  };

  const handleDeleteComponent = async (component: ProjectComponent) => {
    if (!window.confirm(`Delete component "${component.name}"?`)) return;
    try {
      await deleteComponent(component.id).unwrap();
      toast.success('Component deleted');
      setSelectedComponentId(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete component');
    }
  };

  const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
    try {
      await updateTask({ id: taskId, data: { is_completed: !isCompleted } }).unwrap();
      toast.success(isCompleted ? 'Task marked incomplete' : 'Task completed');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

  const getItemName = (itemId: number) => items.find((i) => i.id === itemId)?.name ?? `Item #${itemId}`;

  const getStatusBadge = (status: ProjectStatus) => {
    const map: Record<ProjectStatus, string> = {
      PLANNING: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      IN_PROGRESS: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      ON_HOLD: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      COMPLETED: 'bg-muted text-muted-foreground',
      CANCELLED: 'bg-destructive/10 text-destructive',
    };
    return map[status] ?? 'bg-muted text-muted-foreground';
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <FolderKanban className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Projects</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                onClick={() => setIsAddProjectOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Project
              </Button>
              <Select value={factoryId?.toString() ?? 'all'} onValueChange={handleFactoryChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Factory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All factories</SelectItem>
                  {factories.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-120px)]">
          {/* Left panel - Navigator */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
            <>
                {/* Projects list */}
                <Card className="border-border flex-1 min-h-0 flex flex-col">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Projects</CardTitle>
                    <span className="text-sm text-muted-foreground">{filteredProjects.length} projects</span>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-0">
                    {loadingProjects ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                      </div>
                    ) : filteredProjects.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        No projects found
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {filteredProjects.map((project) => (
                          <div
                            key={project.id}
                            className={`flex items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                              selectedProjectId === project.id ? 'bg-brand-primary/10' : ''
                            }`}
                            onClick={() => handleProjectSelect(project)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-card-foreground truncate">{project.name ?? 'Unnamed'}</div>
                              <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(project.status ?? 'PLANNING')}`}>
                                {(project.status ?? 'PLANNING').replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteProject(project)}
                                      disabled={isDeletingProject}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Deactivate project</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Components list - when project selected */}
                {selectedProjectId && (
                  <Card className="border-border flex-1 min-h-0 flex flex-col">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Components</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        onClick={() => setIsAddComponentOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                      {loadingComponents ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                        </div>
                      ) : components.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                          No components
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {components.map((component) => (
                            <div
                              key={component.id}
                              className={`flex items-center justify-between gap-2 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                selectedComponentId === component.id ? 'bg-brand-primary/10' : ''
                              }`}
                              onClick={() => handleComponentSelect(component)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-card-foreground truncate">{component.name}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteComponent(component);
                                }}
                                disabled={isDeletingComponent}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
            </>
          </div>

          {/* Right panel - Project/Component detail */}
          <div className="flex-1 min-w-0">
            {!selectedComponentId ? (
              <Card className="border-border h-full">
                {!selectedProjectId ? (
                  <CardContent className="py-16 flex flex-col items-center justify-center min-h-[280px]">
                    <FolderOpen className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium text-card-foreground mb-2">Select a Project</h3>
                    <p className="text-sm text-muted-foreground">Choose a project to view its details and components</p>
                  </CardContent>
                ) : selectedProject ? (
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-card-foreground">{selectedProject.name}</h2>
                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${getStatusBadge(selectedProject.status ?? 'PLANNING')}`}>
                          {(selectedProject.status ?? 'PLANNING').replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {selectedProject.description ? (
                      <p className="text-sm text-muted-foreground mb-4">{selectedProject.description}</p>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {selectedProject.budget != null && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget</p>
                          <p className="text-base font-medium">{formatCurrency(selectedProject.budget)}</p>
                        </div>
                      )}
                      {selectedProject.deadline && (
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Deadline</p>
                          <p className="text-base font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Components</p>
                        <p className="text-base font-medium">{components.length}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Settings className="h-4 w-4" />
                        <span>Select a component from the list to view tasks, items, and costs</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CardContent className="py-16 flex flex-col items-center justify-center min-h-[280px]">
                    <p className="text-sm text-muted-foreground">Project not found</p>
                  </CardContent>
                )}
              </Card>
            ) : selectedComponent ? (
              <div className="space-y-6">
                {/* 1. Component intro card */}
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-card-foreground">{selectedComponent.name}</h2>
                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${getStatusBadge(selectedComponent.status ?? 'PLANNING')}`}>
                          {(selectedComponent.status ?? 'PLANNING').replace('_', ' ')}
                        </span>
                        {selectedComponent.description && (
                          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{selectedComponent.description}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-6 text-sm">
                        {selectedComponent.budget != null && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget</p>
                            <p className="font-medium">{formatCurrency(selectedComponent.budget)}</p>
                          </div>
                        )}
                        {selectedComponent.deadline && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Deadline</p>
                            <p className="font-medium">{new Date(selectedComponent.deadline).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Cost</p>
                          <p className="text-lg font-semibold text-brand-primary">
                            {totalCost ? formatCurrency(totalCost.total_cost) : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Misc Costs / Notes switcher */}
                <Card className="border-border">
                  <CardContent className="p-0">
                    <Tabs defaultValue="misc" className="w-full">
                      <div className="border-b border-border px-4">
                        <TabsList className="h-11 w-full justify-start rounded-none border-0 bg-transparent p-0">
                          <TabsTrigger value="misc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Misc Costs ({miscCosts.length})
                          </TabsTrigger>
                          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3">
                            <FileText className="h-4 w-4 mr-2" />
                            Notes ({tasks.filter((t) => t.is_note).length})
                          </TabsTrigger>
                        </TabsList>
                      </div>
                      <TabsContent value="misc" className="p-4 m-0">
                        {miscCosts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No misc costs. Add expenses like labor, permits, or other non-item costs.</p>
                        ) : (
                          <div className="space-y-2">
                            {miscCosts.map((cost) => (
                              <div key={cost.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 text-sm">
                                <span className="text-card-foreground">{cost.name}</span>
                                <span className="font-medium">{formatCurrency(cost.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                      <TabsContent value="notes" className="p-4 m-0">
                        {tasks.filter((t) => t.is_note).length === 0 ? (
                          <p className="text-sm text-muted-foreground">No notes. Add notes for specifications, decisions, or reminders.</p>
                        ) : (
                          <div className="space-y-2">
                            {tasks
                              .filter((t) => t.is_note)
                              .map((task) => (
                                <div key={task.id} className="p-3 rounded-lg border border-border bg-muted/30 text-sm">
                                  <p className="font-medium text-card-foreground">{task.name}</p>
                                  {task.description && <p className="mt-1 text-muted-foreground">{task.description}</p>}
                                </div>
                              ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* 3. Sample cards: Tasks, Items, and placeholders */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tasks */}
                  <Card className="border-border">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        Tasks
                      </CardTitle>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => setIsAddTaskOpen(true)}>
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                      {tasks.filter((t) => !t.is_note).length === 0 ? (
                        <p className="text-xs text-muted-foreground">No tasks</p>
                      ) : (
                        tasks
                          .filter((t) => !t.is_note)
                          .map((task) => (
                            <div key={task.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50">
                              <button type="button" onClick={() => handleToggleTask(task.id, task.is_completed)} className="shrink-0">
                                {task.is_completed ? <Check className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                              </button>
                              <span className={`flex-1 text-xs truncate ${task.is_completed ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>{task.name}</span>
                            </div>
                          ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Items */}
                  <Card className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Items ({componentItems.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                      {componentItems.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No items</p>
                      ) : (
                        componentItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-1.5 rounded hover:bg-muted/50 text-xs">
                            <span className="text-card-foreground truncate">{getItemName(item.item_id)}</span>
                            <span className="text-muted-foreground shrink-0 ml-1">× {item.qty}</span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Timeline - placeholder */}
                  <Card className="border-border border-dashed opacity-75">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Milestones & schedule coming soon</p>
                    </CardContent>
                  </Card>

                  {/* Documents - placeholder */}
                  <Card className="border-border border-dashed opacity-75">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">Attachments & specs coming soon</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="border-border">
                <CardContent className="py-16 flex flex-col items-center justify-center min-h-[280px]">
                  <p className="text-sm text-muted-foreground">Component not found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AddProjectDialog
        open={isAddProjectOpen}
        onOpenChange={setIsAddProjectOpen}
        defaultFactoryId={factoryId}
        onSuccess={(project) => {
          if (project.factory_id) setFactoryId(project.factory_id);
          setSelectedProjectId(project.id);
          setSelectedProjectData(project);
          setSelectedComponentId(null);
        }}
      />
      {selectedProjectId && (
        <AddProjectComponentDialog
          open={isAddComponentOpen}
          onOpenChange={setIsAddComponentOpen}
          projectId={selectedProjectId}
          onSuccess={(id) => setSelectedComponentId(id)}
        />
      )}
      {selectedComponentId && (
        <AddProjectComponentTaskDialog
          open={isAddTaskOpen}
          onOpenChange={setIsAddTaskOpen}
          projectComponentId={selectedComponentId}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
