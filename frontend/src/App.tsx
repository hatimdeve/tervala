// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Cleaner from './pages/Cleaner';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import CleanerLibrary from './pages/CleanerLibrary';
import KpiLibrary from './pages/KpiLibrary';
import NotFound from './pages/NotFound';
import { FileProvider } from './context/FileContext';
import { DashboardProvider } from './context/DashboardContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from '@clerk/clerk-react';
import { AdminPage } from './pages/AdminPage';
import Layout from './components/ui/Layout';
import OrganizationsPage from './pages/admin/OrganizationsPage';
import UsersPage from './pages/admin/UsersPage';

function App() {
  console.log('App component rendering...');
  
  const { isSignedIn, isLoaded } = useAuth();
  console.log('Auth state:', { isSignedIn, isLoaded });

  if (!isLoaded) {
    console.log('Auth not loaded yet...');
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <ThemeProvider>
      <FileProvider>
        <DashboardProvider>
          <Routes>
            {!isSignedIn ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="/cleaner" element={<Cleaner />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/library/cleaning" element={<CleanerLibrary />} />
                <Route path="/library/kpi" element={<KpiLibrary />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/organizations" element={<OrganizationsPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            )}
          </Routes>
        </DashboardProvider>
      </FileProvider>
    </ThemeProvider>
  );
}

export default App;