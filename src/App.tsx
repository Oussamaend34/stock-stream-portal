import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import ProductManagement from '@/pages/ProductManagement';
import WarehouseManagement from '@/pages/WarehouseManagement';
import StockManagement from '@/pages/StockManagement';
import OrderManagement from '@/pages/OrderManagement';
import PurchaseManagement from '@/pages/PurchaseManagement';
import ShipmentManagement from '@/pages/ShipmentManagement';
import ReceptionManagement from '@/pages/ReceptionManagement';
import TransferManagement from '@/pages/TransferManagement';
import InventoryManagement from '@/pages/InventoryManagement';
import ClientManagement from '@/pages/ClientManagement';
import SupplierManagement from '@/pages/SupplierManagement';
import UserManagement from '@/pages/UserManagement';
import NotFound from '@/pages/NotFound';
import { useEffect } from 'react';
import { authService } from '@/lib/auth';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize authentication state from localStorage
    authService.initializeAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
