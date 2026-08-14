# Document scan for attachments — design

**Date:** 2026-08-10
**Scope:** `frontend/` (one optional one-line change in `backend/`)
**Status:** Approved, ready for implementation planning

## Problem

People photograph paper documents — challans, invoices, delivery notes — with a phone and attach the photo to an order. The result is a skewed, shadowed, multi-megabyte snapshot of a desk with a page somewhere in it. We want CamScanner-style cleanup: find the page, flatten it, raise contrast, and upload something legible and small.

## Decisions

| Decision | Choice |
|---|---|
| Entry point | File pick / drop only. No in-app camera capture. |
| What gets stored | One file. The user chooses original or scanned before upload; the discarded version is never uploaded. |
| Cropping | Auto-detect the page, with four draggable corners to correct it. |
| Filters | Three presets: Scan B&W, Grayscale, Colour-enhanced. |
| Multi-page | Out of scope. One photo, one attachment. |
| Where the work runs | Client-side, jscanify on OpenCV.js. |
| OpenCV.js delivery | Self-hosted, pinned, under `public/vendor/opencv/`. |
| Load timing | Lazy on tap, with a quiet prefetch when the dialog opens on an image. |
| UI shape | All-in-one: the existing "Name this attachment" dialog gains scan controls. No second dialog, no stages. |
| Original compression | Decodable photos (JPEG, and HEIC where the browser supports it) downscaled to 2400px @ q0.82. PNG/WebP untouched. |

### Why client-side

Cloudinary can warp with `e_distort` but cannot find page edges, so a server-side approach would force users to place all four corners by hand and pay a network round-trip per adjustment. A Python OpenCV backend would detect well but breaks the direct signed-upload design (bytes would flow through Railway), adds a ~60 MB dependency, and makes corner dragging laggy. Client-side keeps the backend untouched and previews instant; the cost is a one-time ~9 MB wasm download, paid only by people who actually scan.

## Architecture

Four new modules plus a contained change to `AttachmentPanel`.

### `src/lib/opencvLoader.ts`

```ts
loadOpenCv(): Promise<OpenCv>
prefetchOpenCv(): void
```

Injects `/vendor/opencv/opencv.js` once, resolves when the wasm runtime is initialized, caches the promise so later scans are instant, rejects after a 20-second timeout. The only module aware of script tags. `prefetchOpenCv()` is fire-and-forget and swallows errors; it no-ops when `navigator.connection.saveData` is set or `effectiveType` is `2g` / `slow-2g`.

### `src/lib/documentScan.ts`

Pure image logic, no React. Takes the `cv` instance as an argument so tests can inject a fake.

```ts
type Corners = { topLeft: Point; topRight: Point; bottomRight: Point; bottomLeft: Point };
type ScanPresetId = 'bw' | 'grayscale' | 'colour';

decodeForScan(file: File): Promise<ImageBitmap>       // downscales sources over 24 MP
detectCorners(cv, image): Corners                     // falls back to whole-image corners
normalizeCorners(points): Corners                     // orders TL/TR/BR/BL
isUsableQuad(corners, imageSize): boolean             // convex, non-degenerate, min area
clampCorner(point, imageSize): Point
outputSizeFor(corners): { width: number; height: number }
warpToCanvas(cv, image, corners, size): HTMLCanvasElement
applyScanFilter(cv, canvas, preset): HTMLCanvasElement
canvasToUploadFile(canvas, fileName, preset): Promise<File>
```

### `src/lib/imageCompression.ts`

```ts
shouldCompressOriginal(file): boolean                  // JPEG yes, PNG/WebP no
compressOriginal(file): Promise<File>                  // returns the source if the result is larger or undecodable
```

Compression needs to decode the image, so it is attempted only on formats the browser can decode. HEIC is treated as pass-through for the same reason scanning is unavailable for it: most browsers cannot decode it to a canvas. `compressOriginal` returns the untouched source whenever decoding fails, so a browser that *can* decode HEIC gets the benefit without a separate code path.

### `src/components/newcomponents/customui/scan/`

- `scanPresets.ts` — preset definitions (id, label, OpenCV parameters, output container). Data only.
- `CornerOverlay.tsx` — dumb component. Renders the quad outline and four handles over a scaled image, reports corner changes up, does no image processing.
- `useDocumentScan.ts` — hook owning scan state: loader status, corners, preset, rendered result, generation counter for invalidating in-flight work.

### `AttachmentPanel` change

The pending-upload dialog gains, in its right column:

- **Version** chips: `Original` / `Scan document`. Disabled with a reason for PDF and HEIC.
- **Preset** chips, visible only in scanned mode.
- **Corners** actions: `Re-detect`, `Whole photo`.
- A small result thumbnail under the controls.

The dialog grows to ~66vh only while scanned mode is active, per the project's modal convention. Everything downstream — sign → Cloudinary POST → confirm — is unchanged; the scan simply swaps which `File` gets uploaded. The image is decoded once and reused for detection, preview and final render.

## Pipeline

1. **Decode** — `createImageBitmap(file)`. Sources over ~24 MP are downscaled first; phone photos otherwise OOM mobile Safari.
2. **Detect** — `findPaperContour` + `getCornerPoints` on a copy scaled to 1000px on the long edge, then scale the points back to source coordinates. Detection accuracy does not improve above that size, but speed does.
3. **Warp** — output width is the longer of the top/bottom edges, height the longer of the left/right, capped at 2200px on the long edge. Then `extractPaper(image, width, height, corners)`, which skips re-detection when corners are supplied.
4. **Filter**
   - *Scan B&W* — grayscale, light Gaussian blur, `adaptiveThreshold` (Gaussian, block 25, C 10).
   - *Grayscale* — grayscale plus CLAHE (clip 2.0, 8×8 tiles), which evens out the shadow of a phone held over paper.
   - *Colour* — mild contrast stretch plus unsharp mask; keeps pen ink and stamps readable.
5. **Encode** — *Scan B&W* → PNG, because JPEG puts mosquito noise around every letter and bilevel pages compress extremely well as PNG (roughly 200–400 KB for A4 at 2200px). *Grayscale* and *Colour* → JPEG q0.85. The file name comes from the dialog's name field with the extension forced to match, capped at 255 characters.

**Responsiveness:** the on-screen canvas renders at ≤900px. Handles and the outline follow the pointer immediately; warp plus filter recompute on drag end, throttled. Every `cv.Mat` is released in a `finally` block — the primary leak risk with OpenCV.js.

## Compression

Delivery-side compression already exists: thumbs are `f_auto,q_auto,w_400,c_limit` and previews `f_auto,q_auto`. This work covers the stored master.

- Scanned output is compressed by construction (capped dimensions, preset-appropriate container).
- Originals: decodable camera photos are downscaled to 2400px on the long edge and re-encoded at q0.82, typically 500–800 KB from a 4–8 MB phone photo. PNG and WebP pass through untouched, since they are usually screenshots where lossy re-encoding destroys small text. If the compressed result is larger than the source, or the source cannot be decoded, the source is kept.
- Backend: cap `preview_url` at `w_1600,c_limit` in `attachment_manager.derive_urls`. The carousel currently fetches full-resolution previews.

The 10 MB upload cap stays as it is. Raising it on the strength of client-side downscaling is a separate decision.

## Failure modes

Every failure degrades to "upload the photo unscanned".

| Failure | Behaviour |
|---|---|
| OpenCV.js fails or times out (20s) | Revert to Original, toast that scanning is unavailable. Prefetch failures are silent; only an explicit tap surfaces an error. |
| No page detected, or degenerate quad | Fall back to whole-photo corners, inline hint: "Couldn't find the page edges — drag the dots." |
| Corner drag out of bounds or non-convex | Handles clamp to image bounds; a drag producing a bowtie or sub-minimum-area quad is rejected. |
| Warp or filter throws | Mats freed, mode reverts to Original, toast. |
| Dialog closed mid-scan | Generation counter invalidates in-flight work; late results dropped, mats deleted and object URLs revoked on unmount. |
| Encoded file exceeds 10 MB | PNG → JPEG q0.8 → one downscale, then an error toast. |
| PDF or HEIC input | Scan chip disabled with the reason shown. |
| Decode fails (corrupt or undecodable) | Scan chip disabled; plain upload still available. |

## Testing

**Vitest**, with `cv` injected so no wasm runs in tests:

- corner normalization to TL/TR/BR/BL order from arbitrary point order
- `outputSizeFor` on skewed quads, including the 2200px cap
- `clampCorner` and `isUsableQuad` (convexity, minimum area, collinear points)
- whole-photo fallback when detection returns nothing
- filename extension swapping per preset, with the 255-character cap
- `shouldCompressOriginal` truth table, and the "compressed came out larger, keep the source" rule
- the encode fallback ladder against a fake `toBlob`

**React Testing Library**, one test on the dialog with `documentScan` mocked: scan chip disabled for a PDF, preset chips visible only in scanned mode, Upload receiving the scanned file rather than the original.

**Manual smoke pass:** a real challan photo end to end; a cluttered-desk photo to exercise the detection fallback; a PNG screenshot to confirm it passes through uncompressed; OpenCV asset blocked in devtools to confirm the graceful path.

**Playwright:** not part of this work. Per project rules, E2E is only added or run on explicit request.

## Out of scope

- In-app camera capture
- Multi-page PDF assembly
- Storing original and scanned as two versions of one attachment
- OCR or text extraction
- Raising the 10 MB upload cap
