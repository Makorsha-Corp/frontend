import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { fetchStorageParts, upsertStoragePart, increaseStoragePartQty, fetchStoragePartByFactoryAndPartID, updateStoragePartAvg } from "@/services/StorageService";
import { fetchDamagedPartsByFactoryID, increaseDamagedPartQty } from "@/services/DamagedGoodsService";
import { fetchFactories } from "@/services/FactoriesService";
import { fetchAllParts, searchPartsByName } from "@/services/PartsService";
import { Factory, StoragePart, Part } from "@/types";
import SearchAndFilter from "@/components/customui/SearchAndFilter";
import StoragePartsRow from "@/components/customui/StoragePartsRow";
import NavigationBar from "@/components/customui/NavigationBar";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import AsyncSelect from 'react-select/async';
import StorageDetails from "@/components/customui/StorageDetails";
import RunningOrders from "@/components/customui/RunningOrders";
import { Textarea } from "@/components/ui/textarea";
import { calculatePartAveragePrice } from "@/services/helper";
import { insertInstantAddStoragePart } from "@/services/InstantAddStoragePartService";
import { useAuth } from "@/context/AuthContext";
import { insertInstantAddDamagedPart } from "@/services/InstantAddDamagedPartService";

const ITEMS_PER_PAGE = 10;

const StoragePage = () => {
  const profile = useAuth().profile
  const { hasFeatureAccess } = useAuth();
  const canStorageInstantAdd = hasFeatureAccess("storage_instant_add"); 
  const canStorageManualUpdate = hasFeatureAccess("storage_manual_updates")
  const [searchParams, setSearchParams] = useSearchParams();
  const [storageParts, setStorageParts] = useState<StoragePart[]>([]);
  const [damagedParts, setDamagedParts] = useState<StoragePart[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [loadingDamaged, setLoadingDamaged] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "storage");
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | undefined>(
    searchParams.get("factory") ? Number(searchParams.get("factory")) : undefined
  );
  const [totalItems, setTotalItems] = useState(0);
  const [totalValue, setTotalValue] = useState<number>(0);

  // Calculate total value from storage parts
  const calculateTotalValue = (parts: StoragePart[]) => {
    const total = parts.reduce((sum, part) => {
      const avgPrice = part.avg_price || 0;
      const qty = part.qty || 0;
      return sum + (avgPrice * qty);
    }, 0);
    setTotalValue(total);
  };

  // Instant add part to storage dialog state
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | undefined>();
  const [instantAddQuantity, setInstantAddQuantity] = useState<string>("");
  const [instantAddAveragePrice, setInstantAddAveragePrice] = useState<string>("");
  const [instantAddNote, setInstantAddNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingParts, setIsLoadingParts] = useState(false);

  // Load factories and parts on component mount
  useEffect(() => {
    const loadFactories = async () => {
      try {
        const factoriesData = await fetchFactories();
        setFactories(factoriesData);
      } catch (error) {
        console.error("Error loading factories:", error);
      }
    };

    const loadAllParts = async () => {
      try {
        const partsData = await fetchAllParts();
        setAllParts(partsData);
      } catch (error) {
        console.error("Error loading parts:", error);
      }
    };

    loadFactories();
    loadAllParts();
  }, []);

  // Update URL when factory or tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedFactoryId) {
      params.set("factory", selectedFactoryId.toString());
    } else {
      params.delete("factory");
    }
    params.set("tab", activeTab);
    params.set("page", "1"); // Reset to first page when tab changes
    setSearchParams(params);
  }, [selectedFactoryId, activeTab]);

  // Load parts data when factory is selected, tab changes, or search params change
  useEffect(() => {
    const loadPartsData = async () => {
      if (!selectedFactoryId) {
        setStorageParts([]);
        setDamagedParts([]);
        return;
      }

      const page = Number(searchParams.get("page")) || 1;
      const partName = searchParams.get("partName") || undefined;
      const partId = searchParams.get("partId") ? Number(searchParams.get("partId")) : undefined;

      if (activeTab === "storage") {
        setLoadingStorage(true);
        try {
          const { data, count } = await fetchStorageParts({
            factoryId: selectedFactoryId,
            partName,
            partId,
            page,
            limit: ITEMS_PER_PAGE
          });
          setStorageParts(data);
          console.log("Storage parts loaded:", data);
          setTotalItems(count || 0);
          calculateTotalValue(data);
        } catch (error) {
          console.error("Error loading storage parts:", error);
        } finally {
          setLoadingStorage(false);
        }
      } else {
        setLoadingDamaged(true);
        try {
          const { data, count } = await fetchDamagedPartsByFactoryID({
            factoryId: selectedFactoryId,
            partName: partName || null,
            partId: partId || null,
            page,
            limit: ITEMS_PER_PAGE
          });
          setDamagedParts(data);
          setTotalItems(count || 0);
        } catch (error) {
          console.error("Error loading damaged parts:", error);
        } finally {
          setLoadingDamaged(false);
        }
      }
    };

    loadPartsData();
  }, [selectedFactoryId, activeTab, searchParams]);

  const handleSearch = async (partName: string | null, partId: number | null) => {
    if (!selectedFactoryId) return;

    const params = new URLSearchParams(searchParams);
    if (partName) params.set("partName", partName);
    else params.delete("partName");
    if (partId) params.set("partId", partId.toString());
    else params.delete("partId");
    params.set("page", "1"); // Reset to first page on new search
    setSearchParams(params);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params);
  };

  const  resetInstantAdd = async () => {
      setSelectedPart(undefined);
      setInstantAddQuantity("");
      setInstantAddAveragePrice("");
      setInstantAddNote("");
      setIsAddPartDialogOpen(false);
  }

  const handleInstantAddPartToStorage = async () => {
    if (!profile){
      toast.error("Error: could not find profile info")
      return;
    }

    if (!selectedPart || !instantAddQuantity || !selectedFactoryId) {
      toast.error("Please select a part and enter quantity");
      return;
    }

    if (!instantAddAveragePrice){
      toast.error("Average price is required")
    }

    const quantityNum = Number(instantAddQuantity);
    if (quantityNum <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const avgNum = Number(instantAddAveragePrice);
    if (avgNum <= 0) {
      toast.error("Average must be greater than 0");
      return;
    }


    setIsSubmitting(true);
    try {
      const storage_part_data = await fetchStoragePartByFactoryAndPartID(selectedPart.id,selectedFactoryId) 
      let new_avg_price: number
      if(storage_part_data)
      {
        if (storage_part_data.avg_price) {
          // storage data exists and has average price
          new_avg_price = calculatePartAveragePrice(storage_part_data.qty, storage_part_data.avg_price, quantityNum, avgNum)
        } else {
          // storage data exists but no averrage price
          toast.error("The average for this item cannot be calculated since the current average cost is unavailable")
          return;
        }
      }
      else{
        new_avg_price = calculatePartAveragePrice(0, 0, quantityNum, avgNum)
      }

      const instant_add = await insertInstantAddStoragePart(profile.id,avgNum,selectedFactoryId,selectedPart.id,quantityNum,instantAddNote);
      if (instant_add){
        await increaseStoragePartQty(selectedPart.id, selectedFactoryId, quantityNum);
        toast.success("Part added to storage successfully");
        await updateStoragePartAvg(selectedPart.id, selectedFactoryId,new_avg_price)
        toast.success("Part average updated")
      }
      else{
        toast.error("Failed to add part, storage was not updated")
        return;
      }
      resetInstantAdd()
      refreshCurrentData();
    } catch (error) {
      console.error("Error adding part:", error);
      toast.error(`Failed to add part to ${activeTab === "storage" ? "storage" : "damaged parts"}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleInstantAddPartToDamagedParts = async () => {
  if (!profile) {
    toast.error("Error: could not find profile info");
    return;
  }

  if (!selectedPart || !instantAddQuantity || !selectedFactoryId) {
    toast.error("Please select a part and enter quantity");
    return;
  }

  const quantityNum = Number(instantAddQuantity);
  if (Number.isNaN(quantityNum) || quantityNum <= 0) {
    toast.error("Quantity must be greater than 0");
    return;
  }

  setIsSubmitting(true);
  try {
    // create instant-add record for damaged parts
    const instant_add = await insertInstantAddDamagedPart(
      profile.id,
      selectedFactoryId,
      selectedPart.id,
      quantityNum,
      instantAddNote // optional
    );

    if (!instant_add) {
      toast.error("Failed to add part, damaged parts were not updated");
      return;
    }

    // increase damaged qty
    await increaseDamagedPartQty(selectedFactoryId, selectedPart.id, quantityNum);
    toast.success("Part added to damaged parts successfully");

    // reset & refresh
    resetInstantAdd();
    refreshCurrentData();
  } catch (error) {
    console.error("Error adding part:", error);
    toast.error("Failed to add part to damaged parts");
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

  const currentPage = Number(searchParams.get("page")) || 1;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Add this function to refresh the current data
  const refreshCurrentData = async () => {
    if (!selectedFactoryId) return;

    const page = Number(searchParams.get("page")) || 1;
    const partName = searchParams.get("partName") || undefined;
    const partId = searchParams.get("partId") ? Number(searchParams.get("partId")) : undefined;

    if (activeTab === "storage") {
      setLoadingStorage(true);
      try {
        const { data, count } = await fetchStorageParts({
          factoryId: selectedFactoryId,
          partName,
          partId,
          page,
          limit: ITEMS_PER_PAGE
        });
        setStorageParts(data);
        setTotalItems(count || 0);
        calculateTotalValue(data);
      } catch (error) {
        console.error("Error reloading storage parts:", error);
      } finally {
        setLoadingStorage(false);
      }
    } else {
      setLoadingDamaged(true);
      try {
        const { data, count } = await fetchDamagedPartsByFactoryID({
          factoryId: selectedFactoryId,
          partName: partName || null,
          partId: partId || null,
          page,
          limit: ITEMS_PER_PAGE
        });
        setDamagedParts(data);
        setTotalItems(count || 0);
      } catch (error) {
        console.error("Error reloading damaged parts:", error);
      } finally {
        setLoadingDamaged(false);
      }
    }
  };

  return (
    <>
      <NavigationBar />
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <main className="p-4 sm:px-6 sm:py-0 mt-2">
          {/* Top row: Selection, Details, Running Orders */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 h-full mb-4">
            {/* Storage Selection (Factory only) */}
            <div className="flex-none min-w-72 max-w-96 w-1/6">
              <Card className="mb-4 h-full">
                <CardHeader>
                  <CardTitle>Storage Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label className="mb-2">Select Factory</Label>
                    <Select
                      value={selectedFactoryId === undefined ? "" : selectedFactoryId.toString()}
                      onValueChange={(value) => setSelectedFactoryId(value === "" ? undefined : Number(value))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue>
                          {selectedFactoryId === undefined ? "Select a Factory" : factories.find(f => f.id === selectedFactoryId)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {factories.map(factory => (
                          <SelectItem key={factory.id} value={factory.id.toString()}>
                            {factory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Storage Details */}
            <StorageDetails 
              factoryName={factories.find(f => f.id === selectedFactoryId)?.name} 
              totalItems={totalItems} 
              totalValue={activeTab === "storage" ? totalValue : undefined}
            />

            {/* Running Orders for storage (by factory) */}
            <RunningOrders factory={factories.find(f => f.id === selectedFactoryId)} />
          </div>

          {/* Bottom: Storage/Damaged parts table and controls */}
          {selectedFactoryId === undefined ? (
            <div className="text-center text-lg">Please select a factory to view parts</div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle>{activeTab === "storage" ? "Storage Parts" : "Damaged Parts"}</CardTitle>
                    <CardDescription>
                      {activeTab === "storage" ? "View and manage parts in storage" : "View and manage damaged parts"}
                    </CardDescription>
                  </div>
                  <SearchAndFilter 
                    filterConfig={[
                      { type: 'partName', label: 'Part Name' },
                      { type: 'partId', label: 'Part ID' },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-4">
                  {canStorageInstantAdd && (
                    <Button
                      onClick={() => setIsAddPartDialogOpen(true)}
                      className="bg-blue-700 hover:bg-blue-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Part
                    </Button>)
                  }

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="inline-flex h-10 w-[300px] items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <TabsTrigger value="storage" className="w-[140px]">Storage Parts</TabsTrigger>
                      <TabsTrigger value="damaged" className="w-[140px]">Damaged Parts</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part ID</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Average Price</TableHead>
                      <TableHead className="text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activeTab === "storage" ? loadingStorage : loadingDamaged) ? (
                      Array.from({ length: 6 }).map((_, idx) => (
                        <TableRow key={idx}>
                          <TableCell><div className="h-5 w-16 bg-muted rounded" /></TableCell>
                          <TableCell><div className="h-5 w-40 bg-muted rounded" /></TableCell>
                          <TableCell><div className="h-5 w-20 bg-muted rounded" /></TableCell>
                          <TableCell className="text-right"><div className="h-5 w-10 bg-muted rounded ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      (activeTab === "storage" ? storageParts : damagedParts).map((part) => (
                        <StoragePartsRow 
                          key={part.id} 
                          part={part} 
                          isDamaged={activeTab === "damaged"} 
                          onDelete={refreshCurrentData}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
                {!(activeTab === "storage" ? loadingStorage : loadingDamaged) && totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Add Part to Storage Dialog */}
        <Dialog
          open={isAddPartDialogOpen}
          onOpenChange={(open) => {
            setIsAddPartDialogOpen(open);
            if (!open) resetInstantAdd(); // reset when closed by X or outside click
          }}
        >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "storage" ? "Add Part to Storage" : "Add Part to Damaged Parts"}
            </DialogTitle>
            <DialogDescription>
              Add a part to the {activeTab === "storage" ? "storage" : "damaged parts"} of {factories.find(f => f.id === selectedFactoryId)?.name}
            </DialogDescription>
          </DialogHeader>
           
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
              <Label htmlFor="quantity">
                Quantity{selectedPart ? ` (${selectedPart.unit || 'units'})` : ''}
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={instantAddQuantity}
                onChange={(e) => setInstantAddQuantity(e.target.value)}
                min="1"
              />
            </div>

            {activeTab === "storage" && (
              <div className="grid gap-2">
                <Label htmlFor="average_price">
                  Average Price Per Unit
                  {selectedPart ? ` (${selectedPart.unit || "units"})` : ""}
                </Label>
                <Input
                  id="average_price"
                  type="number"
                  placeholder="Enter average price for each unit"
                  value={instantAddAveragePrice}
                  onChange={(e) => setInstantAddAveragePrice(e.target.value)}
                  min="1"
                />
              </div>
            )}


            <div className="grid gap-2">
              <Label htmlFor="Note">
                Note
              </Label>
              <Textarea
                id="instant_add_note"
                placeholder="Note"
                value={instantAddNote}
                onChange={(e) => setInstantAddNote(e.target.value)}
              />
            </div>
          </div>


          <DialogFooter>
            <Button
              variant="outline"
              onClick={()=>resetInstantAdd()}
            >
              Cancel
            </Button>
            <Button
              onClick={activeTab === "storage"
                ? handleInstantAddPartToStorage
                : handleInstantAddPartToDamagedParts}
              disabled={
                isSubmitting ||
                !selectedPart ||
                !instantAddQuantity ||
                (activeTab === "storage" && !instantAddAveragePrice) // only required for storage
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                `Add to ${activeTab === "storage" ? "Storage" : "Damaged Parts"}`
              )}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StoragePage;