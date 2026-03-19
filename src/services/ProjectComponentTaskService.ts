import { supabase_client } from "./SupabaseClient";
import toast from "react-hot-toast";
import { ProjectComponentTask } from "@/types";

// Fetch all tasks for a given component with optional sorting
export const fetchProjectComponentTasks = async (
  componentId: number,
  sortOrder: "asc" | "desc" = "desc"
) => {
  const { data, error } = await supabase_client
    .from("project_component_tasks")
    .select("*")
    .eq("project_component_id", componentId)
    .order("created_at", { ascending: sortOrder === "asc" });

  if (error) {
    console.error("Error fetching tasks:", error.message);
    toast.error("Failed to fetch tasks");
    return [];
  }

  return data as ProjectComponentTask[];
};

// Fetch only notes
export const fetchProjectComponentNotes = async (
  componentId: number
) => {
  const { data, error } = await supabase_client
    .from("project_component_tasks")
    .select("*")
    .eq("project_component_id", componentId)
    .eq("is_note", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error.message);
    toast.error("Failed to fetch notes");
    return [];
  }

  return data as ProjectComponentTask[];
};

// Fetch only todos (not notes)
export const fetchProjectComponentTodoTasks = async (
  componentId: number
) => {
  const { data, error } = await supabase_client
    .from("project_component_tasks")
    .select("*")
    .eq("project_component_id", componentId)
    .eq("is_note", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching todos:", error.message);
    toast.error("Failed to fetch todos");
    return [];
  }

  return data as ProjectComponentTask[];
};

// Add a new task
export const addProjectComponentTask = async (
  taskData: Partial<ProjectComponentTask>
) => {
  const { error } = await supabase_client
    .from("project_component_tasks")
    .insert([taskData]);

  if (error) {
    console.error("Error adding task:", error.message);
    toast.error("Failed to add task");
    return false;
  }

  toast.success("Task added successfully");
  return true;
};

// Update task
export const updateProjectComponentTask = async (
  id: number,
  updateData: Partial<ProjectComponentTask>
) => {
  const { error } = await supabase_client
    .from("project_component_tasks")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating task:", error.message);
    toast.error("Failed to update task");
    return false;
  }

  toast.success("Task updated successfully");
  return true;
};

// Toggle completion state
export const toggleProjectComponentTaskCompletion = async (
  id: number,
  isCompleted: boolean
) => {
  const { error } = await supabase_client
    .from("project_component_tasks")
    .update({ is_completed: isCompleted })
    .eq("id", id);

  if (error) {
    console.error("Error toggling completion:", error.message);
    toast.error("Failed to update completion status");
    return false;
  }

  toast.success(
    isCompleted ? "Task marked as completed" : "Task marked as incomplete"
  );
  return true;
};

// Bulk complete tasks
export const completeMultipleProjectComponentTasks = async (taskIds: number[]) => {
  const { error } = await supabase_client
    .from("project_component_tasks")
    .update({ is_completed: true })
    .in("id", taskIds);

  if (error) {
    console.error("Error completing multiple tasks:", error.message);
    toast.error("Failed to complete tasks");
    return false;
  }

  toast.success("Selected tasks marked as completed");
  return true;
};

// Delete task
export const deleteProjectComponentTask = async (id: number) => {
  const { error } = await supabase_client
    .from("project_component_tasks")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting task:", error.message);
    toast.error("Failed to delete task");
    return false;
  }

  toast.success("Task deleted successfully");
  return true;
};

// Metrics: count of completed or incomplete tasks
export const fetchMetricProjectComponentTasksByCompletion = async (
  componentId: number,
  isCompleted: boolean
) => {
  const { count, error } = await supabase_client
    .from("project_component_tasks")
    .select("*", { count: "exact", head: true })
    .eq("project_component_id", componentId)
    .eq("is_completed", isCompleted);

  if (error) {
    console.error("Error fetching task metric:", error.message);
    return null;
  }

  return count;
};
