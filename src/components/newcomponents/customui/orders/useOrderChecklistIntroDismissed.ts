import { useCallback, useState } from 'react';
import { ORDER_CHECKLIST_INTRO_DISMISSED_KEY } from './orderChecklistCopy';

function readDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ORDER_CHECKLIST_INTRO_DISMISSED_KEY) === '1';
}

export function useOrderChecklistIntroDismissed() {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismiss = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ORDER_CHECKLIST_INTRO_DISMISSED_KEY, '1');
    setDismissed(true);
  }, []);

  return { dismissed, dismiss };
}
