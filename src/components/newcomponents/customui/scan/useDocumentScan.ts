import { useCallback, useEffect, useRef, useState } from 'react';

import {
  bitmapToCanvas,
  clampCorners,
  decodeImageFile,
  detectCornersFromBitmap,
  isUsableQuad,
  loadOpenCv,
  outputSizeFor,
  prefetchOpenCv,
  renderScannedCanvas,
  type DecodedImage,
  type OrderedCorners,
  type ScanPresetId,
} from '@/lib/documentScan';
import { canvasToUploadFile } from '@/lib/documentScan/encodeResult';
import { defaultCorners } from '@/lib/documentScan/orderCorners';
import { compressOriginal } from '@/lib/imageCompression';
import { isHeicFile } from '@/lib/heicConvert';

import { DEFAULT_SCAN_PRESET } from './scanPresets';

export type UploadVersion = 'original' | 'scanned';

export interface UseDocumentScanResult {
  canScan: boolean;
  scanDisabledReason: string | null;
  version: UploadVersion;
  setVersion: (version: UploadVersion) => Promise<void>;
  preset: ScanPresetId;
  setPreset: (preset: ScanPresetId) => void;
  corners: OrderedCorners | null;
  setCorners: (corners: OrderedCorners) => void;
  scanPhase: 'idle' | 'loading' | 'ready' | 'error';
  detectionNote: string | null;
  sourcePreviewUrl: string | null;
  resultPreviewUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  isBusy: boolean;
  enableScan: () => Promise<void>;
  redetectCorners: () => Promise<void>;
  resetToWholePhoto: () => void;
  resolveUploadFile: (fileName: string) => Promise<File>;
}

function isScannableFile(file: File): boolean {
  if (file.type === 'application/pdf') return false;
  return file.type.startsWith('image/') || isHeicFile(file);
}

export function useDocumentScan(file: File | null): UseDocumentScanResult {
  const [version, setVersionState] = useState<UploadVersion>('original');
  const [preset, setPresetState] = useState<ScanPresetId>(DEFAULT_SCAN_PRESET);
  const [corners, setCornersState] = useState<OrderedCorners | null>(null);
  const [scanPhase, setScanPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [detectionNote, setDetectionNote] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null);
  const [resultCanvas, setResultCanvas] = useState<HTMLCanvasElement | null>(null);

  const generationRef = useRef(0);
  const renderTimerRef = useRef<number | null>(null);
  const fileRef = useRef<File | null>(file);

  fileRef.current = file;

  const canScan = file ? isScannableFile(file) : false;
  const scanDisabledReason = !file
    ? null
    : file.type === 'application/pdf'
      ? 'Scanning works on photos, not PDFs.'
      : canScan
        ? null
        : 'This file type cannot be scanned.';

  const updateResultPreview = useCallback((canvas: HTMLCanvasElement | null) => {
    setResultPreviewUrl(canvas ? canvas.toDataURL('image/jpeg', 0.75) : null);
    setResultCanvas(canvas);
  }, []);

  const renderScan = useCallback(
    async (nextCorners: OrderedCorners, nextPreset: ScanPresetId) => {
      if (!sourceCanvas || !decoded) return;
      const generation = generationRef.current;

      try {
        const cv = await loadOpenCv();
        if (generation !== generationRef.current) return;

        const { width, height } = outputSizeFor(nextCorners);
        const rendered = await renderScannedCanvas(
          cv,
          sourceCanvas,
          nextCorners,
          width,
          height,
          nextPreset,
        );
        if (generation !== generationRef.current) return;
        if (!rendered) {
          throw new Error('Could not render scanned preview.');
        }
        updateResultPreview(rendered);
      } catch (error) {
        if (generation !== generationRef.current) return;
        setScanPhase('error');
        updateResultPreview(null);
        throw error;
      }
    },
    [decoded, sourceCanvas, updateResultPreview],
  );

  const scheduleRender = useCallback(
    (nextCorners: OrderedCorners, nextPreset: ScanPresetId) => {
      if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
      renderTimerRef.current = window.setTimeout(() => {
        void renderScan(nextCorners, nextPreset);
      }, 120);
    },
    [renderScan],
  );

  const runDetection = useCallback(async () => {
    if (!decoded) return null;
    const cv = await loadOpenCv();
    return detectCornersFromBitmap(cv, decoded.bitmap);
  }, [decoded]);

  const enableScan = useCallback(async () => {
    if (!decoded || !canScan) return;
    setScanPhase('loading');
    setDetectionNote(null);

    try {
      const detection = await runDetection();
      if (!detection) return;

      setCornersState(detection.corners);
      setDetectionNote(
        detection.detected ? null : "Couldn't find the page edges — drag the dots.",
      );
      setVersionState('scanned');
      await renderScan(detection.corners, preset);
      setScanPhase('ready');
    } catch (error) {
      setScanPhase('error');
      setVersionState('original');
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Document scanning is unavailable right now.';
      throw new Error(message);
    }
  }, [canScan, decoded, preset, renderScan, runDetection]);

  const redetectCorners = useCallback(async () => {
    if (!decoded || version !== 'scanned') return;
    setScanPhase('loading');
    try {
      const detection = await runDetection();
      if (!detection) return;
      setCornersState(detection.corners);
      setDetectionNote(
        detection.detected ? null : "Couldn't find the page edges — drag the dots.",
      );
      await renderScan(detection.corners, preset);
      setScanPhase('ready');
    } catch {
      setScanPhase('error');
    }
  }, [decoded, preset, renderScan, runDetection, version]);

  const resetToWholePhoto = useCallback(() => {
    if (!decoded) return;
    const whole = defaultCorners(decoded.width, decoded.height);
    setCornersState(whole);
    setDetectionNote(null);
    void renderScan(whole, preset);
  }, [decoded, preset, renderScan]);

  const setVersion = useCallback(
    (next: UploadVersion): Promise<void> => {
      if (next === 'scanned') {
        return enableScan();
      }
      setVersionState('original');
      return Promise.resolve();
    },
    [enableScan],
  );

  const setPreset = useCallback(
    (next: ScanPresetId) => {
      setPresetState(next);
      if (version === 'scanned' && corners) {
        scheduleRender(corners, next);
      }
    },
    [corners, scheduleRender, version],
  );

  const setCorners = useCallback(
    (next: OrderedCorners) => {
      if (!decoded) return;
      const clamped = clampCorners(next, decoded.width, decoded.height);
      if (!isUsableQuad(clamped, decoded.width, decoded.height)) return;
      setCornersState(clamped);
      if (version === 'scanned') {
        scheduleRender(clamped, preset);
      }
    },
    [decoded, preset, scheduleRender, version],
  );

  useEffect(() => {
    generationRef.current += 1;
    const generation = generationRef.current;

    setVersionState('original');
    setPresetState(DEFAULT_SCAN_PRESET);
    setCornersState(null);
    setScanPhase('idle');
    setDetectionNote(null);
    setDecoded(null);
    setSourceCanvas(null);
    updateResultPreview(null);

    if (!file) {
      setSourcePreviewUrl(null);
      return undefined;
    }

    prefetchOpenCv();

    void decodeImageFile(file)
      .then((nextDecoded) => {
        if (generation !== generationRef.current) {
          nextDecoded.bitmap.close();
          return;
        }
        setDecoded(nextDecoded);
        const canvas = bitmapToCanvas(nextDecoded.bitmap);
        setSourceCanvas(canvas);
        setSourcePreviewUrl(canvas.toDataURL('image/jpeg', 0.75));
      })
      .catch(() => {
        if (generation !== generationRef.current) return;
        setScanPhase('error');
      });

    return () => {
      generationRef.current += 1;
      if (renderTimerRef.current) window.clearTimeout(renderTimerRef.current);
    };
  }, [file, updateResultPreview]);

  useEffect(
    () => () => {
      decoded?.bitmap.close();
    },
    [decoded],
  );

  const resolveUploadFile = useCallback(
    async (fileName: string) => {
      const original = fileRef.current;
      if (!original) throw new Error('No file selected.');

      if (version === 'scanned' && resultCanvas) {
        return canvasToUploadFile(resultCanvas, fileName, preset);
      }

      const compressed = await compressOriginal(original);
      if (compressed !== original) return compressed;

      if (decoded?.normalizedFile) return decoded.normalizedFile;
      return original;
    },
    [decoded?.normalizedFile, preset, resultCanvas, version],
  );

  return {
    canScan,
    scanDisabledReason,
    version,
    setVersion,
    preset,
    setPreset,
    corners,
    setCorners,
    scanPhase,
    detectionNote,
    sourcePreviewUrl,
    resultPreviewUrl,
    imageWidth: decoded?.width ?? 0,
    imageHeight: decoded?.height ?? 0,
    isBusy: scanPhase === 'loading',
    enableScan,
    redetectCorners,
    resetToWholePhoto,
    resolveUploadFile,
  };
}
