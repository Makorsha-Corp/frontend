import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi';
import type { Department } from '@/types/department';
import { Plus, Pencil, Loader2, Users } from 'lucide-react';
import AddDepartmentDialog from './AddDepartmentDialog';
import EditDepartmentDialog from './EditDepartmentDialog';

interface DepartmentsManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepartmentsManageDialog: React.FC<DepartmentsManageDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data: departments = [], isLoading } = useGetDepartmentsQuery(
    { skip: 0, limit: 100 },
    { skip: !open }
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-card-foreground">
              <Users className="h-5 w-5" />
              Manage Departments
            </DialogTitle>
            <DialogDescription>
              Add or edit departments used across your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {departments.length} {departments.length === 1 ? 'department' : 'departments'}
              </span>
              <Button
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Department
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8 rounded-lg border border-dashed border-border bg-muted/30">
                <p className="text-sm text-muted-foreground mb-3">No departments yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add your first department
                </Button>
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto space-y-1 rounded-lg border border-border">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                  >
                    <span className="font-medium text-sm text-card-foreground">{dept.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-brand-primary hover:text-brand-primary-hover hover:bg-brand-primary/10"
                      onClick={() => setEditingDepartment(dept)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddDepartmentDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        departments={departments}
      />
      <EditDepartmentDialog
        open={!!editingDepartment}
        onOpenChange={(open) => !open && setEditingDepartment(null)}
        department={editingDepartment}
        departments={departments}
      />
    </>
  );
};

export default DepartmentsManageDialog;
