import type { WorkOrderApprover } from '@/types/workOrder';
import type { WorkspaceMember } from '@/types/workspace';

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

/** Synthetic approvers for pre-create flows (sheet entry, wizards). */
export function draftApproversFromUserIds(
  userIds: number[],
  members: WorkspaceMember[],
): WorkOrderApprover[] {
  return userIds.map((userId, index) => {
    const member = members.find((m) => m.user_id === userId);
    return {
      id: -(index + 1),
      workspace_id: 0,
      work_order_id: 0,
      user_id: userId,
      user_name: member?.user_name ?? null,
      user_email: member?.user_email ?? null,
      user_position: member?.user_position ?? null,
      assigned_by: null,
      assigned_at: '',
      approver_slot: null,
      approved: false,
      approved_at: null,
    };
  });
}

export type { TransferOrderApprover, TransferApprovalSummary } from '@/types/transferOrder';
