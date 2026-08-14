import { isHeicFile, convertHeicToJpeg } from '@/lib/heicConvert';

import { fitWithin } from './geometry';
import { MAX_DECODE_MEGAPIXELS } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OpenCv = any;

const OPENCV_SCRIPT_SRC = '/vendor/opencv/opencv.js';

let cvPromise: Promise<OpenCv> | null = null;
let scriptPromise: Promise<void> | null = null;

function isOpenCvReady(cv: OpenCv): boolean {
  return typeof cv?.Mat !== 'undefined';
}

function isThenable(value: unknown): value is PromiseLike<OpenCv> {
  return (
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as PromiseLike<OpenCv>).then === 'function'
  );
}

function getGlobalCv(): OpenCv | undefined {
  return (window as Window & { cv?: OpenCv }).cv;
}

function assignGlobalCv(cv: OpenCv): OpenCv {
  (window as Window & { cv?: OpenCv }).cv = cv;
  return cv;
}

/** OpenCV 5 UMD assigns window.cv to cv(Module), a Promise — await before use. */
async function resolveOpenCvExport(raw: unknown): Promise<OpenCv> {
  if (!raw) {
    throw new Error('OpenCV failed to load.');
  }

  if (isThenable(raw)) {
    const resolved = await raw;
    if (!isOpenCvReady(resolved)) {
      throw new Error('OpenCV failed to load.');
    }
    return assignGlobalCv(resolved);
  }

  return waitForRuntime(raw as OpenCv);
}

function shouldSkipPrefetch(): boolean {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
}

function waitForRuntime(cv: OpenCv): Promise<OpenCv> {
  if (isOpenCvReady(cv)) {
    return Promise.resolve(assignGlobalCv(cv));
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('OpenCV failed to load.'));
    }, 20_000);

    cv.onRuntimeInitialized = () => {
      window.clearTimeout(timeout);
      resolve(assignGlobalCv(cv));
    };
  });
}

function injectOpenCvScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = getGlobalCv();
    if (existing) {
      void resolveOpenCvExport(existing).then(() => resolve()).catch(reject);
      return;
    }

    const current = document.querySelector<HTMLScriptElement>(
      `script[data-opencv-loader="true"]`,
    );
    if (current) {
      const onReady = () => {
        void resolveOpenCvExport(getGlobalCv()).then(() => resolve()).catch(reject);
      };
      if (getGlobalCv()) {
        onReady();
        return;
      }
      current.addEventListener('load', onReady, { once: true });
      current.addEventListener('error', () => {
        reject(new Error('OpenCV failed to load.'));
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = OPENCV_SCRIPT_SRC;
    script.async = true;
    script.dataset.opencvLoader = 'true';
    script.onload = () => {
      void resolveOpenCvExport(getGlobalCv()).then(() => resolve()).catch(reject);
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('OpenCV failed to load.'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Lazy-load OpenCV WASM once per session (served from /public/vendor/opencv). */
export function loadOpenCv(): Promise<OpenCv> {
  if (!cvPromise) {
    cvPromise = injectOpenCvScript().then(() => {
      const cv = getGlobalCv();
      if (!cv || !isOpenCvReady(cv)) {
        throw new Error('OpenCV failed to load.');
      }
      return cv;
    });
  }
  return cvPromise;
}

/** Fire-and-forget OpenCV prefetch; errors are ignored. */
export function prefetchOpenCv(): void {
  if (shouldSkipPrefetch()) return;
  void loadOpenCv().catch(() => undefined);
}

export interface DecodedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  /** JPEG file when HEIC was converted for decode. */
  normalizedFile: File | null;
}

/** Decode an upload file to a bitmap, downscaling very large sources first. */
export async function decodeImageFile(file: File): Promise<DecodedImage> {
  const normalizedFile = isHeicFile(file) ? await convertHeicToJpeg(file) : null;
  const decodeFile = normalizedFile ?? file;
  let bitmap = await createImageBitmap(decodeFile);

  const megapixels = bitmap.width * bitmap.height;
  if (megapixels > MAX_DECODE_MEGAPIXELS) {
    const scale = Math.sqrt(MAX_DECODE_MEGAPIXELS / megapixels);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not decode image.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    bitmap = await createImageBitmap(canvas);
  }

  return {
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    normalizedFile,
  };
}

export function bitmapToCanvas(bitmap: ImageBitmap, maxEdge?: number): HTMLCanvasElement {
  const target = maxEdge
    ? fitWithin(bitmap.width, bitmap.height, maxEdge)
    : { width: bitmap.width, height: bitmap.height };

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas.');
  ctx.drawImage(bitmap, 0, 0, target.width, target.height);
  return canvas;
}
