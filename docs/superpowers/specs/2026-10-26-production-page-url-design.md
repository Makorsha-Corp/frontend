# Production page URL

**Date:** 2026-10-26  
**Status:** Implemented 2026-10-26

**Supersedes (partially):**

- [2026-07-25 page factory scope](../../../../docs/superpowers/specs/2026-07-25-page-factory-scope-design.md) — Production only. `factoryId` stays in the URL. Other pages still strip their factory param.
- [2026-10-26 week board redesign](./2026-10-26-production-schedule-week-board-redesign-design.md) — the non-goal "URL-persisted week anchor" no longer applies. The Batches week is stored in `batchDate`.

## Problem

A Production link should open the same screen the sender was looking at: tab, factory, dates, filters, and the open batch. The page already has a parser (`productionPageUrl.ts`), but it keeps every tab's keys at once, strips `factoryId` after the first read, and can lose a selection when two URL writes happen in one click.

## Decision

One parser and one writer. Each tab owns an allowlist. A write applies the change, deletes keys the open tab does not own, then sorts the remaining keys. Components never read or write the query string themselves.

`useProductionPageNavigation` is the only caller of `setSearchParams` on this page.

## Goals

- A copied link restores the open tab exactly: factory, view, filters, and the open record.
- Opening that link sets the Production page factory and does not change the navbar factory.
- A navbar factory change after the page is open updates the page and rewrites `factoryId`, so a later copy still matches the screen.
- Switching tabs drops the previous tab's keys in the same write.
- One user action is one URL write.

## Non-goals

- Debouncing the search box.
- Work Orders, or any other page's factory param.
- Changing the navbar factory when a Production link is opened.
- A new missing-batch error screen.
- Keeping the unshipped `runsDate`, `runsScope`, `runsLines`, and `runsMachine` names.

## Keys

`factoryId` is on every tab and is never removed by a tab switch. Omit it only when Production has no numeric factory selected. `q`, `statuses`, and `showCompleted` share names across Overview and Batches. The values do not survive a tab switch.

| Tab | Keys, in this order | Omit when |
|---|---|---|
| Overview | `factoryId`, `lineId`, `q`, `showCompleted`, `statuses`, `batchFrom`, `batchTo` | `tab` (overview is the default). Empty search, completed off, default statuses, no line, no date range |
| Batches | `tab=batches`, `factoryId`, `batchId`, `batchDate`, `batchDateScope`, `batchLines`, `q`, `showCompleted`, `batchMachine`, `statuses` | No open batch. Week omits `batchDateScope`. All lines, all machines, empty search, completed off, default statuses |
| Setup | `tab=setup`, `factoryId`, `formulaId`, `setupQ` | No focused recipe, empty setup search |

`lineId` is Overview only. Batches lines use `batchLines`.

### Batches date

- **Week:** `batchDate` set (`yyyy-MM-dd` week anchor), no `batchDateScope`.
- **Day:** `batchDate` plus `batchDateScope=day`.
- **All dates:** `batchDateScope=all` and no `batchDate`.

When a tab change lands on Batches and both date keys are absent, that same push includes this week's anchor. A direct load of Batches with both date keys absent writes the anchor with a replace. `batchDateScope=all` counts as present: do not seed over it.

`batchLines` is a comma-separated list of line ids, sorted numerically. `none` means no lines. Omit the param when every line of the factory is selected. `showCompleted` is `1` when on. `statuses` is a comma-separated list.

## Writes

One user action calls the writer once.

1. Apply the patch.
2. Delete every key the resulting tab does not own.
3. Sort the remaining keys into the order in the table above (`tab` first when present, then `factoryId`, then the rest of that tab's list).

History:

- **Push** when the screen changes: tab, week / day / all dates, open batch, close batch.
- **Replace** for filter changes, the page-header factory pick, the navbar factory follow, invalid-param cleanup, and the Batches week seed.

A week-card click is one push that sets `batchDate`, `batchDateScope=day`, and `batchId` together.

A tab change is one push that sets `tab` and drops the other tab's keys.

## Factory

- A link with `factoryId` sets the page factory through the existing visit-local override. The navbar is not changed. The param stays.
- The page-header factory picker writes `factoryId` and does not change the navbar.
- After the first paint, a navbar factory change updates the page factory and rewrites `factoryId` (replace). If the navbar factory is cleared, omit `factoryId`. The first paint must not treat the navbar factory already in memory as a change. A deep link is not overwritten by that value.
- No numeric factory: omit `factoryId`.

## Bad links

On load, one replace pass cleans the query string.

- Delete keys the open tab does not own.
- Delete an unknown `tab`, a non-number id, or a date that is not `yyyy-MM-dd`. Leave the other keys.
- `batchDateScope` may only be `day` or `all`. Delete anything else. Delete `day` when `batchDate` is missing. The week seed then runs if both date keys are gone.
- Drop status tokens that are not real batch statuses. If none remain, omit `statuses`.
- Check `batchLines` and `batchMachine` only after that factory's lines and machines have loaded. Remove unknown ids. If no line ids remain, omit `batchLines` (all lines). Do not check before the lists load.
- Delete a `factoryId` that is not a factory in this workspace. The page then uses the navbar factory.
- A well-formed `batchId` the API cannot find keeps the current missing-batch detail. Do not add a new error screen.

## Tests

Extend `frontend/src/pages/newpages/production/productionPageUrl.test.ts`. No Playwright.

- Each tab write keeps only that tab's keys. `factoryId` survives all three.
- Key order matches the table.
- Defaults stay omitted: no `tab` on Overview, no `batchDateScope` on week, no param for all lines, all machines, or completed off.
- One Batches write can set `batchDate`, `batchDateScope=day`, and `batchId` together.
- The cleanup pass drops foreign keys, bad ids, bad dates, a bad scope, `day` with no date, and unknown status tokens.
- `batchDateScope=all` removes `batchDate`.

## Files

- `frontend/src/pages/newpages/production/productionPageUrl.ts` — allowlists, one writer, cleanup.
- `frontend/src/pages/newpages/production/productionPageUrl.test.ts` — the cases above.
- `frontend/src/pages/newpages/production/useProductionPageNavigation.ts` — single write per action, factory follow, week seed, stop stripping `factoryId`.
- `frontend/src/pages/newpages/ProductionPage.tsx` — pass the combined day-and-batch callback only. No direct query-string access.
