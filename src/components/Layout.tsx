
import React from 'react';
import NavBar from './NavBar';
import { Toaster } from '@/components/ui/sonner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;
