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
   * Account detail page: invoices sidebar uses `skip`/`limit` pagination (not a server cap).
   * Totals row uses up to FLEXIBLE_1000 in one request; if an account exceeds that, totals may be partial.
   */
  ACCOUNT_INVOICE_PAGE_SIZE: 11,

  /**
   * Accounts hub (aggregated + tag tabs), tag-scoped accounts list, Manage Accounts dialog.
   * Payable / Receivable hub tabs still load up to ACCOUNTS_LIST_MAX in one request (invoice join).
   */
  ACCOUNTS_HUB_PAGE_SIZE: 50,

  /** Common tight cap: items, sales_orders, statuses, ledgers, many project/production lists, etc. */
  STRICT_100: 100,

  /** Common relaxed cap: purchase_orders, machines, factories, account_invoices max, etc. */
  FLEXIBLE_1000: 1000,
} as const;
