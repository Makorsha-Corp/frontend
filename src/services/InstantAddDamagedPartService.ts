import { InstantAddDamagedPart } from "@/types";
import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";

export const insertInstantAddDamagedPart = async (
  added_by: number,
  factory_id: number,
  part_id: number,
  qty: number,
  note?: String | null
): Promise<InstantAddDamagedPart | null> => {
  const { data, error } = await supabase_client
    .from("instant_add_damaged_part") // adjust if your table name differs
    .insert({
      added_by: added_by,
      factory_id: factory_id,
      part_id: part_id,
      qty: qty,
      note: note ?? null, // default to null if undefined
    })
    .select("*")
    .single();

  if (error) {
    toast.error(error.message);
    return null;
  }

  return data as InstantAddDamagedPart;
};
