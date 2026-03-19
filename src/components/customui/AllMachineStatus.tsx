// AllMachinesStatus.tsx
import { useEffect, useState } from "react";
import { fetchFactories, fetchAllFactorySections } from "@/services/FactoriesService";
import { fetchAllMachinesEnriched } from "@/services/MachineServices";
import { fetchMachineParts } from "@/services/MachinePartsService";
import { Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../ui/badge";

interface Factory {
    id: number;
    name: string;
}

interface FactorySection {
    id: number;
    name: string;
    factory_id: number;
}

interface Machine {
    id: number;
    name: string;
    is_running: boolean;
    factory_section_id: number;
    factory: string;
    factory_section_name: string;
}

interface AllMachinesStatusProps {
    factoryId?: number;
    factorySectionId?: number;
    handleRowSelection?: (factoryId: number, factorySectionId: number, machineId: number) => void;
    loadingMessage?: string;
}

const AllMachinesStatus = ({ factoryId, factorySectionId, handleRowSelection, loadingMessage }: AllMachinesStatusProps) => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [factorySections, setFactorySections] = useState<FactorySection[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [machinePartsStatus, setMachinePartsStatus] = useState<Record<number, { hasDefective: boolean }>>({});
    const [loadingFactories, setLoadingFactories] = useState(true);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingMachines, setLoadingMachines] = useState(false);

    // Load factories on mount (lightweight)
    useEffect(() => {
        const loadFactories = async () => {
            setLoadingFactories(true);
            try {
                const fetchedFactories = await fetchFactories();
                setFactories(fetchedFactories);
            } catch (error) {
                console.error("Error loading factories:", error);
            } finally {
                setLoadingFactories(false);
            }
        };
        loadFactories();
    }, []);

    // Load sections when factory is selected
    useEffect(() => {
        if (!factoryId) {
            setFactorySections([]);
            setMachines([]);
            setMachinePartsStatus({});
            return;
        }

        const loadSections = async () => {
            setLoadingSections(true);
            try {
                const fetchedSections = await fetchAllFactorySections();
                const filteredSections = fetchedSections.filter(s => s.factory_id === factoryId);
                setFactorySections(filteredSections);
                
                // Clear machines when factory changes
                setMachines([]);
                setMachinePartsStatus({});
            } catch (error) {
                console.error("Error loading sections:", error);
            } finally {
                setLoadingSections(false);
            }
        };

        loadSections();
    }, [factoryId]);

    // Load machines when factory is selected (for all sections within that factory)
    useEffect(() => {
        if (!factoryId) {
            setMachines([]);
            setMachinePartsStatus({});
            return;
        }

        const loadMachines = async () => {
            setLoadingMachines(true);
            try {
                const { data: enrichedMachines } = await fetchAllMachinesEnriched();
                // Load machines for ALL sections within the selected factory
                const filteredMachines = enrichedMachines.filter(m => {
                    const section = factorySections.find(s => s.id === m.factory_section_id);
                    return section && section.factory_id === factoryId;
                });
                setMachines(filteredMachines);
                
                // Clear machine parts status when factory changes
                setMachinePartsStatus({});
            } catch (error) {
                console.error("Error loading machines:", error);
            } finally {
                setLoadingMachines(false);
            }
        };

        // Only load machines after sections are loaded
        if (factorySections.length > 0) {
            loadMachines();
        }
    }, [factoryId, factorySections]);

    // If no factory is selected, show a message
    if (factoryId === undefined) {
        return (
            <Card className="mt-5">
                <CardHeader>
                    <CardTitle>Machine Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center h-32 text-muted-foreground">
                        Please select a factory to view machine status
                    </div>
                </CardContent>
            </Card>
        );
    }



    // Filter machines based on factoryId and factorySectionId
    const filteredMachines = machines.filter(machine => {
        // Always filter by factory
        if (factoryId !== undefined) {
            const section = factorySections.find(s => s.id === machine.factory_section_id);
            if (!section || section.factory_id !== factoryId) return false;
        }
        
        // If a specific section is selected, filter by that section
        if (factorySectionId !== undefined && machine.factory_section_id !== factorySectionId) {
            return false;
        }
        
        return true;
    });

    // Group machines by factory and section
    const groupedMachines = filteredMachines.reduce((acc, machine) => {
        const section = factorySections.find(s => s.id === machine.factory_section_id);
        const factory = factories.find(f => f.id === section?.factory_id);
        
        if (!factory || !section) return acc;
        
        const key = `${factory.id}-${section.id}`;
        if (!acc[key]) {
            acc[key] = {
                factory: factory.name,
                section: section.name,
                machines: []
            };
        }
        acc[key].machines.push(machine);
        return acc;
    }, {} as Record<string, { factory: string; section: string; machines: Machine[] }>);

    // Sort machines in each group
    Object.values(groupedMachines).forEach(group => {
        group.machines.sort((a, b) => 
            a.name.localeCompare(b.name, undefined, {
                numeric: true,
                sensitivity: 'base'
            })
        );
    });

    return (
        <Card className="mt-5">
            <CardHeader>
                <CardTitle>Machine Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[12%]">Factory</TableHead>
                            <TableHead className="w-[8%]">Section</TableHead>
                            <TableHead className="w-[64%]">Machines</TableHead>
                            <TableHead className="w-[8%]">Running Status</TableHead>
                            <TableHead className="w-[8%]">Parts Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                                                                          {loadingFactories || loadingSections || loadingMachines ? (
                             <TableRow>
                                 <TableCell colSpan={5}>
                                     <div className="flex justify-center items-center h-32 text-muted-foreground">
                                         <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                         {loadingFactories ? "Loading factories..." :
                                          loadingSections ? "Loading sections..." :
                                          loadingMachines ? "Loading machines..." : "Loading..."}
                                     </div>
                                 </TableCell>
                             </TableRow>
                                                  ) : Object.keys(groupedMachines).length === 0 ? (
                             <TableRow>
                                 <TableCell colSpan={5}>
                                     <div className="flex justify-center items-center h-32 text-muted-foreground">
                                         {!factoryId ? "Please select a factory to view machine status" :
                                          "No machines found for the selected factory"}
                                     </div>
                                 </TableCell>
                             </TableRow>
                         ) : (
                             Object.entries(groupedMachines).map(([key, group]) => {
                                const [factoryId, sectionId] = key.split('-').map(Number);
                                const runningCount = group.machines.filter(m => m.is_running).length;
                                const totalCount = group.machines.length;
                                const defectiveCount = group.machines.filter(m => machinePartsStatus[m.id]?.hasDefective).length;

                                return (
                                    <TableRow 
                                        key={key}
                                        className="cursor-default"
                                    >
                                        <TableCell>{group.factory}</TableCell>
                                        <TableCell>{group.section}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-2">
                                                {group.machines.map((machine) => {
                                                    const hasDefective = machinePartsStatus[machine.id]?.hasDefective;
                                                    return (
                                                        <Badge
                                                            key={machine.id}
                                                            variant="secondary"
                                                            className={`text-sm cursor-pointer ${
                                                                hasDefective
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : machine.is_running
                                                                        ? "bg-green-100 text-green-600"
                                                                        : "bg-red-100 text-red-600"
                                                            }`}
                                                            onClick={() => handleRowSelection?.(factoryId, sectionId, machine.id)}
                                                        >
                                                            {machine.name}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-sm ${runningCount === totalCount ? 'bg-green-100' : runningCount === 0 ? 'bg-red-100' : 'bg-orange-100'}`}
                                            >
                                                {runningCount}/{totalCount} Running
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-sm ${defectiveCount > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}
                                            >
                                                {defectiveCount > 0 ? `${defectiveCount} Defective` : 'All Parts OK'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default AllMachinesStatus;