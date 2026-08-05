/**
 * API pagination limits — must stay within backend `Query(..., le=X)` caps.
 * Requesting a higher `limit` than the server allows returns **422**.
 *
 * Full notes, caveats, and a representative backend table:
 * @see docs/api-pagination-limits.md
 *
 * When adding list queries, check the matching FastAPI route and update both
 * this file and the markdown doc if you change behavior or caps.
 */
export const API_LIMITS = {
  /**
   * GET /accounts/ — must be ≤ backend `le=` (this repo: `le=500` in `accounts.py`).
   * If any environment still caps at 100, requests will fail until that API is redeployed.
   */
  ACCOUNTS_LIST_MAX: 500,

  /**
   * Account invoices list on the accounts landing page (join with accounts in the UI).
   * Backend account_invoices `le=1000`; keep this aligned with product needs.
   */
  INVOICES_HUB: 500,

  /**
   * Accounts hub (aggregated + tag tabs), tag-scoped accounts list, Manage Accounts dialog.
   * Payable / Receivable hub tabs still load up to ACCOUNTS_LIST_MAX in one request (invoice join).
   */
  ACCOUNTS_HUB_PAGE_SIZE: 50,

  /** Common tight cap: items, sales_orders, statuses, ledgers, many project/production lists, etc. */
  STRICT_100: 100,

  /** Common relaxed cap: purchase_orders, machines, factories, account_invoices max, account detail invoice navigator, etc. */
  FLEXIBLE_1000: 1000,

  /** GET /work-orders/sheet/ default page size (backend default 50, max 100). */
  WORK_ORDERS_SHEET_PAGE_SIZE: 50,

  /** GET /work-orders/sheet/ max page size. */
  WORK_ORDERS_SHEET_PAGE_MAX: 100,

  /** GET /items/ catalog page size (backend max 100). */
  ITEMS_CATALOG_PAGE_SIZE: 50,

  /** Purchase / expense / transfer order hub list page size (backend default 50, max 100). */
  ORDER_HUB_PAGE_SIZE: 50,

  /** GET /inventory/ Storage page list size (backend default 50, max 1000). */
  STORAGE_PAGE_SIZE: 50,

  /** Max `limit` for GET /purchase-orders/, /expense-orders/, /transfer-orders/ list routes. */
  ORDER_HUB_LIST_MAX: 100,

  /** Show a performance warning in the sheet when total exceeds this count. */
  WORK_ORDERS_SHEET_LARGE_TOTAL_WARNING: 500,
} as const;
