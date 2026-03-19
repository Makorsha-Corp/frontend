import { useEffect, useState } from 'react';
import { fetchPageParts } from '../services/PartsService';
import { useSearchParams } from "react-router-dom"
import { Loader2, PlusCircle, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import { Tabs, TabsContent,} from "@/components/ui/tabs"
import PartsTableRow from "@/components/customui/PartsTableRow"
import NavigationBar from "@/components/customui/NavigationBar"
import { Part } from '@/types';
import toast from 'react-hot-toast';
import { convertUtcToBDTime } from '@/services/helper';
import SearchAndFilter from "@/components/customui/SearchAndFilter"; // Import the SearchAndFilter component
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddPartPopup from '@/components/customui/Parts/AddPartPopup';
import { useAuth } from '@/context/AuthContext';



const PartsPage = () => {
    
    const [parts,setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);     // Track total pages
    const [partsPerPage] = useState(20);                 // Set number of parts per page
    const [totalCount, setTotalCount] = useState(0);     // Track total number of parts
    const [addPartEnabled, setaddPartEnabled] = useState<boolean>(false)
    const [isAddPartPopupOpen, setIsAddPartPopupOpen] = useState(false);
    const [sortBy, setSortBy] = useState<"name" | "id">("name");
    const appSettings = useAuth().appSettings
    const [searchParams, setSearchParams] = useSearchParams();

    const [currentPage, setCurrentPage] = useState(
        searchParams.get("page") ? Number(searchParams.get("page")) : 1
    );

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", String(page));
        setSearchParams(params);
    };

    const filterConfig = [
        {type: "partId", label: ["Enter Part ID"]},
        {type: "partName", label: ["Enter Part Name"]}
    ];

    const [filters, setFilters] = useState({
        partIdQuery: searchParams.get("partId") || "",
        partNameQuery: searchParams.get("partName") || ""
    });

    useEffect(() => {
        setFilters({
            partIdQuery: searchParams.get("partId") || "",
            partNameQuery: searchParams.get("partName") || ""
        });
    
        setCurrentPage(searchParams.get("page") ? Number(searchParams.get("page")) : 1);
    }, [searchParams]);

    useEffect(() => {
        fetchPartsForPage();
    }, [filters, sortBy]);

    const fetchPartsForPage = async (page = currentPage) => {
        try {
            setLoading(true);
            const { data: fetchedParts, count } = await fetchPageParts({
                page,
                partsPerPage,
                filters: filters,
                sortBy: sortBy,
        });
            setParts(fetchedParts);
            setTotalCount(count ?? 0);
            setTotalPages(Math.ceil((count ?? 0) / partsPerPage));
        } catch (error) {
            toast.error("Failed to fetch parts");
        } finally {
            setLoading(false);
        }
    };

    const toggleSort = () => {
        setSortBy(prevSort => prevSort === "name" ? "id" : "name");
    };

    useEffect(() => {
        const loadAddPartSettings = async () => {
            try {
                if (appSettings) {
                    appSettings.forEach((setting) => {
                        if (setting.name === "Add Part") {
                            setaddPartEnabled(setting.enabled);
                        }
                    });
                }
            } catch (error) {
                toast.error("Could not load settings data");
                setaddPartEnabled(false);
            }
        };
        loadAddPartSettings();
    }, [appSettings]);


    return (
        <>
            <NavigationBar />
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        <Tabs defaultValue="all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <SearchAndFilter filterConfig={filterConfig} />
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={toggleSort}
                                        className="flex items-center gap-1"
                                    >
                                        <ArrowUpDown className="h-3.5 w-3.5" />
                                        Sort by {sortBy === "name" ? "Name" : "ID"}
                                    </Button>
                                </div>
                                <div>
                                    <Dialog open={isAddPartPopupOpen} onOpenChange={setIsAddPartPopupOpen}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                className="bg-blue-950" 
                                                disabled={!addPartEnabled}
                                            >
                                                <PlusCircle className="h-3.5 w-3.5" />
                                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                                    Add Part
                                                </span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[600px]">
                                            <AddPartPopup 
                                                addPartEnabled={addPartEnabled}
                                                onSuccess={()=>fetchPartsForPage()}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            <TabsContent value="all">
                                <Card x-chunk="dashboard-06-chunk-0">
                                    <CardHeader>
                                        <CardTitle>Parts</CardTitle>
                                        <CardDescription>Manage parts and view information.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>ID</TableHead>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead className="hidden md:table-cell">Unit</TableHead>
                                                    <TableHead className="hidden md:table-cell">Created at</TableHead>
                                                    <TableHead>
                                                        <span className="sr-only">Actions</span>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            {loading ? (
                                                <div className='flex flex-row justify-center'>
                                                    <Loader2 className='h-8 w-8 animate-spin' />
                                                </div>
                                            ) : (
                                                <TableBody>
                                                    {parts.map(part => (
                                                        <PartsTableRow
                                                            key={part.id}
                                                            id={part.id}
                                                            name={part.name}
                                                            unit={part.unit}
                                                            created_at={convertUtcToBDTime(part.created_at)}
                                                            onRefresh={fetchPartsForPage}
                                                        />
                                                    ))}
                                                </TableBody>
                                            )}
                                        </Table>
                                    </CardContent>
                                    <CardFooter>
                                        <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
                                            <span>
                                                Showing <strong>{(currentPage - 1) * partsPerPage + 1}</strong> to <strong>{Math.min(currentPage * partsPerPage, totalCount)}</strong> of <strong>{totalCount}</strong> Parts
                                            </span>

                                            {/* Pagination */}
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>

                                                {/* Page Navigation */}
                                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                    .filter(page =>
                                                        page >= currentPage - 2 && page <= currentPage + 2
                                                    )
                                                    .map((page) => (
                                                        <Button key={page} size="sm" variant={currentPage === page ? "default" : "outline"} onClick={() => goToPage(page)}>
                                                            {page}
                                                        </Button>
                                                    ))}

                                                <Button size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
                                            </div>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </main>
                </div>
            </div>
        </>
    );
};

export default PartsPage;