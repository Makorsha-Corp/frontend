// MachinePartsRow.tsx
import { useState } from 'react';
import { TableRow, TableCell } from '../ui/table';
import { Button } from '../ui/button';
import { updateRequiredQuantity, updateDefectiveQuantity, deleteMachinePart } from "@/services/MachinePartsService";
import toast from 'react-hot-toast';
import { MachinePart } from '@/types';
import { Link } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

interface MachinePartsRowProps {
    MachinePart: MachinePart;
    onRefresh: () => Promise<void>; // Add onRefresh prop to the row interface
}

const MachinePartsRow: React.FC<MachinePartsRowProps> = ({ MachinePart, onRefresh }) => {
    // RBAC check
    const { hasFeatureAccess } = useAuth();
    const canMachineManualUpdate = hasFeatureAccess("machine_manual_updates");

    // Edit dialog state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [newCurQty, setNewCurQty] = useState<string>(String(MachinePart.qty));
    const [newReqQty, setNewReqQty] = useState<string>(String(MachinePart.req_qty ?? 0));
    const [newDefectiveQty, setNewDefectiveQty] = useState<string>(String(MachinePart.defective_qty ?? 0));
    const [isSaving, setIsSaving] = useState(false);

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const openEditDialog = () => {
        if (!canMachineManualUpdate) return;
        setNewCurQty(String(MachinePart.qty));
        setNewReqQty(String(MachinePart.req_qty ?? 0));
        setNewDefectiveQty(String(MachinePart.defective_qty ?? 0));
        setIsEditDialogOpen(true);
    };

    const handleUpdate = async () => {
        const curQtyNum = Number(newCurQty);
        const reqQtyNum = Number(newReqQty);
        const defQtyNum = Number(newDefectiveQty);

        if (Number.isNaN(curQtyNum) || curQtyNum < 0) {
            toast.error("Please enter a valid current quantity (0 or greater).");
            return;
        }
        if (Number.isNaN(reqQtyNum) || reqQtyNum < 0) {
            toast.error("Please enter a valid required quantity (0 or greater).");
            return;
        }
        if (Number.isNaN(defQtyNum) || defQtyNum < 0) {
            toast.error("Please enter a valid defective quantity (0 or greater).");
            return;
        }

        setIsSaving(true);
        try {
            await updateRequiredQuantity(MachinePart.id, curQtyNum, reqQtyNum);
            await updateDefectiveQuantity(MachinePart.id, defQtyNum);
            toast.success('Quantities updated successfully');
            setIsEditDialogOpen(false);
            await onRefresh();
        } catch (error) {
            toast.error('Failed to update quantities.');
        } finally {
            setIsSaving(false);
        }
    };

    const openDeleteDialog = () => {
        if (!canMachineManualUpdate) return;
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const success = await deleteMachinePart(MachinePart.id);
            if (success) {
                setIsDeleteDialogOpen(false);
                await onRefresh();
            }
        } catch (error) {
            toast.error('Failed to delete machine part');
        } finally {
            setIsDeleting(false);
        }
    };

    const hasDefectiveParts = MachinePart.defective_qty && MachinePart.defective_qty > 0;

    return (
        <>
            <TableRow key={MachinePart.id}>
                <TableCell>
                    <Link 
                        to={`/viewpart/${MachinePart.parts.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                        {MachinePart.parts.id}
                    </Link>
                </TableCell>
                <TableCell>{MachinePart.parts.name}</TableCell>
                <TableCell>
                    <span className={`${MachinePart.qty < (MachinePart.req_qty ?? 0) ? 'text-orange-500' : ''}`}>
                        {MachinePart.qty}
                    </span>
                </TableCell>
                <TableCell>
                    <span className={`${hasDefectiveParts ? 'text-yellow-600 font-medium' : 'text-gray-500'}`}>
                        {MachinePart.defective_qty ?? 0}
                    </span>
                </TableCell>
                <TableCell>
                    {MachinePart.req_qty === -1 || MachinePart.req_qty === null ? (
                        <span className="text-red-500">--</span>
                    ) : (
                        MachinePart.req_qty
                    )}
                </TableCell>
                <TableCell className="text-right">
                    {canMachineManualUpdate && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="More actions">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Machine Part Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={openEditDialog}>
                                    Edit Quantities
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={openDeleteDialog}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </TableCell>
            </TableRow>

            {/* Edit Quantities Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Edit Machine Part Quantities</DialogTitle>
                        <DialogDescription>
                            Update quantities for <strong>{MachinePart.parts.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="edit_cur_qty" className="text-sm font-medium">
                                Current Quantity ({MachinePart.parts.unit || "units"})
                            </label>
                            <Input
                                id="edit_cur_qty"
                                type="number"
                                min={0}
                                step={1}
                                value={newCurQty}
                                onChange={(e) => setNewCurQty(e.target.value)}
                                placeholder="Enter current quantity"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="edit_req_qty" className="text-sm font-medium">
                                Required Quantity ({MachinePart.parts.unit || "units"})
                            </label>
                            <Input
                                id="edit_req_qty"
                                type="number"
                                min={0}
                                step={1}
                                value={newReqQty}
                                onChange={(e) => setNewReqQty(e.target.value)}
                                placeholder="Enter required quantity"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="edit_def_qty" className="text-sm font-medium">
                                Defective Quantity ({MachinePart.parts.unit || "units"})
                            </label>
                            <Input
                                id="edit_def_qty"
                                type="number"
                                min={0}
                                step={1}
                                value={newDefectiveQty}
                                onChange={(e) => setNewDefectiveQty(e.target.value)}
                                placeholder="Enter defective quantity"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">
                            Delete Machine Part
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{MachinePart.parts.name}</strong> from this machine?
                            <br />
                            <br />
                            Current quantity: <strong>{MachinePart.qty} {MachinePart.parts.unit || "units"}</strong>
                            <br />
                            <br />
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default MachinePartsRow;
