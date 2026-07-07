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
  sku?: string | null;
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
  sku?: string | null;
  tag_ids?: number[];  // IDs of tags to assign
}

/**
 * Request body for updating an existing item
 */
export interface UpdateItemRequest {
  name?: string;
  description?: string | null;
  unit?: string;
  sku?: string | null;
  is_active?: boolean;
  tag_ids?: number[];  // IDs of tags to assign (replaces existing tags)
}

/**
 * Query parameters for listing items
 */
export interface ListItemsParams extends PaginationParams {
  search?: string;  // Search by item name
}

/** Match from GET /items/similar/ */
export type SimilarItemMatchType = 'exact_normalized' | 'fuzzy';

export interface SimilarItemMatch {
  id: number;
  name: string;
  unit: string;
  sku: string | null;
  similarity_score: number;
  match_type: SimilarItemMatchType;
}

export interface SimilarItemsResponse {
  query: string;
  normalized_query: string;
  matches: SimilarItemMatch[];
}

export interface GetSimilarItemsParams {
  name: string;
  limit?: number;
}

/** Minimum normalized name length before similar-item lookup runs */
export const ITEM_SIMILAR_NAME_MIN_LENGTH = 3;

/** Mirror backend pg_trgm threshold */
export const ITEM_SIMILARITY_THRESHOLD = 0.35;
