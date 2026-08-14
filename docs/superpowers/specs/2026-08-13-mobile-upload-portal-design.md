# Mobile upload portal — design

**Date:** 2026-08-13  
**Scope:** `frontend/` + `backend/`  
**Status:** Approved — promote path (no Railway byte download)

## Problem

Users photograph paper documents on their phone but attach from the desktop ERP. QR flow: phone scans and uploads once to Cloudinary staging; desktop promotes (rename) into an attachment. FastAPI never holds file bytes.

## Decisions

| Decision | Choice |
|---|---|
| Who uploads on phone | Same logged-in person at the desk (not anonymous) |
| Phone auth | Short-lived token in QR URL — no login on phone |
| Handoff | Cloudinary staging → Admin **rename** into attachment `public_id` |
| Phone processing | CamScan on device CPU, then **one** Cloudinary upload of the final file |
| Desktop processing | Name/note + promote (no re-scan, no second upload) |
| Files per QR | One file; re-scan for another |
| Phone UI | Camera + file picker + existing scan dialog; same 10 MB allowlist |
| Desktop entry | Bottom third of compact Add strip + manager "From phone" button |
| Phone button visibility | Hidden below `md` (user is already on a phone) |

## Flow

1. Desktop creates session (`POST /mobile-upload/sessions`) → raw token + expiry (~10 min).
2. QR popup shows `https://<app>/m/<token>`.
3. Phone opens public page — no app shell, raw `fetch` to API (no RTK reauth).
4. Phone CamScan → signs with token → uploads scanned file to Cloudinary staging → confirms.
5. Desktop polls while QR open → on `uploaded`, name/note + optional signed preview URL → `POST .../promote`.
6. Promote renames staging asset, Admin-confirms attachment, marks session consumed.

## Backend

Table `mobile_upload_sessions`: workspace, creator, entity target, token hash, expiry, status, staging Cloudinary metadata.

**JWT endpoints:** create, poll, **promote**, cancel.  
**Public endpoints:** session info, sign, confirm — token-only, rate-limited, **404** on bad token (never 401).

Staging is not an `attachments` row until promote. Destroy on cancel or unused sign overwrite. Promote **moves** the asset (no destroy).

## Frontend

- Public route `/m/:token` → `MobileUploadPage` (CamScan then one upload)
- `MobileUploadQrDialog` on `AttachmentPanel` (compact split + manager toolbar)
- RTK `mobileUploadApi` for desktop JWT calls (promote invalidates `Attachment` + entity events)
- `qrcode.react` for QR rendering

## Out of scope (v1)

Multi-file session, phone login, WebRTC, staging sweeper cron, Playwright E2E.

## Security notes

Token is a 10-minute one-file capability link. Attach still requires desktop promote. FastAPI talks Cloudinary Admin JSON only. See `backend/docs/ATTACHMENT_UPLOAD_SECURITY.md`.
