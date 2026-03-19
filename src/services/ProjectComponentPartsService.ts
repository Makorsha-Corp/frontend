import toast from "react-hot-toast";
import { supabase_client } from "./SupabaseClient";
import { ProjectComponentPart } from "@/types";

// Fetch parts assigned to a project component
export const fetchProjectComponentParts = async (
  projectComponentId?: number,
  partId?: number,
  partName?: string
) => {
  let query = supabase_client
    .from("project_component_parts")
    .select(`
      id,
      qty,
      part_id,
      project_component_id,
      parts(*)
      
    `);
  
  if (projectComponentId !== undefined) {
    query = query.eq("project_component_id", projectComponentId);
  }

  if (partId !== undefined) {
    query = query.eq("part_id", partId);
  }

  const { data, error } = await query.order("id", { ascending: true });

  if (error) {
    toast.error("Error fetching project component parts: " + error.message);
    return [];
  }

  let filteredData = data;
  if (partName) {
    filteredData = filteredData.filter((record: any) =>
      record.parts?.name?.toLowerCase().includes(partName.toLowerCase())
    );
  }

  return filteredData as unknown as ProjectComponentPart[];
};

// Upsert (insert or update) part quantity
export const upsertProjectComponentPart = async (
  part_id: number,
  project_component_id: number,
  quantity: number
) => {
  const { error } = await supabase_client
    .from("project_component_parts")
    .upsert(
      { part_id, project_component_id, qty: quantity },
      { onConflict: "part_id, project_component_id" }
    );

  if (error) {
    toast.error(error.message);
    return false;
  }

  return true;
};

// Update part quantity by row ID
export const updateProjectComponentPartQuantity = async (
  id: number,
  quantity: number
) => {
  const { error } = await supabase_client
    .from("project_component_parts")
    .update({ qty: quantity })
    .eq("id", id);

  if (error) {
    toast.error("Error updating quantity: " + error.message);
    return false;
  }

  toast.success("Quantity updated successfully.");
  return true;
};

// upsertProjectComponentPartFromStorage was removed; storage reductions now occur during approval for STP

// Increase quantity
export const increaseProjectComponentPartQty = async (
  project_component_id: number,
  part_id: number,
  quantity: number
) => {
  const { data, error } = await supabase_client
    .from("project_component_parts")
    .select("qty")
    .eq("part_id", part_id)
    .eq("project_component_id", project_component_id);

  if (error) {
    toast.error(error.message);
    return false;
  }

  const currentQty = data?.[0]?.qty || 0;
  const updatedQty = currentQty + quantity;

  const { error: upsertError } = await supabase_client
    .from("project_component_parts")
    .upsert(
      { part_id, project_component_id, qty: updatedQty },
      { onConflict: "part_id, project_component_id" }
    );

  if (upsertError) {
    toast.error(upsertError.message);
    return false;
  }

  return true;
};

// Reduce quantity or delete
export const reduceProjectComponentPartQty = async (
  project_component_id: number,
  part_id: number,
  quantity: number
): Promise<number> => {
  const { data, error } = await supabase_client
    .from("project_component_parts")
    .select("qty")
    .eq("part_id", part_id)
    .eq("project_component_id", project_component_id);

  if (error) {
    toast.error(error.message);
    return 0;
  }

  if (!data || data.length === 0) {
    toast.error("Part not found in component");
    return 0;
  }

  const currentQty = data[0].qty;
  const reduction = Math.min(quantity, currentQty);
  const newQty = currentQty - reduction;

  if (newQty === 0) {
    const { error: deleteError } = await supabase_client
      .from("project_component_parts")
      .delete()
      .eq("part_id", part_id)
      .eq("project_component_id", project_component_id);

    if (deleteError) toast.error(deleteError.message);
  } else {
    const { error: updateError } = await supabase_client
      .from("project_component_parts")
      .update({ qty: newQty })
      .eq("part_id", part_id)
      .eq("project_component_id", project_component_id);

    if (updateError) toast.error(updateError.message);
  }

  return reduction;
};

// Delete part by row ID
export const deleteProjectComponentPart = async (componentPartId: number) => {
  const { error } = await supabase_client
    .from("project_component_parts")
    .delete()
    .eq("id", componentPartId);

  if (error) {
    toast.error("Failed to delete part: " + error.message);
    return false;
  }

  toast.success("Part deleted successfully!");
  return true;
};
