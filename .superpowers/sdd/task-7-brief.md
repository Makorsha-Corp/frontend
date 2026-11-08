### Task 7: Programs dialog

**Files:**
- Modify: `frontend/src/features/production/productionApi.ts`
- Modify: `frontend/src/types/production.ts`
- Create: `frontend/src/components/newcomponents/customui/production/ProductionScheduleProgramsDialog.tsx`
- Modify: `frontend/src/components/newcomponents/customui/production/ProductionScheduleTab.tsx`

**Interfaces:**
- Consumes: `POST /production-batch-programs/`, `POST /production-batch-programs/{id}/stop/`, `GET /production-batch-programs/?factory_id=`, `useGetProductionFormulaByIdQuery` or `useGetFormulaStagesQuery`
- Produces: toolbar button **Recurring programs**, visible only when a factory is selected. Save sends `factory_id`, `formula_id`, `first_start_at`, `cadence`, `end_date`. If any stage has `expected_duration_minutes` null, confirm with the warning text `Some steps have no duration. They will start at the same time as the previous step.` and still POST when the user confirms. There is no control to change recipe, cadence, or first start after create. Stop calls the stop endpoint and invalidates the schedule query.

- [ ] **Step 1: Add the RTK endpoints**

Tag `ProductionSchedule` on create and stop so `getProductionSchedule` refetches. Types:

```typescript
export interface ProductionBatchProgram {
  id: number;
  factory_id: number;
  formula_id: number;
  first_start_at: string;
  cadence: 'daily' | 'weekly' | 'monthly';
  end_date: string;
  status: 'active' | 'stopped';
  batch_count?: number;
}
```

- [ ] **Step 2: Build the dialog**

List programs for the current factory. Each active row has **Stop**. The create form has recipe select, datetime-local first start, cadence select, and end date. Disable save when recipe, first start, or end date is empty.

- [ ] **Step 3: Run helper tests again**

Run: `npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts` from `frontend/`

Expected: PASS.

- [ ] **Step 4: Commit**

User runs this. Agent does not.

```bash
git add src/features/production/productionApi.ts src/types/production.ts src/components/newcomponents/customui/production/ProductionScheduleProgramsDialog.tsx src/components/newcomponents/customui/production/ProductionScheduleTab.tsx
git commit -m "feat: create recurring production programs from the schedule"
```
