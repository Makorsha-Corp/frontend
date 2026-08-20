import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { store } from "@/app/store";

import LoginPage from "./pages/newpages/LoginPage";
import WorkspaceSelectorPage from "./pages/newpages/WorkspaceSelectorPage";
import DashboardPage from "./pages/newpages/DashboardPage";
import FactoriesPage from "./pages/newpages/FactoriesPage";
import FactoryDetailPage from "./pages/newpages/FactoryDetailPage";
import FactorySectionRedirectPage from "./pages/newpages/FactorySectionRedirectPage";
import MachinesPage from "./pages/newpages/MachinesPage";
import ItemsPage from "./pages/newpages/ItemsPage";
import AccountsLandingPage from "./pages/newpages/AccountsLandingPage";
import AccountDetailPage from "./pages/newpages/AccountDetailPage";
import StoragePage from "./pages/newpages/StoragePage";
import ProductsPage from "./pages/newpages/ProductsPage";

import OrdersOverviewPage from "./pages/newpages/orders/OrdersOverviewPage";
import PurchaseOrdersPage from "./pages/newpages/orders/PurchaseOrdersPage";
import TransferOrdersPage from "./pages/newpages/orders/TransferOrdersPage";
import ExpenseOrdersPage from "./pages/newpages/orders/ExpenseOrdersPage";
import SalesOrdersPage from "./pages/newpages/orders/SalesOrdersPage";
import SalesTeamPage from "./pages/newpages/orders/SalesTeamPage";
import WorkOrdersLegacyRedirect from "./pages/newpages/orders/WorkOrdersLegacyRedirect";

import ProjectsPage from "./pages/newpages/ProjectsPage";
import ProductionPage from "./pages/newpages/ProductionPage";
import LedgersPage from "./pages/newpages/LedgersPage";
import CalendarPage from "./pages/newpages/calendar/CalendarPage";

import { ThemeProvider } from "./context/ThemeContext";
import { SettingsModalProvider } from "./context/SettingsModalContext";
import BusinessLensPage from "./pages/newpages/BusinessLensPage";
import BusinessLensWizardPage from "./pages/newpages/BusinessLensWizardPage";
import ManagementPage from "./pages/newpages/ManagementPage";
import BillingTrialPage from "./pages/newpages/BillingTrialPage";
import UploadsPage from "./pages/newpages/UploadsPage";
import HelpPage from "./pages/newpages/HelpPage";
import PlatformLayout from "./layouts/PlatformLayout";
import PlatformSupportPage from "./pages/newpages/platform/PlatformSupportPage";
import PlatformWaitlistPage from "./pages/newpages/platform/PlatformWaitlistPage";
import RequirePlatformAdmin from "./components/newcomponents/customui/RequirePlatformAdmin";
import MobileUploadPage from "./pages/newpages/MobileUploadPage";
import RequireAuth from "./components/newcomponents/customui/RequireAuth";
import RequireWorkspace from "./components/newcomponents/customui/RequireWorkspace";
import AppShellLayout from "./layouts/AppShellLayout";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <SettingsModalProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<LoginPage />} />
            <Route path="/m/:token" element={<MobileUploadPage />} />

            {/* Requires auth, no workspace needed */}
            <Route element={<RequireAuth />}>
              <Route path="/workspace-selector" element={<WorkspaceSelectorPage />} />
              <Route element={<RequirePlatformAdmin />}>
                <Route element={<PlatformLayout />}>
                  <Route path="/platform" element={<Navigate to="/platform/support" replace />} />
                  <Route path="/platform/support" element={<PlatformSupportPage />} />
                  <Route path="/platform/waitlist" element={<PlatformWaitlistPage />} />
                </Route>
              </Route>
            </Route>

            {/* Requires auth + workspace */}
            <Route element={<RequireWorkspace />}>
              <Route element={<AppShellLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/factories" element={<FactoriesPage />} />
              <Route path="/factories/:id" element={<FactoryDetailPage />} />
              <Route path="/factories/:id/sections/:sectionId" element={<FactorySectionRedirectPage />} />
              <Route path="/machines" element={<MachinesPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/accounts" element={<Navigate to="/accounts/overview" replace />} />
              <Route path="/accounts/overview" element={<AccountsLandingPage initialSection="overview" />} />
              <Route path="/accounts/payable" element={<AccountsLandingPage initialSection="payable" />} />
              <Route path="/accounts/receivable" element={<AccountsLandingPage initialSection="receivable" />} />
              <Route path="/accounts/self" element={<Navigate to="/accounts/overview" replace />} />
              <Route path="/accounts/aggregated" element={<Navigate to="/accounts/overview" replace />} />
              <Route path="/accounts/utilities" element={<Navigate to="/accounts/payable" replace />} />
              <Route path="/accounts/payroll" element={<Navigate to="/accounts/payable" replace />} />
              <Route path="/accounts/suppliers" element={<Navigate to="/accounts/payable" replace />} />
              <Route path="/accounts/vendors" element={<Navigate to="/accounts/payable" replace />} />
              <Route path="/accounts/customers" element={<Navigate to="/accounts/receivable" replace />} />
              <Route path="/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/project" element={<ProjectsPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/ledgers" element={<LedgersPage />} />
              <Route path="/machine" element={<Navigate to="/factories" replace />} />
              <Route path="/orders" element={<OrdersOverviewPage />} />
              <Route path="/orders/purchase" element={<PurchaseOrdersPage />} />
              <Route path="/orders/transfer" element={<TransferOrdersPage />} />
              <Route path="/orders/expense" element={<ExpenseOrdersPage />} />
              <Route path="/sales" element={<SalesOrdersPage />} />
              <Route path="/sales/overview" element={<SalesOrdersPage />} />
              <Route path="/sales/team" element={<SalesTeamPage />} />
              <Route path="/orders/sales" element={<Navigate to="/sales/overview" replace />} />
              <Route path="/orders/work" element={<WorkOrdersLegacyRedirect />} />
              <Route path="/management" element={<ManagementPage />} />
              <Route path="/billing/trial" element={<BillingTrialPage />} />
              <Route path="/uploads" element={<UploadsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/storage" element={<StoragePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/businesslens" element={<BusinessLensPage />} />
              <Route path="/businesslens/:templateId" element={<BusinessLensWizardPage />} />
              </Route>
            </Route>
          </Routes>
          </SettingsModalProvider>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
