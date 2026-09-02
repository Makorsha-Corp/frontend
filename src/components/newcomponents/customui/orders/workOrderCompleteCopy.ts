const MAX_LISTED_SIBLING_JOBS = 3;

export const WORK_ORDER_DIRECT_COMPLETE_TOOLTIP =
  'Complete on the planned date without starting — use when work was already done and this entry is catching up.';

export function getWorkOrderStartActionTooltip(hasMachineTarget: boolean): string {
  if (hasMachineTarget) {
    return 'Move to In Progress — consumes pending inventory and sets the target machine to Maintenance.';
  }
  return 'Move to In Progress — consumes pending inventory marked for this order.';
}

export function formatOtherActiveJobsWarning(siblingWorkOrderNumbers: string[]): {
  title: string;
  body: string;
} {
  const count = siblingWorkOrderNumbers.length;
  const listed = siblingWorkOrderNumbers.slice(0, MAX_LISTED_SIBLING_JOBS);
  const remainder = count - listed.length;
  const listedLabel = listed.join(', ');
  const suffix = remainder > 0 ? `, and ${remainder} more` : '';

  return {
    title: `${count} other job${count === 1 ? '' : 's'} still in progress on this machine`,
    body: `(${listedLabel}${suffix}). Your Idle/Off choice will apply to the machine now — other open jobs may still be active.`,
  };
}
