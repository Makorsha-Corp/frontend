/**
 * Account Tag related types
 */

/**
 * Account Tag represents a category/label for accounts
 * (supplier, client, utility, payroll, etc.)
 */
export interface AccountTag {
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
