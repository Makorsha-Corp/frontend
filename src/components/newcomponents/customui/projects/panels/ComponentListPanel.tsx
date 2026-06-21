import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { projectNavigatorRowBaseClass, projectNavigatorRowHoverClass, projectNavigatorRowSelectedClass } from '../projectsPageUtils';
import type { ProjectComponent } from '@/types/projectComponent';

interface ComponentListPanelProps {
  components: ProjectComponent[];
  isLoading: boolean;
  selectedComponentId: number | null;
  selectedProjectId: number | null;
  onSelect: (component: ProjectComponent) => void;
  onAdd: () => void;
  onDelete: (component: ProjectComponent) => void;
  isDeleting: boolean;
  className?: string;
}

const ComponentListPanel: React.FC<ComponentListPanelProps> = ({
  components,
  isLoading,
  selectedComponentId,
  selectedProjectId,
  onSelect,
  onAdd,
  onDelete,
  isDeleting,
  className,
}) => {
  if (!selectedProjectId) {
    return (
      <Card className={cn('flex min-h-0 flex-col border-border border-dashed bg-muted/10', className)}>
        <CardContent className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-muted-foreground">Select a project to view components</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('flex min-h-0 flex-1 flex-col border-border', className)}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold text-card-foreground">Components</CardTitle>
          <Button size="icon" variant="outline" className="h-7 w-7" onClick={onAdd} title="Add component">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          </div>
        ) : components.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No components</div>
        ) : (
          <div className="divide-y divide-border">
            {components.map((component) => (
              <div
                key={component.id}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 px-4 py-3 transition-colors',
                  projectNavigatorRowBaseClass,
                  projectNavigatorRowHoverClass,
                  selectedComponentId === component.id && projectNavigatorRowSelectedClass
                )}
                onClick={() => onSelect(component)}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-card-foreground">{component.name}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 shrink-0 p-0 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(component);
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComponentListPanel;
