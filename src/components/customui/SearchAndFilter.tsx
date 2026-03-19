import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  fetchFactories,
  fetchFactorySections,
  fetchDepartments,
} from "@/services/FactoriesService";
import { fetchAllMachines } from "@/services/MachineServices";
import { fetchStatuses } from "@/services/StatusesService";
import { getOrderTypes } from "@/services/OrderWorkflowService";
import { Factory, FactorySection, Machine } from "@/types";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FilterOption {
  type: string;
  label?: string | string[];
  placeholder?: string;
}

interface SearchAndFilterProps {
  filterConfig?: FilterOption[];
  onFiltersChange?: (filters: FilterState) => void;
}

interface FilterState {
  searchType: "id" | "date";
  searchQuery: string;
  reqNumQuery: string;
  selectedDate: Date | undefined;
  dateFilterType: 1 | 2 | 3;
  factory: Factory | null;
  factorySection: FactorySection | null;
  machine: Machine | null;
  departmentId: number;
  statusId: number;
  orderType: string;
  partIdQuery: string;
  partNameQuery: string;
}

interface DropdownOption {
  id: number;
  name: string;
}

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

interface FilterDropdownProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled = false,
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Select
      value={value.toString()}
      onValueChange={(val) => onValueChange(Number(val))}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue>
          {options.find(opt => opt.id === value)?.name || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="-1">All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id.toString()}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

interface SearchTypeToggleProps {
  searchType: "id" | "date";
  onSearchTypeChange: (type: "id" | "date") => void;
  showId: boolean;
  showDate: boolean;
}

const SearchTypeToggle: React.FC<SearchTypeToggleProps> = ({
  searchType,
  onSearchTypeChange,
  showId,
  showDate,
}) => (
  <div className="flex gap-2">
    {showId && (
      <Button
        variant={searchType === "id" ? "default" : "outline"}
        onClick={() => onSearchTypeChange("id")}
        className="flex-1"
      >
        Search by ID
      </Button>
    )}
    {showDate && (
      <Button
        variant={searchType === "date" ? "default" : "outline"}
        onClick={() => onSearchTypeChange("date")}
        className="flex-1"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        Search by Date
      </Button>
    )}
  </div>
);

interface DateFilterProps {
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  dateFilterType: 1 | 2 | 3;
  onDateFilterTypeChange: (type: 1 | 2 | 3) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({
  selectedDate,
  onDateChange,
  dateFilterType,
  onDateFilterTypeChange,
}) => (
  <div className="space-y-4">
    <Label>Select Date</Label>
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateChange}
      className="rounded-md border"
    />
    
    <div className="flex gap-2">
      {[
        { value: 1, label: "On" },
        { value: 2, label: "Before" },
        { value: 3, label: "After" }
      ].map(({ value, label }) => (
        <Button
          key={value}
          variant={dateFilterType === value ? "default" : "outline"}
          onClick={() => onDateFilterTypeChange(value as 1 | 2 | 3)}
          className="flex-1"
        >
          {label}
        </Button>
      ))}
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filterConfig = [],
  onFiltersChange,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [filters, setFilters] = useState<FilterState>(() => ({
    searchType: (searchParams.get("searchType") as "id" | "date") || "id",
    searchQuery: searchParams.get("query") || "",
    reqNumQuery: searchParams.get("reqNum") || "",
    selectedDate: searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined,
    dateFilterType: (searchParams.get("dateFilterType") ? Number(searchParams.get("dateFilterType")) : 1) as 1 | 2 | 3,
    factory: null,
    factorySection: null,
    machine: null,
    departmentId: searchParams.get("department") ? Number(searchParams.get("department")) : -1,
    statusId: searchParams.get("status") ? Number(searchParams.get("status")) : -1,
    orderType: searchParams.get("orderType") || "all",
    partIdQuery: searchParams.get("partId") || "",
    partNameQuery: searchParams.get("partName") || "",
  }));

  // Data states
  const [factories, setFactories] = useState<Factory[]>([]);
  const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [departments, setDepartments] = useState<DropdownOption[]>([]);
  const [statuses, setStatuses] = useState<DropdownOption[]>([]);
  const [orderTypes, setOrderTypes] = useState<{ type: string }[]>([]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const shouldShowFilter = (type: string) => {
    return !filterConfig.length || filterConfig.some((filter) => filter.type === type);
  };

  const getFilterLabel = (type: string, index = 0): string => {
    const filter = filterConfig.find(f => f.type === type);
    if (!filter) return `Enter ${type}`;
    
    if (filter.placeholder) return filter.placeholder;
    
    if (Array.isArray(filter.label)) {
      return filter.label[index] ?? filter.label[0] ?? `Enter ${type}`;
    }
    
    return filter.label ?? `Enter ${type}`;
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [factoriesData, departmentsData, statusesData, orderTypesData] = await Promise.all([
          fetchFactories(),
          fetchDepartments(),
          fetchStatuses(),
          getOrderTypes(),
        ]);
        
        setFactories(factoriesData);
        setDepartments(departmentsData);
        setStatuses(statusesData);
        setOrderTypes(orderTypesData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  // Load factory sections when factory changes
  useEffect(() => {
    if (filters.factory) {
      const fetchSections = async () => {
        try {
          const sections = await fetchFactorySections(filters.factory!.id);
          setFactorySections(sections);
          
          // Reset dependent selections
          setFilters(prev => ({
            ...prev,
            factorySection: null,
            machine: null,
          }));
        } catch (error) {
          console.error("Failed to fetch factory sections:", error);
        }
      };
      fetchSections();
    } else {
      setFactorySections([]);
    }
  }, [filters.factory]);

  // Load machines when factory section changes
  useEffect(() => {
    if (filters.factorySection) {
      const fetchMachines = async () => {
        try {
          const machinesData = await fetchAllMachines(filters.factorySection!.id);
          setMachines(machinesData);
          
          // Reset machine selection
          setFilters(prev => ({ ...prev, machine: null }));
        } catch (error) {
          console.error("Failed to fetch machines:", error);
        }
      };
      fetchMachines();
    } else {
      setMachines([]);
    }
  }, [filters.factorySection]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const updateFilters = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const handleSearchTypeChange = (type: "id" | "date") => {
    updateFilters({
      searchType: type,
      selectedDate: type === "id" ? undefined : filters.selectedDate,
      searchQuery: type === "date" ? "" : filters.searchQuery,
      reqNumQuery: type === "date" ? "" : filters.reqNumQuery,
    });
  };

  const handleFactoryChange = (factoryId: string) => {
    const factory = factories.find(f => f.id.toString() === factoryId) || null;
    updateFilters({ factory });
  };

  const handleFactorySectionChange = (sectionId: string) => {
    const section = factorySections.find(s => s.id.toString() === sectionId) || null;
    updateFilters({ factorySection: section });
  };

  const handleMachineChange = (machineId: string) => {
    const machine = machines.find(m => m.id.toString() === machineId) || null;
    updateFilters({ machine });
  };

  const handleApplyFilters = () => {
    // Start from current URL params to avoid wiping unrelated state (e.g., factory/section/machine on other pages)
    const params = new URLSearchParams(searchParams);

    // Add all filter values to URL params
    if (filters.factory) params.set("factory", filters.factory.id.toString());
    if (filters.factorySection) params.set("section", filters.factorySection.id.toString());
    if (filters.machine) params.set("machine", filters.machine.id.toString());
    if (filters.departmentId !== -1) params.set("department", filters.departmentId.toString());
    if (filters.statusId !== -1) params.set("status", filters.statusId.toString());
    if (filters.searchQuery) params.set("query", filters.searchQuery);
    if (filters.reqNumQuery) params.set("reqNum", filters.reqNumQuery);
    if (filters.partIdQuery) params.set("partId", filters.partIdQuery);
    if (filters.partNameQuery) params.set("partName", filters.partNameQuery);
    if (filters.selectedDate) params.set("date", filters.selectedDate.toISOString());
    if (filters.dateFilterType !== 1) params.set("dateFilterType", filters.dateFilterType.toString());
    if (filters.orderType !== "all") params.set("orderType", filters.orderType);
    
    params.set("searchType", filters.searchType);

    setSearchParams(params);
    
    // Notify parent component if callback provided
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
    
    setIsOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      searchType: "id",
      searchQuery: "",
      reqNumQuery: "",
      selectedDate: undefined,
      dateFilterType: 1,
      factory: null,
      factorySection: null,
      machine: null,
      departmentId: -1,
      statusId: -1,
      orderType: "all",
      partIdQuery: "",
      partNameQuery: "",
    };

    setFilters(resetFilters);
    setSearchParams(new URLSearchParams());
    
    if (onFiltersChange) {
      onFiltersChange(resetFilters);
    }
  };

  // ============================================================================
  // MEMOIZED VALUES
  // ============================================================================

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery ||
      filters.reqNumQuery ||
      filters.selectedDate ||
      filters.factory ||
      filters.factorySection ||
      filters.machine ||
      filters.departmentId !== -1 ||
      filters.statusId !== -1 ||
      filters.orderType !== "all" ||
      filters.partIdQuery ||
      filters.partNameQuery
    );
  }, [filters]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className={hasActiveFilters ? "bg-amber-100 text-yellow-800 hover:bg-yellow-200" : ""}
        >
          <Filter className="mr-2 h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Search & Filters</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent className="h-full overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Search & Filter Orders
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
          <SheetDescription>
            Use the filters below to search for orders.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-6 px-2">
          {/* Search Type Toggle */}
          {(shouldShowFilter("id") || shouldShowFilter("date")) && (
            <SearchTypeToggle
              searchType={filters.searchType}
              onSearchTypeChange={handleSearchTypeChange}
              showId={shouldShowFilter("id")}
              showDate={shouldShowFilter("date")}
            />
          )}

          {/* ID & Requisition Number Search */}
          {shouldShowFilter("id") && filters.searchType === "id" && (
            <div className="space-y-3">
              <Input
                type="search"
                placeholder={getFilterLabel("id")}
                value={filters.searchQuery}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              />
              <Input
                type="search"
                placeholder={getFilterLabel("id", 1)}
                value={filters.reqNumQuery}
                onChange={(e) => updateFilters({ reqNumQuery: e.target.value })}
              />
            </div>
          )}

          {/* Date Filter */}
          {shouldShowFilter("date") && filters.searchType === "date" && (
            <DateFilter
              selectedDate={filters.selectedDate}
              onDateChange={(date) => updateFilters({ selectedDate: date })}
              dateFilterType={filters.dateFilterType}
              onDateFilterTypeChange={(type) => updateFilters({ dateFilterType: type })}
            />
          )}

          {/* Factory Selection */}
          {shouldShowFilter("factory") && (
            <div className="space-y-2">
              <Label>Factory</Label>
              <Select
                value={filters.factory?.id.toString() || "-1"}
                onValueChange={handleFactoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Factory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">All Factories</SelectItem>
                  {factories.map((factory) => (
                    <SelectItem key={factory.id} value={factory.id.toString()}>
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Factory Section Selection */}
          {shouldShowFilter("factorySection") && (
            <div className="space-y-2">
              <Label>Factory Section</Label>
              <Select
                value={filters.factorySection?.id.toString() || "-1"}
                onValueChange={handleFactorySectionChange}
                disabled={!filters.factory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">All Sections</SelectItem>
                  {factorySections.map((section) => (
                    <SelectItem key={section.id} value={section.id.toString()}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Machine Selection */}
          {shouldShowFilter("machine") && (
            <div className="space-y-2">
              <Label>Machine</Label>
              <Select
                value={filters.machine?.id.toString() || "-1"}
                onValueChange={handleMachineChange}
                disabled={!filters.factorySection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Machine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">All Machines</SelectItem>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id.toString()}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department & Status Dropdowns */}
          {shouldShowFilter("department") && (
            <FilterDropdown
              label="Department"
              value={filters.departmentId}
              onValueChange={(value) => updateFilters({ departmentId: value })}
              options={departments}
              placeholder="Select Department"
            />
          )}

          {shouldShowFilter("status") && (
            <FilterDropdown
              label="Status"
              value={filters.statusId}
              onValueChange={(value) => updateFilters({ statusId: value })}
              options={statuses}
              placeholder="Select Status"
            />
          )}

          {/* Order Type Toggle */}
          {shouldShowFilter("orderType") && (
            <div className="space-y-2">
              <Label>Order Type</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={filters.orderType === "all" ? "default" : "outline"}
                  onClick={() => updateFilters({ orderType: "all" })}
                  className="px-2"
                >
                  All
                </Button>
                {orderTypes.map((orderType) => (
                  <Button
                    size="sm"
                    key={orderType.type}
                    variant={filters.orderType === orderType.type ? "default" : "outline"}
                    onClick={() => updateFilters({ orderType: orderType.type })}
                    className="px-2"
                  >
                    {orderType.type}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Part Filters */}
          {shouldShowFilter("partId") && (
            <Input
              type="search"
              placeholder={getFilterLabel("partId")}
              value={filters.partIdQuery}
              onChange={(e) => updateFilters({ partIdQuery: e.target.value })}
            />
          )}

          {shouldShowFilter("partName") && (
            <Input
              type="search"
              placeholder={getFilterLabel("partName")}
              value={filters.partNameQuery}
              onChange={(e) => updateFilters({ partNameQuery: e.target.value })}
            />
          )}
        </div>

        <SheetFooter className="flex justify-between">
          <Button onClick={handleResetFilters} type="button" variant="outline">
            Reset Filters
          </Button>
          <Button onClick={handleApplyFilters} type="submit" className="bg-blue-950 text-white">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SearchAndFilter;
