import { useEffect, useState, type RefObject } from 'react';

import {
  PDF_PAGE_WIDTH_DEFAULT,
  bucketPdfPageTargetSize,
} from '@/lib/pdfPageTargetWidth';

export interface UsePdfPageTargetWidthOptions {
  pageAspect?: number;
  displayScale?: number;
}

export function usePdfPageTargetWidth(
  containerRef: RefObject<HTMLElement | null>,
  options: UsePdfPageTargetWidthOptions = {},
): number {
  const { pageAspect, displayScale = 1 } = options;
  const [width, setWidth] = useState(PDF_PAGE_WIDTH_DEFAULT);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let rafId = 0;

    const applySize = (containerWidth: number, containerHeight: number) => {
      const scaleFactor = Math.max(1, displayScale);
      const next = bucketPdfPageTargetSize({
        containerWidth: containerWidth * scaleFactor,
        containerHeight: containerHeight * scaleFactor,
        pageAspect,
      });
      setWidth((current) => (current === next ? current : next));
    };

    const measure = () => {
      const rect = element.getBoundingClientRect();
      applySize(rect.width, rect.height);
    };

    measure();
    rafId = window.requestAnimationFrame(measure);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width: entryWidth, height: entryHeight } = entry.contentRect;
      if (entryWidth <= 0 && entryHeight <= 0) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => applySize(entryWidth, entryHeight), 200);
    });

    observer.observe(element);
    return () => {
      if (timer) clearTimeout(timer);
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [containerRef, displayScale, pageAspect]);

  return width;
}
