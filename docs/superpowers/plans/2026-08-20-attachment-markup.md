# Attachment Markup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let workspace members draw, type, and scribble on attachment images and PDF page JPGs as per-user overlay layers, without changing the original Cloudinary file.

**Architecture:** Marks are JSON in `attachment_markups` (one row per attachment + user). FastAPI never touches file bytes. The enlarge / PDF viewer stacks the Cloudinary image, other users’ SVG layers (read-only), then the current user’s editable layer. Coordinates are 0–1 normalized so overlays scale.

**Tech Stack:** FastAPI 4-layer (endpoint → service → manager → DAO), SQLAlchemy + Alembic, RTK Query, React SVG overlay (no Fabric/Konva).

**Spec:** [`frontend/docs/superpowers/specs/2026-08-20-attachment-markup-design.md`](../specs/2026-08-20-attachment-markup-design.md)

## Global Constraints

- User commits git manually — do **not** `git commit` / `git push`
- Do **not** add or run Playwright unless the user agrees
- UI copy must never say Sign, Approve, or Signature (tooltip: “Not a legal signature.”)
- Original Cloudinary asset and `download_url` stay unchanged
- FastAPI still never stores or processes file bytes
- All markup queries filter `workspace_id`
- Markup only on `upload_status=ready` image or PDF attachments
- Export/flatten, e-sign, mobile QR staging markup: out of v1
- No new npm canvas libraries

### Payload contract (all tasks)

```ts
interface MarkupPoint { x: number; y: number } // 0..1 of displayed image
interface MarkupStroke {
  color: string;
  width: number; // relative to image min-side; pen ~0.008, scribble ~0.028
  points: MarkupPoint[];
}
interface MarkupText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number; // 0..1 of min-side
}
interface PageMarks {
  strokes: MarkupStroke[];
  texts: MarkupText[];
  scribbles: MarkupStroke[];
}
interface MarkupPayload {
  pages: Record<string, PageMarks>; // keys "1", "2", …; images always "1"
}
```

Empty page object = omit the key. Save with no pages / all empty → **delete** that user’s row.

---

### Task 1: Table, model, migration

**Files:**
- Create: `backend/app/models/attachment_markup.py`
- Create: `backend/alembic/versions/114_attachment_markups.py`
- Modify: `backend/app/db/base.py` (import model)
- Modify: `backend/app/models/__init__.py` if it re-exports models

**Interfaces:**
- Produces: `AttachmentMarkup` mapped to `attachment_markups`

- [ ] **Step 1: Add model**

```python
# backend/app/models/attachment_markup.py
from sqlalchemy import Column, Integer, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class AttachmentMarkup(Base):
    __tablename__ = "attachment_markups"
    __table_args__ = (
        UniqueConstraint("attachment_id", "user_id", name="uq_attachment_markup_user"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    attachment_id = Column(Integer, ForeignKey("attachments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    payload = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    attachment = relationship("Attachment", backref="markups")
    user = relationship("Profile")
```

- [ ] **Step 2: Alembic `114_attachment_markups`**

`revision = "114_attachment_markups"`  
`down_revision = "113_heal_machine_tables"`

Create table with FKs as above, unique `(attachment_id, user_id)`, indexes on `workspace_id`, `attachment_id`, `user_id`. Use `table_exists("attachment_markups")` no-op like `110_attachment_ledger.py`.

- [ ] **Step 3: Import in `app/db/base.py`** next to `Attachment`

- [ ] **Step 4: Verify** `cd backend; python -c "from app.models.attachment_markup import AttachmentMarkup; print(AttachmentMarkup.__tablename__)"`

---

### Task 2: DAO + schemas

**Files:**
- Create: `backend/app/dao/attachment_markup.py`
- Create: `backend/app/schemas/attachment_markup.py`

**Interfaces:**
- Consumes: `AttachmentMarkup`
- Produces: `attachment_markup_dao`; Pydantic `MarkupPayload`, `AttachmentMarkupLayerResponse`, `AttachmentMarkupPutRequest`

- [ ] **Step 1: Schemas** — `MarkupPoint`, `MarkupStroke`, `MarkupText`, `PageMarks`, `MarkupPayload` (Pydantic v2). `AttachmentMarkupPutRequest` has `payload: MarkupPayload`. Response:

```python
class AttachmentMarkupLayerResponse(BaseModel):
    user_id: int
    user_name: str
    is_mine: bool
    updated_at: datetime
    payload: MarkupPayload
    model_config = ConfigDict(from_attributes=True)
```

Max 50k points total per payload (reject 400 if over) — keep JSON small.

- [ ] **Step 2: DAO** (always `workspace_id`):

```python
def get_for_attachment(self, db, *, workspace_id: int, attachment_id: int) -> list[AttachmentMarkup]
def get_for_user(self, db, *, workspace_id: int, attachment_id: int, user_id: int) -> AttachmentMarkup | None
def upsert_for_user(self, db, *, workspace_id, attachment_id, user_id, payload: dict) -> AttachmentMarkup
def delete_for_user(self, db, *, workspace_id, attachment_id, user_id) -> bool
```

`upsert`: flush, no commit. `delete_for_user` returns False if missing.

- [ ] **Step 3: Unit-test DAO with mocks** in `backend/tests/test_attachment_markup.py` — `get_for_attachment` filter includes `workspace_id`.

---

### Task 3: Manager + service

**Files:**
- Create: `backend/app/managers/attachment_markup_manager.py`
- Modify: `backend/app/services/attachment_service.py` (or thin `attachment_markup_service.py` if `attachment_service.py` is already huge — prefer **new** `attachment_markup_service.py` to keep attachment upload service focused)

**Interfaces:**
- Consumes: `attachment_dao.get_active`, `attachment_markup_dao`
- Produces:
  - `list_layers(db, workspace_id, attachment_id, current_user_id) -> list[AttachmentMarkupLayerResponse]`
  - `put_own_layer(db, workspace_id, attachment_id, user_id, payload) -> AttachmentMarkupLayerResponse | None`
  - `delete_own_layer(...)`

Rules:
- Attachment missing/deleted → `AttachmentNotFoundError`
- `upload_status != ready` or mime not image/pdf → `AttachmentValidationError` (“Markup is only available for images and PDFs.”)
- `put_own_layer`: if payload `pages` empty or every page has empty arrays → delete row, return `None` (HTTP 204)
- Join `Profile.name` for `user_name`
- Never accept `user_id` from the client body

- [ ] **Step 1: Tests** (mocks) — not-found; not image/pdf; empty payload deletes; list sets `is_mine`

- [ ] **Step 2: Implement manager + service commit/rollback**

---

### Task 4: HTTP endpoints

**Files:**
- Modify: `backend/app/api/v1/endpoints/attachments.py`

**Interfaces:**
- `GET /attachments/{attachment_id}/markups` → `{ items: AttachmentMarkupLayerResponse[] }`
- `PUT /attachments/{attachment_id}/markups/me` body `{ payload }` → 200 layer or 204 if cleared
- `DELETE /attachments/{attachment_id}/markups/me` → 204
- There is **no** PUT for another user. Do not add `user_id` path/body.

- [ ] **Step 1: OpenAPI test** — paths registered; PUT description does not contain “sign”/“signature”

- [ ] **Step 2: Service tests with MagicMock** — calling PUT as user A cannot write user B (body has no user_id; manager uses `current_user.id` only)

- [ ] **Step 3: Wire endpoints** using `get_current_workspace` + `get_current_active_user`

Run: `cd backend; python -m pytest tests/test_attachment_markup.py -q`  
Expected: PASS

---

### Task 5: Frontend types + RTK

**Files:**
- Modify: `frontend/src/types/attachment.ts`
- Modify: `frontend/src/features/attachments/attachmentsApi.ts`

**Interfaces:**
- Types matching payload contract + `AttachmentMarkupLayer`
- Hooks: `useGetAttachmentMarkupsQuery`, `usePutMyAttachmentMarkupMutation`, `useDeleteMyAttachmentMarkupMutation`
- Tags: `{ type: 'AttachmentMarkup', id: attachmentId }`

- [ ] **Step 1: Types + API slice**
- [ ] **Step 2:** `npx tsc --noEmit`

---

### Task 6: SVG overlay + page helpers

**Files:**
- Create: `frontend/src/components/newcomponents/customui/attachmentMarkup/markupTypes.ts` (re-export from `@/types/attachment` if duplicated — prefer single types file)
- Create: `frontend/src/components/newcomponents/customui/attachmentMarkup/pageMarks.ts`
- Create: `frontend/src/components/newcomponents/customui/attachmentMarkup/MarkupOverlay.tsx`
- Create: `frontend/src/components/newcomponents/customui/attachmentMarkup/pageMarks.test.ts`

**Interfaces:**
- `emptyPageMarks(): PageMarks`
- `getPageMarks(payload, page: number): PageMarks`
- `setPageMarks(payload, page, marks): MarkupPayload`
- `isPayloadEmpty(payload): boolean`
- `MarkupOverlay` props: `marks: PageMarks`, `interactive?: boolean`, `className`

Render SVG `viewBox="0 0 1 1"` `preserveAspectRatio="none"` over the image (`absolute inset-0`). Polylines for strokes/scribbles; `<text>` for texts. Non-interactive: `pointer-events-none`.

- [ ] **Step 1: Unit tests** — page 2 marks not visible via `getPageMarks(payload, 1)`; empty payload true

- [ ] **Step 2: Overlay component**

---

### Task 7: Editor (pen, text, scribble)

**Files:**
- Create: `frontend/src/components/newcomponents/customui/attachmentMarkup/MarkupEditor.tsx`
- Create: `frontend/src/components/newcomponents/customui/attachmentMarkup/markupCopy.ts`
- Create: `frontend/src/components/newcomponents/customui/attachmentMarkup/markupCopy.test.ts`

**Interfaces:**
- Tools: `'pen' | 'text' | 'scribble'`
- `markupCopy.scribbleTooltip = 'Not a legal signature.'`
- `markupCopy.scribbleLabel = 'Scribble'`
- Forbidden strings test: file contents of `markupCopy.ts` + MarkupEditor labels must not match `/sign|approve|signature/i`

Pointer: on pointerdown/move/up, map client coords to 0–1 via `getBoundingClientRect`. Pen → `strokes`; scribble → `scribbles` (wider default). Text: click places a box; Enter/blur commits. Undo stack in memory (session only). **Save** calls `putMyAttachmentMarkup` with full payload (merge current page into loaded own payload). **Clear my marks** (this page or all — v1: clear **current page** then save; if payload empty after, mutation 204). Save error: `appToast.error`, keep local state.

- [ ] **Step 1: Copy unit test**
- [ ] **Step 2: Editor UI** — tool buttons, color (brand-primary + black), Save, optional Clear page

---

### Task 8: Wire enlarge + PDF viewer

**Files:**
- Create: `frontend/src/components/newcomponents/customui/attachmentMarkup/AttachmentMarkupStage.tsx`
- Modify: `frontend/src/components/newcomponents/customui/AttachmentPanel.tsx` (`previewDialog` ~L1000–1058)
- Modify: `frontend/src/components/newcomponents/customui/AttachmentPdfPageViewer.tsx` — accept optional overlay render prop **or** lift `page` to parent

**Preferred:** `AttachmentMarkupStage` wraps image or PDF viewer:

- Loads markups when `previewAttachment` is image or PDF and `ready`
- Layer chips: each `user_name`, checkbox default on; cannot toggle-edit others
- Own layer = editor when Mark mode on; others = `MarkupOverlay` only
- PDF: `page` state lives in stage; pass into viewer + `getPageMarks(..., page)`
- Office files: no Mark button (unchanged download empty-state)
- Header: existing Download stays; add **Mark** toggle (`aria-pressed`)

`AttachmentPdfPageViewer`: add optional `page` / `onPageChange` controlled props so stage owns page index. Uncontrolled fallback for any other callers.

- [ ] **Step 1: Controlled page props on PDF viewer** (default keep internal state if `page` omitted)
- [ ] **Step 2: Stage + preview dialog**
- [ ] **Step 3:** `npx tsc --noEmit`

---

### Task 9: Soft-delete + download sanity

**Files:**
- Modify: `backend/app/managers/attachment_manager.py` or wherever `is_deleted` is set — CASCADE on `attachment_id` already drops rows if hard-delete; **soft-delete** keeps the attachment row, so list markups must 404/`AttachmentNotFoundError` via `get_active` (already excludes deleted). Confirm GET markups uses `get_active`.

- [ ] **Step 1: Test** — `get_active` None → list_layers raises not found (mock)
- [ ] **Step 2:** No Cloudinary destroy/rename in markup code paths (grep)

---

## Verification

```bash
cd backend
python -m pytest tests/test_attachment_markup.py -q

cd ../frontend
npx tsc --noEmit
```

Manual:
1. Enlarge a JPG — Mark — pen + text + scribble — Save — reload dialog — marks persist
2. Second user (or two browsers) — both layers visible; A cannot move B’s strokes
3. PDF — marks on page 2 missing on page 1
4. Download still original (no drawings in the file)
5. Office attachment — no Mark
6. No “Sign” in Mark toolbar

## Out of scope

Export flattened copy, legal e-sign, highlighter tool, markup on QR staging, Playwright.
