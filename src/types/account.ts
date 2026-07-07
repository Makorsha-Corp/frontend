/**
 * Account related types
 *
 * Accounts represent external entities (suppliers, clients, utilities, payroll)
 */

import { PaginationParams } from './common';

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
 * Strict backend account response shape (OpenAPI AccountResponse).
 */
export interface AccountApiResponse {
  id: number;
  workspace_id: number;
  name: string;
  account_code: string | null;
  primary_contact_person: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  secondary_contact_person: string | null;
  secondary_email: string | null;
  secondary_phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  payment_preferences: string | null;
  bank_details: string | null;
  allow_invoices: boolean;
  is_active: boolean;
  created_at: string;
}

/**
 * UI account model (strict response + optional expanded fields returned by backend).
 */
export type Account = AccountApiResponse & {
  account_tags?: AccountTagInfo[];
};

/**
 * Request body for creating a new account
 */
export interface CreateAccountRequest {
  // Basic Info
  name: string;
  account_code?: string | null;
  primary_contact_person?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  secondary_contact_person?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  payment_preferences?: string | null;
  bank_details?: string | null;

  allow_invoices?: boolean;
  tag_ids?: number[];
}

/**
 * Request body for updating an existing account
 */
export interface UpdateAccountRequest {
  // Basic Info
  name?: string;
  account_code?: string | null;
  primary_contact_person?: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  secondary_contact_person?: string | null;
  secondary_email?: string | null;
  secondary_phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  payment_preferences?: string | null;
  bank_details?: string | null;

  allow_invoices?: boolean;
  is_active?: boolean;
  tag_ids?: number[];
}

/**
 * Query parameters for listing accounts
 */
export interface ListAccountsParams extends PaginationParams {
  search?: string;  // Search by account name
  tag_code?: string;  // Filter by tag code (supplier, vendor, client, utility, payroll)
}

/** Aggregate invoice totals from GET /accounts/{id}/invoice-summary/ */
export interface AccountInvoiceSummaryApiResponse {
  invoice_count: number;
  invoiced_total: string;
  paid_total: string;
  outstanding_total: string;
}

export interface AccountInvoiceSummary {
  invoiceCount: number;
  invoiced: number;
  paid: number;
  outstanding: number;
}

export interface AccountInvoiceSummaryParams {
  account_id: number;
  invoice_type?: 'payable' | 'receivable';
  payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue';
  invoice_status?: 'draft' | 'confirmed' | 'voided';
  invoice_number_search?: string;
  invoice_date_from?: string;
  invoice_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  amount_min?: number;
  amount_max?: number;
}
