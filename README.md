# Frontend (Kolom)

Vite + React + TypeScript. **Project conventions, API URLs, and progress logs** live in the **parent** repo folder: [`../CLAUDE.md`](../CLAUDE.md), [`../progressCode.md`](../progressCode.md), [`../progressDesign.md`](../progressDesign.md), [`../inprogress.md`](../inprogress.md).

**Local dev**: `npm install` → copy `.env.example` to `.env.local` → `npm run dev`.

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base, e.g. `http://localhost:8000/api/v1` (local) or Railway URL (hosted build on Vercel) |

No Cloudinary env vars on the frontend — upload signatures come from the API. See [`../backend/docs/HOSTED_MOBILE_UPLOAD.md`](../backend/docs/HOSTED_MOBILE_UPLOAD.md).

**Shared tokens**: `frontend/shared/` (same files as repo-root `shared/`). After editing root `shared/`, run `node ../scripts/sync-shared.mjs` from the workspace root. CSS: `src/index.css` imports `../shared/marker-tokens.css`. JS: `@shared/…` alias in `vite.config.ts`.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
