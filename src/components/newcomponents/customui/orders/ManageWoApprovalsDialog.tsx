import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { WorkOrderApprover } from '@/types/workOrder';
import { avatarColor, initialsOf } from './transferOrderApprovals';
import type { WorkspaceMember } from '@/types/workspace';

export interface ManageWoApprovalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvers: WorkOrderApprover[];
  assignableMembers: WorkspaceMember[];
  requiredApprovals: string;
  onRequiredApprovalsChange: (value: string) => void;
  onAddApprover: (userId: number) => void;
  onRemoveApprover: (userId: number) => void;
}

const ManageWoApprovalsDialog: React.FC<ManageWoApprovalsDialogProps> = ({
  open,
  onOpenChange,
  approvers,
  assignableMembers,
  requiredApprovals,
  onRequiredApprovalsChange,
  onAddApprover,
  onRemoveApprover,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(42rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
      <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4">
        <DialogTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          Manage work order approvals
        </DialogTitle>
        <DialogDescription>
          Add workspace members as approvers and set how many approvals are required. With no
          approvers assigned, this order does not require approval.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="wo-required-approvals" className="text-sm text-muted-foreground">
            Required approvals
          </Label>
          <Input
            id="wo-required-approvals"
            type="number"
            min={0}
            max={approvers.length || undefined}
            placeholder="All assigned"
            value={requiredApprovals}
            onChange={(e) => onRequiredApprovalsChange(e.target.value)}
            className="h-9 w-28"
          />
        </div>

        {assignableMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Select value="" onValueChange={(v) => onAddApprover(Number(v))}>
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
      </div>
    </DialogContent>
  </Dialog>
);

export default ManageWoApprovalsDialog;
