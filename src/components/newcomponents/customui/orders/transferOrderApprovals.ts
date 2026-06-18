import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkspaceMember } from '@/types/workspace';

export interface TransferOrderApprover {
  id: string;
  user_id: number;
  user_name: string | null;
  user_position: string | null;
  user_email: string | null;
  approved: boolean;
  approved_at: string | null;
}

export interface TransferApprovalSummary {
  approved_count: number;
  required: number;
  met: boolean;
}

export interface TransferApprovalEvent {
  id: string;
  event_type: 'approver_added' | 'approver_removed' | 'approved' | 'withdrawn' | 'required_changed';
  description: string;
  created_at: string;
  user_name?: string | null;
}

const STORAGE_PREFIX = 'tr-approvals-v1';

function storageKey(transferOrderId: number): string {
  return `${STORAGE_PREFIX}-${transferOrderId}`;
}

interface StoredApprovalState {
  approvers: TransferOrderApprover[];
  requiredApprovals: string;
}

function loadState(transferOrderId: number): StoredApprovalState {
  try {
    const raw = localStorage.getItem(storageKey(transferOrderId));
    if (!raw) return { approvers: [], requiredApprovals: '' };
    const parsed = JSON.parse(raw) as StoredApprovalState;
    return {
      approvers: Array.isArray(parsed.approvers) ? parsed.approvers : [],
      requiredApprovals: typeof parsed.requiredApprovals === 'string' ? parsed.requiredApprovals : '',
    };
  } catch {
    return { approvers: [], requiredApprovals: '' };
  }
}

function saveState(transferOrderId: number, state: StoredApprovalState): void {
  localStorage.setItem(storageKey(transferOrderId), JSON.stringify(state));
}

export function readTransferApprovalSummary(transferOrderId: number): TransferApprovalSummary {
  const stored = loadState(transferOrderId);
  return computeTransferApprovalSummary(stored.approvers, stored.requiredApprovals);
}

export function readTransferApproverCount(transferOrderId: number): number {
  return loadState(transferOrderId).approvers.length;
}

export function computeTransferApprovalSummary(
  approvers: TransferOrderApprover[],
  requiredApprovals: string
): TransferApprovalSummary {
  const approved_count = approvers.filter((a) => a.approved).length;
  const parsed = requiredApprovals.trim() === '' ? null : Number(requiredApprovals);
  const required =
    parsed != null && !Number.isNaN(parsed) && parsed >= 0
      ? Math.min(parsed, approvers.length || parsed)
      : approvers.length;
  const met = approvers.length === 0 ? true : approved_count >= required;
  return { approved_count, required, met };
}

export const AVATAR_COLORS = [
  'bg-brand-primary',
  'bg-green-600',
  'bg-amber-600',
  'bg-sky-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-teal-600',
];

export function initialsOf(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(userId: number): string {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

function memberToApprover(member: WorkspaceMember): TransferOrderApprover {
  return {
    id: `local-${member.user_id}`,
    user_id: member.user_id,
    user_name: member.user_name,
    user_position: member.user_position,
    user_email: member.user_email,
    approved: false,
    approved_at: null,
  };
}

export function useTransferOrderApprovals(transferOrderId: number) {
  const [approvers, setApprovers] = useState<TransferOrderApprover[]>([]);
  const [requiredApprovals, setRequiredApprovals] = useState('');
  const [localEvents, setLocalEvents] = useState<TransferApprovalEvent[]>([]);

  useEffect(() => {
    const stored = loadState(transferOrderId);
    setApprovers(stored.approvers);
    setRequiredApprovals(stored.requiredApprovals);
    setLocalEvents([]);
  }, [transferOrderId]);

  const persist = useCallback(
    (nextApprovers: TransferOrderApprover[], nextRequired: string) => {
      saveState(transferOrderId, {
        approvers: nextApprovers,
        requiredApprovals: nextRequired,
      });
    },
    [transferOrderId]
  );

  const appendEvent = useCallback((event: Omit<TransferApprovalEvent, 'id'>) => {
    setLocalEvents((prev) => [
      {
        ...event,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
      ...prev,
    ]);
  }, []);

  const approvalSummary = useMemo(
    () => computeTransferApprovalSummary(approvers, requiredApprovals),
    [approvers, requiredApprovals]
  );

  const addApprover = useCallback(
    (member: WorkspaceMember) => {
      if (approvers.some((a) => a.user_id === member.user_id)) return;
      const next = [...approvers, memberToApprover(member)];
      setApprovers(next);
      persist(next, requiredApprovals);
      appendEvent({
        event_type: 'approver_added',
        description: `${member.user_name ?? `User #${member.user_id}`} added as approver`,
        created_at: new Date().toISOString(),
        user_name: member.user_name,
      });
    },
    [approvers, requiredApprovals, persist, appendEvent]
  );

  const removeApprover = useCallback(
    (userId: number) => {
      const removed = approvers.find((a) => a.user_id === userId);
      const next = approvers.filter((a) => a.user_id !== userId);
      setApprovers(next);
      persist(next, requiredApprovals);
      if (removed) {
        appendEvent({
          event_type: 'approver_removed',
          description: `${removed.user_name ?? `User #${userId}`} removed from approvers`,
          created_at: new Date().toISOString(),
          user_name: removed.user_name,
        });
      }
    },
    [approvers, requiredApprovals, persist, appendEvent]
  );

  const setRequired = useCallback(
    (value: string) => {
      setRequiredApprovals(value);
      persist(approvers, value);
      if (value.trim() !== requiredApprovals.trim()) {
        appendEvent({
          event_type: 'required_changed',
          description: `Required approvals set to ${value.trim() === '' ? 'all assigned' : value}`,
          created_at: new Date().toISOString(),
        });
      }
    },
    [approvers, requiredApprovals, persist, appendEvent]
  );

  const withdrawAllApprovals = useCallback(() => {
    const next = approvers.map((a) => ({
      ...a,
      approved: false,
      approved_at: null,
    }));
    if (next.every((a, i) => a.approved === approvers[i].approved)) return;
    setApprovers(next);
    persist(next, requiredApprovals);
    appendEvent({
      event_type: 'withdrawn',
      description: 'All approvals withdrawn after section unconfirm',
      created_at: new Date().toISOString(),
    });
  }, [approvers, requiredApprovals, persist, appendEvent]);

  const toggleApproval = useCallback(
    (userId: number, userName: string | null) => {
      const now = new Date().toISOString();
      let wasApproved = false;
      const next = approvers.map((a) => {
        if (a.user_id !== userId) return a;
        wasApproved = a.approved;
        return {
          ...a,
          approved: !a.approved,
          approved_at: !a.approved ? now : null,
        };
      });
      setApprovers(next);
      persist(next, requiredApprovals);
      appendEvent({
        event_type: wasApproved ? 'withdrawn' : 'approved',
        description: wasApproved
          ? `${userName ?? `User #${userId}`} withdrew approval`
          : `${userName ?? `User #${userId}`} approved transfer order`,
        created_at: now,
        user_name: userName,
      });
    },
    [approvers, requiredApprovals, persist, appendEvent]
  );

  return {
    approvers,
    requiredApprovals,
    approvalSummary,
    localEvents,
    addApprover,
    removeApprover,
    setRequired,
    toggleApproval,
    withdrawAllApprovals,
  };
}
