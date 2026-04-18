# API pagination limits (frontend ↔ backend)

List endpoints use `skip` and `limit` query parameters. FastAPI validates `limit` with `le=<max>` per route. **If the frontend requests a higher `limit` than the backend allows, the API returns 422** (sometimes surfaced as **400** by proxies) and RTK Query may show empty or error states.

**Deploy drift:** the frontend must not send a higher `limit` than **the environment you are calling**. `API_LIMITS.ACCOUNTS_LIST_MAX` is **500** to match this repo’s `GET /accounts/` (`le=500`). If you point the app at an older API still on `le=100`, either redeploy the backend or temporarily lower that constant to 100.

## Why this document exists

- Limits are **inconsistent across endpoints** (many use `le=100`, several use `le=1000`, audit logs use `le=200`, etc.).
- Some screens load **two** lists (e.g. accounts + invoices) and assume both windows are large enough to join in the UI; that coupling can break as data grows.
- **We may need to revisit limits** when workspaces have more rows than a single page: prefer proper pagination, higher caps, or server-side filters (e.g. “accounts with open receivable”) instead of only raising `le`.

## Frontend source of truth

Use constants from [`src/constants/apiLimits.ts`](../src/constants/apiLimits.ts) where possible, and keep that file in sync when backend `le=` values change.

## Backend snapshot (representative)

Regenerate or spot-check with ripgrep when changing the API:

| Typical `le` | Example endpoints |
|--------------|-------------------|
| **100** | `items`, `sales_orders`, **`GET /accounts/`** (default / many deployed envs), `sales_deliveries`, `statuses`, `ledgers`, `storage_items`, `project_component_*`, `production_lines`, `production_formulas`, `production_batches`, `orders`, `access_control`, … |
| **200** | `financial_audit_logs` (multiple list routes) |
| **500** | **`GET /accounts/`** in **this repo** after deploy (accounts hub); not necessarily on Railway until shipped |
| **1000** | `purchase_orders`, `transfer_orders`, `expense_orders`, `work_orders`, `account_invoices`, `invoice_payments`, `machines`, `factories`, `projects`, `inventory`, `products`, … |

This table is **not exhaustive**; always confirm in `backend/app/api/v1/endpoints/*.py`.

## Accounts hub caveat (Receivable / Payable tabs)

The accounts landing page loads up to **`API_LIMITS.INVOICES_HUB`** receivable invoices and **`API_LIMITS.INVOICES_HUB`** payable invoices, and up to **`API_LIMITS.ACCOUNTS_LIST_MAX`** accounts, then **filters in the browser**. Counterparties beyond those windows will not appear until we add pagination or dedicated backend filters.
