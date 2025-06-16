// src/components/ui/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  LineChart,
  Archive,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun,
  User,
  UserCog
} from 'lucide-react';
import { Switch } from './switch';
import { useTheme } from '../../context/ThemeContext';
import { UserButton, useUser } from '@clerk/clerk-react';

export default function Sidebar() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  // Ouvre automatiquement le sous-menu admin si on est sur une route admin
  React.useEffect(() => {
    if (location.pathname.startsWith('/admin/')) setIsAdminOpen(true);
  }, [location.pathname]);

  return (
    <div className="fixed top-0 left-0 w-64 h-screen bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col">
      <div className="py-6 pl-3 pr-6 flex items-center gap-1">
        <img
          src="/images/tervel-logo.png"
          alt="Tervel.A Logo"
          className="h-12"
          style={{ filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }}
        />
        <span 
          className="font-bold text-3xl bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 dark:from-white dark:via-zinc-300 dark:to-zinc-400 text-transparent bg-clip-text tracking-tighter font-russo"
        >
          TervelA
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto mt-8">
        <nav className="px-4 space-y-4">
          <NavLink 
            to="/cleaner" 
            className={({ isActive }) => `flex items-center gap-2 hover:text-blue-500 font-medium ${isActive ? 'text-blue-500 font-bold' : ''}`}
          >
            <Sparkles size={18} /> Tervel Clean
          </NavLink>

          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `flex items-center gap-2 hover:text-blue-500 font-medium ${isActive ? 'text-blue-500 font-bold' : ''}`}
          >
            <LineChart size={18} /> Tervel Dash
          </NavLink>

          <div>
            <div
              onClick={() => setIsLibraryOpen(!isLibraryOpen)}
              className="flex items-center gap-2 cursor-pointer hover:text-blue-500 font-medium"
            >
              <Archive size={18} /> Libraries
              {isLibraryOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {isLibraryOpen && (
              <div className="ml-6 mt-2 flex flex-col gap-2">
                <NavLink 
                  to="/library/cleaning" 
                  className={({ isActive }) => `text-sm hover:text-blue-500 font-normal ${isActive ? 'text-blue-500 font-bold' : ''}`}
                >
                  Cleansing Rules
                </NavLink>
                <NavLink 
                  to="/library/kpi" 
                  className={({ isActive }) => `text-sm hover:text-blue-500 font-normal ${isActive ? 'text-blue-500 font-bold' : ''}`}
                >
                  Dashboard Queries
                </NavLink>
              </div>
            )}
          </div>

          {isAdmin && (
            <div>
              <div
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className="flex items-center gap-2 cursor-pointer hover:text-blue-500 font-medium"
                style={{ fontWeight: location.pathname.startsWith('/admin') ? 'bold' : 'normal' }}
              >
                <UserCog size={18} /> Administration
                {isAdminOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              {isAdminOpen && (
                <div className="ml-6 mt-2 flex flex-col gap-2">
                  <NavLink
                    to="/admin/organizations"
                    className={({ isActive }) => `text-sm hover:text-blue-500 font-normal ${isActive ? 'text-blue-500 font-bold' : ''}`}
                  >
                    Organizations
                  </NavLink>
                  <NavLink
                    to="/admin/users"
                    className={({ isActive }) => `text-sm hover:text-blue-500 font-normal ${isActive ? 'text-blue-500 font-bold' : ''}`}
                  >
                    Users
                  </NavLink>
                </div>
              )}
            </div>
          )}

          <NavLink 
            to="/login" 
            className={({ isActive }) => `flex items-center gap-2 hover:text-blue-500 font-medium ${isActive ? 'text-blue-500 font-bold' : ''}`}
          >
            <ShieldCheck size={18} /> Login
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => `flex items-center gap-2 hover:text-blue-500 font-medium ${isActive ? 'text-blue-500 font-bold' : ''}`}
          >
            <User size={18} /> Mon Profil
          </NavLink>

          {/* Theme Toggle */}
          <div className="mt-auto pt-6 border-t border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-zinc-400">Theme</span>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
                <Switch
                  checked={isDark}
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle theme"
                />
                <Moon className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
        <UserButton 
          appearance={{
            elements: {
              rootBox: "w-full flex justify-start",
              userButtonTrigger: "w-10 h-10"
            }
          }}
          afterSignOutUrl="/"
        />
      </div>
    </div>
  );
}