import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetFactoriesQuery, useDeleteFactoryMutation } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi';
import type { Factory } from '@/types/factory';
import { Search, Plus, Loader2, Pencil, Trash2, Factory as FactoryIcon, ChevronRight, Layers, Users } from 'lucide-react';
import AddFactoryDialog from '@/components/newcomponents/customui/AddFactoryDialog';
import EditFactoryDialog from '@/components/newcomponents/customui/EditFactoryDialog';
import DepartmentsManageDialog from '@/components/newcomponents/customui/DepartmentsManageDialog';
import toast, { Toaster } from 'react-hot-toast';

interface FactoryCardProps {
  factory: Factory;
  sectionsCount?: number;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const FactoryCard: React.FC<FactoryCardProps> = ({
  factory,
  sectionsCount = 0,
  onEdit,
  onView,
  onDelete,
  isDeleting,
}) => (
    <Card
      className="border-border hover:border-brand-primary/30 hover:shadow-md transition-all cursor-pointer group"
      onClick={onView}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FactoryIcon className="h-7 w-7 text-brand-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                {factory.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2.5 py-1 rounded-md text-sm font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  {factory.abbreviation}
                </span>
                <span className="text-sm text-muted-foreground">ID #{factory.id}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-brand-primary transition-colors flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>{sectionsCount} {sectionsCount === 1 ? 'section' : 'sections'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
            View details
          </Button>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-brand-primary hover:text-brand-primary-hover hover:bg-brand-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit factory</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Deactivate factory</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
);

const FactoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFactory, setEditingFactory] = useState<Factory | null>(null);
  const [isDeptsDialogOpen, setIsDeptsDialogOpen] = useState(false);

  const { data: factories, isLoading, error } = useGetFactoriesQuery({
    skip: 0,
    limit: 100,
    search: searchQuery || undefined,
  });
  const { data: allSections = [] } = useGetFactorySectionsQuery({ skip: 0, limit: 500 });
  const { data: departments = [] } = useGetDepartmentsQuery({ skip: 0, limit: 100 });
  const sectionsByFactory = React.useMemo(() => {
    const map: Record<number, number> = {};
    for (const s of allSections) {
      map[s.factory_id] = (map[s.factory_id] ?? 0) + 1;
    }
    return map;
  }, [allSections]);
  const [deleteFactory, { isLoading: isDeleting }] = useDeleteFactoryMutation();

  const filteredFactories = React.useMemo(() => {
    if (!factories) return [];
    if (!searchQuery.trim()) return factories;
    const q = searchQuery.toLowerCase();
    return factories.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.abbreviation.toLowerCase().includes(q)
    );
  }, [factories, searchQuery]);

  const handleEdit = (factory: Factory) => {
    setEditingFactory(factory);
  };

  const handleView = (factory: Factory) => {
    navigate(`/factories/${factory.id}`);
  };

  const handleDelete = async (factory: Factory) => {
    if (!window.confirm(`Are you sure you want to deactivate "${factory.name}"? This is a soft delete.`)) {
      return;
    }

    try {
      await deleteFactory(factory.id).unwrap();
      toast.success(`Factory "${factory.name}" has been deactivated`);
    } catch (error: any) {
      console.error('Failed to deactivate factory:', error);
      toast.error(error?.data?.detail || 'Failed to deactivate factory');
    }
  };

  const handleEditDialogClose = (open: boolean) => {
    if (!open) setEditingFactory(null);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <FactoryIcon className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Factories</h1>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-brand-primary hover:bg-brand-primary-hover shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Factory
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-background">
          <Card className="shadow-sm bg-card border-border">
            <CardContent className="p-0">
              {/* Table/data header bar: search */}
              <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                {/* Left: count */}
                <div className="text-sm text-muted-foreground shrink-0">
                  {!isLoading && (
                    <span className="font-medium">{filteredFactories.length} {filteredFactories.length === 1 ? 'factory' : 'factories'}</span>
                  )}
                </div>
                {/* Right: search */}
                <div className="relative w-[180px] min-w-[140px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    type="text"
                    placeholder="Search factories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
              </div>

              <div className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
                  <p className="text-muted-foreground">Loading factories...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <p className="text-destructive">Failed to load factories. Please try again.</p>
                </div>
              ) : filteredFactories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary/10 rounded-full mb-4">
                    <FactoryIcon className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">No Factories Found</h3>
                  <p className="text-muted-foreground text-center mb-6 max-w-sm">
                    {searchQuery ? 'No factories match your search.' : 'Get started by adding your first factory.'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-brand-primary hover:bg-brand-primary-hover"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Factory
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredFactories.map((factory) => (
                    <FactoryCard
                      key={factory.id}
                      factory={factory}
                      sectionsCount={sectionsByFactory[factory.id] ?? 0}
                      onEdit={() => handleEdit(factory)}
                      onView={() => handleView(factory)}
                      onDelete={() => handleDelete(factory)}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              )}
              </div>
            </CardContent>
          </Card>

          {/* Departments card - opens popup */}
          <Card
            className="mt-6 max-w-sm shadow-sm bg-card border-border cursor-pointer hover:border-brand-primary/30 hover:shadow-md transition-all"
            onClick={() => setIsDeptsDialogOpen(true)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">Departments</p>
                  <p className="text-sm text-muted-foreground">
                    {departments.length} {departments.length === 1 ? 'department' : 'departments'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>

      <AddFactoryDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} factories={factories ?? []} />
      <EditFactoryDialog
        open={!!editingFactory}
        onOpenChange={handleEditDialogClose}
        factory={editingFactory}
        factories={factories ?? []}
      />
      <DepartmentsManageDialog
        open={isDeptsDialogOpen}
        onOpenChange={setIsDeptsDialogOpen}
      />
    </div>
  );
};

export default FactoriesPage;
