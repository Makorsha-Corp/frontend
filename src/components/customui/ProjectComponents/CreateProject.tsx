import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { addProject } from "@/services/ProjectsService";
import { addProjectComponent } from "@/services/ProjectComponentService";
import { Project, ProjectComponent } from "@/types";
import toast from "react-hot-toast";
import CreateProjectComponent from "./CreateProjectComponent";

interface CreateProjectProps {
  isOpen: boolean;
  onClose: () => void;
  factoryId: number;
  onProjectCreated?: (project: Project) => void;
}

const CreateProject: React.FC<CreateProjectProps> = ({
  isOpen,
  onClose,
  factoryId,
  onProjectCreated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
  });
  
  const [components, setComponents] = useState<ProjectComponent[]>([]);
  const [isCreateComponentOpen, setIsCreateComponentOpen] = useState(false);

  const resetForm = () => {
    setProjectData({
      name: "",
      description: "",
      priority: "MEDIUM",
    });
    setComponents([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleComponentCreated = (component: ProjectComponent) => {
    setComponents([...components, component]);
    setIsCreateComponentOpen(false);
  };

  const removeComponent = (componentId: number) => {
    setComponents(components.filter((comp) => comp.id !== componentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!projectData.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    if (!projectData.description.trim()) {
      toast.error('Project description is required');
      return;
    }
    
    setIsLoading(true);

    try {
      // Create the project
      const projectPayload: Partial<Project> = {
        name: projectData.name,
        description: projectData.description,
        deadline: null,
        priority: projectData.priority,
        status: "PLANNING", // Always create projects in Planning stage
        factory_id: factoryId,
      };

      const createdProject = await addProject(projectPayload);
      
      if (!createdProject) {
        throw new Error("Failed to create project");
      }

      // Create components if any (using loop instead of bulk insert)
      if (components.length > 0) {
        for (const comp of components) {
          const componentPayload: Partial<ProjectComponent> = {
            name: comp.name,
            description: comp.description || null,
            budget: comp.budget || null,
            start_date: comp.start_date || null,
            deadline: comp.deadline || null,
            status: comp.status,
            project_id: createdProject.id,
          };

          await addProjectComponent(componentPayload);
        }
      }

      onProjectCreated?.(createdProject);
      handleClose();
      toast.success("Project created successfully!");
      
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={projectData.name}
                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={projectData.description}
                    onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                    rows={2}
                    required
                  />
                </div>


                {/* Priority */}
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={projectData.priority}
                    onValueChange={(value: "LOW" | "MEDIUM" | "HIGH") => 
                      setProjectData({ ...projectData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Components Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Components ({components.length})</Label>
                    <Button 
                      type="button" 
                      onClick={() => setIsCreateComponentOpen(true)} 
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Component
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {components.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p className="text-sm">No components added yet</p>
                        <p className="text-xs">Click "Add Component" to get started</p>
                      </div>
                    ) : (
                      components.map((component) => (
                        <div key={component.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{component.name}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeComponent(component.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
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

      {/* Separate Component Creation Modal */}
      <CreateProjectComponent
        isOpen={isCreateComponentOpen}
        onClose={() => setIsCreateComponentOpen(false)}
        projectId={0} // Temporary project ID, components will be saved for later creation
        onComponentCreated={handleComponentCreated}
        isPreCreation={true}
      />
    </>
  );
};

export default CreateProject;
