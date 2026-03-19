import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGetFactoryByIdQuery, useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery, useDeleteFactorySectionMutation } from '@/features/factorySections/factorySectionsApi';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Factory as FactoryIcon, Pencil, Loader2, Layers, LayoutGrid, Plus, Search, Trash2, ChevronRight } from 'lucide-react';
import EditFactoryDialog from '@/components/newcomponents/customui/EditFactoryDialog';
import AddFactorySectionDialog from '@/components/newcomponents/customui/AddFactorySectionDialog';
import EditFactorySectionDialog from '@/components/newcomponents/customui/EditFactorySectionDialog';
import type { FactorySection } from '@/types/factorySection';
import toast, { Toaster } from 'react-hot-toast';

const FactoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [isEditSectionDialogOpen, setIsEditSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<FactorySection | null>(null);
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');

  const [deleteSection, { isLoading: isDeletingSection }] = useDeleteFactorySectionMutation();

  const factoryId = id ? parseInt(id, 10) : null;
  const { data: factory, isLoading, error } = useGetFactoryByIdQuery(factoryId!, {
    skip: !factoryId || isNaN(factoryId),
  });
  const { data: allFactories = [] } = useGetFactoriesQuery({ skip: 0, limit: 200 });
  const { data: sections = [] } = useGetFactorySectionsQuery(
    { factory_id: factoryId!, limit: 500 },
    { skip: !factoryId || isNaN(factoryId) }
  );

  const filteredSections = React.useMemo(() => {
    if (!sectionSearchQuery.trim()) return sections;
    const q = sectionSearchQuery.toLowerCase();
    return sections.filter((s) => s.name.toLowerCase().includes(q));
  }, [sections, sectionSearchQuery]);

  const handleEditSection = (section: FactorySection) => {
    setEditingSection(section);
    setIsEditSectionDialogOpen(true);
  };

  const handleEditSectionDialogClose = (open: boolean) => {
    if (!open) setEditingSection(null);
    setIsEditSectionDialogOpen(open);
  };

  const handleDeleteSection = async (section: FactorySection) => {
    if (!window.confirm(`Are you sure you want to deactivate "${section.name}"? This is a soft delete.`)) {
      return;
    }
    try {
      await deleteSection(section.id).unwrap();
      toast.success(`Section "${section.name}" has been deactivated`);
    } catch (error: any) {
      console.error('Failed to deactivate section:', error);
      toast.error(error?.data?.detail || 'Failed to deactivate section');
    }
  };

  if (!factoryId || isNaN(factoryId)) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <p className="text-destructive">Invalid factory ID. <a href="/factories" className="underline">Back to factories</a></p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />

      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/factories">Factories</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{factory ? `${factory.name} (${factory.abbreviation})` : 'Factory'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="h-6 w-px bg-border" />
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <FactoryIcon className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
                {factory ? `${factory.name} (${factory.abbreviation})` : 'Factory'}
              </h1>
            </div>
            {factory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="border-border"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Factory
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-background">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-brand-primary mb-4" />
              <p className="text-muted-foreground">Loading factory...</p>
            </div>
          ) : error || !factory ? (
            <Card className="shadow-sm bg-card border-border">
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-destructive mb-4">Factory not found.</p>
                  <Button onClick={() => navigate('/factories')} variant="outline">
                    Back to Factories
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats - left/top */}
              <div className="lg:col-span-1 space-y-3">
                <Card className="shadow-sm bg-card border-border">
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                        <Layers className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">{sections.length}</p>
                        <p className="text-xs text-muted-foreground">Sections</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-card-foreground">—</p>
                        <p className="text-xs text-muted-foreground">Machines (placeholder)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Factory Details - compact */}
              <Card className="shadow-sm bg-card border-border lg:col-span-2">
                <CardHeader className="py-4">
                  <CardTitle className="text-card-foreground text-base">Factory Details</CardTitle>
                  <CardDescription className="text-xs">Basic information.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground font-medium">ID</dt>
                      <dd className="mt-0.5 font-mono">{factory.id}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground font-medium">Name</dt>
                      <dd className="mt-0.5">{factory.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground font-medium">Abbreviation</dt>
                      <dd className="mt-0.5">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                          {factory.abbreviation}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Factory Sections */}
              <Card className="shadow-sm bg-card border-border lg:col-span-3">
                <CardContent className="p-0">
                  <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-muted-foreground shrink-0">
                      <span className="font-medium">{filteredSections.length} {filteredSections.length === 1 ? 'section' : 'sections'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-[180px] min-w-[140px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          type="text"
                          placeholder="Search sections..."
                          value={sectionSearchQuery}
                          onChange={(e) => setSectionSearchQuery(e.target.value)}
                          className="pl-10 h-9"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="h-9 bg-brand-primary hover:bg-brand-primary-hover"
                        onClick={() => setIsAddSectionDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Section
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    {filteredSections.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
                        <Layers className="h-10 w-10 mb-3 opacity-50" />
                        <p>{sectionSearchQuery ? 'No sections match your search.' : 'No sections yet. Add your first section.'}</p>
                        {!sectionSearchQuery && (
                          <Button
                            size="sm"
                            className="mt-3 bg-brand-primary hover:bg-brand-primary-hover"
                            onClick={() => setIsAddSectionDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Section
                          </Button>
                        )}
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {filteredSections.map((section) => (
                          <li
                            key={section.id}
                            className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                            onClick={() => navigate(`/factories/${factoryId}/sections/${section.id}`)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                                <Layers className="h-4 w-4 text-brand-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-card-foreground truncate">{section.name}</p>
                                <p className="text-xs text-muted-foreground">ID #{section.id}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-primary transition-colors flex-shrink-0" />
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-brand-primary hover:bg-brand-primary/10"
                                      onClick={() => handleEditSection(section)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit section</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteSection(section)}
                                      disabled={isDeletingSection}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Deactivate section</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <EditFactoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        factory={factory ?? null}
        factories={allFactories}
      />
      <AddFactorySectionDialog
        open={isAddSectionDialogOpen}
        onOpenChange={setIsAddSectionDialogOpen}
        factoryId={factoryId}
        sections={sections}
      />
      <EditFactorySectionDialog
        open={isEditSectionDialogOpen}
        onOpenChange={handleEditSectionDialogClose}
        section={editingSection}
        sections={sections}
      />
    </div>
  );
};

export default FactoryDetailPage;
