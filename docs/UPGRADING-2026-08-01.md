# Pulling the 2026-08-01 changes — what you need to do

## 1. Node 20.19+ or 22.12+

Vite 7 requires `^20.19.0 || >=22.12.0` (the upgrade cleared a high-severity
dev-server advisory in Vite 5). Check with `node -v`; if you're older, the dev
server won't start.

## 2. Reinstall

```bash
npm install
```

Vite 5 → 7, plus `vitest` and `eslint-plugin-unused-imports` are new, and
~40 packages moved within range (TypeScript 5.7 → 5.9, RTK 2.12, Radix minors).

## 3. What changed in the workflow

Lint previously matched only `.js`/`.jsx` — i.e. **zero files** in a codebase
of 626 `.ts`/`.tsx` — and `build` never ran `tsc`, so type errors could ship.
Both are fixed, which means these now actually gate your work:

| Command | What it does |
|---|---|
| `npm run lint` | ESLint over `.ts`/`.tsx` too, `--max-warnings 0` |
| `npm run typecheck` | `tsc -b` — new |
| `npm test` | vitest unit tests — new (98 tests that previously could not run) |
| `npm run build` | now `tsc -b && vite build` |
| `npm run test:e2e` | Playwright, unchanged (not run in CI) |

CI runs lint → typecheck → test → build on every push and PR.

## Conventions the linter now enforces

- **Unused imports/vars are errors.** Prefix intentionally-unused function
  args with `_` (e.g. RTK Query's `invalidatesTags: (_result, _error, arg)`).
- **`catch (e: any)` is out.** Use `apiErrorDetail(error, 'fallback message')`
  from `@/utils/apiError` to pull a FastAPI `detail` off an RTK Query error.
- **`react-hooks/exhaustive-deps` is on.** If you deliberately want a
  narrower dep list, add `// eslint-disable-next-line react-hooks/exhaustive-deps`
  with a comment saying why.
- Escape apostrophes and quotes in JSX text (`&apos;`, `&ldquo;`).

## Note on RTK Query cache tags

Tags only invalidate queries **within the same `createApi` slice** — listing a
foreign slice's tag in `invalidatesTags` is a silent no-op. (One such bug was
fixed in `workOrdersApi`.) For cross-slice refreshes use `onQueryStarted` plus
the helpers in `src/features/cache/`. See `docs/CODING_CONVENTIONS.md`.
