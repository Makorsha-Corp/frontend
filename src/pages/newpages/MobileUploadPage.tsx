import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, FileUp, Loader2, Smartphone } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { appToast } from '@/lib/appToast';

import PendingAttachmentUploadDialog from '@/components/newcomponents/customui/scan/PendingAttachmentUploadDialog';
import { Button } from '@/components/ui/button';
import {
  ALLOWED_ATTACHMENT_ACCEPT,
  ATTACHMENT_TYPE_HINT,
  MAX_ATTACHMENT_BYTES,
  prepareAttachmentFileForUpload,
  validateAttachmentFile,
} from '@/lib/attachmentAllowlist';
import { getPublicMobileUploadSession, uploadPublicMobileFile } from '@/lib/mobileUploadPublicApi';
import type { MobileUploadPublicSession } from '@/types/mobileUpload';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PagePhase = 'loading' | 'ready' | 'uploading' | 'success' | 'dead';

export default function MobileUploadPage() {
  const { token = '' } = useParams<{ token: string }>();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [session, setSession] = useState<MobileUploadPublicSession | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [pendingNote, setPendingNote] = useState('');

  const loadSession = useCallback(async () => {
    if (!token) {
      setPhase('dead');
      return;
    }
    setPhase('loading');
    try {
      const info = await getPublicMobileUploadSession(token);
      if (info.status === 'waiting') {
        setSession(info);
        setPhase('ready');
        return;
      }
      setSession(info);
      setPhase('dead');
    } catch {
      setPhase('dead');
    }
  }, [token]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const clearInputs = () => {
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const queueFile = (file: File | undefined) => {
    if (!file || phase !== 'ready') return;

    const validationError = validateAttachmentFile(file);
    if (validationError) {
      appToast.error(validationError);
      clearInputs();
      return;
    }

    const prepared = prepareAttachmentFileForUpload(file);
    if (!prepared) {
      appToast.error('Unsupported file type.');
      clearInputs();
      return;
    }

    setPendingFile(prepared.file);
    setPendingName(prepared.file.name);
    setPendingNote('');
    clearInputs();
  };

  const cancelPending = () => {
    setPendingFile(null);
    setPendingName('');
    setPendingNote('');
  };

  const confirmPending = async (file: File, requestedName: string) => {
    if (!token) return;
    setPendingFile(null);
    setPendingName('');
    setPendingNote('');
    setPhase('uploading');
    setProgress(0);
    try {
      const named = new File([file], requestedName || file.name, { type: file.type });
      await uploadPublicMobileFile(token, named, setProgress);
      setPhase('success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      appToast.error(message);
      setPhase('ready');
      setProgress(null);
    }
  };

  const heading = session?.entity_label ?? 'your computer';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Smartphone className="h-5 w-5 text-brand-primary" />
          <div>
            <h1 className="text-base font-semibold">Send to computer</h1>
            <p className="text-xs text-muted-foreground">One photo or file for {heading}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-8">
        {phase === 'loading' ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            <p className="text-sm">Checking link…</p>
          </div>
        ) : null}

        {phase === 'ready' ? (
          <>
            <p className="text-center text-sm text-muted-foreground">
              {ATTACHMENT_TYPE_HINT} — max {formatBytes(MAX_ATTACHMENT_BYTES)}
            </p>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => queueFile(event.target.files?.[0])}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_ATTACHMENT_ACCEPT}
              className="hidden"
              onChange={(event) => queueFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              size="lg"
              className="h-14 w-full text-base"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="mr-2 h-5 w-5" />
              Take photo
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-14 w-full text-base"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="mr-2 h-5 w-5" />
              Choose file
            </Button>
          </>
        ) : null}

        {phase === 'uploading' ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            <p className="text-sm font-medium">Uploading…</p>
            {progress != null ? (
              <p className="text-xs tabular-nums text-muted-foreground">{progress}%</p>
            ) : null}
          </div>
        ) : null}

        {phase === 'success' ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <p className="text-base font-semibold">Sent to your computer</p>
            <p className="mt-2 text-sm text-muted-foreground">You can close this page.</p>
          </div>
        ) : null}

        {phase === 'dead' ? (
          <div className="rounded-lg border border-border bg-muted/20 p-6 text-center">
            <p className="text-base font-semibold">This link is no longer available</p>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have expired or already been used. Open a new QR code from your computer.
            </p>
          </div>
        ) : null}
      </main>

      <PendingAttachmentUploadDialog
        file={pendingFile}
        fileName={pendingName}
        onFileNameChange={setPendingName}
        description={pendingNote}
        onDescriptionChange={setPendingNote}
        open={!!pendingFile && phase === 'ready'}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) cancelPending();
        }}
        onCancel={cancelPending}
        onConfirm={async (file, fileName) => {
          await confirmPending(file, fileName);
        }}
        isUploading={phase === 'uploading'}
        showDescription={false}
        title="Scan and send"
        descriptionText="Scan the document on this phone, then send the final file to your computer."
      />
    </div>
  );
}
