# Account invoice search — design spec

**Date:** 2026-08-20  
**Status:** Approved for implementation

## Problem

Account detail invoice search must find rows by invoice number, vendor invoice number, or linked order number (PO/EXP/SO/WO). Users often see **Inv #42** in the list while `invoice_number` is null (42 is internal id). Search felt broken when typed text did not match stored DB fields.

## Decision

**Simple substring search + honest hints** (not smart prefix stripping).

### What matches

| Input example | Matches |
|---------------|---------|
| `PO-2026-009` | Linked purchase order number (substring, case-insensitive) |
| `EXP-2026-001` | Linked expense order number |
| `SO-…`, `WO-…` | Sales / work order numbers |
| Vendor / internal invoice # | `vendor_invoice_number`, `invoice_number` when set |
| `42` (digits only) | Exact internal invoice **id** (draft rows shown as Inv #42) |

### What does not match

- Display labels with prefixes: `Inv #42`, `Order #PO-…`, `#PO-…`
- Order numbers without type prefix if user expects magic — hint tells them to include `PO-` / `EXP-`

### Backend rules

- Param: existing `invoice_number_search` (no API rename)
- Substring: `ILIKE` with `%term%` on invoice + vendor fields and order number subqueries (forward `order_type`/`order_id` + reverse `order.invoice_id`)
- Escape user `%`, `_`, `\` in ILIKE patterns
- Numeric-only query: also `AccountInvoice.id == int(query)`
- All order subqueries scoped by `workspace_id`

### Frontend UX

- Placeholder: `PO-2026-009, vendor #, or invoice #`
- Helper (when search empty): explains draft invoices → order number with prefix or internal id
- No client-side filtering; server paginated list

## Out of scope

- Auto-strip `Inv #` / `Order #` from input
- Separate invoice vs order search fields
- Transfer order search (no invoice linkage)

## Verification

- Backend: `pytest tests/test_account_invoice_order_number_search.py`
- Manual: search full PO number, vendor #, numeric id on draft, confirm irrelevant queries excluded
