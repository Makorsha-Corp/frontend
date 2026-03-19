/**
 * Account related types
 *
 * Accounts represent external entities (suppliers, clients, utilities, payroll)
 */

import { PaginationParams } from './common';
import { AccountTag } from './accountTag';

/**
 * Tag information in account response
 */
export interface AccountTagInfo {
  id: number;
  name: string;
  tag_code: string;
  color: string | null;
  icon: string | null;
  is_system_tag: boolean;
}

/**
 * Account represents an external entity (supplier, client, utility, employee)
 */
export interface Account {
  id: number;
  workspace_id: number;

  // Basic Info
  name: string;
  account_code: string | null;

  // Contact Info
  primary_contact_person: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  secondary_contact_person: string | null;
  secondary_email: string | null;
  secondary_phone: string | null;

  // Address
  address: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;

  // Business Details
  tax_id: string | null;
  business_registration_number: string | null;

  // Financial Terms
  payment_terms: string | null;
  credit_limit: number | null;
  currency: string | null;

  // Banking Info
  bank_name: string | null;
  bank_account_number: string | null;
  bank_swift_code: string | null;

  // Admin Controls
  allow_invoices: boolean;
  invoices_disabled_reason: string | null;

  // Notes
  notes: string | null;

  // Status & Audit
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  deleted_at: string | null;
  deleted_by: number | null;

  // Tags
  tags?: AccountTagInfo[];  // Tags assigned to this account
}

/**
 * Request body for creating a new account
 */
export interface CreateAccountRequest {
  // Basic Info
  name: string;
  account_code?: string | null;

  // Contact Info
  primary_contact_person?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;

  // Address
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;

  // Financial
  payment_terms?: string | null;
  tax_id?: string | null;

  // Notes
  notes?: string | null;

  // Admin Controls
  allow_invoices?: boolean;
  invoices_disabled_reason?: string | null;

  // Status
  is_active?: boolean;

  // Tags
  tag_ids?: number[];  // IDs of tags to assign
}

/**
 * Request body for updating an existing account
 */
export interface UpdateAccountRequest {
  // Basic Info
  name?: string;
  account_code?: string | null;

  // Contact Info
  primary_contact_person?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;

  // Address
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;

  // Financial
  payment_terms?: string | null;
  tax_id?: string | null;

  // Notes
  notes?: string | null;

  // Admin Controls
  allow_invoices?: boolean;
  invoices_disabled_reason?: string | null;

  // Status
  is_active?: boolean;

  // Tags
  tag_ids?: number[];  // IDs of tags to assign (replaces existing tags)
}

/**
 * Query parameters for listing accounts
 */
export interface ListAccountsParams extends PaginationParams {
  search?: string;  // Search by account name
  tag_code?: string;  // Filter by tag code (supplier, vendor, client, utility, payroll)
}
