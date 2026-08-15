import type { WorkOrderApprover } from '@/types/workOrder';
import type { WorkspaceMember } from '@/types/workspace';

export {
  APPROVAL_AVATAR_COLORS as AVATAR_COLORS,
  avatarColor,
  initialsOf,
} from './approvals/approvalAvatarUtils';

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
