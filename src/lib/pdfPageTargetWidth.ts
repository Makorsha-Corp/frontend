export const PDF_PAGE_WIDTH_MIN = 400;
export const PDF_PAGE_WIDTH_MAX = 3200;
export const PDF_PAGE_WIDTH_BUCKET = 400;
export const PDF_PAGE_WIDTH_DEFAULT = 1600;

export interface PdfPageTargetSizeInput {
  containerWidth: number;
  containerHeight?: number;
  pageAspect?: number;
}

function clampAndBucket(raw: number): number {
  const clamped = Math.min(PDF_PAGE_WIDTH_MAX, Math.max(PDF_PAGE_WIDTH_MIN, raw));
  return Math.ceil(clamped / PDF_PAGE_WIDTH_BUCKET) * PDF_PAGE_WIDTH_BUCKET;
}

/** Target Cloudinary raster width from container size, DPR, and optional page aspect. */
export function bucketPdfPageWidth(
  containerWidth: number,
  containerHeight?: number,
  pageAspect?: number,
): number {
  if (containerWidth <= 0 && (containerHeight ?? 0) <= 0) {
    return PDF_PAGE_WIDTH_DEFAULT;
  }

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const scale = 1.5;

  const widthCandidate =
    containerWidth > 0 ? Math.ceil(containerWidth * dpr * scale) : 0;

  let heightCandidate = 0;
  if (containerHeight != null && containerHeight > 0 && pageAspect != null && pageAspect > 0) {
    heightCandidate = Math.ceil(containerHeight * dpr * scale * pageAspect);
  }

  const raw = Math.max(widthCandidate, heightCandidate);
  if (raw <= 0) {
    return PDF_PAGE_WIDTH_DEFAULT;
  }

  return clampAndBucket(raw);
}

export function bucketPdfPageTargetSize(input: PdfPageTargetSizeInput): number {
  return bucketPdfPageWidth(input.containerWidth, input.containerHeight, input.pageAspect);
}
