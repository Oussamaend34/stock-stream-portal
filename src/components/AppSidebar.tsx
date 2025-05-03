
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Warehouse, 
  User
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem 
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const location = useLocation();

  // Navigation items for the sidebar
  const navItems = [
    { title: 'Users', icon: User, path: '/users' },
    { title: 'Warehouses', icon: Warehouse, path: '/warehouses' },
    { title: 'Orders', icon: Package, path: '/orders' },
    { title: 'Shipments', icon: Truck, path: '/shipments' },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="p-4 flex items-center">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Warehouse className="text-warehouse-600" size={24} />
          <span className="text-xl font-bold">WareManager</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                  >
                    <Link to={item.path}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Link 
          to="/login"
          className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
        >
          <User size={18} />
          <span>Logout</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
