
import React from 'react';
import { 
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Toaster } from '@/components/ui/sonner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 w-full">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Warehouse Management System</h1>
            <div></div> {/* Empty div for spacing */}
          </div>
          
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </SidebarInset>
        
        <Toaster position="top-right" />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
