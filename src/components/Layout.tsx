import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import { Toaster } from '@/components/ui/sonner';
import ChatButton from './ChatButton';

const Layout = () => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
      
      <ChatButton />
      <Toaster position="top-right" />
    </div>
  );
};

export default Layout;
