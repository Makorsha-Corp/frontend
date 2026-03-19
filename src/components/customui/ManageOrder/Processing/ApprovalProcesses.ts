import { increaseDamagedPartQty } from '@/services/DamagedGoodsService';
import { reduceMachinePartQty, addDefectiveQuantity, increaseMachinePartQty } from '@/services/MachinePartsService';
import { setMachineIsRunningById } from '@/services/MachineServices';
import { reduceStoragePartQty } from '@/services/StorageService';
import { fetchOrderedPartsByOrderID } from '@/services/OrderedPartsService';

import { Order, OrderedPart } from '@/types';

/**
 * UNIFIED ORDER APPROVAL FUNCTION
 * Handles approval processing for all order types when advancing from status 1 (Pending)
 * Fetches ordered parts and routes to appropriate approval function based on order type
 */
export const handleOrderApproval = async (order: Order): Promise<{ success: boolean; errors: string[] }> => {
    try {

        // Fetch all ordered parts for this order
        const orderedParts = await fetchOrderedPartsByOrderID(order.id);
        
        if (!orderedParts || orderedParts.length === 0) {
            console.log("No ordered parts found for order approval");
            return { success: true, errors: [] };
        }

        // Process based on order type
        switch (order.order_type) {
            case "PFM":
                return await handlePFMApproval(
                    orderedParts,
                    order.machine_id,
                    order.factory_id
                );

            case "PFS":
                return {success:true, errors:[]};

            case "STM":
                return await handleSTMApproval(
                    orderedParts,
                    order.machine_id,
                    order.factory_id,
                    order.src_factory!
                );

            case "PFP":
                // Move insertion to completion stage; no-op at approval
                return { success: true, errors: [] };

            case "STP":
                return await handleSTPApproval(
                    orderedParts,
                    order.src_factory!
                );

            default:
                console.log(`Unknown order type: ${order.order_type}`);
                return { success: false, errors: [`Unknown order type: ${order.order_type}`] };
        }
    } catch (error) {
        console.error("Error in unified order approval processing:", error);
        return { success: false, errors: [`Order approval error: ${error}`] };
    }
};
/**
 * Handles the STP (Storage to Project) approval process
 * Reduces parts from source storage. Insertion into project happens on completion.
 */
const handleSTPApproval = async (
    orderedParts: OrderedPart[],
    srcFactoryId: number,
): Promise<{ success: boolean; errors: string[] }> => {
    try {
        const errors: string[] = [];
        for (const part of orderedParts) {
            try {
                await reduceStoragePartQty(part.part_id, srcFactoryId, part.qty);
            } catch (error) {
                console.error(`Error reducing storage for part ${part.part_id}:`, error);
                errors.push(`Failed to reduce storage for part ${part.part_id}`);
            }
        }
        return { success: errors.length === 0, errors };
    } catch (error) {
        console.error("Error in STP approval processing:", error);
        return { success: false, errors: [`STP processing error: ${error}`] };
    }
};


/**
 * Handles the PFM (Purchase for Machine) approval process for multiple parts (BATCH VERSION - NOW DEFAULT)
 * Based on individual part unstable_type, performs different actions
 * If any part has INACTIVE unstable_type, the machine will be marked inactive
 */
export const handlePFMApproval = async (
    orderedParts: OrderedPart[],
    machine_id: number,
    factory_id: number
): Promise<{ success: boolean; errors: string[] }> => {
    const errors: string[] = [];

    
    try {
        // Check if any part is marked as INACTIVE - if so, set machine inactive
        const hasInactiveParts = orderedParts.some(part => part.unstable_type === 'INACTIVE');
        
        if (hasInactiveParts) {
            // Set machine inactive when any part is marked as INACTIVE
            await setMachineIsRunningById(machine_id, false);
        }

        // Process each part based on its unstable_type
        for (const part of orderedParts) {
            switch (part.unstable_type) {
                case 'INACTIVE':
                    // Standard PFM process for inactive parts: reduce machine parts and increase damaged parts
                    await reduceMachinePartQty(machine_id, part.part_id, part.qty);
                    await increaseDamagedPartQty(factory_id, part.part_id, part.qty);
                    break;
                
                case 'DEFECTIVE':
                    // Use defective parts: increase defective parts qty and reduce machine parts qty
                    await addDefectiveQuantity(machine_id, part.part_id, part.qty);
                    await reduceMachinePartQty(machine_id, part.part_id, part.qty);
                    break;
                
                case 'LESS':
                    // Use fewer parts: decrease machine parts and increase damaged parts
                    await reduceMachinePartQty(machine_id, part.part_id, part.qty);
                    await increaseDamagedPartQty(factory_id, part.part_id, part.qty);
                    break;
                
                default:
                    // Fallback for null or unexpected values: treat as INACTIVE
                    await reduceMachinePartQty(machine_id, part.part_id, part.qty);
                    await increaseDamagedPartQty(factory_id, part.part_id, part.qty);
                    break;
            }
        }

        return { success: true, errors };
    } catch (error) {
        console.error("Error in PFM approval processing:", error);
        return { success: false, errors: [`PFM processing error: ${error}`] };
    }
};


/**
 * Handles the PFS (Purchase for Storage) approval process
 * Increases storage part quantities for all ordered parts
 */
// export const handlePFSApproval = async (
//     orderedParts: OrderedPart[],
//     factory_id: number
// ): Promise<{ success: boolean; errors: string[] }> => {
//     const errors: string[] = [];
//     try {
//         for (const part of orderedParts) {
//             await increaseStoragePartQty(part.part_id, factory_id, part.qty);
//         }
//     } catch (error) {
//         console.error("Error in PFS approval processing:", error);
//         return { success: false, errors: [`PFS processing error: ${error}`] };
//     }
//     return { success: errors.length==0, errors };
// };

/**
 * Handles the STM (Storage to Machine) approval process
 * Transfers parts from storage to machine and handles machine status
 * Now supports unstable types similar to PFM orders
 * If any part has INACTIVE unstable_type, the machine will be marked inactive
 */
export const handleSTMApproval = async (
    orderedParts: OrderedPart[],
    machine_id: number,
    _factory_id: number,
    src_factory_id: number
): Promise<{ success: boolean; errors: string[] }> => {
    const errors: string[] = [];

    try {
        // Check if any part is marked as INACTIVE - if so, set machine inactive
        const hasInactiveParts = orderedParts.some(part => part.unstable_type === 'INACTIVE');
        
        if (hasInactiveParts) {
            // Set machine inactive when any part is marked as INACTIVE
            await setMachineIsRunningById(machine_id, false);
        }

        // Process each part based on its unstable_type
        for (const part of orderedParts) {
            // Always reduce from storage first
            await reduceStoragePartQty(part.part_id, src_factory_id, part.qty);
            
            switch (part.unstable_type) {
                case 'INACTIVE':
                    // Standard STM process for inactive parts: transfer parts normally
                    await increaseMachinePartQty(machine_id, part.part_id, part.qty);
                    break;
                
                case 'DEFECTIVE':
                    // Add as defective parts and increase machine parts (defective parts are tracked separately)
                    await addDefectiveQuantity(machine_id, part.part_id, part.qty);
                    await increaseMachinePartQty(machine_id, part.part_id, part.qty);
                    break;
                
                case 'LESS':
                    // Use fewer parts: don't add full quantity to machine, send difference to damaged goods
                    // For STM, we could implement a different logic, but following PFM pattern
                    await increaseMachinePartQty(machine_id, part.part_id, part.qty);
                    // Note: For STM LESS, we might want to track this differently than PFM
                    break;
                
                default:
                    // Fallback for null or unexpected values: treat as INACTIVE
                    await increaseMachinePartQty(machine_id, part.part_id, part.qty);
                    break;
            }
        }

        return { success: true, errors };
    } catch (error) {
        console.error("Error in STM approval processing:", error);
        return { success: false, errors: [`STM processing error: ${error}`] };
    }
};

/**
 * Handles the PFP (Purchase for Project) approval process
 * Adds parts to the project component parts table
 */
// Removed; PFP no longer does work at approval

/**
 * Handles the STP (Storage to Project) approval process
 * Transfers parts from storage to project component parts table
 */
// Removed; STP approval handled inline above


