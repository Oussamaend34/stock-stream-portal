import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Package,
  PackageOpen,
  Truck,
  Warehouse,
  User,
  FileText,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  MoveHorizontal,
  ClipboardList,
  LayoutDashboard,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { authService } from '@/lib/auth';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const user = authService.getUserData();

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FileText size={20} />, requiresAdmin: false },
    { name: 'Users', path: '/users', icon: <User size={20} />, requiresAdmin: true },
    { name: 'Clients', path: '/clients', icon: <Users size={20} />, requiresAdmin: false },
    { name: 'Suppliers', path: '/suppliers', icon: <Users size={20} />, requiresAdmin: false },
    { name: 'Warehouses', path: '/warehouses', icon: <Warehouse size={20} />, requiresAdmin: true },
    { name: 'Stock', path: '/stock', icon: <Boxes size={20} />, requiresAdmin: false },
    { name: 'Products', path: '/products', icon: <Package size={20} />, requiresAdmin: false },
    { name: 'Units', path: '/units', icon: <Scale size={20} />, requiresAdmin: false },
    { name: 'Inventory', path: '/inventories', icon: <ClipboardList size={20} />, requiresAdmin: false },
    { name: 'Orders', path: '/orders', icon: <ShoppingCart size={20} />, requiresAdmin: false },
    { name: 'Purchases', path: '/purchases', icon: <ShoppingBag size={20} />, requiresAdmin: false },
    { name: 'Shipments', path: '/shipments', icon: <Truck size={20} />, requiresAdmin: false },
    { name: 'Receptions', path: '/receptions', icon: <PackageOpen size={20} />, requiresAdmin: false },
    { name: 'Transfers', path: '/transfers', icon: <MoveHorizontal size={20} />, requiresAdmin: false },
  ];

  const navItems = useMemo(() => {
    const isAdmin = user?.role === 'ADMIN';
    return allNavItems.filter(item => !item.requiresAdmin || isAdmin);
  }, [user]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const NavLink = ({ item }: { item: typeof allNavItems[0] }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link 
        to={item.path}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md transition-all",
          isActive 
            ? "bg-warehouse-100 text-warehouse-900 font-medium" 
            : "text-gray-600 hover:bg-gray-100",
          isCollapsed && "lg:justify-center lg:px-2"
        )}
        onClick={() => isMobile && setIsOpen(false)}
      >
        <span>{item.icon}</span>
        <span className={cn(isCollapsed && "lg:hidden")}>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden flex justify-between items-center p-4 bg-white border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Warehouse className="text-warehouse-600" size={24} />
          <span className="text-xl font-bold text-gray-800">WareManager</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleMenu}
          className="text-gray-700"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Desktop sidebar / Mobile menu */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 lg:sticky lg:top-0 lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "lg:w-20" : "w-64",
          "lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="p-6 border-b border-gray-200 relative">
            <Link to="/dashboard" className={cn("flex items-center", isCollapsed ? "lg:justify-center" : "space-x-2")}>
              <Warehouse className="text-warehouse-600" size={24} />
              <span className={cn("text-xl font-bold text-gray-800", isCollapsed && "lg:hidden")}>WareManager</span>
            </Link>

            {/* Collapse button - only visible on desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="hidden lg:flex absolute -right-3 top-6 h-6 w-6 rounded-full bg-white shadow-md justify-center items-center text-gray-600 hover:bg-gray-100"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map(item => (
              <NavLink key={item.path} item={item} />
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <Link 
              to="/login" 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600",
                isCollapsed && "lg:justify-center lg:px-2"
              )}
              onClick={() => {
                authService.logout();
                isMobile && setIsOpen(false);
              }}
            >
              <User size={20} />
              <span className={cn(isCollapsed && "lg:hidden")}>Logout</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Backdrop overlay for mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default NavBar;
