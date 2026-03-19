// MachinePage.tsx
import { useCallback, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchFactories, fetchFactorySections, fetchAllFactorySections } from "@/services/FactoriesService";
import { fetchMachineParts, manualAddMachinePart } from "@/services/MachinePartsService";
import { fetchMachineById, fetchAllMachines } from "@/services/MachineServices";
import { fetchAllParts, searchPartsByName } from "@/services/PartsService";
import toast from "react-hot-toast";
import { Loader2, Plus } from "lucide-react";
import MachinePartsTable from "@/components/customui/MachinePartsTable";
import NavigationBar from "@/components/customui/NavigationBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Machine, MachinePart, Part } from "@/types";
import MachineStatus from "@/components/customui/MachineStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AllMachinesStatus from "@/components/customui/AllMachineStatus";
import RunningOrders from "@/components/customui/RunningOrders";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AsyncSelect from 'react-select/async';
import { useAuth } from "@/context/AuthContext";

const MachinePartsPage = () => {
  // RBAC
  const { hasFeatureAccess, profile } = useAuth();
  const canMachineInstantAdd = hasFeatureAccess("machine_instant_add");

  const [searchParams, setSearchParams] = useSearchParams();
  const [MachineParts, setMachineParts] = useState<MachinePart[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [machineDetailsLoading, setMachineDetailsLoading] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [factories, setFactories] = useState<{ id: number; name: string }[]>([]);
  const [factorySections, setFactorySections] = useState<{ id: number; name: string }[]>([]);
  const [allSections, setAllSections] = useState<{ id: number; name: string; factory_id: number }[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineList, setMachineList] = useState<{ id: number; name: string }[]>([]);
  
  // Add loading states for better UX
  const [machinesLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [factoryLoading, setFactoryLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState<"factory" | "section" | null>(null);

  // Add Part dialog state
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | undefined>();
  const [addPartCurrentQty, setAddPartCurrentQty] = useState<string>("");
  const [addPartRequiredQty, setAddPartRequiredQty] = useState<string>("");
  const [addPartAveragePrice, setAddPartAveragePrice] = useState<string>("");
  const [addPartNote, setAddPartNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  
  // Initialize state from URL parameters
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | undefined>(() => {
    const factoryParam = searchParams.get('factory');
    return factoryParam ? Number(factoryParam) : undefined;
  });
  const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number | undefined>(() => {
    const sectionParam = searchParams.get('section');
    return sectionParam ? Number(sectionParam) : undefined;
  });
  const [selectedMachineId, setSelectedMachineId] = useState<number | undefined>(() => {
    const machineParam = searchParams.get('machine');
    return machineParam ? Number(machineParam) : undefined;
  });
  
  const [selectedMachine, setSelectedMachine] = useState<Machine>();

  // Cache removed per updated requirements
  
  // Memoize sorted machine list to prevent unnecessary re-sorting
  const sortedMachineList = useMemo(() => {
    return [...machineList].sort((a, b) => a.id - b.id);
  }, [machineList]);
  
  // Reserve 'machines' for future enriched data; keep dependency to avoid linter warnings
  useEffect(() => {
    // no-op: machines will be enriched and used in future updates
  }, [machines]);
  
  // Build machine list from preloaded machines
  const loadMachines = useCallback((factorySectionId: number | undefined) => {
    if (factorySectionId !== undefined && factorySectionId !== -1) {
      const list = machines
        .filter((m) => m.factory_section_id === factorySectionId)
        .map((m) => ({ id: m.id, name: m.name }));
      setMachineList(list);
      if (!searchParams.get('machine')) {
        setSelectedMachineId(undefined);
      }
    } else {
      setMachineList([]);
      if (!searchParams.get('machine')) {
        setSelectedMachineId(undefined);
      }
    }
  }, [machines, searchParams]);
  
  // Update URL parameters when selections change
  const updateUrlParams = useCallback((factory?: number, section?: number, machine?: number) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      
      if (factory !== undefined) {
        newParams.set('factory', factory.toString());
      } else {
        newParams.delete('factory');
      }
      
      if (section !== undefined) {
        newParams.set('section', section.toString());
      } else {
        newParams.delete('section');
      }
      
      if (machine !== undefined) {
        newParams.set('machine', machine.toString());
      } else {
        newParams.delete('machine');
      }
      
      return newParams;
    });
  }, [setSearchParams]);

  
  const refreshComponents = useCallback(async () => {
    if (!selectedMachineId) return;

    try {
      setMachineDetailsLoading(true);
      setPartsLoading(true);

      // Fetch the machine details and parts in parallel
      const [machine, fetchedParts] = await Promise.all([
        fetchMachineById(selectedMachineId),
        fetchMachineParts(
          selectedMachineId,
          filters.partIdQuery || undefined,
          filters.partNameQuery || undefined
        )
      ]);

      // Set the machine details
      setSelectedMachine(machine ?? undefined);

      // Process and set the parts
      const processedParts = fetchedParts.map((record: any) => ({
        id: record.id,
        machine_id: record.machine_id,
        part_id: record.parts.id,
        qty: record.qty,
        req_qty: record.req_qty ?? -1,
        defective_qty: record.defective_qty ?? 0,
        parts: record.parts,
        machines: record.machines,
      }));

      setMachineParts(processedParts);

    } catch (error) {
      toast.error("Failed to refresh components");
      setMachineParts([]); // Clear parts on error
    } finally {
      setMachineDetailsLoading(false);
      setPartsLoading(false);
    }
  }, [selectedMachineId, filters]);

  // Handle initial URL parameter loading
  useEffect(() => {
    const factoryParam = searchParams.get('factory');
    if (factoryParam && factories.length > 0) {
      const factoryId = Number(factoryParam);
      if (factories.some(f => f.id === factoryId)) {
        setSelectedFactoryId(factoryId);
      }
    }
  }, [searchParams, factories]);

  // Clear overview loaders when relevant data is ready (handled in effects below)

  // Load sections when factory is selected from URL
  useEffect(() => {
    const loadSectionsFromUrl = async () => {
      const sectionParam = searchParams.get('section');
      if (selectedFactoryId && sectionParam) {
        try {
          let sections: { id: number; name: string }[] = [];
          if (allSections.length > 0) {
            sections = allSections.filter(s => s.factory_id === selectedFactoryId).map(s => ({ id: s.id, name: s.name }));
          } else {
            const fetched = await fetchFactorySections(selectedFactoryId);
            sections = fetched;
          }
          setFactorySections(sections);
          
          const sectionId = Number(sectionParam);
          if (sections.some(s => s.id === sectionId)) {
            setSelectedFactorySectionId(sectionId);
          }
        } catch (error) {
          console.error("Failed to load factory sections from URL");
        }
      }
    };
    loadSectionsFromUrl();
  }, [selectedFactoryId, searchParams, allSections]);

  // Load machines when section is selected from URL
  useEffect(() => {
    const loadMachinesFromUrl = async () => {
      const machineParam = searchParams.get('machine');
      if (selectedFactorySectionId && machineParam) {
        try {
          // Build from preloaded machines
          const machinesList = machines
            .filter((m) => m.factory_section_id === selectedFactorySectionId)
            .map((m) => ({ id: m.id, name: m.name }));
          setMachineList(machinesList);
          
          const machineId = Number(machineParam);
          if (machinesList.some(m => m.id === machineId)) {
            setSelectedMachineId(machineId);
          }
        } catch (error) {
          console.error("Failed to load machines from URL");
        }
      }
    };
    loadMachinesFromUrl();
  }, [selectedFactorySectionId, searchParams, machines]);

  // Load machine details when selectedMachineId changes
  useEffect(() => {
    const loadMachineData = async () => {
      if (!selectedMachineId) {
        setSelectedMachine(undefined);
        return;
      }

      // Only fetch if we don't already have the machine or if it's a different machine
      if (!selectedMachine || selectedMachine.id !== selectedMachineId) {
        try {
          const machine = await fetchMachineById(selectedMachineId);
          if (machine) {
            setSelectedMachine(machine);
          }
        } catch (error) {
          console.error("Error fetching machine:", error);
          setSelectedMachine(undefined);
        }
      }
    };

    loadMachineData();
  }, [selectedMachineId, selectedMachine]);

  useEffect(() => {
    // Preload factories, sections, machines, and parts on mount
    const preloadAll = async () => {
      try {
        const [fetchedFactories, fetchedSections, fetchedMachines, fetchedParts] = await Promise.all([
          fetchFactories(),
          fetchAllFactorySections(),
          fetchAllMachines(),
          fetchAllParts(),
        ]);
        setFactories(fetchedFactories);
        setAllSections(fetchedSections as { id: number; name: string; factory_id: number }[]);
        setMachines(fetchedMachines);
        setAllParts(fetchedParts || []);
      } catch (error) {
        toast.error("Failed to preload data");
      }
    };
    preloadAll();
  }, []);

  useEffect(() => {
    // Filter sections client-side when a factory is selected
    if (selectedFactoryId === undefined) {
      setFactorySections([]);
      setSectionsLoading(false);
      if (!searchParams.get('section')) {
        setSelectedFactorySectionId(undefined);
      }
      return;
    }
    const filtered = allSections
      .filter((s) => s.factory_id === selectedFactoryId)
      .map((s) => ({ id: s.id, name: s.name }));
    setFactorySections(filtered);
    // sections ready; clear factory overview loader
    if (overviewLoading === "factory") setOverviewLoading(null);
  }, [selectedFactoryId, searchParams, allSections]);

  useEffect(() => {
    // Recompute machine list client-side when section changes
    loadMachines(selectedFactorySectionId);
    // machine list ready; clear section overview loader
    if (overviewLoading === "section") setOverviewLoading(null);
  }, [selectedFactorySectionId, loadMachines]);

  useEffect(() => {
    const loadParts = async () => {
      if (selectedMachineId === undefined) {
        setMachineParts([]);
        setPartsLoading(false);
        return;
      }

      setPartsLoading(true);
      try {
        const fetchedParts = await fetchMachineParts(
          selectedMachineId,
          filters.partIdQuery || undefined,
          filters.partNameQuery || undefined
        );

        const processedParts = fetchedParts.map((record: any) => ({
          id: record.id,
          machine_id: record.machine_id,
          part_id: record.parts.id,
          qty: record.qty,
          req_qty: record.req_qty ?? -1,
          defective_qty: record.defective_qty ?? 0,
          parts: record.parts,
          machines: record.machines,
        }));

        setMachineParts(processedParts);
      } catch (error) {
        console.error("Failed to fetch parts:", error);
        toast.error("Failed to fetch parts");
        setMachineParts([]); // Only clear on error
      } finally {
        setPartsLoading(false);
      }
    };
    
    loadParts();
  }, [selectedMachineId, filters]);

  // New function to handle machine selection

  const handleRowSelection = (factoryId: number, factorySectionId: number, machineId: number) => {
    setSelectedFactoryId(factoryId);
    setSelectedFactorySectionId(factorySectionId);
    setSelectedMachineId(machineId);
    updateUrlParams(factoryId, factorySectionId, machineId);
  };

  const handleSelectMachine = async (value: string) => {
    const machineId = value == "" ? undefined : Number(value);
    setSelectedMachineId(machineId);
    updateUrlParams(selectedFactoryId, selectedFactorySectionId, machineId);
  };

  // Add Part handlers
  const resetAddPartDialog = () => {
    setSelectedPart(undefined);
    setAddPartCurrentQty("");
    setAddPartRequiredQty("");
    setAddPartAveragePrice("");
    setAddPartNote("");
    setIsAddPartDialogOpen(false);
  };

  const handleAddPartToMachine = async () => {
    if (!profile) {
      toast.error("Error: could not find profile info");
      return;
    }

    if (!selectedPart || !addPartCurrentQty || !selectedMachineId || !selectedFactoryId) {
      toast.error("Please select a part and enter current quantity");
      return;
    }

    if (!addPartAveragePrice) {
      toast.error("Average price is required");
      return;
    }

    const currentQtyNum = Number(addPartCurrentQty);
    const requiredQtyNum = Number(addPartRequiredQty);
    const avgPriceNum = Number(addPartAveragePrice);

    if (Number.isNaN(currentQtyNum) || currentQtyNum <= 0) {
      toast.error("Current quantity must be greater than 0");
      return;
    }

    if (Number.isNaN(avgPriceNum) || avgPriceNum <= 0) {
      toast.error("Average price must be greater than 0");
      return;
    }

    if (addPartRequiredQty && (Number.isNaN(requiredQtyNum) || requiredQtyNum < 0)) {
      toast.error("Required quantity must be 0 or greater");
      return;
    }

    setIsSubmitting(true);
    try {
      // Call manualAddMachinePart and check the result
      const result = await manualAddMachinePart(
        selectedMachineId,
        selectedPart.id,
        currentQtyNum,
        selectedFactoryId,
        profile.id,
        avgPriceNum,
        requiredQtyNum || 0,
        0, // defective_qty defaults to 0
        addPartNote || null
      );
      
      // Check if the addition was successful
      if (!result || !result.success) {
        // Error toast already shown in the service function
        return;
      }

      // Success - reset and refresh
      resetAddPartDialog();
      await refreshComponents();
    } catch (error) {
      console.error("Error adding part:", error);
      toast.error("Failed to add part to machine");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create default options for AsyncSelect - sorted alphabetically
  const allPartOptions = allParts
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((part) => ({
      value: part,
      label: `${part.name} (${part.unit || 'units'})`,
    }));

  return (
    <>
      <NavigationBar />
      <div className="flex w-full flex-col bg-muted/40">
        <main className="mt-2 p-4 sm:px-6 sm:py-0">
          {/* Container for selections, machine status, and running orders */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 h-full">

            {/* Selections Section */}
            <div className="flex-none min-w-72 max-w-96 w-1/6"> {/* Roughly 1/6th of the width */}
              <Card className="mb-4 h-full">
                <CardHeader>
                  <CardTitle>Machine Details</CardTitle>
                </CardHeader>

                <CardContent>
                  {/* Factory Selection Dropdown */}
                  <div className="mb-4">
                    <Label className="mb-2">Select Factory</Label>
                    <Select
                      value={selectedFactoryId === undefined ? "" : selectedFactoryId.toString()}
                      onValueChange={async (value) => {
                        const factoryId = value === "" ? undefined : Number(value);
                        setFactoryLoading(true);
                        setOverviewLoading(factoryId ? "factory" : null);
                        setSelectedFactoryId(factoryId);
                        setSelectedFactorySectionId(undefined);
                        setSelectedMachineId(undefined);
                        // clear any dependent data
                        setSelectedMachine(undefined);
                        updateUrlParams(factoryId, undefined, undefined);
                        setFactoryLoading(false);
                      }}
                      disabled={factoryLoading}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue>
                          {factoryLoading 
                            ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</div>
                            : selectedFactoryId === undefined
                              ? "Select a Factory"
                              : factories.find((f) => f.id === selectedFactoryId)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {factories.map((factory) => (
                          <SelectItem key={factory.id} value={factory.id.toString()}>
                            {factory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Factory Section Selection Dropdown */}
                 
                    <div className="mb-4">
                      <Label className="mb-2">Select Factory Section</Label>
                      <Select
                        value={selectedFactorySectionId === undefined ? "" : selectedFactorySectionId.toString()}
                        onValueChange={(value) => {
                          const sectionId = value === "" ? undefined : Number(value);
                          setOverviewLoading(sectionId ? "section" : null);
                          setSelectedFactorySectionId(sectionId);
                          setSelectedMachineId(undefined);
                          // clear any dependent data
                          setSelectedMachine(undefined);
                          updateUrlParams(selectedFactoryId, sectionId, undefined);
                        }}
                        disabled={sectionsLoading}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue>
                            {sectionsLoading 
                              ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading sections...</div>
                              : selectedFactorySectionId === undefined
                                ? "Select a Section"
                                : factorySections.find((s) => s.id === selectedFactorySectionId)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {factorySections.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  

                  {/* Machine Selection Dropdown */}
                  
                    <div className="mb-4">
                      <Label className="mb-2">Select Machine</Label>
                      <Select
                        value={selectedMachineId === undefined ? "" : selectedMachineId.toString()}
                        onValueChange={handleSelectMachine}
                        disabled={machinesLoading}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue>
                            {machinesLoading 
                              ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading machines...</div>
                              : selectedMachineId === undefined
                                ? "Select a Machine"
                                : machineList.find((m) => m.id === selectedMachineId)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {sortedMachineList.map((machine) => (
                            <SelectItem key={machine.id} value={machine.id.toString()}>
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                
                  {/* Reset Button */}
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      // Reset all fields to their initial state
                      setSelectedFactoryId(undefined);
                      setSelectedFactorySectionId(undefined);
                      setSelectedMachineId(undefined);
                      setSelectedMachine(undefined);
                      setSearchParams({}); // Clear all URL parameters
                    }}
                  >
                    Reset And Show All Statuses
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Machine Status Section - Always visible */}
            <div className="w-80 flex-shrink-0">
              {machineDetailsLoading ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading machine status...
                </div>
              ) : (
                <MachineStatus machineId={selectedMachineId} />
              )}
            </div>
            
            {/* Running Orders Section */}
            {machineDetailsLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading running orders...
              </div>
            ) : (
              <RunningOrders machine={selectedMachine} />
            )}
          </div>

          {selectedMachineId === undefined ? (
              <div className="mt-3">
                <AllMachinesStatus
                  factoryId={selectedFactoryId}
                  factorySectionId={selectedFactorySectionId}
                  handleRowSelection={handleRowSelection}
                  loadingMessage={overviewLoading === "factory" ? "Loading Factory Details" : overviewLoading === "section" ? "Loading Section Details" : undefined}
                />
              </div>
            ) : (
              <div className="w-full mt-4">
                <MachinePartsTable
                  MachineParts={MachineParts}
                  onApplyFilters={setFilters}
                  onResetFilters={() => setFilters({})}
                  onRefresh={refreshComponents}
                  selectedMachine={selectedMachine}
                  loading={partsLoading}
                  headerAction={
                    canMachineInstantAdd ? (
                      <Button
                        onClick={() => setIsAddPartDialogOpen(true)}
                        className="bg-blue-700 hover:bg-blue-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Part
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            )
          }
        </main>
      </div>

      {/* Add Part to Machine Dialog */}
      <Dialog
        open={isAddPartDialogOpen}
        onOpenChange={(open) => {
          setIsAddPartDialogOpen(open);
          if (!open) resetAddPartDialog();
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add Part to Machine</DialogTitle>
            <DialogDescription>
              Manually add a part to {selectedMachine?.name || "this machine"}. This will be logged for tracking purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 text-sm">
            <strong>Warning:</strong> You are manually adding a part to this machine.
            <br />
            Please enter correct parts, quantities, and average prices to avoid inaccuracies.
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="part-select">Select Part</Label>
              <AsyncSelect
                id="part-select"
                cacheOptions
                defaultOptions={allPartOptions}
                loadOptions={async (inputValue: string) => {
                  if (!inputValue) {
                    return allPartOptions;
                  }
                  
                  setIsLoadingParts(true);
                  try {
                    const response = await searchPartsByName(inputValue);
                    return response
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((part) => ({
                        value: part,
                        label: `${part.name} (${part.unit || 'units'})`,
                      }));
                  } catch (error) {
                    console.error("Error searching parts:", error);
                    return [];
                  } finally {
                    setIsLoadingParts(false);
                  }
                }}
                onChange={(selectedOption) => {
                  setSelectedPart(selectedOption?.value);
                }}
                placeholder="Search or Select a Part"
                className="mt-1"
                isSearchable
                isLoading={isLoadingParts}
                value={selectedPart ? { value: selectedPart, label: `${selectedPart.name} (${selectedPart.unit || 'units'})` } : null}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="current_quantity">
                Current Quantity{selectedPart ? ` (${selectedPart.unit || 'units'})` : ''}
              </Label>
              <Input
                id="current_quantity"
                type="number"
                placeholder="Enter current quantity"
                value={addPartCurrentQty}
                onChange={(e) => setAddPartCurrentQty(e.target.value)}
                min="1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="required_quantity">
                Required Quantity {selectedPart ? ` (${selectedPart.unit || 'units'})` : ''}
              </Label>
              <Input
                id="required_quantity"
                type="number"
                placeholder="Enter required quantity"
                value={addPartRequiredQty}
                onChange={(e) => setAddPartRequiredQty(e.target.value)}
                min="0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="average_price">
                Average Price Per Unit{selectedPart ? ` (${selectedPart.unit || 'unit'})` : ''}
              </Label>
              <Input
                id="average_price"
                type="number"
                placeholder="Enter average price per unit"
                value={addPartAveragePrice}
                onChange={(e) => setAddPartAveragePrice(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">
                Note (Optional)
              </Label>
              <Textarea
                id="note"
                placeholder="Add any notes about this manual addition"
                value={addPartNote}
                onChange={(e) => setAddPartNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetAddPartDialog}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPartToMachine}
              disabled={isSubmitting || !selectedPart || !addPartCurrentQty || !addPartAveragePrice}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add to Machine"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MachinePartsPage;
