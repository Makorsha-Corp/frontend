import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Wrench, Plus } from "lucide-react";
import { ProjectComponentPart } from "@/types";
import { fetchProjectComponentParts } from "@/services/ProjectComponentPartsService";
// toast removed - component simplified

interface ProjectComponentPartsProps {
  projectComponentId: number;
  projectId?: number;
  componentId?: number;
  factoryId?: number;
}

const ProjectComponentParts: React.FC<ProjectComponentPartsProps> = ({
  projectComponentId,
  projectId,
  componentId,
  factoryId,
}) => {
  const [parts, setParts] = useState<ProjectComponentPart[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to open CreateOrderPage in new tab with comprehensive pre-filled data
  const handleCreateNewOrder = () => {
    if (!projectId || !componentId || !factoryId) return;
    
    const params = new URLSearchParams({
      // Core identifiers
      factory: factoryId.toString(),
      project: projectId.toString(),
      component: componentId.toString(),
      
      // Order type only
      orderType: 'PFP' // Project for Part order type
    });
    
    const createOrderUrl = `/createorder?${params.toString()}`;
    window.open(createOrderUrl, '_blank');
  };

  // Load parts when component mounts or projectComponentId changes
  useEffect(() => {
    const loadParts = async () => {
      if (!projectComponentId) {
        
        setParts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const partsData = await fetchProjectComponentParts(projectComponentId);
        console.log(partsData)
        setParts(partsData || []);
      } catch (error) {
        console.error("Failed to fetch project component parts:", error);
        setParts([]);
      } finally {
        setLoading(false);
      }
    };

    loadParts();
  }, [projectComponentId]);


  if (loading) {
    return (
      <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Component Parts
          </div>
          {projectId && componentId && factoryId && (
            <Button
              size="sm"
              onClick={handleCreateNewOrder}
              className="h-8 gap-1 bg-blue-950 hover:bg-blue-900"
            >
              <Plus className="h-3.5 w-3.5" />
              Create New Order
            </Button>
          )}
        </CardTitle>
      </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border rounded-md bg-gray-50 animate-pulse flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="h-4 bg-gray-300 rounded w-8 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-6"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Component Parts ({parts.length})
          </div>
          {projectId && componentId && factoryId && (
            <Button
              size="sm"
              onClick={handleCreateNewOrder}
              className="h-8 gap-1 bg-blue-950 hover:bg-blue-900"
            >
              <Plus className="h-3.5 w-3.5" />
              Create New Order
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {parts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Parts Assigned</h3>
            <p className="text-sm">This component doesn't have any parts assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-full overflow-y-auto">
            {parts.map((componentPart) => (
              <div
                key={componentPart.id}
                className="p-3 border rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 w-full"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{componentPart.parts.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {componentPart.parts.id} • Unit: {componentPart.parts.unit || 'pcs'}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold text-primary">{componentPart.qty}</div>
                  <div className="text-xs text-muted-foreground">{componentPart.parts.unit || 'pcs'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectComponentParts;
