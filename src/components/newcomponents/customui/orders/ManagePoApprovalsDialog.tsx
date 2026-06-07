import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Check, Clock, ShieldCheck, UserPlus, X } from 'lucide-react';
import type { PurchaseOrderApprover } from '@/types/purchaseOrder';
import type { WorkspaceMember } from '@/types/workspace';

const PO_SECTION_ASSIGNMENT_LABELS = [
  'Supplier',
  'Order details',
  'Items',
  'Draft invoice',
] as const;

export interface ManagePoApprovalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvers: PurchaseOrderApprover[];
  assignableMembers: WorkspaceMember[];
  requiredApprovals: string;
  onRequiredApprovalsChange: (value: string) => void;
  onAddApprover: (userId: number) => void;
  onRemoveApprover: (userId: number) => void;
  disabled?: boolean;
  initialsOf: (name: string | null | undefined) => string;
  avatarColor: (userId: number) => string;
}

const ManagePoApprovalsDialog: React.FC<ManagePoApprovalsDialogProps> = ({
  open,
  onOpenChange,
  approvers,
  assignableMembers,
  requiredApprovals,
  onRequiredApprovalsChange,
  onAddApprover,
  onRemoveApprover,
  disabled = false,
  initialsOf,
  avatarColor,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(42rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
      <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4">
        <DialogTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          Manage PO approvals
        </DialogTitle>
        <DialogDescription>
          Add approvers and set how many approvals are required before the invoice can be finalized.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="po-required-approvals" className="text-sm text-muted-foreground">
            Required approvals
          </Label>
          <Input
            id="po-required-approvals"
            type="number"
            min={0}
            max={approvers.length || undefined}
            placeholder="All assigned"
            value={requiredApprovals}
            onChange={(e) => onRequiredApprovalsChange(e.target.value)}
            disabled={disabled}
            className="h-9 w-28"
          />
        </div>

        {assignableMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Select
              value=""
              disabled={disabled}
              onValueChange={(v) => onAddApprover(Number(v))}
            >
              <SelectTrigger className="h-9 flex-1">
                <SelectValue placeholder="Add approver..." />
              </SelectTrigger>
              <SelectContent>
                {assignableMembers.map((m) => (
                  <SelectItem key={m.user_id} value={String(m.user_id)}>
                    {m.user_name ?? `User #${m.user_id}`}
                    {m.user_position ? ` · ${m.user_position}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Assigned approvers
          </p>
          {approvers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">No approvers assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {approvers.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                        a.approved ? avatarColor(a.user_id) : 'bg-muted-foreground/40'
                      )}
                    >
                      {initialsOf(a.user_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">
                        {a.user_name ?? `User #${a.user_id}`}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.user_position || a.user_email || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {a.approved ? (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30">
                        <Check className="h-3 w-3" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveApprover(a.user_id)}
                      disabled={disabled}
                      title="Remove approver"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-card-foreground">Section assignments</p>
            <Badge variant="secondary" className="font-normal text-xs">
              Optional · coming soon
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Assign which PO sections each approver is responsible for reviewing. Not enforced yet.
          </p>
          {approvers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Add approvers to configure sections.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Approver</th>
                    {PO_SECTION_ASSIGNMENT_LABELS.map((label) => (
                      <th key={label} className="pb-2 px-1 text-center font-medium whitespace-nowrap">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approvers.map((a) => (
                    <tr key={a.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 text-xs font-medium truncate max-w-[8rem]">
                        {a.user_name ?? `User #${a.user_id}`}
                      </td>
                      {PO_SECTION_ASSIGNMENT_LABELS.map((label) => (
                        <td key={label} className="py-2 px-1 text-center">
                          <Checkbox
                            disabled
                            checked={false}
                            aria-label={`${label} for ${a.user_name ?? a.user_id}`}
                            className="mx-auto"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Done
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ManagePoApprovalsDialog;
