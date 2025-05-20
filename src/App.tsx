import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import WarehouseManagement from "./pages/WarehouseManagement";
import OrderManagement from "./pages/OrderManagement";
import PurchaseManagement from "./pages/PurchaseManagement";
import ShipmentManagement from "./pages/ShipmentManagement";
import ReceptionManagement from "./pages/ReceptionManagement";
import ClientManagement from "./pages/ClientManagement";
import SupplierManagement from "./pages/SupplierManagement";
import StockManagement from "./pages/StockManagement";
import ProductManagement from "./pages/ProductManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated routes with Layout (sidebar) */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/users" element={<Layout><UserManagement /></Layout>} />
          <Route path="/warehouses" element={<Layout><WarehouseManagement /></Layout>} />
          <Route path="/stock" element={<Layout><StockManagement /></Layout>} />
          <Route path="/stock/warehouses/:warehouseCode" element={<Layout><StockManagement /></Layout>} />
          <Route path="/stock/products/:productId" element={<Layout><StockManagement /></Layout>} />
          <Route path="/stock/low-stock" element={<Layout><StockManagement /></Layout>} />
          <Route path="/stock/advanced-filter" element={<Layout><StockManagement /></Layout>} />
          <Route path="/orders" element={<Layout><OrderManagement /></Layout>} />
          <Route path="/purchases" element={<Layout><PurchaseManagement /></Layout>} />
          <Route path="/shipments" element={<Layout><ShipmentManagement /></Layout>} />
          <Route path="/receptions" element={<Layout><ReceptionManagement /></Layout>} />
          <Route path="/products" element={<Layout><ProductManagement /></Layout>} />
          <Route path="/clients" element={<Layout><ClientManagement /></Layout>} />
          <Route path="/suppliers" element={<Layout><SupplierManagement /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
