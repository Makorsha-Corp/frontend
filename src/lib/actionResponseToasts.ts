import type { ActionMessage } from '@/types/common';

import { appToast } from '@/lib/appToast';

const MESSAGE_SEPARATOR = ' · ';

/** Combine ActionResponse messages into one toast line. */
export function formatActionMessages(messages: ActionMessage[]): string {
  if (messages.length === 0) return '';
  if (messages.length === 1) return messages[0].message;

  const primary =
    messages.find((m) => m.type === 'success') ??
    messages.find((m) => m.type === 'error') ??
    messages.find((m) => m.type === 'warning') ??
    messages[0];

  const rest = messages.filter((m) => m !== primary).map((m) => m.message);
  if (rest.length === 0) return primary.message;
  return [primary.message, ...rest].join(MESSAGE_SEPARATOR);
}

function toastKindForMessages(messages: ActionMessage[]): 'success' | 'error' | 'neutral' {
  if (messages.some((m) => m.type === 'error')) return 'error';
  if (messages.some((m) => m.type === 'success')) return 'success';
  return 'neutral';
}

/** Show one toast for ActionResponse.messages — avoids N-toast pile-up. */
export function showActionMessages(messages: ActionMessage[] | undefined): void {
  if (!messages?.length) return;
  const text = formatActionMessages(messages);
  appToast[toastKindForMessages(messages)](text);
}
