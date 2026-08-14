import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Loader2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCancelMobileUploadSessionMutation,
  useCreateMobileUploadSessionMutation,
  useGetMobileUploadSessionQuery,
  usePromoteMobileUploadSessionMutation,
} from '@/features/mobileUpload/mobileUploadApi';
import type { AttachmentEntityType } from '@/types/attachment';
import { ATTACHMENT_ENTITY_TYPE_LABELS } from '@/types/attachment';

const MAX_NOTE_LENGTH = 500;

export interface MobileUploadQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: AttachmentEntityType;
  entityId: number;
  entityLabel?: string;
  onAttached?: () => void;
}

function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function MobileUploadQrDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityLabel,
  onAttached,
}: MobileUploadQrDialogProps) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(entityLabel ?? null);
  const [countdown, setCountdown] = useState('');
  const [fileName, setFileName] = useState('');
  const [note, setNote] = useState('');
  const [stopPolling, setStopPolling] = useState(false);
  const namePrefillSessionRef = useRef<number | null>(null);
  const [createSession, { isLoading: isCreating }] = useCreateMobileUploadSessionMutation();
  const [cancelSession] = useCancelMobileUploadSessionMutation();
  const [promoteSession, { isLoading: isPromoting }] = usePromoteMobileUploadSessionMutation();

  const { data: session } = useGetMobileUploadSessionQuery(sessionId ?? 0, {
    skip: !open || sessionId == null,
    pollingInterval: open && sessionId != null && !stopPolling ? 2000 : 0,
  });

  const uploaded = session?.status === 'uploaded';

  const uploadUrl = useMemo(() => {
    if (!rawToken || typeof window === 'undefined') return '';
    return `${window.location.origin}/m/${rawToken}`;
  }, [rawToken]);

  const reset = useCallback(() => {
    setSessionId(null);
    setRawToken(null);
    setExpiresAt(null);
    setFileName('');
    setNote('');
    setStopPolling(false);
    namePrefillSessionRef.current = null;
  }, []);

  const bootstrapSession = useCallback(async () => {
    reset();
    try {
      const created = await createSession({
        entity_type: entityType,
        entity_id: entityId,
        entity_label: entityLabel ?? null,
      }).unwrap();
      setSessionId(created.session_id);
      setRawToken(created.token);
      setExpiresAt(created.expires_at);
      setResolvedLabel(created.entity_label ?? entityLabel ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start phone upload.';
      toast.error(message);
      onOpenChange(false);
    }
  }, [createSession, entityId, entityLabel, entityType, onOpenChange, reset]);

  const bootstrapSessionRef = useRef(bootstrapSession);
  bootstrapSessionRef.current = bootstrapSession;

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    void bootstrapSessionRef.current();
  }, [open, reset]);

  useEffect(() => {
    if (!expiresAt || !open) return;
    const tick = () => setCountdown(formatCountdown(expiresAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, open]);

  useEffect(() => {
    if (session?.status === 'uploaded') setStopPolling(true);
  }, [session?.status]);

  useEffect(() => {
    if (!uploaded || sessionId == null) return;
    if (namePrefillSessionRef.current === sessionId) return;
    namePrefillSessionRef.current = sessionId;
    setFileName(session?.file_name ?? '');
  }, [session?.file_name, sessionId, uploaded]);

  const handleClose = async (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (
      sessionId != null &&
      !isPromoting &&
      (session?.status === 'waiting' || session?.status === 'uploaded')
    ) {
      try {
        await cancelSession(sessionId).unwrap();
      } catch {
        /* best effort */
      }
    }
    onOpenChange(false);
  };

  const copyLink = async () => {
    if (!uploadUrl) return;
    try {
      await navigator.clipboard.writeText(uploadUrl);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleAttach = async () => {
    if (sessionId == null) return;
    const trimmedName = fileName.trim();
    const trimmedNote = note.trim();
    if (trimmedNote.length > MAX_NOTE_LENGTH) {
      toast.error(`Description must be ${MAX_NOTE_LENGTH} characters or fewer.`);
      return;
    }
    try {
      const attached = await promoteSession({
        sessionId,
        file_name: trimmedName || null,
        note: trimmedNote || null,
      }).unwrap();
      toast.success(`${attached.file_name} attached`);
      onAttached?.();
      onOpenChange(false);
    } catch (error) {
      const apiDetail =
        error && typeof error === 'object' && 'data' in error
          ? (error as { data?: { detail?: string } }).data?.detail
          : undefined;
      toast.error(apiDetail ?? (error instanceof Error ? error.message : 'Could not attach file.'));
    }
  };

  const heading =
    resolvedLabel ??
    `${ATTACHMENT_ENTITY_TYPE_LABELS[entityType] ?? entityType} #${entityId}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(24rem,94vw)] max-w-none gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-brand-primary" />
            Upload from phone
          </DialogTitle>
          <DialogDescription>
            {uploaded
              ? `Name the file from your phone, then attach it to ${heading}.`
              : `Scan the QR code or open the link on your phone to send a file to ${heading}.`}
          </DialogDescription>
        </DialogHeader>

        {uploaded ? (
          <div className="flex flex-col gap-4">
            {session?.preview_url ? (
              <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                <img
                  src={session.preview_url}
                  alt={session.file_name ?? 'Phone upload preview'}
                  className="max-h-48 w-full object-contain"
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="mobile-upload-file-name">File name</Label>
              <Input
                id="mobile-upload-file-name"
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
                disabled={isPromoting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-upload-note">Description (optional)</Label>
              <Textarea
                id="mobile-upload-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={MAX_NOTE_LENGTH}
                disabled={isPromoting}
                className="min-h-[4.5rem] resize-none"
              />
            </div>
            <Button type="button" onClick={() => void handleAttach()} disabled={isPromoting}>
              {isPromoting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Attaching…
                </>
              ) : (
                'Attach'
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {isCreating || !uploadUrl ? (
              <div className="flex h-44 w-44 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-white p-3">
                <QRCodeSVG value={uploadUrl} size={176} level="M" includeMargin={false} />
              </div>
            )}

            <div className="w-full space-y-2 text-center">
              <p className="text-xs text-muted-foreground">
                Expires in{' '}
                <span className="tabular-nums font-medium text-foreground">{countdown || '—'}</span>
              </p>
              <p className="text-sm text-muted-foreground">Waiting for your phone…</p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={!uploadUrl}
              onClick={() => void copyLink()}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
