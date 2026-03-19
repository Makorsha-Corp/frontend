import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addProjectComponent } from "@/services/ProjectComponentService";
import { ProjectComponent } from "@/types";
import toast from "react-hot-toast";

interface CreateProjectComponentProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onComponentCreated?: (component: ProjectComponent) => void;
  isPreCreation?: boolean; // Flag for creating components before project exists
}

const CreateProjectComponent: React.FC<CreateProjectComponentProps> = ({
  isOpen,
  onClose,
  projectId,
  onComponentCreated,
  isPreCreation = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [componentData, setComponentData] = useState({
    name: "",
    description: "",
  });

  const resetForm = () => {
    setComponentData({
      name: "",
      description: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const componentPayload: Partial<ProjectComponent> = {
        name: componentData.name,
        description: componentData.description || null,
        deadline: null,
        status: "PLANNING", // Always create components in Planning stage
        project_id: projectId,
      };

      if (isPreCreation) {
        // For pre-creation (before project exists), create a mock component
        const mockComponent: ProjectComponent = {
          id: Date.now(), // Temporary ID
          name: componentData.name,
          description: componentData.description || null,
          deadline: null,
          status: "PLANNING", // Always create components in Planning stage
          project_id: 0, // Will be updated when project is created
          created_at: new Date().toISOString(),
          project: {} as any, // Mock project reference
        };

        onComponentCreated?.(mockComponent);
        handleClose();
        toast.success("Component prepared for creation!");
      } else {
        // Normal creation with existing project
        const createdComponent = await addProjectComponent(componentPayload);
        
        if (!createdComponent) {
          throw new Error("Failed to create component");
        }

        onComponentCreated?.(createdComponent);
        handleClose();
        toast.success("Component created successfully!");
      }
      
    } catch (error) {
      console.error("Error creating component:", error);
      toast.error("Failed to create component");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Component</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Component Name */}
          <div>
            <Label htmlFor="name">Component Name *</Label>
            <Input
              id="name"
              value={componentData.name}
              onChange={(e) => setComponentData({ ...componentData, name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={componentData.description}
              onChange={(e) => setComponentData({ ...componentData, description: e.target.value })}
              rows={3}
            />
          </div>
          

          {/* Actions */}
          <div className="flex space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectComponent;
