import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";
import { ProjectComponent } from "@/types";

// Fetch all components for a given project
export const fetchProjectComponentsByProjectId = async (projectId: number) => {
  const { data, error } = await supabase_client
    .from("project_components")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project components:", error.message);
    toast.error("Failed to fetch components");
    return [];
  }

  return data as ProjectComponent[];
};

// Fetch a single component by ID
export const fetchProjectComponentById = async (componentId: number) => {
  const { data, error } = await supabase_client
    .from("project_components")
    .select("*")
    .eq("id", componentId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching component:", error.message);
    toast.error("Failed to fetch component");
    return null;
  }

  return data as ProjectComponent;
};

// Add a new component
export const addProjectComponent = async (
  componentData: Partial<ProjectComponent>
) => {
  const { data, error } = await supabase_client
    .from("project_components")
    .insert([componentData])
    .select()
    .single();

  if (error) {
    console.error("Error adding component:", error.message);
    toast.error("Failed to add component");
    return null;
  }

  toast.success("Component added successfully");
  return data as ProjectComponent;
};

// Update a component by ID
export const updateProjectComponent = async (
  componentId: number,
  updateData: Partial<ProjectComponent>
) => {
  const { error } = await supabase_client
    .from("project_components")
    .update(updateData)
    .eq("id", componentId);

  if (error) {
    console.error("Error updating component:", error.message);
    toast.error("Failed to update component");
    return false;
  }

  toast.success("Component updated successfully");
  return true;
};

// Count components by status (PLANNING, STARTED, COMPLETED)
export const fetchMetricProjectComponentsByStatus = async (
  status: "PLANNING" | "STARTED" | "COMPLETED"
) => {
  const { count, error } = await supabase_client
    .from("project_components")
    .select("*", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    console.error(`Error fetching component metric for ${status}:`, error.message);
    return null;
  }

  return count;
};


// Calculate only order costs for a project component (no misc expenses)
export const calculateProjectComponentCost = async (projectComponentId: number) => {
  // 1. Fetch order ids from orders table based on project_component_id
  const { data: orders, error: ordersError } = await supabase_client
    .from("orders")
    .select("id")
    .eq("project_component_id", projectComponentId);

  if (ordersError) {
    toast.error("Failed to fetch orders: " + ordersError.message);
    return null;
  }

  const orderIds = (orders ?? []).map((order: any) => order.id);
  if (orderIds.length === 0) {
    return 0;
  }

  // 2. Fetch order_parts for those order ids
  const { data: orderParts, error: orderPartsError } = await supabase_client
    .from("order_parts")
    .select("qty, unit_cost")
    .in("order_id", orderIds);

  if (orderPartsError) {
    toast.error("Failed to fetch order parts: " + orderPartsError.message);
    return null;
  }

  // 3. Calculate total cost
  let totalCost = 0;
  (orderParts ?? []).forEach((part: any) => {
    if (typeof part.qty === "number" && typeof part.unit_cost === "number") {
      totalCost += part.qty * part.unit_cost;
    }
  });

  return totalCost;
}

// Calculate total cost for a project component (order costs + misc expenses)
export const calculateProjectComponentTotalCost = async (projectComponentId: number): Promise<number> => {
  try {
    // 1. Get order costs
    const orderCost = await calculateProjectComponentCost(projectComponentId);
    
    // 2. Get misc expenses for this component
    const { fetchMiscProjectCosts } = await import("./MiscellaneousProjectCostServices");
    const miscCosts = await fetchMiscProjectCosts(undefined, projectComponentId);
    const miscExpenses = miscCosts.reduce((total, cost) => total + (cost.amount || 0), 0);
    
    // 3. Return total
    return (orderCost || 0) + miscExpenses;
  } catch (error) {
    console.error("Error calculating project component total cost:", error);
    return 0;
  }
}