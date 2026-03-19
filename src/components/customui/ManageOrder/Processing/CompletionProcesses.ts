import { calculatePartAveragePrice } from "@/services/helper";
import { fetchStoragePartByFactoryAndPartID, increaseStoragePartQty, updateStoragePartAvg } from "@/services/StorageService";
import { increaseMachinePartQty, reduceDefectiveQuantity } from "@/services/MachinePartsService";
import { increaseDamagedPartQty } from "@/services/DamagedGoodsService";
import { OrderedPart } from "@/types";
import { upsertProjectComponentPart } from "@/services/ProjectComponentPartsService";
import toast from "react-hot-toast";

export const handlePFSReceivedAction = async (
    orderedPart: OrderedPart,
    factory_id: number,
): Promise<boolean> => {
    try {
        const storage_part_data = await fetchStoragePartByFactoryAndPartID(orderedPart.part_id,factory_id) 
        let new_avg_price: number
        
        if (!orderedPart.unit_cost){
            //cost for ordered part is missing
            toast.error("The average for this item cannot be calculated since the cost for this ordered part was not set")
            return false;
        }

        if(storage_part_data)
        {
            if (!storage_part_data.avg_price){
                // storage data exists but no averrage price
                toast.error("The average for this item cannot be calculated since the current average cost for this part in storage does not exist")
                return false;
            }
            new_avg_price = calculatePartAveragePrice(storage_part_data.qty, storage_part_data.avg_price, orderedPart.qty, orderedPart.unit_cost)
        }
        else{
            new_avg_price = calculatePartAveragePrice(0, 0, orderedPart.qty, orderedPart.unit_cost)
        }
        await increaseStoragePartQty(orderedPart.part_id,factory_id,orderedPart.qty);
        await updateStoragePartAvg(orderedPart.part_id, factory_id,new_avg_price)
        return true
    } catch (error) {
        toast.error("Failed to complete order")
        return false
    }

}

/**
 * Handles the completion process for PFM (Purchase for Machine) orders when parts are received
 * Based on the part's unstable_type, performs different actions:
 * - INACTIVE: Parts go directly to machine (machine was already set inactive during approval)
 * - DEFECTIVE: Parts are added as defective parts to machine
 * - LESS: Parts are used for replacement, excess goes to damaged goods
 */
export const handlePFMReceivedAction = async (
    orderedPart: OrderedPart,
    machine_id: number,
    factory_id: number,
): Promise<boolean> => {
    try {
        if (!orderedPart.unit_cost) {
            toast.error("Cannot complete part transfer - unit cost is missing for this ordered part");
            return false;
        }

        if(orderedPart.unstable_type === 'DEFECTIVE'){
            await reduceDefectiveQuantity(machine_id, orderedPart.part_id, orderedPart.qty);
            await increaseDamagedPartQty(factory_id, orderedPart.part_id, orderedPart.qty);
        }
        
        await increaseMachinePartQty(machine_id, orderedPart.part_id, orderedPart.qty);

        return true;
        
    } catch (error) {
        console.error("Error in PFM received action:", error);
        toast.error(`Failed to complete part transfer for ${orderedPart.parts.name}`);
        return false;
    }
}

// export const handleSTMReceivedAction = async (
//     orderedPart: OrderedPart,
//     machine_id: number,
// ): Promise<boolean> => {
//     try {
//         await increaseMachinePartQty(machine_id, orderedPart.part_id, orderedPart.qty);
//         return true;
//     }
//     catch (error) {
//         console.error("Error in STM received action:", error);
//         toast.error(`Failed to complete part transfer for ${orderedPart.parts.name}`);
//         return false;
//     }
// }
/**
 * PFP completion: add purchased parts to project component on completion
 */
export const handlePFPReceivedAction = async (
  orderedPart: OrderedPart,
  project_component_id: number,
): Promise<boolean> => {
  try {
    if (!project_component_id) return false;
    await upsertProjectComponentPart(orderedPart.part_id, project_component_id, orderedPart.qty);
    return true;
  } catch (error) {
    toast.error("Failed to complete PFP part transfer");
    return false;
  }
}

/**
 * STP completion: reduce from source storage and add to project component
 */
export const handleSTPReceivedAction = async (
  orderedPart: OrderedPart,
  project_component_id: number,
  src_factory_id: number,
): Promise<boolean> => {
  try {
    if (!project_component_id || !src_factory_id) return false;
    // Storage was already reduced at approval; just upsert into project component
    await upsertProjectComponentPart(orderedPart.part_id, project_component_id, orderedPart.qty);
    return true;
  } catch (error) {
    toast.error("Failed to complete STP part transfer");
    return false;
  }
}
    