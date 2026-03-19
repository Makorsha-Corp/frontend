import { supabase_client } from "./SupabaseClient";
import { toast } from "react-hot-toast";
import { OrderWorkflow } from "@/types";

export async function getOrderWorkflowByID(workflow_id: number): Promise<OrderWorkflow | null> {
  const { data, error } = await supabase_client
    .from("order_workflows")
    .select("*")
    .eq("id", workflow_id)
    .single();

  if (error) {
    toast.error(error.message);
    return null;
  }

  return data;
}

export async function getOrderWorkflowByType(order_type: string): Promise<OrderWorkflow | null> {
  const { data, error } = await supabase_client
    .from("order_workflows")
    .select("*")
    .eq("order_type", order_type)
    .single();

  if (error) {
    toast.error(error.message);
    return null;
  }

  return data;
}


export async function getAllOrderWorkflows(): Promise<OrderWorkflow[] | null> {
  const { data, error } = await supabase_client
    .from("order_workflows")
    .select("*");

  if (error) {
    toast.error("Failed to fetch order workflows: " + error.message);
    return null;
  }

  return data;
}


export async function getAllOrderWorkflowsByNameMap(): Promise<Record<string, OrderWorkflow> | null> {
  const { data, error } = await supabase_client
    .from("order_workflows")
    .select("*");

  if (error) {
    toast.error("Failed to fetch order workflows: " + error.message);
    return null;
  }

  const map: Record<string, OrderWorkflow> = {};
  data.forEach((workflow) => {
    map[workflow.name] = workflow;
  });

  return map;
}


export async function getAllOrderWorkflowsByIdMap(): Promise<Record<number, OrderWorkflow> | null> {
  const { data, error } = await supabase_client
    .from("order_workflows")
    .select("*");

  if (error) {
    toast.error("Failed to fetch order workflows: " + error.message);
    return null;
  }

  const map: Record<number, OrderWorkflow> = {};
  data.forEach((workflow) => {
    map[workflow.id] = workflow;
  });

  return map;
}

// Returns a dictionary mapping workflow name (order type) -> last status id.
export async function getOrderTypeLastStatusMap() {
  let query = supabase_client
    .from("order_workflows")
    .select("type, status_sequence");

  const { data, error } = await query;
  if (error) {
    console.warn("Failed to fetch workflows:", error.message);
    return {};
  }

  const map: Record<string, number | null> = {};
  data.forEach((row) => {
    map[row.type] = Array.isArray(row.status_sequence) && row.status_sequence.length > 0 ? row.status_sequence[row.status_sequence.length - 1] : null;
  });

  console.log(map)
  return map;
}


export async function getOrderTypes() {
  const { data, error } = await supabase_client
    .from("order_workflows")
    .select("type");

  if (error) {
    console.warn("Failed to fetch workflows:", error.message);
    return [];
  }

  return data;
}