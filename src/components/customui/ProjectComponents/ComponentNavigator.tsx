import React from "react";
import { MoreHorizontal, Edit, ArrowLeft, Plus, Play, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { convertUtcToBDTime } from "@/services/helper";
import { Project, ProjectComponent } from "@/types";
import CreateProjectComponent from "./CreateProjectComponent";
import EditComponentModal from "./EditComponentModal";
import StartComponentModal from "./StartComponentModal";
import CompleteComponentModal from "./CompleteComponentModal";
import { calculateProjectComponentTotalCost } from "@/services/ProjectComponentService";

interface ComponentNavigatorProps {
  selectedProject: Project | undefined;
  selectedComponentId: number | undefined;
  components: ProjectComponent[];
  // When supplemental expenses change for a component, this prop will carry its id
  miscCostUpdatedForComponentId?: number | null;
  onComponentSelect: (componentId: number) => void;
  onComponentDeselect: () => void;
  onComponentCreated?: (component: ProjectComponent) => void;
  onComponentUpdated?: () => void;
  onProjectUpdated?: () => void;
}

const ComponentNavigator: React.FC<ComponentNavigatorProps> = ({
  selectedProject,
  selectedComponentId,
  components,
  miscCostUpdatedForComponentId,
  onComponentSelect,
  onComponentDeselect,
  onComponentCreated,
  onComponentUpdated,
  onProjectUpdated,
}) => {
  const [isCreateComponentOpen, setIsCreateComponentOpen] = React.useState(false);

  // New modals (edit/start/complete)
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = React.useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = React.useState(false);

  // Component total costs state (orders + misc expenses)
  const [componentCosts, setComponentCosts] = React.useState<Record<number, number>>({});
  const [loadingCosts, setLoadingCosts] = React.useState<Record<number, boolean>>({});

  // Get selected component
  const selectedComponent = components?.find(
    (component) => component.id === selectedComponentId
  );

  // Calculate total cost for a component (orders + misc expenses)
  const calculateComponentCost = React.useCallback(async (componentId: number) => {
    if (loadingCosts[componentId]) return; // Already loading
    
    setLoadingCosts(prev => ({ ...prev, [componentId]: true }));
    try {
      const totalCost = await calculateProjectComponentTotalCost(componentId);
      setComponentCosts(prev => ({ ...prev, [componentId]: totalCost }));
    } catch (error) {
      console.error('Error calculating component cost:', error);
      setComponentCosts(prev => ({ ...prev, [componentId]: 0 }));
    } finally {
      setLoadingCosts(prev => ({ ...prev, [componentId]: false }));
    }
  }, [loadingCosts]);

  // Load costs for all components when components change
  React.useEffect(() => {
    if (components && components.length > 0) {
      components.forEach(component => {
        if (!(component.id in componentCosts) && !loadingCosts[component.id]) {
          calculateComponentCost(component.id);
        }
      });
    }
  }, [components, componentCosts, loadingCosts, calculateComponentCost]);

  // Recalculate a single component's costs when its supplemental expenses were updated
  React.useEffect(() => {
    if (!miscCostUpdatedForComponentId) return;
    // Ensure the component exists in current list
    const exists = components?.some(c => c.id === miscCostUpdatedForComponentId);
    if (!exists) return;
    calculateComponentCost(miscCostUpdatedForComponentId);
    // no cleanup needed
  }, [miscCostUpdatedForComponentId, components, calculateComponentCost]);

  // Utilities
  const formatCurrency = (amount: number | null | undefined) => {
    const val = amount ?? 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDateOnly = (utcTimestamp: string | null | undefined): string => {
    if (!utcTimestamp) return "TBD";
    try {
      const fullDateTime = convertUtcToBDTime(utcTimestamp);
      return fullDateTime.split(",")[0];
    } catch {
      return "TBD";
    }
  };

  const formatDateForInput = (utcTimestamp: string | null | undefined): string => {
    if (!utcTimestamp) return "";
    try {
      const date = new Date(utcTimestamp);
      if (isNaN(date.getTime())) return "";
      const bdOffset = 6 * 60 * 60 * 1000;
      const bdDate = new Date(date.getTime() + bdOffset);
      const year = bdDate.getUTCFullYear();
      const month = String(bdDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(bdDate.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const getComponentStatusBadge = (status: ProjectComponent["status"]) => {
    const base = "px-2 py-1 rounded text-xs font-medium";
    switch (status) {
      case "PLANNING":
        return `${base} bg-blue-100 text-blue-800`;
      case "STARTED":
        return `${base} bg-green-100 text-green-800`;
      case "COMPLETED":
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  // removed unused getPriorityBadge to satisfy linter


  if (!selectedProject) return null;

  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 flex-1 min-w-0 truncate">
          {selectedComponent ? ` ${selectedComponent.name}` : 'Component'}
        </h2>
        <div className="flex items-center gap-1 flex-none">
          {selectedComponent && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onComponentDeselect}
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
                    Edit Component
                  </DropdownMenuItem>
                  {selectedComponent.status === "PLANNING" && (
                    <DropdownMenuItem onClick={() => setIsStartModalOpen(true)}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Component
                    </DropdownMenuItem>
                  )}
                  {selectedComponent.status === "STARTED" && (
                    <DropdownMenuItem onClick={() => setIsCompleteModalOpen(true)}>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Component
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
            </>
          )}
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setIsCreateComponentOpen(true)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500" 
            title="Add component"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedComponentId ? (
        <div className="space-y-3">
          {selectedComponent && (
            <div className="space-y-3">
              {/* Info */}
              <div>
                <p
                  className="text-sm text-muted-foreground leading-relaxed line-clamp-3"
                  title={selectedComponent.description || ''}
                >
                  {selectedComponent.description}
                </p>
              </div>

              {/* Details (always visible) */}
              <div className="space-y-3">
                  {/* Budget and Cost */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Budget</span>
                      <div className="font-semibold text-green-600">{selectedComponent.budget?formatCurrency(selectedComponent.budget):'TBD'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Total Cost</span>
                      <div className="font-semibold text-blue-600">
                        {selectedComponent && loadingCosts[selectedComponent.id] ? (
                          <span className="text-sm">Calculating...</span>
                        ) : selectedComponent && componentCosts[selectedComponent.id] !== undefined ? (
                          componentCosts[selectedComponent.id] > 0 ? formatCurrency(componentCosts[selectedComponent.id]) : 'TBD'
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
                      <div className="font-medium">{formatDateOnly(selectedComponent.start_date)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">End Date</span>
                      <div className="font-medium">{formatDateOnly(selectedComponent.end_date)}</div>
                    </div>
                  </div>

                  {/* Deadline and Status */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Deadline</span>
                      <div className="font-medium text-red-600">{formatDateOnly(selectedComponent.deadline)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Status</span>
                      <div className={getComponentStatusBadge(selectedComponent.status)}>
                        {selectedComponent.status}
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          )}
        </div>
      ) : (
        // Grid of components to select
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {!components || components.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
              <div className="text-gray-500 mb-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No components yet</h3>
              <p className="text-sm text-gray-500 mb-4">Get started by creating your first component</p>
            </div>
          ) : (
            components.map((component) => (
              <div
                key={component.id}
                className="p-3 border rounded-lg cursor-pointer transition-all duration-200 bg-white hover:bg-gray-50 border-gray-200"
                onClick={() => onComponentSelect(component.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-base">{component.name}</h4>
                  <div className="text-sm text-muted-foreground ml-2">
                    {loadingCosts[component.id] ? (
                      <span className="text-xs">Calculating...</span>
                    ) : componentCosts[component.id] !== undefined ? (
                      componentCosts[component.id] > 0 ? formatCurrency(componentCosts[component.id]) : 'TBD'
                    ) : (
                      'TBD'
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {component.description || ""}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Component Modal */}
      <CreateProjectComponent
        isOpen={isCreateComponentOpen}
        onClose={() => setIsCreateComponentOpen(false)}
        projectId={selectedProject.id}
        onComponentCreated={onComponentCreated}
      />

      {/* Edit / Start / Complete Modals for the selected component */}
      {selectedComponent && (
        <>
          <EditComponentModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            componentId={selectedComponent.id}
            initialName={selectedComponent.name}
            initialDescription={selectedComponent.description || ""}
            onComponentUpdated={onComponentUpdated}
          />

          <StartComponentModal
            isOpen={isStartModalOpen}
            onClose={() => setIsStartModalOpen(false)}
            componentId={selectedComponent.id}
            componentName={selectedComponent.name}
            projectId={selectedProject.id}
            projectStatus={selectedProject.status}
            defaultStartDate={formatDateForInput(selectedComponent.start_date)}
            onComponentUpdated={onComponentUpdated}
            onProjectUpdated={onProjectUpdated}
          />

          <CompleteComponentModal
            isOpen={isCompleteModalOpen}
            onClose={() => setIsCompleteModalOpen(false)}
            componentId={selectedComponent.id}
            componentName={selectedComponent.name}
            defaultStartDate={formatDateForInput(selectedComponent.start_date)}
            onComponentUpdated={onComponentUpdated}
          />
        </>
      )}
    </div>
  );
};

export default ComponentNavigator;
