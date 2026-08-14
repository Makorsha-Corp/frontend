# Expense Orders Financial Overview

**Date:** 2026-08-11  
**Status:** Implemented

## Summary

Replace the Expense Orders hub overview table with a financial snapshot (lean v2: 3 widgets). Filter-scoped category follows the filter strip; due/unpaid always reflect all open non-voided expenses in the workspace.

## Goals

- Overview optimizes for **financial lens** (not recent-orders table or PO-style activity/attention).
- **Replace** the `OrdersOverviewTable` on overview entirely.
- **Mixed scope:** category respects filters; due timeline and unpaid pipeline ignore filters.

## Layout (lean v2 — 3 cards)

```
┌─────────────────────────────────────────────────────────┐
│ KPI row (unchanged): total, value, open pipeline, etc.  │
├─────────────────────────────────────────────────────────┤
│ Category breakdown (filter-scoped)                      │
├──────────────────────────┬──────────────────────────────┤
│ Due timeline             │ Unpaid pipeline              │
└──────────────────────────┴──────────────────────────────┘
```

Removed from UI (v2): **Stage pipeline** (KPI row + strip cover this), **Open by account** (account filter enough). Backend still returns those fields; frontend ignores them.

## Widgets

| Widget | Scope | Click behavior |
|--------|-------|----------------|
| Category breakdown | Filter-scoped | Apply category filter in URL |
| Due timeline | All open expenses | Open order detail (sample rows) |
| Unpaid pipeline | All open with invoice | Open order detail (sample rows) |

### Due buckets

- Overdue (`due_date < today`)
- Due this week (today through end of calendar week)
- Due later this month (after week through end of month)
- No due date

Orders due after the current month are excluded from due timeline in v1.

### Unpaid buckets

Open orders with linked non-voided invoices grouped by `payment_status`: unpaid, partial, overdue. Outstanding = `invoice_amount - paid_amount`.

## API

Extended `GET /expense-orders/stats/` with `financial_snapshot` on `ExpenseOrderHubStatsResponse`. Single RTK query refreshes KPIs and widgets together. `recent_orders` retained in API but unused by overview.

## Frontend

- `ExpenseOrderFinancialOverview.tsx` — 3 widget cards (category, due, unpaid)
- `ExpenseOrdersOverviewPanel.tsx` — KPI row + financial overview
- `ExpenseOrdersPage.tsx` — filter navigation callbacks from widget clicks

## Out of scope (v1)

- Recent activity / needs-attention (PO pattern)
- Chart library
- Recurring expense / template widgets
- Per-user approval queue
- Removing `recent_orders` from API

## Verification

- Backend: `pytest tests/test_expense_order_financial_snapshot.py`
- Frontend: `npm run build`
- Manual: filter strip updates filter-scoped widgets; due/unpaid stay on open workspace set; clicks apply filters or open detail
