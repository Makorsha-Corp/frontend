const MAX_LISTED_SIBLING_JOBS = 3;

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
