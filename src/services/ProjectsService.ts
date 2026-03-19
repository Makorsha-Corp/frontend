import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";
import { Project } from "@/types";
import { calculateProjectComponentTotalCost } from "./ProjectComponentService";

// Fetch all projects with optional filtering, pagination, and sorting
export const fetchProjects = async (
  factoryId?: number,
  page: number = 1,
  limit: number = 10,
  sortOrder: "asc" | "desc" | null = null
) => {
  let query = supabase_client
    .from("projects")
    .select("*", { count: "exact" });

  if (factoryId !== undefined && factoryId !== -1) {
    query = query.eq("factory_id", factoryId);
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  if (sortOrder) {
    query = query.order("created_at", { ascending: sortOrder === "asc" });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching projects:", error.message);
    toast.error("Failed to fetch projects");
    return { data: [], count: 0 };
  }

  return { data: data as Project[], count };
};

// Fetch a single project by ID
export const fetchProjectById = async (projectId: number) => {
  const { data, error } = await supabase_client
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project:", error.message);
    toast.error("Failed to fetch project");
    return null;
  }

  return data as Project;
};

// Fetch all projects belonging to a specific factory
export const fetchProjectsByFactoryId = async (factoryId: number) => {
  const { data, error } = await supabase_client
    .from("projects")
    .select("*")
    .eq("factory_id", factoryId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects by factory:", error.message);
    toast.error("Failed to fetch factory projects");
    return [];
  }

  return data as Project[];
};

// Fetch specific projects by a list of IDs
export const fetchProjectsByIds = async (projectIds: number[]) => {
  const { data, error } = await supabase_client
    .from("projects")
    .select("*")
    .in("id", projectIds);

  if (error) {
    console.error("Error fetching projects by IDs:", error.message);
    toast.error("Failed to fetch selected projects");
    return [];
  }

  return data as Project[];
};

// Fetch minimal list of project id + names for dropdowns
export const fetchAllProjectNames = async (factoryId?: number) => {
  let query = supabase_client.from("projects").select("id, name");

  if (factoryId !== undefined && factoryId !== -1) {
    query = query.eq("factory_id", factoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching project names:", error.message);
    toast.error("Failed to fetch project names");
    return [];
  }

  return data as { id: number; name: string }[];
};


export const addProject = async (projectData: Partial<Project>) => {
  const { data, error } = await supabase_client
    .from("projects")
    .insert([projectData])
    .select()
    .single();

  if (error) {
    console.error("Error adding project:", error.message);
    toast.error("Failed to add project");
    return null;
  }

  toast.success("Project added successfully");
  return data as Project;
};


// Update a project by ID
export const updateProject = async (
  projectId: number,
  updateData: Partial<Project>
) => {
  const { error } = await supabase_client
    .from("projects")
    .update(updateData)
    .eq("id", projectId);

  if (error) {
    console.error("Error updating project:", error.message);
    toast.error("Failed to update project");
    return false;
  }

  toast.success("Project updated successfully");
  return true;
};

// Count projects by status (for metrics)
export const fetchMetricProjectsByStatusCount = async (
  status: "PLANNING" | "STARTED" | "COMPLETED"
) => {
  const { count, error } = await supabase_client
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    console.error(`Error fetching metric for ${status} projects:`, error.message);
    return null;
  }

  return count;
};


export const fetchMetricProjectsByPriorityCount = async (
  priority: "LOW" | "MEDIUM" | "HIGH"
) => {
  const { count, error } = await supabase_client
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("priority", priority);

  if (error) {
    console.error(`Error fetching metric for ${priority} priority:`, error.message);
    return null;
  }

  return count;
};


// Calculate total project cost (sum of all component totals: orders + misc expenses)
export const calculateProjectTotalCost = async (projectId: number): Promise<number> => {
  try {
    // 1. Get all project components for this project
    const { data: components, error: componentsError } = await supabase_client
      .from("project_components")
      .select("id")
      .eq("project_id", projectId);

    if (componentsError) {
      console.error("Error fetching project components:", componentsError.message);
      return 0;
    }

    if (!components || components.length === 0) {
      return 0;
    }

    let projectTotalCost = 0;
    for (const component of components) {
      const componentTotal = await calculateProjectComponentTotalCost(component.id);
      projectTotalCost += componentTotal;
    }

    return projectTotalCost;

  } catch (error) {
    console.error("Error calculating project total cost:", error);
    return 0;
  }
}
