import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { todayLocalDateKey } from '@/lib/heatmapDateKey';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePurchaseOrderMutation } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Account } from '@/types/account';
import type { Factory } from '@/types/factory';
import type { CreatePurchaseOrder, CreatePurchaseOrderItem } from '@/types/purchaseOrder';
import type { Item } from '@/types/item';
import { Check, Loader2, Pencil, Trash2 } from 'lucide-react';
import { appToast } from '@/lib/appToast';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import AddItemDialog from '@/components/newcomponents/customui/AddItemDialog';
import ItemSelectorDialog, { type ItemSelection } from '@/components/newcomponents/customui/ItemSelectorDialog';
import { ItemSelectSummaryButton } from '@/components/newcomponents/customui/ItemSelectSummaryButton';
import { useAutoSelectGlobalFactory, useGlobalFactory } from '@/hooks/useGlobalFactoryContext';
import { cn } from '@/lib/utils';
import { ProductionBatchPicker } from '@/components/newcomponents/customui/production/ProductionBatchPicker';
import {
  handleUnaddedItemDraftOnSubmit,
  useLineItemAddButtonHighlight,
} from '@/components/newcomponents/customui/orders/useLineItemAddButtonHighlight';

export interface PurchaseOrderShortageSeed {
  factoryId: number;
  itemId: number;
  quantity: number;
}

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  factories: Factory[];
  onSuccess: (order: { id: number }) => void;
  /** Prefill one storage line. Saving does not put stock on the shelf. */
  shortageSeed?: PurchaseOrderShortageSeed | null;
}

const AddPurchaseOrderDialog: React.FC<AddPurchaseOrderDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  factories,
  onSuccess,
  shortageSeed = null,
}) => {
  const { t } = useTranslation('orders');
  const { t: tc } = useTranslation('common');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationType, setDestinationType] = useState<'storage' | 'machine' | 'project'>('storage');
  const [destinationId, setDestinationId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [productionBatchId, setProductionBatchId] = useState('');
  const [items, setItems] = useState<
    Array<{ item_id: number; quantity_ordered: number; unit_price: number | null; notes?: string }>
  >([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [machinePickerOpen, setMachinePickerOpen] = useState(false);
  const [machineDisplayLine, setMachineDisplayLine] = useState('');
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [addHintOpen, setAddHintOpen] = useState(false);
  const [unaddedHintOpen, setUnaddedHintOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const hasUnaddedItemDraft = Boolean(itemId.trim() || qty.trim() || unitPrice.trim());
  const {
    addButtonHighlighted,
    pulseAddButtonHighlight,
    dismissAddButtonHighlight,
  } = useLineItemAddButtonHighlight();

  const [createOrder, { isLoading }] = useCreatePurchaseOrderMutation();
  const globalFactory = useGlobalFactory();
  const { markFactoryEdited: markDestinationFactoryEdited } = useAutoSelectGlobalFactory(
    open,
    setDestinationId,
    shortageSeed?.factoryId,
    open && destinationType === 'storage'
  );

  const shortageSeedAppliedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      shortageSeedAppliedRef.current = false;
      return;
    }
    if (!shortageSeed || shortageSeedAppliedRef.current) return;
    shortageSeedAppliedRef.current = true;
    setDestinationType('storage');
    setDestinationId(String(shortageSeed.factoryId));
    setAccountId('');
    setItems([]);
    setItemId(String(shortageSeed.itemId));
    setQty(String(shortageSeed.quantity));
    setUnitPrice('');
  }, [open, shortageSeed]);
  const { data: itemsList = [], refetch: refetchItems } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: !open });

  const usedItemIds = useMemo(() => new Set(items.map((line) => line.item_id)), [items]);

  const selectedItemLabel = useMemo(() => {
    if (!itemId.trim()) return null;
    const parsed = parseInt(itemId, 10);
    if (Number.isNaN(parsed)) return null;
    const item = itemsList.find((i) => i.id === parsed);
    if (!item) return null;
    return item.unit ? `${item.name} (${item.unit})` : item.name;
  }, [itemId, itemsList]);

  const reset = () => {
    setAccountId('');
    setDestinationType('storage');
    setDestinationId('');
    setDescription('');
    setProductionBatchId('');
    setItems([]);
    setItemId('');
    setQty('');
    setUnitPrice('');
    setMachineDisplayLine('');
    setMachinePickerOpen(false);
    setAddHintOpen(false);
    setUnaddedHintOpen(false);
    dismissAddButtonHighlight();
    setEditingItemId(null);
  };

  const canAddLineItem = (() => {
    if (!itemId.trim() || !qty.trim()) return false;
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    if (unitPrice.trim()) {
      const p = parseFloat(unitPrice);
      if (Number.isNaN(p) || p < 0) return false;
    }
    return !isNaN(iid) && !isNaN(q) && q > 0 && !usedItemIds.has(iid);
  })();

  useEffect(() => {
    if (canAddLineItem) setAddHintOpen(false);
  }, [canAddLineItem]);

  useEffect(() => {
    if (!hasUnaddedItemDraft) {
      setUnaddedHintOpen(false);
      dismissAddButtonHighlight();
    }
  }, [hasUnaddedItemDraft, dismissAddButtonHighlight]);

  useEffect(() => {
    if (!unaddedHintOpen) return;
    const dismiss = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-unadded-hint-root]')) {
        setUnaddedHintOpen(false);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [unaddedHintOpen]);

  useEffect(() => {
    if (!addHintOpen) return;
    const dismiss = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-add-item-hint-root]')) {
        setAddHintOpen(false);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [addHintOpen]);

  const handleItemSelect = (selection: ItemSelection) => {
    if (usedItemIds.has(selection.itemId)) {
      appToast.error(t('dlgItemAlready'));
      return;
    }
    setItemId(String(selection.itemId));
    setItemPickerOpen(false);
  };

  const handleCreateItemSuccess = (newItem: Item) => {
    void refetchItems();
    setItemId(String(newItem.id));
    setIsCreateItemOpen(false);
  };

  const handleAddItemClick = () => {
    if (!canAddLineItem) {
      setAddHintOpen(true);
      return;
    }
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    const p = unitPrice.trim() ? parseFloat(unitPrice) : null;
    if (p != null && (Number.isNaN(p) || p < 0)) {
      appToast.error(t('dlgInvalidUnitPrice'));
      return;
    }
    if (usedItemIds.has(iid)) {
      appToast.error(t('dlgItemAlready'));
      return;
    }
    setItems((prev) => [...prev, { item_id: iid, quantity_ordered: q, unit_price: p }]);
    setItemId('');
    setQty('');
    setUnitPrice('');
    setAddHintOpen(false);
    dismissAddButtonHighlight();
  };

  const handleRemoveItem = (idx: number) => {
    const removed = items[idx];
    if (removed && removed.item_id === editingItemId) setEditingItemId(null);
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (
    idx: number,
    field: 'quantity_ordered' | 'unit_price',
    raw: string
  ) => {
    if (field === 'unit_price') {
      if (raw.trim() === '') {
        setItems((prev) =>
          prev.map((line, i) => (i === idx ? { ...line, unit_price: null } : line))
        );
        return;
      }
      const n = parseFloat(raw);
      if (Number.isNaN(n) || n < 0) return;
      setItems((prev) =>
        prev.map((line, i) => (i === idx ? { ...line, unit_price: n } : line))
      );
      return;
    }
    const n = parseFloat(raw);
    if (raw.trim() === '' || Number.isNaN(n) || n <= 0) return;
    setItems((prev) =>
      prev.map((line, i) => (i === idx ? { ...line, [field]: n } : line))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ignore accidental submits while nested selector dialogs are open.
    if (accountPickerOpen || machinePickerOpen || itemPickerOpen) {
      return;
    }
    const did = parseInt(destinationId, 10);
    const aid = accountId ? parseInt(accountId, 10) : null;
    if (accountId && (aid == null || isNaN(aid))) {
      appToast.error(t('dlgInvalidSupplier'));
      return;
    }
    if (isNaN(did) || !destinationId) {
      appToast.error(t('dlgSelectDestination'));
      return;
    }
    if (
      handleUnaddedItemDraftOnSubmit({
        hasUnaddedItemDraft,
        unaddedHintOpen,
        setUnaddedHintOpen,
        pulseAddButtonHighlight,
        clearDraft: () => {
          setItemId('');
          setQty('');
          setUnitPrice('');
        },
      }) === 'blocked'
    ) {
      return;
    }
    if (items.length === 0) {
      appToast.error(t('dlgAddAtLeastOne'));
      return;
    }

    const orderData: CreatePurchaseOrder = {
      ...(aid != null ? { account_id: aid } : {}),
      destination_type: destinationType,
      destination_id: did,
      order_date: todayLocalDateKey(),
      description: description || undefined,
      production_batch_id: productionBatchId ? Number(productionBatchId) : undefined,
      items: items.map((i) => ({
        item_id: i.item_id,
        quantity_ordered: i.quantity_ordered,
        ...(i.unit_price != null ? { unit_price: i.unit_price } : {}),
        notes: i.notes,
      })) as CreatePurchaseOrderItem[],
    };

    try {
      const result = await createOrder(orderData).unwrap();
      appToast.success(
        shortageSeed
          ? t('dlgPoCreatedShort')
          : t('dlgPoCreated'),
      );
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || t('dlgFailedCreate'));
    }
  };

  const lineItemsBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-2 min-w-0">
        <Label className="text-base">{t('dlgItemsRequired')}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{t('dlgAddedCount', { count: items.length })}</span>
      </div>

      <div className="space-y-2 shrink-0 rounded-lg border border-border bg-muted/20 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <ItemSelectSummaryButton
              ariaLabel={t('dlgSelectItem')}
              emptyLabel={t('dlgSelectItem')}
              selectedLabel={selectedItemLabel}
              staleNumericId={itemId || null}
              onClick={() => setItemPickerOpen(true)}
              className="h-10"
            />
          </div>
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('dlgOr')}
          </span>
          <Button
            type="button"
            className="h-10 shrink-0 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground"
            onClick={() => setIsCreateItemOpen(true)}
          >
            {t('dlgCreateItemPlus')}
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid flex-1 min-w-[5rem] gap-1">
            <Label className="text-xs text-muted-foreground">{t('dlgQty')}</Label>
            <StepNumberInput
              min={1}
              step={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
              className="bg-background"
            />
          </div>
          <div className="grid flex-1 min-w-[5.5rem] gap-1">
            <Label className="text-xs text-muted-foreground">{t('dlgUnitPriceOptional')}</Label>
            <StepNumberInput
              min={0}
              step={1}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder={t('dlgOptional')}
              className="bg-background"
            />
          </div>
          <div className="relative shrink-0" data-add-item-hint-root>
            {addHintOpen && !canAddLineItem ? (
              <div
                role="tooltip"
                className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[14rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
              >
                {t('dlgSelectItemQtyHint')}
              </div>
            ) : null}
            <Button
              type="button"
              size="icon"
              className={cn(
                canAddLineItem
                  ? 'h-10 w-10 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground'
                  : 'h-10 w-10 bg-neutral-400 text-neutral-100 hover:bg-neutral-400 dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-600 cursor-not-allowed',
                addButtonHighlighted && 'po-scroll-target-highlight'
              )}
              onClick={handleAddItemClick}
              onMouseEnter={() => {
                if (addButtonHighlighted) dismissAddButtonHighlight();
              }}
              aria-label={t('dlgAddLineItem')}
              aria-expanded={addHintOpen && !canAddLineItem}
              aria-disabled={!canAddLineItem}
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-background divide-y">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t('dlgNoOrderItems')}</p>
        ) : (
          items.map((it, idx) => {
            const item = itemsList.find((i) => i.id === it.item_id);
            const unitSuffix = item?.unit ? ` ${item.unit}` : '';
            const isEditing = editingItemId === it.item_id;
            const priceStr =
              it.unit_price != null
                ? Number(it.unit_price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : null;
            return (
              <div key={it.item_id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">
                    {item?.name ?? `Item #${it.item_id}`}
                  </p>
                  {isEditing ? (
                    <div className="grid max-w-xs grid-cols-2 gap-2">
                      <div className="grid gap-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Qty{unitSuffix}
                        </Label>
                        <StepNumberInput
                          min={1}
                          step={1}
                          value={String(it.quantity_ordered)}
                          onChange={(e) => handleUpdateLine(idx, 'quantity_ordered', e.target.value)}
                          className="h-9 bg-background"
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-[10px] text-muted-foreground">{t('dlgUnitPrice')}</Label>
                        <StepNumberInput
                          min={0}
                          step={1}
                          value={it.unit_price != null ? String(it.unit_price) : ''}
                          onChange={(e) => handleUpdateLine(idx, 'unit_price', e.target.value)}
                          className="h-9 bg-background"
                          placeholder="—"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t('dlgQuantityLine', { qty: it.quantity_ordered })}
                      {unitSuffix}
                      <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
                        ·
                      </span>
                      {priceStr != null ? t('dlgPerUnit', { price: priceStr }) : t('dlgPriceNotSet')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {isEditing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setEditingItemId(null)}
                    >
                      {t('dlgDone')}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingItemId(it.item_id)}
                      aria-label={t('dlgEditNamed', { name: item?.name ?? t('dlgItemFallback') })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const orderFieldsBlock = (
    <div className="grid gap-4 min-w-0">
      <div>
        <Label>{t('dlgDestTypeRequired')}</Label>
        <Select
          value={destinationType}
          onValueChange={(v) => {
            setDestinationType(v as 'storage' | 'machine' | 'project');
            setDestinationId('');
            setMachineDisplayLine('');
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="storage">{t('dlgStorageFactory')}</SelectItem>
            <SelectItem value="machine">{t('dlgMachine')}</SelectItem>
            <SelectItem value="project">{t('dlgProject')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {destinationType === 'storage' && (
        <div>
          <Label>{t('dlgFactoryRequired')}</Label>
          <Select
            value={destinationId || '__none__'}
            onValueChange={(v) => {
              markDestinationFactoryEdited();
              setDestinationId(v === '__none__' ? '' : v);
            }}
            required
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('dlgSelectFactory')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t('dlgSelectFactoryEllipsis')}</SelectItem>
              {factories.map((f) => (
                <SelectItem key={f.id} value={f.id.toString()}>
                  {f.name} ({f.abbreviation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {destinationType === 'machine' && (
        <div>
          <Label>{t('dlgMachineRequired')}</Label>
          <MachineSelectSummaryButton
            onClick={() => setMachinePickerOpen(true)}
            ariaLabel={
              machineDisplayLine
                ? `Change machine. Current: ${machineDisplayLine}`
                : 'Select machine'
            }
            selectedLine={machineDisplayLine || null}
            staleNumericId={machineDisplayLine ? null : destinationId || null}
            compactLabel
          />
          <MachineSelectorDialog
            open={machinePickerOpen}
            onOpenChange={setMachinePickerOpen}
            initialFactoryId={globalFactory?.id}
            title="Select destination machine"
            description="Pick factory and section, highlight a machine, then confirm."
            onSelect={(m, ctx) => {
              setDestinationId(String(m.id));
              setMachineDisplayLine(`${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`);
            }}
          />
        </div>
      )}
      {destinationType === 'project' && (
        <div>
          <Label>{t('dlgDestIdRequired')}</Label>
          <Input
            type="number"
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            placeholder={t('dlgProjectComponentId')}
            className="mt-1"
          />
        </div>
      )}
      <div>
        <Label>{t('dlgSupplier')}</Label>
        <AccountSelectSummaryButton
          onClick={() => setAccountPickerOpen(true)}
          ariaLabel={
            accountId
              ? `Change supplier. Current account ID ${accountId}`
              : 'Select supplier'
          }
          selectedLine={accounts.find((a) => a.id === parseInt(accountId, 10))?.name || null}
          staleNumericId={accountId || null}
        />
        <AccountSelectorDialog
          open={accountPickerOpen}
          onOpenChange={setAccountPickerOpen}
          title="Select supplier"
          description="Search and pick the supplier account for this purchase order."
          selectedAccountId={accountId ? parseInt(accountId, 10) : undefined}
          onSelect={(account) => {
            if (!account) return;
            setAccountId(String(account.id));
          }}
        />
      </div>
      <div>
        <Label>{t('dlgDescription')}</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('dlgOptional')} className="mt-1" />
      </div>
      <ProductionBatchPicker value={productionBatchId} onChange={setProductionBatchId} />
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-hidden p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-0 text-left">
          <DialogTitle>{t('dlgAddPurchase')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2 md:gap-8 md:items-stretch">
            <div className="min-h-0 min-w-0 overflow-y-auto pl-2 pr-4 md:flex md:flex-col md:justify-center">
              {orderFieldsBlock}
            </div>
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:pt-0 md:pl-8">
              {lineItemsBlock}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <div className="relative" data-unadded-hint-root>
              {unaddedHintOpen ? (
                <div
                  role="tooltip"
                  className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[16rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                >
                  {t('dlgUnaddedHint')}
                </div>
              ) : null}
              <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary-hover">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dlgCreate')}
              </Button>
            </div>
          </div>
        </form>
        </DialogContent>
      </Dialog>
      <ItemSelectorDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        onSelect={handleItemSelect}
        selectedItemId={itemId ? parseInt(itemId, 10) : undefined}
        catalogOnly
        title={t('dlgSelectItem')}
        description="Search catalog and pick a line item."
      />
      <AddItemDialog
        open={isCreateItemOpen}
        onOpenChange={setIsCreateItemOpen}
        onSuccess={handleCreateItemSuccess}
      />
    </>
  );
};

export default AddPurchaseOrderDialog;
