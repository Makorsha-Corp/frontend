import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { store } from "@/app/store";
// Legacy pages - commented out
// import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Login2Page from "./pages/newpages/Login2Page";
import WorkspaceSelectorPage from "./pages/newpages/WorkspaceSelectorPage";
import DashboardPage from "./pages/newpages/DashboardPage";
import FactoriesPage from "./pages/newpages/FactoriesPage";
import FactoryDetailPage from "./pages/newpages/FactoryDetailPage";
import FactorySectionDetailPage from "./pages/newpages/FactorySectionDetailPage";
import MachinesPage from "./pages/newpages/MachinesPage";
import ItemsPage from "./pages/newpages/ItemsPage";
import AccountsLandingPage from "./pages/newpages/AccountsLandingPage";
import AccountDetailPage from "./pages/newpages/AccountDetailPage";
// import PartsPage from "./pages/PartsPage";
// import OrderPage from "./pages/OrderPage";
// import CreateOrderPage from "./pages/CreateOrderPage";
// import ViewOrderPage from "./pages/ViewOrderPage";
// import ManageOrderPage from "./pages/ManageOrderPage";
// import ViewPartPage from "./pages/ViewPartPage";
import StoragePage from "./pages/newpages/StoragePage";
import OrdersOverviewPage from "./pages/newpages/orders/OrdersOverviewPage";
import PurchaseOrdersPage from "./pages/newpages/orders/PurchaseOrdersPage";
import TransferOrdersPage from "./pages/newpages/orders/TransferOrdersPage";
import ExpenseOrdersPage from "./pages/newpages/orders/ExpenseOrdersPage";
import SalesOrdersPage from "./pages/newpages/orders/SalesOrdersPage";
import WorkOrdersPage from "./pages/newpages/orders/WorkOrdersPage";
import MachinePage from "./pages/MachinePage";
import ProjectsPage from "./pages/newpages/ProjectsPage";
import ProductionPage from "./pages/newpages/ProductionPage";
import LedgersPage from "./pages/newpages/LedgersPage";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./components/customui/routing/PrivateRouting";
// import InvoicePage from "./pages/InvoicePage";
// import ManagementPage from "./pages/ManagementPage";
// import UnauthorizedPage from "./pages/UnauthorizedPage";
// import NoProfilePage from "./pages/NoProfilePage";
// import DisabledPage from "./pages/DisabledPage";
import BusinessLensPage from "./pages/newpages/BusinessLensPage";
import BusinessLensWizardPage from "./pages/newpages/BusinessLensWizardPage";
import ManagementPage from "./pages/newpages/ManagementPage";
import ApiTestPage from "./pages/ApiTestPage";
import RequireAuth from "./components/newcomponents/customui/RequireAuth";
import RequireWorkspace from "./components/newcomponents/customui/RequireWorkspace";
// import AuditTestPage from "./pages/AuditTestPage";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login2" element={<Login2Page />} />
            <Route path="/" element={<Navigate to="/login2" replace />} />
            <Route path="/api-test" element={<ApiTestPage />} />

            {/* Requires auth, no workspace needed */}
            <Route element={<RequireAuth />}>
              <Route path="/workspace-selector" element={<WorkspaceSelectorPage />} />
            </Route>

            {/* Requires auth + workspace */}
            <Route element={<RequireWorkspace />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/factories" element={<FactoriesPage />} />
              <Route path="/factories/:id" element={<FactoryDetailPage />} />
              <Route path="/factories/:id/sections/:sectionId" element={<FactorySectionDetailPage />} />
              <Route path="/machines" element={<MachinesPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/accounts" element={<AccountsLandingPage />} />
              <Route path="/accounts/aggregated" element={<AccountsLandingPage initialSection="aggregated" />} />
              <Route path="/accounts/payable" element={<AccountsLandingPage initialSection="payable" />} />
              <Route path="/accounts/receivable" element={<AccountsLandingPage initialSection="receivable" />} />
              <Route path="/accounts/utilities" element={<AccountsLandingPage initialSection="utilities" />} />
              <Route path="/accounts/payroll" element={<AccountsLandingPage initialSection="payroll" />} />
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
              <Route path="/orders/sales" element={<SalesOrdersPage />} />
              <Route path="/orders/work" element={<WorkOrdersPage />} />
              <Route path="/management" element={<ManagementPage />} />
              <Route path="/storage" element={<StoragePage />} />
              <Route path="/businesslens" element={<BusinessLensPage />} />
              <Route path="/businesslens/:templateId" element={<BusinessLensWizardPage />} />
            </Route>

            {/* Public/system pages - legacy */}
            {/* <Route path="/unauthorized" element={<UnauthorizedPage />} /> */}
            {/* <Route path="/profileNotFound" element={<NoProfilePage />} /> */}
            {/* <Route path="/PageDisabled" element={<DisabledPage />} /> */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </Provider>
  );
};

export default App;
