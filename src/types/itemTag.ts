/**
 * Item Tag related types
 */

/**
 * Item Tag represents a category/label for items
 */
export interface ItemTag {
  id: number;
  workspace_id: number;
  name: string;
  tag_code: string;
  color: string | null;
  icon: string | null;
  description: string | null;
  is_system_tag: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  created_by: number | null;
}
