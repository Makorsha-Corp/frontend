import React, { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import NavigationBar from "@/components/customui/NavigationBar";
import {
  Folder,
  FolderOpen,
  Settings
} from "lucide-react";
import { Project, ProjectComponent } from "@/types";
import ProjectComponentTasks from "@/components/customui/ProjectComponents/ProjectComponentTasks";
import RunningOrders from "@/components/customui/RunningOrders";
// NOTE: if your file is named ProjectComponentMiscCosts.tsx, change this import to .../ProjectComponentMiscCosts
import ProjectComponentMiscCosts from "@/components/customui/ProjectComponents/ProjectComponentMiscCost";
import ProjectComponentParts from "@/components/customui/ProjectComponents/ProjectComponentParts";
import ProjectNavigator from "@/components/customui/ProjectComponents/ProjectNavigator";

const ProjectsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Only manage selection IDs from URL params
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | undefined>(() => {
    const factoryParam = searchParams.get('factory');
    return factoryParam ? Number(factoryParam) : undefined;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(() => {
    const projectParam = searchParams.get('project');
    return projectParam ? Number(projectParam) : undefined;
  });
  const [selectedComponentId, setSelectedComponentId] = useState<number | undefined>(() => {
    const componentParam = searchParams.get('component');
    return componentParam ? Number(componentParam) : undefined;
  });
  
  // Store selected objects (received from ProjectNavigator)
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [selectedComponent, setSelectedComponent] = useState<ProjectComponent | undefined>(undefined);
  
  // Ref to store the project total cost refresh function
  const refreshProjectTotalCostRef = useRef<(() => void) | null>(null);
  // Track which component's misc costs were updated to trigger per-component recompute
  const [miscCostUpdatedForComponentId, setMiscCostUpdatedForComponentId] = useState<number | null>(null);

  // Update URL parameters when selections change
  const updateUrlParams = (factory?: number, project?: number, component?: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);

      if (factory !== undefined) {
        newParams.set('factory', factory.toString());
      } else {
        newParams.delete('factory');
      }

      if (project !== undefined) {
        newParams.set('project', project.toString());
      } else {
        newParams.delete('project');
      }

      if (component !== undefined) {
        newParams.set('component', component.toString());
      } else {
        newParams.delete('component');
      }

      return newParams;
    });
  };

  const handleFactorySelect = (factoryId: string) => {
    const id = Number(factoryId);
    setSelectedFactoryId(id);
    setSelectedProjectId(undefined);
    setSelectedComponentId(undefined);
    setSelectedProject(undefined);
    setSelectedComponent(undefined);
    updateUrlParams(id);
  };

  const handleProjectSelect = (projectId: number, project: Project) => {
    setSelectedProjectId(projectId);
    setSelectedProject(project);
    setSelectedComponentId(undefined);
    setSelectedComponent(undefined);
    updateUrlParams(selectedFactoryId, projectId);
  };

  const handleComponentSelect = (componentId: number, component: ProjectComponent) => {
    setSelectedComponentId(componentId);
    setSelectedComponent(component);
    updateUrlParams(selectedFactoryId, selectedProjectId, componentId);
  };

  const handleProjectDeselect = () => {
    setSelectedProjectId(undefined);
    setSelectedProject(undefined);
    setSelectedComponentId(undefined);
    setSelectedComponent(undefined);
    updateUrlParams(selectedFactoryId);
  };

  const handleComponentDeselect = () => {
    setSelectedComponentId(undefined);
    setSelectedComponent(undefined);
    updateUrlParams(selectedFactoryId, selectedProjectId);
  };

  return (
    <>
      <NavigationBar />
      <div className="flex w-full flex-col">
        <main className="flex-1 p-4 sm:px-6 sm:py-4 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 100px)' }}>
            {/* Left Panel - Project Navigator */}
            <ProjectNavigator
              selectedFactoryId={selectedFactoryId}
              selectedProjectId={selectedProjectId}
              selectedComponentId={selectedComponentId}
              onFactorySelect={handleFactorySelect}
              onProjectSelect={handleProjectSelect}
              onProjectDeselect={handleProjectDeselect}
              onComponentSelect={handleComponentSelect}
              onComponentDeselect={handleComponentDeselect}
              onRefreshProjectTotalCost={(refreshFn) => {
                refreshProjectTotalCostRef.current = refreshFn;
              }}
              miscCostUpdatedForComponentId={miscCostUpdatedForComponentId}
            />

            {/* Middle Panel - Running Orders + Component Parts; Right Panel stays */}
            {selectedComponent && (
              <div className="flex-1 flex flex-col lg:flex-row gap-4 h-full min-h-0">
                {/* Middle column: Running Orders (top) + Component Parts (bottom) */}
                <div className="flex-1 h-full flex flex-col gap-4 overflow-hidden min-h-0">
                  {/* Running Orders (top half) */}
                  <div className="flex-1 basis-1/2 min-h-0">
                    <RunningOrders projectComponent={selectedComponent} />
                  </div>

                  {/* Component Parts (bottom half) */}
                  <div className="flex-1 basis-1/2 min-h-0 overflow-hidden">
                    <ProjectComponentParts 
                      projectComponentId={selectedComponent.id}
                      projectId={selectedProjectId}
                      componentId={selectedComponent.id}
                      factoryId={selectedFactoryId}
                    />
                  </div>
                </div>

                {/* Right side: Tasks + Misc Costs */}
                <div className="flex-1 h-full flex flex-col gap-4 overflow-hidden min-h-0">
                  {/* Tasks (top half) */}
                  <div className="flex-1 basis-1/3 min-h-0 overflow-hidden">
                    <ProjectComponentTasks ProjectComponentId={selectedComponent.id} />
                  </div>

                  {/* Misc Costs (bottom half) */}
                  <div className="flex-1 basis-1/3 min-h-0 overflow-hidden">
                    <ProjectComponentMiscCosts
                      projectId={selectedProjectId as number}
                      projectComponentId={selectedComponent.id}
                      onMiscCostUpdated={() => {
                        // Refresh project total cost and trigger per-component recompute
                        refreshProjectTotalCostRef.current?.();
                        setMiscCostUpdatedForComponentId(selectedComponent.id);
                        // Reset so subsequent updates retrigger
                        setTimeout(() => setMiscCostUpdatedForComponentId(null), 0);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Empty States */}
            {!selectedFactoryId && (
              <div className="flex-1 h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a Factory</h3>
                  <p className="text-sm">Choose a factory to view its projects</p>
                </div>
              </div>
            )}

            {selectedFactoryId && !selectedProjectId && (
              <div className="flex-1 h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                  <p className="text-sm">Choose a project to view its components</p>
                </div>
              </div>
            )}

            {selectedProjectId && !selectedComponentId && (
              <div className="flex-1 h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a Component</h3>
                  <p className="text-sm">Choose a project component to view its parts and todos</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default ProjectsPage;
