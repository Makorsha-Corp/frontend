import { useCallback, useEffect, useRef, useState } from 'react';

import { appToast } from '@/lib/appToast';
import { usePutMyAttachmentMarkupMutation } from '@/features/attachments/attachmentsApi';
import type { MarkupPayload } from '@/types/attachment';

import { isMarkupServiceUnavailable } from './markupDefaults';
import { createDebouncedMarkupSave } from './markupAutoSaveScheduler';
import { markupCopy } from './markupCopy';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSaveMarkup(attachmentId: number, enabled: boolean) {
  const [putMarkup] = usePutMyAttachmentMarkupMutation();
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const enabledRef = useRef(enabled);
  const attachmentIdRef = useRef(attachmentId);
  const savePausedRef = useRef(false);
  const toastShownRef = useRef(false);

  enabledRef.current = enabled;
  attachmentIdRef.current = attachmentId;

  const saveNow = useCallback(async (payload: MarkupPayload, force = false) => {
    if (!force && !enabledRef.current) return;
    if (!force && savePausedRef.current) return;

    setStatus('saving');
    try {
      await putMarkup({
        attachmentId: attachmentIdRef.current,
        body: { payload },
      }).unwrap();
      savePausedRef.current = false;
      toastShownRef.current = false;
      setStatus('saved');
    } catch (error) {
      setStatus('error');
      if (isMarkupServiceUnavailable(error)) {
        savePausedRef.current = true;
      }
      if (!toastShownRef.current) {
        appToast.error(markupCopy.saveFailed);
        toastShownRef.current = true;
      }
    }
  }, [putMarkup]);

  const saveNowRef = useRef(saveNow);
  saveNowRef.current = saveNow;

  const schedulerRef = useRef<ReturnType<typeof createDebouncedMarkupSave> | null>(null);
  if (!schedulerRef.current) {
    schedulerRef.current = createDebouncedMarkupSave((payload) =>
      saveNowRef.current(payload, false),
    );
  }

  const resumeSave = useCallback(() => {
    savePausedRef.current = false;
    toastShownRef.current = false;
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  const scheduleSave = useCallback((payload: MarkupPayload) => {
    if (!enabledRef.current) return;
    if (savePausedRef.current) return;
    schedulerRef.current?.schedule(payload);
  }, []);

  const flushSave = useCallback(() => {
    const scheduler = schedulerRef.current;
    const payload = scheduler?.getLatest() ?? { pages: {} };
    scheduler?.cancel();
    void saveNowRef.current(payload, true);
  }, []);

  useEffect(() => {
    savePausedRef.current = false;
    toastShownRef.current = false;
    setStatus('idle');
  }, [attachmentId]);

  useEffect(() => {
    const scheduler = schedulerRef.current;
    return () => {
      const payload = scheduler?.getLatest() ?? { pages: {} };
      scheduler?.cancel();
      if (enabledRef.current && !savePausedRef.current) {
        void saveNowRef.current(payload, true);
      }
    };
  }, []);

  return { status, scheduleSave, flushSave, resumeSave };
}
