# Legacy Reference: RBAC & BusinessLens Systems

This directory contains code and mocks representing the original **Role-Based Access Control (RBAC)** and **BusinessLens Reporting** features from the Supabase version of the frontend. 

It is preserved here to serve as a design pattern and code reference for other agents and developers when implementing these features on top of the custom FastAPI and RTK Query backend.

---

## Directory Structure

* [legacy-types.ts](file:///e:/Projects/Makorsh-Corp/frontend/src/legacy-reference/legacy-types.ts): Self-contained mocks, type declarations, and stub functions to prevent compilation errors.
* **RBAC Reference** (`rbac/`):
  * [AccessControlService.ts](file:///e:/Projects/Makorsh-Corp/frontend/src/legacy-reference/rbac/AccessControlService.ts): Matrix management, role checking, permissions granting/revoking.
  * [PrivateRouting.tsx](file:///e:/Projects/Makorsh-Corp/frontend/src/legacy-reference/rbac/PrivateRouting.tsx): Navigation guard matching active page keys to user permission snapshots.
  * `DeniedRouteModals/`: Modals displayed when access is denied for pages, features, or order management.
* **BusinessLens Reference** (`business-lens/`):
  * [BusinessLensPage.tsx](file:///e:/Projects/Makorsh-Corp/frontend/src/legacy-reference/business-lens/BusinessLensPage.tsx): Wizard selection page displaying template choices and parameter selection modal.
  * [BusinessLensWizardPage.tsx](file:///e:/Projects/Makorsh-Corp/frontend/src/legacy-reference/business-lens/BusinessLensWizardPage.tsx): Route router executing rendering of specific report components.
  * [BusinessLensDisplayCard.tsx](file:///e:/Projects/Makorsh-Corp/frontend/src/legacy-reference/business-lens/BusinessLensDisplayCard.tsx): Main dashboard quick link card promoting the reporting tool.
  * `BusinessLensReports/`:
    * [BusinessLensPartReport.tsx](file:///e:/Projects/Makorsh-Corp/frontend/src/legacy-reference/business-lens/BusinessLensReports/BusinessLensPartReport.tsx): Part-level cost reporting (weighted averages, price volatility, purchase logs).
    * [BusinessLensOrdersReport.tsx](file:///e:/Projects/Makorsh-Corp/frontend/src/legacy-reference/business-lens/BusinessLensReports/BusinessLensOrdersReport.tsx): Order pipeline and factory-level cost summaries (pie charts, expense list).

---

## 1. Role-Based Access Control (RBAC) System

### How it Works
The legacy RBAC system is centered around a table named `access_control`. Permissions are grouped into three categories (`access_types`):
1. **Page Access (`type: "page"`)**: Gated routes. If a role does not have an entry for a given target page key (e.g., `orders`, `storage`), they cannot access it.
2. **Feature Access (`type: "feature"`)**: Micro-permissions within page contexts (e.g., `finance_visibility` to view unit costs, `storage_instant_add` to add storage items without approval).
3. **Manage Order Access (`type: "manage_order"`)**: Workflow routing. This defines which roles are allowed to move/manage orders at a specific status (e.g., only `finance` or `owner` can edit/advance orders at the "Pending Office Approval" status).

During login/session initialization, the app fetches a snapshot of these permissions (`fetchRoleAccessSnapshot`) and provides checker methods via React Context (`canViewPage`, `hasFeature`, `canAccessManageOrder`).

### Code Breakdown
* **`fetchRoleAccessSnapshot(role)`**: Queries the DB for page/feature/manage_order permissions belonging to the role, compiling them into three separate `Sets` for instant checks.
* **`PrivateRouting.tsx`**: A wrapper component. When loaded (e.g., on `/storage` with `pageKey="storage"`), it checks `canViewPage("storage")`. If false, it blocks mounting and displays a `PageAccessDeniedModal`.
* **`setPageRoles`/`setFeatureRoles`**: Manage mapping updates inside the management console. They calculate the difference between the current DB state and the user's modifications (adding new rows and deleting revoked rows).

### User Story
> **As an Administrator**, I want to configure ground-team members so that they can view inventory pages but cannot see financial unit costs or manually modify stock records without authorization.
> 
> * **Flow**: The Admin logs in, opens the access management panel, checks "Storage" for `ground-team`, but unchecks "Storage - Manual Updates" and "Finance Visibility". When a ground-team member logs in, the `useAuth()` hook fetches their role access snapshot. If they try to navigate directly to `/finance` or view unit costs, they see the "Access Denied" modal.

---

## 2. BusinessLens Reporting System

### How it Works
BusinessLens is a template-based wizard for compiling historical summaries of operations, spending, and stock. It allows users to filter by date ranges and specific parameters (e.g., Part ID, Warehouse location).

The legacy version queries order history, calculating and visualizing:
* **Weighted Average Unit Cost**: Accounts for varying unit prices and transaction quantities (`sum(qty * cost) / sum(qty)`).
* **Price Volatility**: Tracking highest and lowest unit costs.
* **Pipeline Health**: Total open vs. completed orders, breakdowns of order types (e.g., PFM, PFP, PFS) represented as pie charts, and expense attribution by factory.

### Code Breakdown
* **`BusinessLensPage.tsx`**: Displays the active reporting templates. Clicking a tile opens a modal to select parameters (date ranges, drop-down selection of parts/items).
* **`BusinessLensPartReport.tsx`**:
  * Receives `partId`, `start`, and `end` date.
  * Queries ordered parts matching the criteria.
  * Computes the total expense, weighted average cost, and cost ranges.
  * Renders a printable table of all purchases, leveraging `react-to-print` to output a clean PDF report.
* **`BusinessLensOrdersReport.tsx`**:
  * Aggregates orders within the date range.
  * Computes open/completed ratios and lists expenses attributed to specific factories.
  * Renders a Pie Chart (`recharts`) showing orders by type (e.g., Purchase Order, Transfer Order).

### User Story
> **As a Procurement Officer**, I want to compile a report on a specific machine part's purchasing history for the past 6 months to analyze price changes and determine which supplier is the most cost-effective.
> 
> * **Flow**: The officer navigates to BusinessLens, selects the **Parts** template, chooses "Bearing Model X", and selects a 6-month date range. They click **Generate**. The page fetches the order logs, calculates that the weighted unit cost is $42.50 (ranging from $40.00 to $45.00), displays a list of all transactions, and lets them click **Print** to save the clean dashboard as a PDF.

---

## 3. Migration Guidelines for FastAPI & RTK Query

When rebuilding these systems on the custom backend:

### RBAC Migration
1. **FastAPI Endpoints**: 
   * Create `/api/v1/access-control/` endpoints to retrieve and modify user permissions.
   * Return a permission map on user login/auth response (to avoid secondary requests).
2. **RTK Query Slice**:
   * Add an `accessControlApi` slice to handle grants/revokes.
   * Cache and inject the user permission snapshot in the Redux `authSlice` state.
3. **Route Guards**:
   * Adapt the existing `RequireAuth` and `RequireWorkspace` components to check permissions from the Redux store (`state.auth.user.permissions`) rather than the legacy `AuthContext`.

### BusinessLens Migration
1. **FastAPI Endpoints**:
   * Create aggregation endpoints on the backend (e.g., `GET /api/v1/reports/parts/{id}` and `GET /api/v1/reports/orders`).
   * Perform calculations (weighted averages, factory grouping, pie chart counts) on the database/backend level rather than fetching thousands of raw records and computing them on the client.
2. **RTK Query Slice**:
   * Implement a `reportsApi` slice with query hooks like `useGetPartReportQuery({ partId, start, end })`.
3. **UI Polish**:
   * Use the responsive layout and styles from `BusinessLensPage.tsx` and integrate the charts using modern tailwind styling matching the newer dashboard.
