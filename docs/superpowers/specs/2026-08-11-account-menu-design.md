# User settings modal — design

**Date:** 2026-08-11  
**Scope:** `frontend/` — sidebar account area + settings UX  
**Status:** Implemented

## Problem

Account actions were split across a dropdown, separate theme toggle, and a full `/preferences` page. Users wanted a unified settings experience with room to grow, while keeping quick theme access in the sidebar.

## Decisions

| Decision | Choice |
|----------|--------|
| Entry | Click user row in sidebar → **settings modal** |
| Layout | Two-pane modal: **left section nav**, **right content panel** |
| Theme | **Separate sidebar button** under user row (not inside modal) |
| Logout | **Modal footer** (destructive button) |
| `/preferences` route | **Removed** — modal only |
| Extensibility | Config-driven nav sections; v2 `admin` for owners |

## Architecture

### `SettingsModalContext`

- `openSettings(section?)`, `closeSettings()`, `activeSection`
- Provider wraps routes in `App.tsx`; renders `UserSettingsModal` once globally
- `useSettingsModal()` from Management page Preferences link

### `UserSettingsModal`

- Workhorse dialog: `h-[66vh]`, `w-[min(56rem,94vw)]`
- Header: avatar initials, "Settings", name · email
- Left nav (`w-48`): section buttons with active highlight
- Right panel: scrollable content for active section
- Footer: Log out

**V1 sections:**

| id | Label | Panel |
|----|-------|-------|
| `general` | General | `TimezoneSettingsPanel` |

### `UserAccountTrigger`

- Replaces dropdown; opens modal on click
- Expanded: initials + name + email + chevron
- Collapsed: initials only

### Sidebar footer order

1. User trigger → modal  
2. Dark/Light theme toggle  

### Removed

- `PreferencesPage.tsx`, `/preferences` route, `UserAccountMenu.tsx` dropdown

## Files

- `src/context/SettingsModalContext.tsx`
- `src/components/newcomponents/customui/UserSettingsModal.tsx`
- `src/components/newcomponents/customui/UserAccountTrigger.tsx`
- `src/components/newcomponents/customui/settings/TimezoneSettingsPanel.tsx`
- Modified: `DashboardNavbar.tsx`, `App.tsx`, `ManagementPage.tsx`

## Out of scope (v1)

- Admin section in modal (Management/Billing stay in sidebar)
- Profile name editing in modal
- Deep-link URLs for settings sections
