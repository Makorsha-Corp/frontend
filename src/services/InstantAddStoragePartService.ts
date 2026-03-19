import { InstantAddStoragePart } from "@/types";
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";

export const insertInstantAddStoragePart = async (
  added_by: number,
  avg_price: number,
  factory_id: number,
  part_id: number,
  qty: number,
  note?: string | null
): Promise<InstantAddStoragePart | null> => {
  const { data, error } = await supabase_client
    .from("instant_add_storage_part")
    .insert({
      added_by: added_by,
      avg_price: avg_price,
      factory_id: factory_id,
      part_id: part_id,
      qty: qty,
      note: note ?? null
    })
    .select("*")
    .single();

  if (error) {
    toast.error(error.message);
    return null;
  }

  return data as InstantAddStoragePart;
};

