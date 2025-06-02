import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import WarehouseManagement from './pages/WarehouseManagement';
import StockManagement from './pages/StockManagement';
import OrderManagement from './pages/OrderManagement';
import PurchaseManagement from './pages/PurchaseManagement';
import ShipmentManagement from './pages/ShipmentManagement';
import ReceptionManagement from './pages/ReceptionManagement';
import TransferManagement from './pages/TransferManagement';
import InventoryManagement from './pages/InventoryManagement';
import ClientManagement from './pages/ClientManagement';
import SupplierManagement from './pages/SupplierManagement';
import UserManagement from './pages/UserManagement';
import UnitManagement from './pages/UnitManagement';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'products',
        element: <ProductManagement />
      },
      {
        path: 'warehouses',
        element: (
          <AdminRoute>
            <WarehouseManagement />
          </AdminRoute>
        )
      },
      {
        path: 'stock',
        element: <StockManagement />
      },
      {
        path: 'orders',
        element: <OrderManagement />
      },
      {
        path: 'purchases',
        element: <PurchaseManagement />
      },
      {
        path: 'shipments',
        element: <ShipmentManagement />
      },
      {
        path: 'receptions',
        element: <ReceptionManagement />
      },
      {
        path: 'transfers',
        element: <TransferManagement />
      },
      {
        path: 'inventories',
        element: <InventoryManagement />
      },
      {
        path: 'clients',
        element: <ClientManagement />
      },
      {
        path: 'suppliers',
        element: <SupplierManagement />
      },
      {
        path: 'users',
        element: (
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        )
      },
      {
        path: 'units',
        element: <UnitManagement />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]); 