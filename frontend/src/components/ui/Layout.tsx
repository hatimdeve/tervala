import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-zinc-900">
      <Sidebar />
      <main className="flex-1 overflow-auto ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 