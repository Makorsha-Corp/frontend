import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { parseProductionQuantity } from '@/lib/productionQuantity';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  EmphasisTabsProvider,
  EmphasisTabsList,
  EmphasisTabsTrigger,
  EmphasisTabPanel,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ItemSelectSummaryButton } from '@/components/newcomponents/customui/ItemSelectSummaryButton';
import ItemSelectorDialog, { type ItemSelection } from '@/components/newcomponents/customui/ItemSelectorDialog';
import { catalogTagCodesForProductionRole } from '@/lib/productionItemCatalogTags';
import { Input } from '@/components/ui/input';
import {
  useAddFormulaStageItemMutation,
  useAddFormulaStageParameterMutation,
  useEnsureStageInputHandoffMutation,
  useGetFormulaStageParametersQuery,
  useRemoveFormulaStageItemMutation,
  useRemoveFormulaStageParameterMutation,
  useUpdateFormulaStageItemMutation,
  useUpdateFormulaStageMutation,
  useUpdateFormulaStageParameterMutation,
} from '@/features/production/productionApi';
import type {
  ItemRole,
  ProductionFormulaStageItem,
  ProductionFormulaStageParameter,
} from '@/types/production';
import { appToast } from '@/lib/appToast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Trash2 } from 'lucide-react';
import { TransformingAddRow } from '@/components/newcomponents/customui/TransformingAddRow';

type MaterialsTab = 'input' | 'output';

const ROLE_BADGE: Record<ItemRole, string> = {
  input: 'border-transparent bg-blue-500/15 text-blue-800 dark:text-blue-200',
  output: 'border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  waste: 'border-transparent bg-amber-500/15 text-amber-900 dark:text-amber-100',
  byproduct: 'border-transparent bg-violet-500/15 text-violet-800 dark:text-violet-200',
};

const TAB_HELP: Record<MaterialsTab, string> = {
  input: 'Items consumed at this station, plus step conditions (heat, turns, etc.).',
  output: 'Product, waste, and byproducts leaving this step.',
};

export interface FormulaStageMaterialsHandle {
  isDirty: () => boolean;
  save: () => Promise<boolean>;
}

export interface FormulaStageMaterialsBlockProps {
  formulaId: number;
  stageId: number;
  /** Shown under the section title so users know which path step is active. */
  stageTitle?: string;
  stageUnassigned?: boolean;
  stageItems: ProductionFormulaStageItem[];
  items: { id: number; name: string; unit?: string }[];
  getItemName: (id: number) => string;
  factoryId?: number | null;
  isLoading?: boolean;
  /** When set, step 2+ inputs wait on previous outputs and copy from them. */
  inputHandoff?: {
    requiresPreviousOutputs: boolean;
    previousOutputCount: number;
  };
  onDirtyChange?: (dirty: boolean) => void;
}

function formatItemLabel(
  itemId: number,
  getItemName: (id: number) => string,
  items: { id: number; name: string; unit?: string }[],
): string {
  const name = getItemName(itemId);
  const unit = items.find((i) => i.id === itemId)?.unit;
  return unit ? `${name} (${unit})` : name;
}

const FormulaStageMaterialsBlock = forwardRef<FormulaStageMaterialsHandle, FormulaStageMaterialsBlockProps>(function FormulaStageMaterialsBlock({
  formulaId,
  stageId,
  stageTitle,
  stageUnassigned = false,
  stageItems,
  items,
  getItemName,
  factoryId = null,
  isLoading = false,
  inputHandoff,
  onDirtyChange,
}, ref) {
  const [materialsTab, setMaterialsTab] = useState<MaterialsTab>('input');
  const [addItemId, setAddItemId] = useState<number | null>(null);
  const [addQty, setAddQty] = useState('1');
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerRole, setItemPickerRole] = useState<ItemRole>('input');
  const [addExpanded, setAddExpanded] = useState(false);
  const [wasteByproductAddRole, setWasteByproductAddRole] = useState<'waste' | 'byproduct' | null>(
    null,
  );
  const [conditionAddExpanded, setConditionAddExpanded] = useState(false);
  const [condLabel, setCondLabel] = useState('');
  const [condValue, setCondValue] = useState('');
  const [condUnit, setCondUnit] = useState('');
  const [condDrafts, setCondDrafts] = useState<
    Record<number, { label: string; planned_value: string; unit: string }>
  >({});
  const [addFormulaStageItem, { isLoading: isAdding }] = useAddFormulaStageItemMutation();
  const [ensureStageInputHandoff] = useEnsureStageInputHandoffMutation();
  const [removeFormulaStageItem] = useRemoveFormulaStageItemMutation();
  const [updateFormulaStageItem] = useUpdateFormulaStageItemMutation();
  const [updateFormulaStage] = useUpdateFormulaStageMutation();
  const [outputQtyDrafts, setOutputQtyDrafts] = useState<Record<number, string>>({});
  const { data: stageParameters = [], isLoading: loadingParameters } = useGetFormulaStageParametersQuery(
    { formulaId, stageId },
    { skip: !formulaId || !stageId },
  );
  const [addFormulaStageParameter, { isLoading: isAddingParameter }] =
    useAddFormulaStageParameterMutation();
  const [updateFormulaStageParameter] = useUpdateFormulaStageParameterMutation();
  const [removeFormulaStageParameter] = useRemoveFormulaStageParameterMutation();
  const outputSnapshots = useRef<Map<number, ProductionFormulaStageItem>>(new Map());
  const parameterSnapshots = useRef<Map<number, ProductionFormulaStageParameter>>(new Map());

  const inputsBlockedByHandoff =
    inputHandoff?.requiresPreviousOutputs === true && inputHandoff.previousOutputCount === 0;
  const shouldEnsureInputHandoff =
    inputHandoff?.requiresPreviousOutputs === true &&
    inputHandoff.previousOutputCount > 0 &&
    stageItems.filter((row) => row.item_role === 'input').length === 0;

  const counts = useMemo(() => {
    const input = stageItems.filter((r) => r.item_role === 'input').length;
    const output = stageItems.filter((r) => r.item_role === 'output').length;
    return { input, output };
  }, [stageItems]);

  useEffect(() => {
    setAddItemId(null);
    setAddQty('1');
    setItemPickerOpen(false);
    setAddExpanded(false);
    setWasteByproductAddRole(null);
    setConditionAddExpanded(false);
    setCondLabel('');
    setCondValue('');
    setCondUnit('');
  }, [stageId]);

  useEffect(() => {
    setCondDrafts((prev) => {
      const next = { ...prev };
      for (const row of stageParameters) {
        if (next[row.id] != null) continue;
        next[row.id] = {
          label: row.label,
          planned_value: row.planned_value,
          unit: row.unit ?? '',
        };
      }
      return next;
    });
  }, [stageParameters]);

  useEffect(() => {
    setOutputQtyDrafts((prev) => {
      const next = { ...prev };
      for (const row of stageItems.filter((r) => r.item_role === 'output')) {
        if (next[row.id] != null) continue;
        next[row.id] = String(row.quantity);
      }
      return next;
    });
  }, [stageItems]);

  useEffect(() => {
    setAddItemId(null);
    setAddQty('1');
    setItemPickerOpen(false);
    setAddExpanded(false);
    setWasteByproductAddRole(null);
  }, [materialsTab]);

  useEffect(() => {
    setMaterialsTab('input');
  }, [stageId]);

  useEffect(() => {
    if (!shouldEnsureInputHandoff) return;
    void ensureStageInputHandoff({ formulaId, stageId });
  }, [shouldEnsureInputHandoff, ensureStageInputHandoff, formulaId, stageId]);
  const selectedItemLabel =
    addItemId != null ? formatItemLabel(addItemId, getItemName, items) : null;

  const handleItemSelect = (selection: ItemSelection) => {
    setAddItemId(selection.itemId);
    setItemPickerOpen(false);
  };

  const syncStageExpectedOutput = async (outputRow: ProductionFormulaStageItem | null) => {
    try {
      await updateFormulaStage({
        id: stageId,
        formulaId,
        data: outputRow
          ? {
              expected_output_quantity: outputRow.quantity,
              expected_output_item_id: outputRow.item_id,
            }
          : {
              expected_output_quantity: null,
              expected_output_item_id: null,
            },
      }).unwrap();
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to sync expected output');
    }
  };

  const handleAdd = async (role: ItemRole) => {
    if (addItemId == null) {
      appToast.error('Select an item');
      return;
    }
    if (role === 'output' && stageItems.some((row) => row.item_role === 'output')) {
      appToast.error('One output per step for now. Edit qty or remove the existing output.');
      return;
    }
    const qty = parseProductionQuantity(addQty);
    if (!qty || qty <= 0) {
      appToast.error('Quantity must be positive');
      return;
    }
    try {
      const created = await addFormulaStageItem({
        formulaId,
        stageId,
        data: {
          item_id: addItemId,
          item_role: role,
          quantity: qty,
        },
      }).unwrap();
      if (role === 'output') {
        await syncStageExpectedOutput(created);
      }
      appToast.success('Item added to step');
      setAddItemId(null);
      setAddQty('1');
      setAddExpanded(false);
      setWasteByproductAddRole(null);
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to add item');
    }
  };

  const closeAnyItemAdd = () => {
    setAddExpanded(false);
    setWasteByproductAddRole(null);
    setAddItemId(null);
    setAddQty('1');
  };

  const closeConditionAdd = () => {
    setConditionAddExpanded(false);
    setCondLabel('');
    setCondValue('');
    setCondUnit('');
  };

  const openConditionAdd = () => {
    closeAnyItemAdd();
    setConditionAddExpanded(true);
  };

  const openSecondaryOutputAdd = (role: 'waste' | 'byproduct') => {
    setConditionAddExpanded(false);
    setAddExpanded(false);
    setAddItemId(null);
    setAddQty('1');
    setItemPickerRole(role);
    setWasteByproductAddRole(role);
  };

  const renderAddItemFields = (role: ItemRole, onCancel: () => void) => (
    <>
      <ItemSelectSummaryButton
        ariaLabel="Select item"
        emptyLabel="Item"
        compactLabel
        selectedLabel={selectedItemLabel}
        staleNumericId={addItemId != null ? String(addItemId) : null}
        onClick={() => {
          setItemPickerRole(role);
          setItemPickerOpen(true);
        }}
        className="h-9 min-h-9 min-w-[6rem] flex-1 py-0 text-sm"
      />
      <StepNumberInput
        min={0.01}
        step={0.01}
        buttonStep={1}
        aria-label="Quantity"
        className="h-9 w-28 tabular-nums bg-background"
        value={addQty}
        onChange={(e) => setAddQty(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        disabled={isAdding}
        className="h-9 shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
        onClick={() => handleAdd(role)}
      >
        {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
      </Button>
      <Button type="button" size="sm" variant="ghost" className="h-9 shrink-0" onClick={onCancel}>
        Cancel
      </Button>
    </>
  );

  const handleOutputQtyBlur = async (row: ProductionFormulaStageItem) => {
    const raw = outputQtyDrafts[row.id] ?? String(row.quantity);
    const qty = parseProductionQuantity(raw);
    if (!qty || qty <= 0) {
      setOutputQtyDrafts((prev) => ({ ...prev, [row.id]: String(row.quantity) }));
      appToast.error('Quantity must be positive');
      return false;
    }
    if (qty === row.quantity) return true;
    try {
      const updated = await updateFormulaStageItem({
        id: row.id,
        formulaId,
        data: { quantity: qty },
      }).unwrap();
      await syncStageExpectedOutput(updated);
      outputSnapshots.current.set(row.id, { ...row, quantity: qty });
      setOutputQtyDrafts((prev) => ({ ...prev, [row.id]: String(qty) }));
      return true;
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to update quantity');
      setOutputQtyDrafts((prev) => ({ ...prev, [row.id]: String(row.quantity) }));
      return false;
    }
  };

  const handleRemove = async (row: ProductionFormulaStageItem) => {
    try {
      await removeFormulaStageItem({ id: row.id, formulaId }).unwrap();
      if (row.item_role === 'output') {
        await syncStageExpectedOutput(null);
      }
      appToast.success('Item removed');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to remove item');
    }
  };

  const renderOutputRows = (rows: ProductionFormulaStageItem[]) => {
    if (rows.length === 0) {
      return (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          No output yet. Add the one product this step produces.
        </p>
      );
    }
    const row = rows[0];
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="w-28 text-right">Expected qty</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow key={row.id}>
            <TableCell className="py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={ROLE_BADGE.output}>
                  output
                </Badge>
                <span className="text-sm">{getItemName(row.item_id)}</span>
              </div>
            </TableCell>
            <TableCell className="py-2 text-right">
              <StepNumberInput
                min={0.01}
                step={0.01}
                buttonStep={1}
                aria-label="Expected output quantity"
                className="ml-auto h-9 w-24 tabular-nums"
                value={outputQtyDrafts[row.id] ?? String(row.quantity)}
                onChange={(e) =>
                  setOutputQtyDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                }
              />
            </TableCell>
            <TableCell className="py-2 text-right">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => void handleRemove(row)}
                aria-label="Remove output"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  };

  const renderRows = (rows: ProductionFormulaStageItem[], role: ItemRole) => {
    if (rows.length === 0) {
      const emptyLabel =
        role === 'input' && inputsBlockedByHandoff
          ? 'Define outputs on the previous step first. Inputs here copy from those outputs—you can edit them after.'
          : role === 'input'
            ? 'No inputs yet'
            : role === 'output'
              ? 'No outputs yet'
              : role === 'waste'
                ? 'No waste lines yet'
                : 'No byproducts yet';
      return (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="w-24 text-right">Qty</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={ROLE_BADGE[role]}>
                    {role}
                  </Badge>
                  <span className="text-sm">{getItemName(row.item_id)}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-right tabular-nums">{row.quantity}</TableCell>
              <TableCell className="py-2 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleRemove(row)}
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderSecondaryOutputTable = (rows: ProductionFormulaStageItem[]) => {
    if (rows.length === 0) {
      return (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          No waste or byproducts yet
        </p>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead className="w-24 text-right">Qty</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const role = row.item_role === 'byproduct' ? 'byproduct' : 'waste';
            const itemName = getItemName(row.item_id);
            return (
              <TableRow key={row.id}>
                <TableCell className="py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge variant="outline" className={cn('shrink-0', ROLE_BADGE[role])}>
                      {role}
                    </Badge>
                    <span className="truncate text-sm" title={itemName}>
                      {itemName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2 text-right tabular-nums">{row.quantity}</TableCell>
                <TableCell className="py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemove(row)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const handleAddCondition = async () => {
    const label = condLabel.trim();
    const planned_value = condValue.trim();
    if (!label || !planned_value) {
      appToast.error('Label and planned value are required');
      return;
    }
    try {
      await addFormulaStageParameter({
        formulaId,
        stageId,
        data: {
          label,
          planned_value,
          unit: condUnit.trim() || undefined,
        },
      }).unwrap();
      appToast.success('Condition added');
      closeConditionAdd();
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to add condition');
    }
  };

  const handleConditionFieldBlur = async (row: ProductionFormulaStageParameter) => {
    const draft = condDrafts[row.id];
    if (!draft) return true;
    const nextLabel = draft.label.trim();
    const nextValue = draft.planned_value.trim();
    const nextUnit = draft.unit.trim();
    if (!nextLabel || !nextValue) {
      setCondDrafts((prev) => ({
        ...prev,
        [row.id]: {
          label: row.label,
          planned_value: row.planned_value,
          unit: row.unit ?? '',
        },
      }));
      appToast.error('Label and planned value are required');
      return false;
    }
    const payload: {
      label?: string;
      planned_value?: string;
      unit?: string | null;
    } = {};
    if (nextLabel !== row.label) payload.label = nextLabel;
    if (nextValue !== row.planned_value) payload.planned_value = nextValue;
    const unitComparable = row.unit ?? '';
    if (nextUnit !== unitComparable) payload.unit = nextUnit || null;
    if (Object.keys(payload).length === 0) return true;
    try {
      await updateFormulaStageParameter({
        id: row.id,
        formulaId,
        data: payload,
      }).unwrap();
      parameterSnapshots.current.set(row.id, {
        ...row,
        label: nextLabel,
        planned_value: nextValue,
        unit: nextUnit || null,
      });
      setCondDrafts((prev) => ({
        ...prev,
        [row.id]: { label: nextLabel, planned_value: nextValue, unit: nextUnit },
      }));
      return true;
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to update condition');
      setCondDrafts((prev) => ({
        ...prev,
        [row.id]: {
          label: row.label,
          planned_value: row.planned_value,
          unit: row.unit ?? '',
        },
      }));
      return false;
    }
  };

  const renderMajorSectionBreak = () => (
    <div className="my-6 h-px w-full shrink-0 bg-border" role="separator" aria-hidden />
  );

  const handleRemoveCondition = async (row: ProductionFormulaStageParameter) => {
    try {
      await removeFormulaStageParameter({ id: row.id, formulaId }).unwrap();
      appToast.success('Condition removed');
    } catch (error: unknown) {
      const detail = (error as { data?: { detail?: string } })?.data?.detail;
      appToast.error(detail || 'Failed to remove condition');
    }
  };

  const renderConditionsSection = () => (
    <div className="space-y-2 border-t border-border pt-4">
      {stageParameters.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground">
          No conditions yet (e.g. Turns / 1, Heat / 350 / °C).
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condition</TableHead>
              <TableHead className="w-32">Planned</TableHead>
              <TableHead className="w-24">Unit</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stageParameters.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="py-2">
                  <Input
                    className="h-9"
                    value={condDrafts[row.id]?.label ?? row.label}
                    onChange={(e) =>
                      setCondDrafts((prev) => ({
                        ...prev,
                        [row.id]: {
                          ...(prev[row.id] ?? {
                            label: row.label,
                            planned_value: row.planned_value,
                            unit: row.unit ?? '',
                          }),
                          label: e.target.value,
                        },
                      }))
                    }
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Input
                    className="h-9 tabular-nums"
                    value={condDrafts[row.id]?.planned_value ?? row.planned_value}
                    onChange={(e) =>
                      setCondDrafts((prev) => ({
                        ...prev,
                        [row.id]: {
                          ...(prev[row.id] ?? {
                            label: row.label,
                            planned_value: row.planned_value,
                            unit: row.unit ?? '',
                          }),
                          planned_value: e.target.value,
                        },
                      }))
                    }
                  />
                </TableCell>
                <TableCell className="py-2">
                  <Input
                    className="h-9"
                    value={condDrafts[row.id]?.unit ?? row.unit ?? ''}
                    onChange={(e) =>
                      setCondDrafts((prev) => ({
                        ...prev,
                        [row.id]: {
                          ...(prev[row.id] ?? {
                            label: row.label,
                            planned_value: row.planned_value,
                            unit: row.unit ?? '',
                          }),
                          unit: e.target.value,
                        },
                      }))
                    }
                  />
                </TableCell>
                <TableCell className="py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => void handleRemoveCondition(row)}
                    aria-label="Remove condition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <TransformingAddRow
        expanded={conditionAddExpanded}
        onExpand={openConditionAdd}
        triggerLabel="Add condition"
      >
        <Input
          placeholder="Condition"
          className="h-9 min-w-[6rem] flex-1"
          value={condLabel}
          onChange={(e) => setCondLabel(e.target.value)}
        />
        <Input
          placeholder="Planned"
          className="h-9 w-28 tabular-nums"
          value={condValue}
          onChange={(e) => setCondValue(e.target.value)}
        />
        <Input
          placeholder="Unit"
          className="h-9 w-20"
          value={condUnit}
          onChange={(e) => setCondUnit(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          disabled={isAddingParameter}
          className="h-9 shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
          onClick={() => void handleAddCondition()}
        >
          {isAddingParameter ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 shrink-0"
          onClick={closeConditionAdd}
        >
          Cancel
        </Button>
      </TransformingAddRow>
    </div>
  );

  const renderAddControl = (
    role: ItemRole,
    options?: { triggerLabel?: string },
  ) => {
    const triggerLabel = options?.triggerLabel ?? 'Add item';
    const isExpandedHere =
      addExpanded &&
      wasteByproductAddRole === null &&
      ((role === 'input' && materialsTab === 'input') ||
        (role === 'output' && materialsTab === 'output'));

    const openAdd = () => {
      setConditionAddExpanded(false);
      setWasteByproductAddRole(null);
      setAddItemId(null);
      setAddQty('1');
      setItemPickerRole(role);
      setAddExpanded(true);
    };

    return (
      <TransformingAddRow
        expanded={isExpandedHere}
        onExpand={openAdd}
        triggerLabel={triggerLabel}
      >
        {renderAddItemFields(role, closeAnyItemAdd)}
      </TransformingAddRow>
    );
  };

  const renderSecondaryOutputRoleSwitcher = () => (
    <div
      className="flex w-full basis-full gap-1 rounded-md border border-input bg-background p-0.5"
      role="group"
      aria-label="Output type"
    >
      {(['waste', 'byproduct'] as const).map((role) => (
        <button
          key={role}
          type="button"
          className={cn(
            'flex-1 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors',
            wasteByproductAddRole === role
              ? 'bg-muted text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
          onClick={() => openSecondaryOutputAdd(role)}
        >
          {role === 'byproduct' ? 'Byproduct' : 'Waste'}
        </button>
      ))}
    </div>
  );

  const renderWasteByproductSection = (
    wasteRows: ProductionFormulaStageItem[],
    byproductRows: ProductionFormulaStageItem[],
  ) => {
    const secondaryRows = [...wasteRows, ...byproductRows];
    return (
      <div className="space-y-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="w-fit cursor-default text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Waste & byproducts
            </p>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs text-sm">
            Scrap and recoverable co-products leaving this step, besides the primary output.
          </TooltipContent>
        </Tooltip>
        {renderSecondaryOutputTable(secondaryRows)}
        <TransformingAddRow
          expanded={wasteByproductAddRole != null}
          onExpand={() => openSecondaryOutputAdd(wasteByproductAddRole ?? 'waste')}
          triggerLabel="Add waste or byproduct"
        >
          {wasteByproductAddRole != null ? (
            <>
              {renderSecondaryOutputRoleSwitcher()}
              {renderAddItemFields(wasteByproductAddRole, closeAnyItemAdd)}
            </>
          ) : null}
        </TransformingAddRow>
      </div>
    );
  };

  useEffect(() => {
    for (const row of stageItems) {
      if (row.item_role !== 'output') continue;
      const existing = outputSnapshots.current.get(row.id);
      const draft = outputQtyDrafts[row.id];
      if (existing && draft != null && draft !== String(existing.quantity)) continue;
      outputSnapshots.current.set(row.id, row);
    }
  }, [stageItems, outputQtyDrafts]);

  useEffect(() => {
    for (const row of stageParameters) parameterSnapshots.current.set(row.id, row);
  }, [stageParameters]);

  const materialsDirty = useMemo(() => {
    for (const row of outputSnapshots.current.values()) {
      const draft = outputQtyDrafts[row.id];
      if (draft != null && draft !== String(row.quantity)) return true;
    }
    for (const row of parameterSnapshots.current.values()) {
      const draft = condDrafts[row.id];
      if (!draft) continue;
      if (draft.label !== row.label) return true;
      if (draft.planned_value !== row.planned_value) return true;
      if (draft.unit !== (row.unit ?? '')) return true;
    }
    return false;
  }, [outputQtyDrafts, condDrafts]);

  useEffect(() => {
    onDirtyChange?.(materialsDirty);
  }, [materialsDirty, onDirtyChange]);

  const saveMaterials = useCallback(async () => {
    let ok = true;
    for (const row of outputSnapshots.current.values()) {
      const draft = outputQtyDrafts[row.id];
      if (draft == null || draft === String(row.quantity)) continue;
      if (!(await handleOutputQtyBlur(row))) ok = false;
    }
    for (const row of parameterSnapshots.current.values()) {
      const draft = condDrafts[row.id];
      if (!draft) continue;
      if (
        draft.label === row.label &&
        draft.planned_value === row.planned_value &&
        draft.unit === (row.unit ?? '')
      ) {
        continue;
      }
      if (!(await handleConditionFieldBlur(row))) ok = false;
    }
    return ok;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- blur handlers read snapshots at save time
  }, [condDrafts, outputQtyDrafts]);

  useImperativeHandle(ref, () => ({
    isDirty: () => materialsDirty,
    save: saveMaterials,
  }), [materialsDirty, saveMaterials]);

  if (isLoading || loadingParameters) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  const inputRows = stageItems.filter((r) => r.item_role === 'input');
  const outputRows = stageItems.filter((r) => r.item_role === 'output');
  const wasteRows = stageItems.filter((r) => r.item_role === 'waste');
  const byproductRows = stageItems.filter((r) => r.item_role === 'byproduct');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Materials on this step</p>
        </div>
        {stageTitle ? (
          <span
            className={cn(
              'inline-flex max-w-[14rem] min-w-0 shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium text-foreground',
              'border-brand-primary/50 bg-brand-primary/10',
              stageUnassigned && 'border-dashed',
            )}
          >
            {stageUnassigned ? (
              <span className="font-semibold text-muted-foreground" aria-hidden>
                X
              </span>
            ) : null}
            <span className="block min-w-0 truncate">{stageTitle}</span>
          </span>
        ) : null}
      </div>

      <EmphasisTabsProvider value={materialsTab}>
        <Tabs value={materialsTab} onValueChange={(v) => setMaterialsTab(v as MaterialsTab)}>
          <EmphasisTabsList className="mb-3">
            {(['input', 'output'] as const).map((tab) => (
              <Tooltip key={tab}>
                <TooltipTrigger asChild>
                  <EmphasisTabsTrigger value={tab}>
                    {tab === 'input' && `Input (${counts.input})`}
                    {tab === 'output' && `Output (${counts.output})`}
                  </EmphasisTabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-sm">
                  {TAB_HELP[tab]}
                </TooltipContent>
              </Tooltip>
            ))}
          </EmphasisTabsList>

          <EmphasisTabPanel panelKey={materialsTab}>
            {materialsTab === 'input' && (
              <div className="space-y-3">
                {renderRows(inputRows, 'input')}
                {!inputsBlockedByHandoff ? renderAddControl('input') : null}
                {renderConditionsSection()}
              </div>
            )}

            {materialsTab === 'output' && (
              <div className="min-w-0">
                <div className="space-y-2">
                  {renderOutputRows(outputRows)}
                  {outputRows.length === 0 ? renderAddControl('output', { triggerLabel: 'Add output' }) : null}
                </div>
                {renderMajorSectionBreak()}
                <div className="min-w-0">
                  {renderWasteByproductSection(wasteRows, byproductRows)}
                </div>
              </div>
            )}
          </EmphasisTabPanel>
        </Tabs>
      </EmphasisTabsProvider>

      <ItemSelectorDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        onSelect={handleItemSelect}
        selectedItemId={addItemId ?? undefined}
        factoryId={factoryId ?? undefined}
        catalogOnly
        allowCreateCatalogItem
        catalogDefaultTagCodes={catalogTagCodesForProductionRole(itemPickerRole)}
        title="Select item"
        description={
          itemPickerRole === 'waste'
            ? 'Items tagged Production Waste. Clear tag filters to browse the full catalog.'
            : itemPickerRole === 'byproduct'
              ? 'Items tagged Byproduct. Clear tag filters to browse the full catalog.'
              : itemPickerRole === 'input'
                ? 'Items tagged Raw Material by default. Clear tag filters to browse all.'
                : 'Items tagged Finished Good by default. Clear tag filters to browse all.'
        }
      />
    </div>
  );
});

export default FormulaStageMaterialsBlock;
