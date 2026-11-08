### Task 6: Grid and day popup

**Files:**
- Create: `frontend/src/components/newcomponents/customui/production/ProductionScheduleDayDialog.tsx`
- Modify: `frontend/src/components/newcomponents/customui/production/ProductionScheduleTab.tsx`

**Interfaces:**
- Consumes: `scheduleStepsForCell`, `scheduleStepsForDay`, `scheduleStepCardText`, `scheduleStepStatusLabel`, `useGetWorkspaceShiftsQuery`, `useUserTimeFormat`
- Produces: day header button sets `dayDialog` state. Card `onClick` calls `onOpenBatch(batch.batch_id)` and does not drag.

- [ ] **Step 1: Change the card and the day header**

Replace the card body that renders `batch.batch_number` and `step.stage_name` with `scheduleStepCardText`. Remove `draggable`, `onDragStart`, and the drop handlers on the cell. Keep the plus class:

`absolute bottom-0.5 right-0.5 flex h-5 w-5 ... opacity-0 ... group-hover/cell:opacity-100 focus-visible:opacity-100`

Make the day header a `<button type="button">` that sets the selected day. Title stays `day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })`.

Build the cell list with `scheduleStepsForCell(scheduleBatches, line.id, day)` instead of the inline `production_line_id === line.id` filter.

- [ ] **Step 2: Add the dialog**

`ProductionScheduleDayDialog` props:

```typescript
{
  day: Date | null;
  batches: ProductionScheduleBatch[];
  lines: { id: number; name: string }[];
  onOpenChange: (open: boolean) => void;
  onOpenBatch: (batchId: number) => void;
  onAddBatch: (day: Date) => void;
}
```

When `day` is null, the dialog is closed. Rows come from `scheduleStepsForDay`. Line label is the matching line name, or **Unassigned**. Show start and end via `formatWallTimeHm` on both timestamps. Show `scheduleStepStatusLabel`. Step name only when it is not equal to the line name. Machine name comes from the line’s machines already loaded on the tab (`machinesForLine`). When `machine_id` is set and that machine is on the step’s line, show its name. When `machine_id` is null, show nothing. Do not print a raw id. Row click calls `onOpenBatch` and closes. **Add batch** calls `onAddBatch(day)` and closes.

`ProductionPage` already seeds a line and a day from `onCreateOnCell`. The dialog’s `onAddBatch` must call a date-only seed. Add an optional `onCreateOnDay?: (day: Date) => void` prop on `ProductionScheduleTab` and pass it from `ProductionPage` without a line id. Do not reuse `onCreateOnCell` for the dialog.

- [ ] **Step 3: Run the helper tests**

Run: `npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts src/components/newcomponents/customui/production/productionScheduleWeek.test.ts` from `frontend/`

Expected: PASS.

- [ ] **Step 4: Commit**

User runs this. Agent does not.

```bash
git add src/components/newcomponents/customui/production/ProductionScheduleDayDialog.tsx src/components/newcomponents/customui/production/ProductionScheduleTab.tsx src/pages/newpages/ProductionPage.tsx
git commit -m "feat: open a schedule day popup from the day header"
```

---

