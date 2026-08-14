declare module 'jscanify/client' {
  export interface JscanifyPoint {
    x: number;
    y: number;
  }

  export interface JscanifyCornerPoints {
    topLeftCorner: JscanifyPoint;
    topRightCorner: JscanifyPoint;
    bottomLeftCorner: JscanifyPoint;
    bottomRightCorner: JscanifyPoint;
  }

  export default class JScanify {
    findPaperContour(img: unknown): unknown;
    getCornerPoints(contour: unknown): JscanifyCornerPoints;
    extractPaper(
      image: HTMLImageElement | HTMLCanvasElement | File,
      resultWidth: number,
      resultHeight: number,
      cornerPoints?: JscanifyCornerPoints,
    ): HTMLCanvasElement | null;
  }
}

declare module 'heic2any' {
  export default function heic2any(options: {
    blob: Blob;
    toType?: string;
    quality?: number;
  }): Promise<Blob | Blob[]>;
}
