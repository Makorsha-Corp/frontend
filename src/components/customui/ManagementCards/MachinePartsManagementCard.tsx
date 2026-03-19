import { useEffect, useState } from "react";
import { Table, TableHead, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import toast from "react-hot-toast";
import { fetchFactories, fetchFactorySections } from "@/services/FactoriesService";
import { fetchAllMachines } from "@/services/MachineServices";
import { fetchMachineParts, upsertMachineParts, updateMachinePartQuantities, deleteMachinePart } from "@/services/MachinePartsService";
import { Check, Pencil, PencilOff, PencilRuler, Plus, PlusCircle, Trash2, X, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Factory, FactorySection, Machine, MachinePart, Part } from "@/types";
import { fetchAllParts } from "@/services/PartsService";
import { AnimatePresence, motion } from "framer-motion";
import ReactSelect from "react-select";

const MachinePartsManagementCard = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [factories, setFactories] = useState<Factory[]>([]);
  const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineParts, setMachineParts] = useState<MachinePart[]>([]); // Machine parts list

  const factoryFromUrl = searchParams.get("factory");
  const sectionFromUrl = searchParams.get("factorySection");
  const machineFromUrl = searchParams.get("machine");

  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(
    factoryFromUrl ? Number(factoryFromUrl) : null
  );
  const [selectedFactorySectionId, setSelectedFactorySectionId] = useState<number | null>(
    sectionFromUrl ? Number(sectionFromUrl) : null
  );
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(
    machineFromUrl ? Number(machineFromUrl) : null
  );

  const [editingPartId, setEditingPartId] = useState<number | null>(null);
    const [editedQty, setEditedQty] = useState<number>(0);
    const [editedReqQty, setEditedReqQty] = useState<number>(0);

    const [parts, setParts] = useState<Part[]>([]);
    const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
    const [partQty, setPartQty] = useState<number>(1);
    const [isAddingPart, setIsAddingPart] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    const factoryFromUrl = searchParams.get("factory");
    const sectionFromUrl = searchParams.get("factorySection");
    const machineFromUrl = searchParams.get("machine");

    setSelectedFactoryId(factoryFromUrl ? Number(factoryFromUrl) : null);
    setSelectedFactorySectionId(sectionFromUrl ? Number(sectionFromUrl) : null);
    setSelectedMachineId(machineFromUrl ? Number(machineFromUrl) : null);
  }, [searchParams]);

  //Load Parts
  useEffect(() => {
    const loadParts = async () => {
      try {
        const data = await fetchAllParts();
        setParts(data);
      } catch (error) {
        toast.error("Failed to load parts.");
      }
    };
    loadParts();
  }, []);
  
  // Load Factories
  useEffect(() => {
    const loadFactories = async () => {
      try {
        const data = await fetchFactories();
        setFactories(data);
      } catch (error) {
        toast.error("Failed to load factories.");
      }
    };
    loadFactories();
  }, []);

  // Load Factory Sections when Factory is selected
  useEffect(() => {
    if (selectedFactoryId !== null) {
      const loadSections = async () => {
        try {
          const data = await fetchFactorySections(selectedFactoryId);
          setFactorySections(data);
        } catch (error) {
          toast.error("Failed to load factory sections.");
        }
      };
      loadSections();

      setMachineParts([]);
    } else {
      setFactorySections([]);
    }
  }, [selectedFactoryId]);
  

  // Load Machines when Factory Section is selected
  useEffect(() => {
    if (selectedFactorySectionId !== null) {
      const loadMachines = async () => {
        try {
          const data = await fetchAllMachines(selectedFactorySectionId);
          setMachines(data);
        } catch (error) {
          toast.error("Failed to load machines.");
        }
      };
      loadMachines();
      setMachineParts([]);
    } else {
      setMachines([]);
    }
  }, [selectedFactorySectionId]);

  // Load Machine Parts when Machine is selected
  useEffect(() => {
    if (selectedMachineId !== null) {
      const loadMachineParts = async () => {
        try {
          const data = await fetchMachineParts(selectedMachineId);
          setMachineParts(data);
        } catch (error) {
          toast.error("Failed to load machine parts.");
        }
      };
      loadMachineParts();
    } else {
      setMachineParts([]);
    }
  }, [selectedMachineId]);

  

  // Handle Factory selection
  const handleFactoryChange = (value: string) => {
    const newFactoryId = Number(value);
    setSelectedFactoryId(newFactoryId);
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("factory", newFactoryId.toString());
      updatedParams.delete("factorySection");
      updatedParams.delete("machine");
      return updatedParams;
    });
  };

  // Handle Factory Section selection
  const handleFactorySectionChange = (value: string) => {
    const newFactorySectionId = Number(value);
    setSelectedFactorySectionId(newFactorySectionId);
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("factorySection", newFactorySectionId.toString());
      updatedParams.delete("machine");
      return updatedParams;
    });
  };

  // Handle Machine selection
  const handleMachineChange = (value: string) => {
    const newMachineId = Number(value);
    setSelectedMachineId(newMachineId);
    setSearchParams((prevParams) => {
      const updatedParams = new URLSearchParams(prevParams);
      updatedParams.set("machine", newMachineId.toString());
      return updatedParams;
    });
  };

  const handleAddPart = async () => {
    if (!selectedMachineId || !selectedPartId || partQty < 1) {
      toast.error("Select a part and enter a valid quantity.");
      return;
    }
  
    try {
      await upsertMachineParts(selectedPartId, selectedMachineId, partQty);
      toast.success("Part added successfully!");
  
      // Refresh parts list
      const updatedParts = await fetchMachineParts(selectedMachineId);
      setMachineParts(updatedParts);
  
      // Reset form
      setSelectedPartId(null);
      setPartQty(1);
    } catch (error) {
      toast.error("Error adding part.");
    }
  };

  // Delete Machine Part
  const handleDeleteMachinePart = async (partId: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this machine part?");
    if (!confirmed) return;

    try {
      const success = await deleteMachinePart(partId);
      if (success && selectedMachineId) {
        const updatedParts = await fetchMachineParts(selectedMachineId);
        setMachineParts(updatedParts);
      }
    } catch (error) {
      toast.error("Failed to delete machine part.");
    }
  };

  const startEditing = (part: MachinePart) => {
    setEditingPartId(part.id);
    setEditedQty(part.qty);
    setEditedReqQty(part.req_qty ?? -1); // Default to 0 if null
};


  const handleUpdateMachineParts = async (part: MachinePart) => {
    if (!part || !selectedMachineId) {
      toast.error("Invalid machine or part selection.");
      return;
    }
  
    // Ensure we use the edited values, but fallback to existing part values if empty
    const updatedQty = editedQty !== null ? editedQty : part.qty;
    const updatedReqQty = editedReqQty !== null ? editedReqQty : part.req_qty;
  
    try {
        console.log(part.id, updatedQty, updatedReqQty?updatedReqQty:-1)
      await updateMachinePartQuantities(part.id, updatedQty, updatedReqQty?updatedReqQty:-1);
  
  
      // Reset edit state
      setEditingPartId(null);
      setEditedQty(0);
      setEditedReqQty(0);
  
      // Refresh machine parts list
      const updatedParts = await fetchMachineParts(selectedMachineId);
      setMachineParts(updatedParts);
    } catch (error) {
      toast.error("Error updating machine part.");
    }
  };
  

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>Configure Machine Parts</span>
          <div className="relative group">
            <Button 
              onClick={() => {
                if (isAddingPart) {
                  setIsAddingPart(false);
                  setSelectedPartId(null);
                  setPartQty(1);
                } else {
                  setIsAddingPart(true);
                }
              }}
              disabled={!selectedMachineId}
              className={`h-8 gap-2 ${
                isAddingPart 
                  ? "bg-red-600 hover:bg-red-700"
                  : selectedMachineId
                    ? "bg-blue-950 hover:bg-blue-900"
                    : "bg-gray-400 cursor-not-allowed"
              } text-white`}
            >
              {isAddingPart ? (
                <>
                  <X size={16} />
                  Cancel
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  Add Part
                </>
              )}
            </Button>
            {!selectedMachineId && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Please select a machine first
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col min-h-[500px]">
        {/* Selection toolbar */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <Select value={selectedFactoryId?.toString() || ""} onValueChange={handleFactoryChange}>
            <SelectTrigger className="w-44">
              <SelectValue>
                {selectedFactoryId ? factories.find(f => f.id === selectedFactoryId)?.abbreviation : "Select Factory"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {factories.map(factory => (
                <SelectItem key={factory.id} value={factory.id.toString()}>{factory.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedFactorySectionId?.toString() || ""} onValueChange={handleFactorySectionChange} disabled={!selectedFactoryId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {factorySections.map(section => (
                <SelectItem key={section.id} value={section.id.toString()}>{section.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMachineId?.toString() || ""} onValueChange={handleMachineChange} disabled={!selectedFactorySectionId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select Machine" />
            </SelectTrigger>
            <SelectContent>
              {machines.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(machine => (
                <SelectItem key={machine.id} value={machine.id.toString()}>{machine.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Part Form */}
        <AnimatePresence mode="wait">
          {isAddingPart && (
            <motion.div
              key="add-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <ReactSelect
                  id="partId"
                  options={parts
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(part => ({
                      value: part.id,
                      label: `${part.name} (${part.unit || "units"})`,
                      isDisabled: machineParts.some(mp => mp.parts.id === part.id),
                    }))}
                  onChange={(selectedOption) => setSelectedPartId(Number(selectedOption?.value))}
                  isSearchable
                  placeholder="Search or Select a Part"
                  value={selectedPartId ? { value: selectedPartId, label: parts.find(p => p.id === selectedPartId)?.name } : null}
                  className="w-[280px]"
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }}
                />

                <Input
                  type="number"
                  value={partQty}
                  onChange={(e) => setPartQty(Number(e.target.value))}
                  className="w-24 text-center"
                  min={1}
                />

                <Button variant="outline" onClick={handleAddPart} className="gap-1">
                  <Plus size={16} />
                  Add
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Machine Parts Table or Empty State */}
        {selectedMachineId ? (
          <div className="rounded-md border flex-1 flex flex-col min-h-[400px]">
            <div className="overflow-x-auto flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="w-[90px]">Part ID</TableHead>
                    <TableHead>Part Name</TableHead>
                    <TableHead className="w-[120px]">Quantity</TableHead>
                    <TableHead className="w-[120px]">Req Qty</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineParts.map(part => (
                    <TableRow key={part.id}>
                      <TableCell>{part.parts.id}</TableCell>
                      <TableCell>
                        <Link to={`/viewpart/${part.parts.id}`} className="text-blue-700 hover:underline">
                          {part.parts.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {editingPartId === part.id ? (
                          <input
                            type="number"
                            value={editedQty ?? part.qty}
                            onChange={(e) => setEditedQty(Number(e.target.value))}
                            aria-label="Edit quantity"
                            className="border rounded-md p-1 w-20 text-center"
                          />
                        ) : (
                          part.qty
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPartId === part.id ? (
                          <input
                            type="number"
                            value={editedReqQty ?? part.req_qty}
                            onChange={(e) => setEditedReqQty(Number(e.target.value))}
                            aria-label="Edit required quantity"
                            className="border rounded-md p-1 w-20 text-center"
                          />
                        ) : (
                          part.req_qty
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {editingPartId === part.id ? (
                          <>
                            <Button variant="outline" onClick={() => setEditingPartId(null)} className="gap-1">
                              <PencilOff className="w-4 h-4" />
                            </Button>
                            <Button onClick={() => handleUpdateMachineParts(part)} className="bg-blue-950 hover:bg-blue-900 gap-1 text-white">
                              <Check className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" onClick={() => startEditing(part)} className="gap-1">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteMachinePart(part.id)} className="gap-1">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid place-items-center">
            <div className="w-full h-full border rounded-md grid place-items-center min-h-[400px]">
              <span className="text-muted-foreground">Select a factory, section, and machine to manage parts</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MachinePartsManagementCard;
