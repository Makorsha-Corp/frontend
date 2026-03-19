import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '../ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import SearchAndFilter from "@/components/customui/SearchAndFilter";
import StoragePartsRow from './StoragePartsRow';
import { StoragePart } from "@/types";

interface StoragePartsTableProps {
    parts: StoragePart[];
    onApplyFilters: (filters: any) => void;
    onResetFilters: () => void;
}

const StoragePartsTable: React.FC<StoragePartsTableProps> = ({ parts, onApplyFilters, onResetFilters }) => {
    return (
        <Card className="mt-5">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Storage Parts</CardTitle>
                    <CardDescription>
                        This is a list of storage orders.
                    </CardDescription>
                </div>
                <SearchAndFilter
                    filterConfig={[
                        { type: 'partName', label: 'Part Name' },
                        { type: 'partId', label: 'Part ID' },
                    ]}
                />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Part ID</TableHead>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Factory Name</TableHead>
                            <TableHead className="text-right">
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parts.map((part) => (
                            <StoragePartsRow key={part.id} part={part} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default StoragePartsTable;
