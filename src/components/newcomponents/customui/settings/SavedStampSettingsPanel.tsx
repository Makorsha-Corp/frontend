import React, { useCallback, useMemo, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { appToast } from '@/lib/appToast';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MarkupEditorToolbar } from '@/components/newcomponents/customui/attachmentMarkup/MarkupEditor';
import {
  DEFAULT_PEN_PRESET,
  MARKUP_PICKER_COLORS,
  penWidthForPreset,
  renderStrokeWidth,
  type PenWidthPresetId,
} from '@/components/newcomponents/customui/attachmentMarkup/markupDefaults';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import {
  canvasToPngFile,
  fileToCanvas,
  removePaperBackground,
} from '@/lib/signature/removePaperBackground';
import { cn } from '@/lib/utils';
import { updateUser } from '@/features/auth/authSlice';
import { useSignStampImageUploadMutation, useUpdateMeMutation } from '@/features/auth/authApi';
import type { MarkupStroke } from '@/types/attachment';
import {
  STAMP_VIEWBOX_HEIGHT,
  STAMP_VIEWBOX_WIDTH,
  type SavedStamp,
} from '@/types/savedStamp';

import StampDrawCanvas from './StampDrawCanvas';

type StampMode = 'draw' | 'upload';

function checkerboardClassName() {
  return 'bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0px]';
}

function cloneStrokes(strokes: MarkupStroke[]): MarkupStroke[] {
  return JSON.parse(JSON.stringify(strokes)) as MarkupStroke[];
}

const SavedStampSettingsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const savedStamp = useAppSelector((state) => state.auth.user?.saved_stamp ?? null);
  const [mode, setMode] = useState<StampMode>(savedStamp?.kind === 'image' ? 'upload' : 'draw');
  const [drawStrokes, setDrawStrokes] = useState<MarkupStroke[]>(
    savedStamp?.kind === 'vector' ? savedStamp.strokes : [],
  );
  const [strokeHistory, setStrokeHistory] = useState<MarkupStroke[][]>([]);
  const [penPreset, setPenPreset] = useState<PenWidthPresetId>(DEFAULT_PEN_PRESET);
  const [color, setColor] = useState<string>(MARKUP_PICKER_COLORS[0]);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(
    savedStamp?.kind === 'image' ? savedStamp.url : null,
  );
  const [uploadDimensions, setUploadDimensions] = useState<{ width: number; height: number } | null>(
    savedStamp?.kind === 'image'
      ? { width: savedStamp.width, height: savedStamp.height }
      : null,
  );
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [updateMe, { isLoading: isSavingProfile }] = useUpdateMeMutation();
  const [signStampUpload, { isLoading: isSigning }] = useSignStampImageUploadMutation();

  const isBusy = isSavingProfile || isSigning || isProcessing;

  const previewStamp = useMemo((): SavedStamp | null => {
    if (mode === 'draw' && drawStrokes.length > 0) {
      return {
        kind: 'vector',
        strokes: drawStrokes,
        viewBox: { width: STAMP_VIEWBOX_WIDTH, height: STAMP_VIEWBOX_HEIGHT },
      };
    }
    if (mode === 'upload' && uploadPreviewUrl && uploadDimensions) {
      return {
        kind: 'image',
        public_id: savedStamp?.kind === 'image' ? savedStamp.public_id : 'pending',
        url: uploadPreviewUrl,
        width: uploadDimensions.width,
        height: uploadDimensions.height,
      };
    }
    return savedStamp;
  }, [drawStrokes, mode, savedStamp, uploadDimensions, uploadPreviewUrl]);

  const pushStrokeHistory = useCallback(() => {
    setStrokeHistory((prev) => [...prev.slice(-19), cloneStrokes(drawStrokes)]);
  }, [drawStrokes]);

  const handleStrokesChange = useCallback((strokes: MarkupStroke[]) => {
    setDrawStrokes(strokes);
  }, []);

  const handleUndo = () => {
    const previous = strokeHistory[strokeHistory.length - 1];
    if (!previous) return;
    setStrokeHistory((stack) => stack.slice(0, -1));
    setDrawStrokes(cloneStrokes(previous));
  };

  const handleClearDrawing = () => {
    if (drawStrokes.length === 0) return;
    pushStrokeHistory();
    setDrawStrokes([]);
  };

  const handleSaveDrawn = async () => {
    if (drawStrokes.length === 0) {
      appToast.error('Draw your stamp before saving.');
      return;
    }
    try {
      const payload: SavedStamp = {
        kind: 'vector',
        strokes: drawStrokes,
        viewBox: { width: STAMP_VIEWBOX_WIDTH, height: STAMP_VIEWBOX_HEIGHT },
      };
      const user = await updateMe({ saved_stamp: payload }).unwrap();
      dispatch(updateUser(user));
      appToast.success('Saved stamp updated.');
    } catch {
      appToast.error('Could not save stamp.');
    }
  };

  const handleClearSaved = async () => {
    try {
      const user = await updateMe({ saved_stamp: null }).unwrap();
      dispatch(updateUser(user));
      setDrawStrokes([]);
      setStrokeHistory([]);
      setUploadPreviewUrl(null);
      setUploadDimensions(null);
      setPendingUploadFile(null);
      appToast.success('Saved stamp removed.');
    } catch {
      appToast.error('Could not remove stamp.');
    }
  };

  const handlePickUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsProcessing(true);
    try {
      const sourceCanvas = await fileToCanvas(file);
      const cleaned = await removePaperBackground(sourceCanvas);
      const previewUrl = cleaned.toDataURL('image/png');
      setUploadPreviewUrl(previewUrl);
      setUploadDimensions({ width: cleaned.width, height: cleaned.height });
      const pngFile = await canvasToPngFile(cleaned, file.name);
      setPendingUploadFile(pngFile);
      setMode('upload');
    } catch {
      appToast.error('Could not process image. Try a clearer photo on white paper.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveUpload = async () => {
    if (!pendingUploadFile && !(savedStamp?.kind === 'image' && uploadPreviewUrl)) {
      appToast.error('Upload a stamp image first.');
      return;
    }

    try {
      if (pendingUploadFile) {
        const sign = await signStampUpload().unwrap();
        const result = await uploadToCloudinary(pendingUploadFile, sign);
        const payload: SavedStamp = {
          kind: 'image',
          public_id: result.public_id,
          url: result.secure_url,
          width: result.width ?? uploadDimensions?.width ?? 1,
          height: result.height ?? uploadDimensions?.height ?? 1,
        };
        const user = await updateMe({ saved_stamp: payload }).unwrap();
        dispatch(updateUser(user));
        setPendingUploadFile(null);
        appToast.success('Saved stamp updated.');
        return;
      }

      if (savedStamp?.kind === 'image') {
        appToast.success('Stamp already saved.');
      }
    } catch {
      appToast.error('Could not upload stamp.');
    }
  };

  const renderPreview = useCallback(() => {
    if (!previewStamp) {
      return (
        <div className="flex min-h-[6rem] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          No saved stamp yet
        </div>
      );
    }

    if (previewStamp.kind === 'image') {
      return (
        <div
          className={cn(
            'flex min-h-[6rem] items-center justify-center rounded-md border border-border p-3',
            checkerboardClassName(),
          )}
        >
          <img
            src={previewStamp.url}
            alt="Saved stamp preview"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    return (
      <div className="rounded-md border border-border bg-white p-3">
        <svg
          viewBox="0 0 1 1"
          className="min-h-[6rem] w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          {previewStamp.strokes.map((stroke, index) => (
            <polyline
              key={`preview-${index}`}
              fill="none"
              stroke={stroke.color}
              strokeWidth={renderStrokeWidth(stroke.width, 'pen')}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={stroke.points.map((point) => `${point.x},${point.y}`).join(' ')}
            />
          ))}
        </svg>
      </div>
    );
  }, [previewStamp]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Save one personal stamp to place on attachment markups. This is not a legal e-sign — it is
        an overlay mark only.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'draw' ? 'default' : 'outline'}
          onClick={() => setMode('draw')}
        >
          Draw
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'upload' ? 'default' : 'outline'}
          onClick={() => setMode('upload')}
        >
          Upload photo
        </Button>
      </div>

      {mode === 'draw' ? (
        <div className="space-y-3">
          <Label>Draw your stamp</Label>
          <MarkupEditorToolbar
            orientation="horizontal"
            tool="pen"
            onToolChange={() => undefined}
            penPreset={penPreset}
            onPenPresetChange={setPenPreset}
            color={color}
            onColorChange={setColor}
            onUndo={handleUndo}
            canUndo={strokeHistory.length > 0}
            onClearPage={handleClearDrawing}
            toolVisibility={{ text: false, pan: false, stamp: false }}
          />
          <StampDrawCanvas
            strokes={drawStrokes}
            onChange={handleStrokesChange}
            onBeforeChange={pushStrokeHistory}
            color={color}
            penWidth={penWidthForPreset(penPreset)}
          />
          <Button type="button" size="sm" onClick={handleSaveDrawn} disabled={isBusy}>
            {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save drawn stamp
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Label htmlFor="stamp-upload-input">Upload on white paper</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" asChild disabled={isBusy}>
              <label htmlFor="stamp-upload-input" className="cursor-pointer">
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Choose image
              </label>
            </Button>
            <input
              id="stamp-upload-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              className="sr-only"
              onChange={handlePickUpload}
              disabled={isBusy}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSaveUpload}
              disabled={isBusy || (!pendingUploadFile && savedStamp?.kind !== 'image')}
            >
              {isSigning || isSavingProfile ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save uploaded stamp
            </Button>
          </div>
          {uploadPreviewUrl ? (
            <div
              className={cn(
                'flex min-h-[8rem] items-center justify-center rounded-md border border-border p-4',
                checkerboardClassName(),
              )}
            >
              <img
                src={uploadPreviewUrl}
                alt="Processed stamp preview"
                className="max-h-40 max-w-full object-contain"
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <Label>Current saved stamp</Label>
        {renderPreview()}
        {savedStamp ? (
          <Button type="button" variant="outline" size="sm" onClick={handleClearSaved} disabled={isBusy}>
            Remove saved stamp
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default SavedStampSettingsPanel;
