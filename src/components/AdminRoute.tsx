import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/lib/auth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const user = authService.getUserData();

  if (!user || user.role !== 'ADMIN') {
    // Redirect to dashboard if user is not an admin
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute; 