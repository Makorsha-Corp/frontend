import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  updateApprovedStorageWithdrawalByID,
  updateOrderedPartQtyByID,
  updateQtyTakenFromStorage,
  updateReceivedByFactoryDateByID,
  updateSentDateByID
} from '@/services/OrderedPartsService';
import { increaseMachinePartQty } from '@/services/MachinePartsService';
import { OrderedPart } from '@/types';
import toast from 'react-hot-toast';
import React from 'react';
import { fetchStoragePartByFactoryAndPartID, upsertStoragePart } from '@/services/StorageService';

interface ApproveTakingFromStorageProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (v: boolean) => void;
  setActionMenuOpen: (v: boolean) => void;
  orderedPartInfo: OrderedPart;
  factory_id: number;
  machine_id: number;
}

const ApproveTakingFromStorageAction: React.FC<ApproveTakingFromStorageProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  setActionMenuOpen,
  orderedPartInfo,
  factory_id,
  machine_id
}) => {
  
    
    const takeFromStorage = async () => {
    
    try {
      
        const storage_data = await fetchStoragePartByFactoryAndPartID(orderedPartInfo.part_id,factory_id) 
        if (storage_data) {
            const currentStorageQty = storage_data.qty 
            if (currentStorageQty >= orderedPartInfo.qty) {
                // Enough in storage
                const new_storage_quantity = currentStorageQty - orderedPartInfo.qty;
                await upsertStoragePart(orderedPartInfo.part_id, factory_id, new_storage_quantity);
                await updateOrderedPartQtyByID(orderedPartInfo.id, 0);
                await increaseMachinePartQty(machine_id, orderedPartInfo.part_id, orderedPartInfo.qty);
                await updateSentDateByID(orderedPartInfo.id, new Date());
                await updateReceivedByFactoryDateByID(orderedPartInfo.id, new Date());
            } else {
                // Not enough in storage
                const new_orderedpart_qty = orderedPartInfo.qty - currentStorageQty;
                await upsertStoragePart(orderedPartInfo.part_id, factory_id, 0);
                await updateOrderedPartQtyByID(orderedPartInfo.id, new_orderedpart_qty);
                await increaseMachinePartQty(machine_id, orderedPartInfo.part_id, currentStorageQty);
            }

            const takingFromStorageQty = Math.min(currentStorageQty, orderedPartInfo.qty);
            await updateQtyTakenFromStorage(orderedPartInfo.id, takingFromStorageQty);
            await updateApprovedStorageWithdrawalByID(orderedPartInfo.id, true);
            }
            else {
                console.log(`no storage data found for partid ${orderedPartInfo.part_id} in factoryid ${factory_id}`)
            }         
    }catch (error) {
            toast.error("Error occurred while processing storage logic");
        }
        
    setIsDialogOpen(false);
    setActionMenuOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogTitle>
          Take from storage Approval - <span className="text-sm">{orderedPartInfo.parts.name}</span>
        </DialogTitle>
        <DialogDescription>
          <p className="text-sm text-muted-foreground">
            This item exists in storage. Approving this action will adjust storage quantity and cannot be undone.
          </p>
          <p className="text-sm text-muted-foreground">Do you Approve?</p>
        </DialogDescription>
        <Button onClick={takeFromStorage}>Approve</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveTakingFromStorageAction;
