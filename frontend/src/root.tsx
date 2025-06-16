import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/ui/Sidebar';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Shared from './pages/Shared';
import Settings from './pages/Settings';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-auto p-8">
            <Dashboard />
          </main>
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/files',
    element: (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-auto p-8">
            <Files />
          </main>
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/shared',
    element: (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-auto p-8">
            <Shared />
          </main>
        </div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-100">
          <Sidebar />
          <main className="flex-1 overflow-auto p-8">
            <Settings />
          </main>
        </div>
      </ProtectedRoute>
    ),
  },
]);

const App: React.FC = () => {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <RouterProvider router={router} />
    </ClerkProvider>
  );
};

export default App; 