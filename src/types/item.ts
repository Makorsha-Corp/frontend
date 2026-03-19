/**
 * Item (Parts/Inventory) related types
 *
 * Items represent the universal catalog of materials, parts, consumables, and goods
 */

import { PaginationParams } from './common';
import { ItemTag } from './itemTag';

/**
 * Tag information in item response
 */
export interface ItemTagInfo {
  id: number;
  name: string;
  tag_code: string;
  color: string | null;
  icon: string | null;
  is_system_tag: boolean;
}

/**
 * Item represents an entry in the item catalog
 */
export interface Item {
  id: number;
  workspace_id: number;
  name: string;
  description: string | null;
  unit: string;  // e.g., "kg", "pcs", "L"
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  tags?: ItemTagInfo[];  // Tags assigned to this item
}

/**
 * Request body for creating a new item
 */
export interface CreateItemRequest {
  name: string;
  description?: string | null;
  unit: string;
  tag_ids?: number[];  // IDs of tags to assign
}

/**
 * Request body for updating an existing item
 */
export interface UpdateItemRequest {
  name?: string;
  description?: string | null;
  unit?: string;
  is_active?: boolean;
  tag_ids?: number[];  // IDs of tags to assign (replaces existing tags)
}

/**
 * Query parameters for listing items
 */
export interface ListItemsParams extends PaginationParams {
  search?: string;  // Search by item name
}
