import { StoragePart } from "@/types";
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";

export const fetchDamagedPartsByFactoryID = async ({
  factoryId,
  partName,
  partId,
  page = 1,
  limit = 10
}: {
  factoryId: number;
  partName: string | null;
  partId: number | null;
  page?: number;
  limit?: number;
}) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase_client
        .from('damaged_parts')
        .select(`
            id,
            qty,
            factory_id,
            part_id,
            parts (*)
        `, { count: 'exact' })
        .eq('factory_id', factoryId)
        .order("id", {ascending: true})
        .range(from, to);
    
    if (partId) {
        query = query.eq('part_id', partId);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching parts:', error.message);
        return { data: [], count: 0 };
    }

    let filteredData = data;

    if (partName) {
        filteredData = filteredData.filter((record: any) =>
            record.parts && record.parts.name.toLowerCase().includes(partName.toLowerCase())
        );
    }
    
    return { 
      data: filteredData as unknown as StoragePart[],
      count
    };
};

export const updateDamagePartQuantity = async (factory_id:number, part_id:number, new_quantity:number) => {
    const { error } = await supabase_client
    .from('damaged_parts')
    .update({ qty: new_quantity })
    .eq('part_id', part_id).eq('factory_id', factory_id)

    if (error){
        toast.error(error.message)
    }
}

export const increaseDamagedPartQty = async (factory_id: number, part_id: number, qty_to_add: number) => {
    try {
        // First check if a damaged part record already exists
        const { data: existingData, error: fetchError } = await supabase_client
            .from('damaged_parts')
            .select('qty')
            .eq('part_id', part_id)
            .eq('factory_id', factory_id)
            .maybeSingle();

        if (fetchError) {
            toast.error('Error checking existing damaged parts: ' + fetchError.message);
            throw fetchError;
        }

        if (existingData) {
            // Record exists, add to existing quantity
            const currentQty = existingData.qty || 0;
            const newQty = currentQty + qty_to_add;

            const { error: updateError } = await supabase_client
                .from('damaged_parts')
                .update({ qty: newQty })
                .eq('part_id', part_id)
                .eq('factory_id', factory_id);

            if (updateError) {
                toast.error('Error updating damaged part quantity: ' + updateError.message);
                throw updateError;
            }

            toast.success(`Added ${qty_to_add} damaged parts. Total: ${newQty}`);
        } else {
            // No existing record, create new one
            const { error: insertError } = await supabase_client
                .from('damaged_parts')
                .insert({
                    part_id: part_id,
                    factory_id: factory_id,
                    qty: qty_to_add
                });

            if (insertError) {
                toast.error('Error adding damaged parts: ' + insertError.message);
                throw insertError;
            }

            toast.success(`Added ${qty_to_add} damaged parts (new record)`);
        }
    } catch (error) {
        console.error('Error in addDamagedPartQty:', error);
        throw error;
    }
}


export const deleteDamagedPart = async (part_id: number, factory_id: number) => {
    try {
        const { error } = await supabase_client
            .from('damaged_parts')
            .delete()
            .eq('part_id', part_id)
            .eq('factory_id', factory_id);

        if (error) {
            toast.error('Error deleting damaged part: ' + error.message);
            throw error;
        }

        toast.success('Damaged part deleted successfully');
    } catch (error) {
        console.error('Error in deleteDamagedPart:', error);
        throw error;
    }
}


export const updateDamagedPartAvg = async (
  part_id: number,
  factory_id: number,
  new_avg_price: number
): Promise<void> => {
  const { error } = await supabase_client
    .from("damaged_parts")
    .update({ avg_price: new_avg_price })
    .eq("part_id", part_id)
    .eq("factory_id", factory_id);

  if (error) {
    toast.error(error.message);
  }
};
