// src/components/ui/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, FileText, BarChart2, ChevronDown, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const [libraryOpen, setLibraryOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 p-4 text-white">
      <h1 className="text-xl font-bold mb-6">TervelA</h1>
      <nav className="flex flex-col gap-4">
        <Link
          to="/cleaner"
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-zinc-800 ${isActive('/cleaner') ? 'bg-zinc-800' : ''}`}
        >
          <LayoutDashboard className="w-4 h-4" /> Nettoyage
        </Link>

        <Link
          to="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-zinc-800 ${isActive('/dashboard') ? 'bg-zinc-800' : ''}`}
        >
          <BarChart2 className="w-4 h-4" /> Dashboard
        </Link>

        <div>
          <button
            onClick={() => setLibraryOpen(!libraryOpen)}
            className="flex items-center w-full gap-2 px-3 py-2 rounded hover:bg-zinc-800"
          >
            <FileText className="w-4 h-4" />
            Library
            {libraryOpen ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />}
          </button>

          {libraryOpen && (
            <div className="ml-6 mt-2 flex flex-col gap-1">
              <Link
                to="/library/cleaning"
                className={`text-sm px-3 py-1 rounded hover:bg-zinc-800 ${isActive('/library/cleaning') ? 'bg-zinc-800' : ''}`}
              >
                🧽 Nettoyage
              </Link>
              <Link
                to="/library/kpi"
                className={`text-sm px-3 py-1 rounded hover:bg-zinc-800 ${isActive('/library/kpi') ? 'bg-zinc-800' : ''}`}
              >
                📊 KPI
              </Link>
            </div>
          )}
        </div>

        <Link
          to="/login"
          className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-zinc-800 ${isActive('/login') ? 'bg-zinc-800' : ''}`}
        >
          <Settings className="w-4 h-4" /> Login
        </Link>
      </nav>
    </aside>
  );
}