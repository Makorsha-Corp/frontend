import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";
import { MiscProjectCost } from "@/types";

// Fetch all costs filtered by optional project_id, component_id, or name
export const fetchMiscProjectCosts = async (
  projectId?: number,
  componentId?: number,
  name?: string
) => {
  let query = supabase_client.from("miscellaneous_project_costs").select("*");

  if (projectId !== undefined) {
    query = query.eq("project_id", projectId);
  }

  if (componentId !== undefined) {
    query = query.eq("project_component_id", componentId);
  }

  if (name !== undefined && name.trim() !== "") {
    query = query.ilike("name", `%${name}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching misc costs:", error.message);
    toast.error("Failed to fetch costs");
    return [];
  }

  return data as MiscProjectCost[];
};

// Fetch by ID
export const fetchMiscProjectCostById = async (id: number) => {
  const { data, error } = await supabase_client
    .from("miscellaneous_project_costs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching cost by ID:", error.message);
    toast.error("Failed to fetch cost");
    return null;
  }

  return data as MiscProjectCost;
};

// Add a new misc cost
export const addMiscProjectCost = async (
  costData: Partial<MiscProjectCost>
) => {
  const { error } = await supabase_client
    .from("miscellaneous_project_costs")
    .insert([costData]);

  if (error) {
    console.error("Error adding cost:", error.message);
    toast.error("Failed to add cost");
    return false;
  }

  toast.success("Cost added successfully");
  return true;
};

// Update cost
export const updateMiscProjectCost = async (
  id: number,
  updateData: Partial<MiscProjectCost>
) => {
  const { error } = await supabase_client
    .from("miscellaneous_project_costs")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating cost:", error.message);
    toast.error("Failed to update cost");
    return false;
  }

  toast.success("Cost updated successfully");
  return true;
};

// Delete cost
export const deleteMiscProjectCost = async (id: number) => {
  const { error } = await supabase_client
    .from("miscellaneous_project_costs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting cost:", error.message);
    toast.error("Failed to delete cost");
    return false;
  }

  toast.success("Cost deleted successfully");
  return true;
};
