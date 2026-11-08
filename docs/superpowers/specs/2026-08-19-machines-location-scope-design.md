# Machines page location scope — design spec

**Date:** 2026-08-19  
**Status:** Implemented

See implementation in `MachinesPage.tsx`, `machinesLocationFilters.ts`, `MachinesInlineLocationFilters.tsx`, `MachinesFiltersPopover.tsx`, `useWorkOrdersFilters.ts`.

Single location `{ factoryId, sectionId }` — header is source of truth; KPI/list/API read it; Filters dialog has no location pickers on Machines page.
