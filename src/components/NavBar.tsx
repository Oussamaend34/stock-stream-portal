
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  Warehouse,
  User,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <FileText size={20} /> },
    { name: 'Users', path: '/users', icon: <User size={20} /> },
    { name: 'Warehouses', path: '/warehouses', icon: <Warehouse size={20} /> },
    { name: 'Orders', path: '/orders', icon: <Package size={20} /> },
    { name: 'Shipments', path: '/shipments', icon: <Truck size={20} /> },
  ];
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link 
        to={item.path}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-md transition-all",
          isActive 
            ? "bg-warehouse-100 text-warehouse-900 font-medium" 
            : "text-gray-600 hover:bg-gray-100"
        )}
        onClick={() => isMobile && setIsOpen(false)}
      >
        <span>{item.icon}</span>
        <span>{item.name}</span>
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
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Warehouse className="text-warehouse-600" size={24} />
              <span className="text-xl font-bold text-gray-800">WareManager</span>
            </Link>
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
              className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600"
              onClick={() => isMobile && setIsOpen(false)}
            >
              <User size={20} />
              <span>Logout</span>
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
