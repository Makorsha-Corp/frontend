# Attachment markup — design spec

**Date:** 2026-08-20  
**Status:** Approved (pending user review of this file)

## Problem

Users want to mark up images and PDFs in the attachments dialog (draw, text, scribble). Current pipeline: files on Cloudinary; FastAPI never holds bytes; PDFs are viewed as Cloudinary raster JPG pages, not embedded PDFs. Overwriting originals is an audit risk. A “Sign” control would look like legal approval without identity, intent, or document-hash evidence.

## Decision

**Overlay on original (A)** with **Export marked copy later (B add-on, not v1).**

- Original Cloudinary asset is never overwritten.
- Marks live in Kolom as vector JSON, not baked pixels.
- **Per-user layers:** each person who marks has one layer; all layers show together; you only edit your own.
- v1 tools: **pen**, **text**, **scribble** (fat pen). Scribble is **not** a legal signature.
- Surfaces: **images and PDF pages** (same canvas on the page JPG).
- Export/flatten: out of v1.

## What scribble is (and is not)

Scribble is a thick freehand tool for notes (initials-looking marks, arrows, emphasis).

It is **not** an electronic signature of record:

- No captured intent to accept a contract or approve payment.
- UI must never say Sign / Approve / Signature.
- Overlay on a raster page is not signing PDF bytes; download is still the original file.
- No document hash, consent step, or non-repudiation audit.

Tooltip (or equivalent): “Not a legal signature.”

Legal e-sign would be a separate product (freeze original, consent, audit, original + signed copy). Out of scope.

## Architecture

```text
Enlarge / PDF page viewer
  → image or Cloudinary page JPG
  → other users' layers (read-only, togglable)
  → current user's layer (editable)
```

PDF: one layer row per user; payload is page-keyed (`pages["3"]` = marks on page 3). Page index is 1-based (same as `GET /attachments/{id}/pdf-page`). Images use `pages["1"]`. Page 2 marks do not appear on page 1.

Download original uses existing signed `download_url`. Unchanged after markup save.

**Export later:** flatten visible layers to PNG/JPG (or per-page images) as a new attachment or download. Not v1.

## Tools (v1)

| Tool | Behavior |
|------|----------|
| Pen | Freehand; color + thickness |
| Text | Click to place; type; drag |
| Scribble | Fat pen; labeled Scribble only |

Undo within the editor session. Save persists **current user’s layer only**.

Clear-all / save with no marks: delete that user’s row (no empty payload left behind).

## Collaboration

- Unique layer per `(attachment_id, user_id)`.
- Two people: no clobber (different rows).
- Same person, two tabs: last save wins for that user.
- Toggle chips: show/hide each person’s layer (default: all on).
- Cannot edit or delete another user’s marks.

## Data

New table, e.g. `attachment_markups`:

- `workspace_id` (required, isolation)
- `attachment_id`
- `user_id`
- `payload` JSON: `{ pages: { "1": { strokes, texts, scribbles }, "2": … } }` — vectors only, not bitmaps
- `updated_at`

Unique `(attachment_id, user_id)`. Payload stays vectors, not bitmaps.

Soft-delete attachment: layers go with it (CASCADE or explicit delete).

API: workspace-scoped GET (all layers for an attachment) + PUT/PATCH **own** layer only. Cannot PUT another user’s layer.

No Cloudinary changes. FastAPI still does not store or process file bytes.

## Permissions / copy

- Markup only on ready **image** and **PDF** attachments (same types that already preview in-app).
- Office/txt/csv: no markup (download-only, unchanged).
- Mobile QR staging (pre-promote): no markup in v1.
- Mark mode lives on Enlarge / PDF page viewer (existing dialog).

## Error handling

- Save failure: toast, stay in editor, keep unsaved local state until retry or discard.
- No offline queue.
- Missing page / failed PDF page URL: no canvas; existing page-load error UI.

## Testing

- GET layers for attachment; PUT own layer; PUT other user’s layer → 403.
- PDF: marks on page 2 absent on page 1.
- After save, original `download_url` still original asset.
- Layer hide/show (frontend).
- Copy: no Sign/Approve/Signature strings in markup UI.

## Out of scope (v1)

- Flatten / Export marked copy
- Legal e-sign / approval workflow
- Highlighter as a separate tool (pen covers it)
- Markup on mobile QR staging
- Print-optimized layout
- Lock-while-editing
- Editing another user’s layer
- Virus scan / DLP (unchanged attachment policy)

## Related

- [`backend/docs/ATTACHMENT_UPLOAD_SECURITY.md`](../../../../backend/docs/ATTACHMENT_UPLOAD_SECURITY.md) — byte-free API, PDF-as-JPG pages
- [`docs/superpowers/specs/2026-08-10-cloudinary-attachments-design.md`](./2026-08-10-cloudinary-attachments-design.md)

---

## Amendment v1.1 (2026-08-20)

**Trigger:** Pen/scribble too thin in practice; primary job is quick solo flag on invoice/PO photos.

### Stroke rendering

- Remove SVG `vectorEffect="non-scaling-stroke"` (was rendering sub-pixel strokes).
- Widths stay normalized 0–1 (fraction of image min-side).
- New defaults: pen `0.018`, scribble `0.05`, text `0.04`.
- Render floor for legacy payloads: pen `0.012`, scribble `0.035`.
- No backend or schema change.

### Save workflow

- **Auto-save** replaces explicit Save button (400ms debounce after edits).
- Flush pending save when leaving Mark mode or closing the preview dialog.
- Status chip: Saving… / Saved; toast on failure; local marks kept for retry.
- Clear page still deletes row when payload empty (unchanged backend rule).

### Multi-user clarity (lightweight)

- Deterministic hue per `user_id` for **other users’** read-only layers.
- “Show only mine” toggle.
- Layer chips: color dot + relative `updated_at`.
- Mark button shows contributor count when layers exist, e.g. `Mark (2)`.

### Still out of scope

- Live cursors / realtime push
- Thickness slider
- Export flatten
- Legal e-sign

---

## Amendment v1.2 (2026-08-20)

**Trigger:** 503 errors when migration missing; user wants pen-only with sizes and zoom/pan.

### Operations

- Markup API requires Alembic migration `114_attachment_markups` (`alembic upgrade head`).
- Missing table returns global 503 (schema error handler); frontend shows unavailable banner.

### Tools

- **Scribble tool removed** from UI; legacy `scribbles[]` in stored payloads still render.
- **Pen size presets:** Fine (S), Medium (M), Bold (L) — width stored per stroke.
- **Pan tool** + pinch/wheel zoom + Reset view (reuse scan `useImageViewport`).
- Drawing coords use `clientToImagePoint` so marks stay aligned when zoomed.

### Auto-save resilience

- On 503/500: pause further PUTs until next edit; toast once; no RTK invalidate loop on failed PUT.
- Status chip shows **Save failed** when paused.

### Still out of scope

- Eraser / tap-to-delete stroke
- Export flatten
- Live multi-user cursors

---

## Amendment v1.3 (2026-08-20)

**Trigger:** Easier navigation while marking; precision drawing for small details.

### Navigation

- **Right-click drag** pans the main viewport at any zoom level, with any tool active (context menu suppressed).
- Left-drag pan unchanged (Pan tool); wheel zoom and pinch unchanged.

### Magnifier loupe

- Toolbar **Magnifier** toggle (pen tool only) opens a **floating rectangle loupe** portaled over the preview dialog.
- Loupe follows cursor over the main viewport; click main image to recenter.
- Draw inside loupe only when magnifier is on (main canvas pen disabled).
- Strokes from loupe use **width ÷ loupe zoom** (default 3×) so marks appear finer on the full image.
- Position locks while drawing to avoid jitter.

### Still out of scope

- Loupe for text tool
- Middle-mouse pan
