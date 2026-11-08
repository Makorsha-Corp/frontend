# Batches tab split scroll

## Goal

Batches tab uses the purchase-order list/detail shell. The run list scrolls on its own. The selected run and its event log scroll together in the right pane. Padding sits on the detail body, so the scrollbar stays on the pane edge and does not shrink the cards.

## Layout

- Only the Batches tab in `ProductionPage.tsx` changes. Overview, Schedule, and Setup stay as they are.
- The tab is a flex row, `p-0`, filling the tab panel. No CSS grid. No outer page padding on this tab.
- Left rail: full height, `bg-card`, `border-r`, `lg:w-[360px]`. Header (`N batches` + New run) does not scroll. The list is `flex-1 min-h-0 overflow-y-auto`.
- Right pane: `flex-1 min-w-0 overflow-hidden`. One scroller: `flex-1 min-h-0 overflow-y-auto`. Run detail and event log sit in `px-4 pb-6 pt-4 space-y-6 lg:px-6`.
- Breakpoint is `lg` (1024px) via `useIsLgScreen`.
- Below `lg`, a selected run hides the rail. No selection hides the detail. The existing close control clears `selectedBatchId` and returns to the list.
- Desktop with nothing selected shows “Select a batch to view details” in the right pane.
- The event log is not height-capped and has no inner scrollbar of its own.

## Out of scope

- No shared shell component with Orders.
- No change to run editing, start, finish, or activity filters.
- No Playwright spec unless asked later.

## Files

- `src/pages/newpages/ProductionPage.tsx` — Batches tab markup only.
