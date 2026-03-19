import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Folder, MoreHorizontal, Edit, Calculator, Calendar, Play, Check, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { Factory, Project, ProjectComponent } from "@/types";
import { convertUtcToBDTime } from "@/services/helper";
import { fetchProjectComponentsByProjectId } from "@/services/ProjectComponentService";
import { calculateProjectTotalCost, fetchProjects } from "@/services/ProjectsService";
import { fetchFactories } from "@/services/FactoriesService";
import ComponentNavigator from "./ComponentNavigator";
import CreateProject from "./CreateProject";
import BudgetPlanningModal from "./BudgetPlanningModal";
import DeadlinePlanningModal from "./DeadlinePlanningModal";
import StartProjectModal from "./StartProjectModal";
import CompleteProjectModal from "./CompleteProjectModal";
import EditProjectModal from "./EditProjectModal";

// Using imported types from @/types

interface ProjectNavigatorProps {
  selectedFactoryId: number | undefined;
  selectedProjectId: number | undefined;
  selectedComponentId: number | undefined;
  onFactorySelect: (factoryId: string) => void;
  onProjectSelect: (projectId: number, project: Project) => void;
  onProjectDeselect: () => void;
  onComponentSelect: (componentId: number, component: ProjectComponent) => void;
  onComponentDeselect: () => void;
  onRefreshProjectTotalCost?: (refreshFn: () => void) => void;
  // A bumping value indicating which component's misc costs changed
  miscCostUpdatedForComponentId?: number | null;
}

const ProjectNavigator: React.FC<ProjectNavigatorProps> = ({
  selectedFactoryId,
  selectedProjectId,
  selectedComponentId,
  onFactorySelect,
  onProjectSelect,
  onProjectDeselect,
  onComponentSelect,
  onComponentDeselect,
  onRefreshProjectTotalCost,
  miscCostUpdatedForComponentId,
}) => {
  // Modal states
  const [isCreateProjectOpen, setIsCreateProjectOpen] = React.useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = React.useState(false);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = React.useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = React.useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  
  // Data states - ProjectNavigator now owns all data
  const [factories, setFactories] = React.useState<Factory[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [components, setComponents] = React.useState<ProjectComponent[]>([]);
  
  // Loading states
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const [loadingComponents, setLoadingComponents] = React.useState(false);
  const [loadingProjectCost, setLoadingProjectCost] = React.useState(false);
  
  // Cost state
  const [projectTotalCost, setProjectTotalCost] = React.useState<number | null>(null);

  // Derived values
  const filteredProjects = React.useMemo(() => {
    if (!selectedFactoryId) return [];
    return projects.filter(project => project.factory_id === selectedFactoryId);
  }, [projects, selectedFactoryId]);

  const selectedProject = React.useMemo(() => {
    return filteredProjects.find(project => project.id === selectedProjectId);
  }, [filteredProjects, selectedProjectId]);

  // Load factories on mount
  React.useEffect(() => {
    const loadFactoriesData = async () => {
      try {
        const factoriesData = await fetchFactories();
        setFactories(factoriesData || []);
      } catch (error) {
        console.error("Failed to fetch factories:", error);
        setFactories([]);
      }
    };
    loadFactoriesData();
  }, []);

  // Load projects when factory is selected
  React.useEffect(() => {
    const loadProjectsData = async () => {
      if (!selectedFactoryId) {
        setProjects([]);
        return;
      }

      setLoadingProjects(true);
      try {
        const { data: projectsData } = await fetchProjects(selectedFactoryId);
        setProjects(projectsData || []);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjectsData();
  }, [selectedFactoryId]);

  // Load project total cost
  const loadProjectTotalCost = React.useCallback(async (projectId: number) => {
    setLoadingProjectCost(true);
    try {
      const totalCost = await calculateProjectTotalCost(projectId);
      setProjectTotalCost(totalCost);
    } catch (error) {
      console.error('Error loading project total cost:', error);
      setProjectTotalCost(null);
    } finally {
      setLoadingProjectCost(false);
    }
  }, []);

  // Load components for the selected project
  const loadComponents = React.useCallback(async (projectId: number) => {
    setLoadingComponents(true);
    try {
      const projectComponents = await fetchProjectComponentsByProjectId(projectId);
      setComponents(projectComponents);
    } catch (error) {
      console.error('Error loading components:', error);
      setComponents([]);
    } finally {
      setLoadingComponents(false);
    }
  }, []);


  const handleProjectUpdatedLocal = async () => {
    // Reload projects and components after project update
    if (selectedFactoryId) {
      try {
        const { data: projectsData } = await fetchProjects(selectedFactoryId);
        setProjects(projectsData || []);
      } catch (error) {
        console.error("Failed to refresh projects:", error);
      }
    }
    
    if (selectedProjectId) {
      await loadComponents(selectedProjectId);       
    }
  };

  const handleComponentUpdatedLocal = async () => {
    // Reload components and project cost after component update
    if (selectedProjectId) {
      await loadComponents(selectedProjectId);
      await loadProjectTotalCost(selectedProjectId);
    }
  };

  const handleProjectCreatedLocal = async (project: Project) => {
    // Reload projects list
    if (selectedFactoryId) {
      try {
        const { data: projectsData } = await fetchProjects(selectedFactoryId);
        setProjects(projectsData || []);
      } catch (error) {
        console.error("Failed to refresh projects:", error);
      }
    }
    // Select the new project and pass to parent
    onProjectSelect(project.id, project);
  };

  const handleComponentCreatedLocal = async (component: ProjectComponent) => {
    // Add to local components list
    setComponents(prev => [component, ...prev]);
    // Select the new component and pass to parent
    onComponentSelect(component.id, component);
  };


  // Load components when a project is selected
  React.useEffect(() => {
    if (selectedProjectId) {
      loadComponents(selectedProjectId);
    } else {
      setComponents([]);
    }
  }, [selectedProjectId, loadComponents]);

  // Load project total cost when a project is selected
  React.useEffect(() => {
    if (selectedProjectId) {
      loadProjectTotalCost(selectedProjectId);
    } else {
      setProjectTotalCost(null);
    }
  }, [selectedProjectId, loadProjectTotalCost]);

  // Function to refresh project total cost (can be called from parent)
  const refreshProjectTotalCost = React.useCallback(() => {
    if (selectedProjectId) {
      loadProjectTotalCost(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectTotalCost]);

  // Pass refresh function to parent
  React.useEffect(() => {
    onRefreshProjectTotalCost?.(refreshProjectTotalCost);
  }, [onRefreshProjectTotalCost, refreshProjectTotalCost]);

  // Styling helpers
  const getProjectStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-800';
      case 'STARTED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Currency (BDT)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date from existing convertUtcToBDTime function (remove time part)
  const formatDateOnly = (utcTimestamp: string | null | undefined): string => {
    if (!utcTimestamp) return 'TBD';
    try {
      const fullDateTime = convertUtcToBDTime(utcTimestamp);
      return fullDateTime.split(',')[0];
    } catch {
      return 'TBD';
    }
  };

  // Convert UTC date to YYYY-MM-DD format for date inputs (used by Start modal)
  const formatDateForInput = (utcTimestamp: string | null | undefined): string => {
    if (!utcTimestamp) return '';
    try {
      const date = new Date(utcTimestamp);
      if (isNaN(date.getTime())) return '';
      const bdOffset = 6 * 60 * 60 * 1000; // Bangladesh UTC+6
      const bdDate = new Date(date.getTime() + bdOffset);
      const year = bdDate.getUTCFullYear();
      const month = String(bdDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(bdDate.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Calculate and format time elapsed for projects
  const getTimeElapsedInfo = (project: Project) => {
    if (!project.start_date) {
      return { label: 'Time Elapsed', value: 'Not started' };
    }

    const startDate = new Date(project.start_date);
    const endDate = project.status === 'COMPLETED' && project.end_date 
      ? new Date(project.end_date) 
      : new Date();
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (project.status === 'COMPLETED') {
      return {
        label: 'Duration',
        value: `${daysDiff} days`
      };
    } else {
      return {
        label: 'Time Elapsed',
        value: `${daysDiff} days`
      };
    }
  };



  return (
    <div className="flex-none min-w-80 max-w-96 w-full lg:w-1/4 h-full">
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Project Navigator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
          
          {/* Factory Selection */}
          <div>
            <Label className="mb-2 text-base font-medium">Factory</Label>
            <Select
              value={selectedFactoryId?.toString() || ""}
              onValueChange={onFactorySelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose factory..." />
              </SelectTrigger>
              <SelectContent>
                {factories.map((factory) => (
                  <SelectItem key={factory.id} value={factory.id.toString()}>
                    {factory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Section */}
          {selectedFactoryId && (
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-gray-900 flex-1 min-w-0 truncate">
                    {selectedProject ? ` ${selectedProject.name}` : 'Project'}
                  </h2>
                  <div className="flex items-center gap-1 flex-none">
                    {!selectedProject && (
                      <>
                    {/* Always allow creating a project when a factory is selected */}
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreateProjectOpen(true)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500" 
                      title="Add project"
                      disabled={!selectedFactoryId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    </>
                    )}

                    {selectedProject && (
                      <>
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={onProjectDeselect}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500"
                          title="Back"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="More options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsBudgetModalOpen(true)}>
                              <Calculator className="mr-2 h-4 w-4" />
                              Plan Budget
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsDeadlineModalOpen(true)}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Plan Deadlines
                            </DropdownMenuItem>
                            {selectedProject.status === "PLANNING" && (
                              <DropdownMenuItem onClick={() => setIsStartModalOpen(true)}>
                                <Play className="mr-2 h-4 w-4" />
                                Start Project
                              </DropdownMenuItem>
                            )}
                            {selectedProject.status === "STARTED" && (
                              <DropdownMenuItem onClick={() => setIsCompleteModalOpen(true)}>
                                <Check className="mr-2 h-4 w-4" />
                                Complete Project
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCreateProjectOpen(true)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500" 
                          title="Add project"
                          disabled={!selectedFactoryId}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        
                      </>
                    )}
                    
                  </div>
                </div>
              
              {selectedProjectId ? (
                <div className="space-y-3">
                  {filteredProjects
                    .filter(project => project.id === selectedProjectId)
                    .map((project) => (
                      <div key={project.id} className="space-y-3">
                        {/* Description (max 3 lines with hover for full text) */}
                        <p
                          className="text-sm text-muted-foreground leading-relaxed line-clamp-3"
                          title={project.description}
                        >
                          {project.description}
                        </p>

                        {/* Project Details (always visible) */}
                          <div className="space-y-3">
                            {/* Budget and Cost */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground block">Budget</span>
                                <div className="font-semibold text-green-600">{project.budget?formatCurrency(project.budget):'TBD'}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Total Cost</span>
                                <div className="font-semibold text-blue-600">
                                  {loadingProjectCost ? (
                                    <span className="text-sm">Calculating...</span>
                                  ) : projectTotalCost !== null ? (
                                    projectTotalCost > 0 ? formatCurrency(projectTotalCost) : 'TBD'
                                  ) : (
                                    'TBD'
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground block">Start Date</span>
                                <div className="font-medium">{formatDateOnly(project.start_date)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">End Date</span>
                                <div className="font-medium">{formatDateOnly(project.end_date)}</div>
                              </div>
                            </div>

                            {/* Deadline and Priority */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground block">Deadline</span>
                                <div className="font-medium text-red-600">{formatDateOnly(project.deadline)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Priority</span>
                                <Badge className={`text-sm ${getProjectPriorityColor(project.priority)}`}>{project.priority}</Badge>
                              </div>
                            </div>

                            {/* Status and Time */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground block">Status</span>
                                <Badge className={`text-sm ${getProjectStatusColor(project.status)}`}>
                                  {project.status}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">{getTimeElapsedInfo(project).label}</span>
                                <div className="font-medium">{getTimeElapsedInfo(project).value}</div>
                              </div>
                            </div>

                            {/* Components Progress - Will be calculated when components are loaded */}
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Components Progress</span>
                                <span className="font-medium text-primary">
                                  N/A
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                                  style={{ width: '0%' }}
                                ></div>
                              </div>
                            </div>
                          </div>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="space-y-2 flex-1 min-h-0 overflow-auto pr-2 pb-2">
                  {loadingProjects ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading projects...</span>
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                      <div className="text-gray-500 mb-2">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
                      <p className="text-sm text-gray-500 mb-4">Get started by creating your first project</p>
                      <button 
                        onClick={() => setIsCreateProjectOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create New Project
                      </button>
                    </div>
                  ) : (
                    filteredProjects.map((project) => (
                      <div 
                        key={project.id} 
                        className="p-3 border rounded-lg cursor-pointer transition-all duration-200 bg-white hover:bg-gray-50 border-gray-200"
                        onClick={() => onProjectSelect(project.id, project)}
                      >
                        <h4 className="font-medium text-base mb-2">
                          {project.name}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Component Navigator */}
          {selectedProject && (
            <>
              {loadingComponents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading components...</span>
                </div>
              ) : (
                <ComponentNavigator
                  selectedProject={selectedProject}
                  selectedComponentId={selectedComponentId}
                  components={components}
                  miscCostUpdatedForComponentId={miscCostUpdatedForComponentId}
                  onComponentSelect={(componentId) => {
                    const component = components.find(c => c.id === componentId);
                    if (component) {
                      onComponentSelect(componentId, component);
                    }
                  }}
                  onComponentDeselect={onComponentDeselect}
                  onComponentCreated={handleComponentCreatedLocal}
                  onComponentUpdated={handleComponentUpdatedLocal}
                  onProjectUpdated={handleProjectUpdatedLocal}
                />
              )}
            </>
          )}

        </CardContent>
      </Card>

      {/* Create Project Modal */}
      {selectedFactoryId && (
        <CreateProject
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
          factoryId={selectedFactoryId}
          onProjectCreated={handleProjectCreatedLocal}
        />
      )}

      {selectedProject && (
        <>
          <BudgetPlanningModal
            isOpen={isBudgetModalOpen}
            onClose={() => setIsBudgetModalOpen(false)}
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onProjectUpdated={handleProjectUpdatedLocal}
          />

          <DeadlinePlanningModal
            isOpen={isDeadlineModalOpen}
            onClose={() => setIsDeadlineModalOpen(false)}
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onProjectUpdated={handleProjectUpdatedLocal}
          />

          <StartProjectModal
            isOpen={isStartModalOpen}
            onClose={() => setIsStartModalOpen(false)}
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            defaultStartDate={formatDateForInput(selectedProject.start_date)}
            onProjectUpdated={handleProjectUpdatedLocal}
          />

          <CompleteProjectModal
            isOpen={isCompleteModalOpen}
            onClose={() => setIsCompleteModalOpen(false)}
            projectId={selectedProject.id}
            projectName={selectedProject.name}
            onProjectUpdated={handleProjectUpdatedLocal}
          />

          <EditProjectModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            projectId={selectedProject.id}
            initialName={selectedProject.name}
            initialDescription={selectedProject.description}
            initialPriority={selectedProject.priority}
            onProjectUpdated={handleProjectUpdatedLocal}
          />
        </>
      )}

    </div>
  );
};

export default ProjectNavigator;
