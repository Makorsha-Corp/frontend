import React, { useState } from 'react';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGetItemsQuery, useDeleteItemMutation } from '@/features/items/itemsApi';
import { useGetTagsQuery } from '@/features/items/itemTagsApi';
import { Item } from '@/types/item';
import { Search, Plus, Loader2, Eye, Pencil, Filter, X, Trash2, Package2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import ItemTagBadge from '@/components/newcomponents/customui/ItemTagBadge';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';
import EditItemDialog from '@/components/newcomponents/customui/EditItemDialog';
import toast, { Toaster } from 'react-hot-toast';

const ItemsPage: React.FC = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('');
  const [filterTagId, setFilterTagId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const itemsPerPage = 20;
  const skip = (currentPage - 1) * itemsPerPage;

  // Fetch tags for filtering
  const { data: tags } = useGetTagsQuery();
  const [deleteItem] = useDeleteItemMutation();

  // Fetch items using RTK Query
  const { data: allItems, isLoading, error } = useGetItemsQuery({
    skip: 0,
    limit: 100,
    search: searchQuery || undefined,
  });

  // Client-side filtering for tags and units
  const filteredItems = React.useMemo(() => {
    if (!allItems) return [];

    let result = [...allItems];

    // Filter by unit
    if (filterUnit) {
      result = result.filter((item) => item.unit === filterUnit);
    }

    // Filter by tag
    if (filterTagId) {
      result = result.filter((item) =>
        item.tags?.some((tag) => tag.id === parseInt(filterTagId))
      );
    }

    return result;
  }, [allItems, filterUnit, filterTagId]);

  // Paginate filtered items
  const items = filteredItems.slice(skip, skip + itemsPerPage);
  const totalItems = filteredItems.length;

  // Get unique units from items for filter dropdown
  const uniqueUnits = React.useMemo(() => {
    if (!allItems) return [];
    const units = new Set(allItems.map((item) => item.unit));
    return Array.from(units).sort();
  }, [allItems]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterUnit('');
    setFilterTagId('');
    setCurrentPage(1);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setIsEditDialogOpen(true);
  };

  const handleView = (item: Item) => {
    // For now, just show the details in a toast
    toast.success(`Viewing item: ${item.name}`, {
      duration: 3000,
    });
  };

  const handleDelete = async (item: Item) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This will set it as inactive.`)) {
      return;
    }

    try {
      await deleteItem(item.id).unwrap();
      toast.success(`Item "${item.name}" has been marked as inactive`);
    } catch (error: any) {
      console.error('Failed to delete item:', error);
      toast.error(error?.data?.detail || 'Failed to delete item');
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const hasActiveFilters = searchQuery || filterUnit || filterTagId;

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" />
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Bar */}
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Package2 className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">Items Catalog</h1>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-brand-primary hover:bg-brand-primary-hover shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 bg-background">
          <Card className="shadow-sm bg-card border-border">
            <CardContent className="p-0">
              {/* Table header bar: search + filters (expandable when cramped) */}
              <div className="border-b border-border px-4 py-3">
                <Collapsible defaultOpen={true}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Left: count */}
                    <div className="text-sm text-muted-foreground shrink-0">
                      {!isLoading && (
                        <span className="font-medium">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                      )}
                    </div>
                    {/* Right: search + filters */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <div className="relative w-[180px] min-w-[140px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          type="text"
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 h-9"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="text-muted-foreground flex-shrink-0" size={16} />
                        <CollapsibleTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 gap-1 shrink-0 group">
                            Filters
                            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent asChild>
                        <div className="flex items-center gap-2 flex-wrap basis-full md:basis-auto md:flex-initial justify-end">
                          <Select value={filterUnit || 'all'} onValueChange={(value) => setFilterUnit(value === 'all' ? '' : value)}>
                            <SelectTrigger className="w-[140px] h-9">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All units</SelectItem>
                              {uniqueUnits.map((unit) => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {tags && tags.length > 0 && (
                            <Select value={filterTagId || 'all'} onValueChange={(value) => setFilterTagId(value === 'all' ? '' : value)}>
                              <SelectTrigger className="w-[160px] h-9">
                                {filterTagId && filterTagId !== 'all' ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tags.find(t => t.id.toString() === filterTagId)?.color || '#9067c6' }} />
                                    <span className="truncate">{tags.find(t => t.id.toString() === filterTagId)?.name}</span>
                                  </div>
                                ) : (
                                  <SelectValue placeholder="Tag" />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All tags</SelectItem>
                                {tags.map((tag) => (
                                  <SelectItem key={tag.id} value={tag.id.toString()}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color || '#9067c6' }} />
                                      {tag.icon && <span>{tag.icon}</span>}
                                      <span>{tag.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground hover:text-destructive">
                              <X className="h-4 w-4 mr-1" /> Clear
                            </Button>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </div>
                </Collapsible>
              </div>

              <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading items...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-destructive">Failed to load items. Please try again.</p>
                </div>
              ) : !items || items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-primary/10 rounded-full mb-4">
                    <Package2 className="h-10 w-10 text-brand-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    No Items Found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery 
                      ? 'No items match your search. Try a different query.'
                      : 'Get started by adding your first item to the catalog.'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-brand-primary hover:bg-brand-primary-hover shadow-sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Item
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-brand-primary/5 dark:bg-brand-primary/10 border-b border-border">
                          <TableHead className="w-[80px] py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</TableHead>
                          <TableHead className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</TableHead>
                          <TableHead className="w-[120px] py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit</TableHead>
                          <TableHead className="py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</TableHead>
                          <TableHead className="w-[180px] py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</TableHead>
                          <TableHead className="text-right w-[150px] py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id} className="hover:bg-brand-primary/10 dark:hover:bg-brand-primary/15 transition-colors border-b border-border last:border-b-0">
                            <td className="font-mono text-sm text-muted-foreground py-4 px-4">{item.id}</td>
                            <td className="font-semibold text-card-foreground py-4 text-sm max-w-[250px] truncate">{item.name}</td>
                            <td className="py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
                                {item.unit}
                              </span>
                            </td>
                            <td className="text-sm text-muted-foreground max-w-xs truncate py-4">
                              {item.description || <span className="text-muted-foreground/50">—</span>}
                            </td>
                          <td className="py-4">
                            <TooltipProvider>
                              {item.tags && item.tags.length > 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 cursor-pointer flex-wrap">
                                      {item.tags.map((tag) => (
                                        <div
                                          key={tag.id}
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: tag.color || '#9067c6' }}
                                        />
                                      ))}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <div className="space-y-1">
                                      {item.tags.map((tag) => (
                                        <div key={tag.id} className="flex items-center gap-2">
                                          <div
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: tag.color || '#9067c6' }}
                                          />
                                          <span className="text-sm">{tag.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-xs text-muted-foreground/50">No tags</span>
                              )}
                            </TooltipProvider>
                          </td>
                            <td className="text-right py-4 px-4">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(item)}
                                  className="h-8 w-8 p-0 text-brand-primary hover:text-brand-primary-hover hover:bg-brand-primary/10 transition-colors"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                  className="h-8 w-8 p-0 text-brand-primary hover:text-brand-primary-hover hover:bg-brand-primary/10 transition-colors"
                                  title="Edit item"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10 transition-colors"
                                  title="Delete item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                      <p className="text-sm text-muted-foreground font-medium">
                        Showing <span className="text-brand-primary">{skip + 1}</span> to <span className="text-brand-primary">{Math.min(skip + itemsPerPage, totalItems)}</span> of <span className="text-brand-primary">{totalItems}</span> items
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="h-9 px-3 disabled:opacity-50"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-md">
                          <span className="text-sm font-medium text-brand-primary">
                            {currentPage}
                          </span>
                          <span className="text-sm text-muted-foreground">of</span>
                          <span className="text-sm text-foreground">
                            {totalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="h-9 px-3 disabled:opacity-50"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AddItemDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <EditItemDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} item={selectedItem} />
    </div>
  );
};

export default ItemsPage;
