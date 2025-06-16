import React, { createContext, useState, useContext, ReactNode } from 'react';

interface DashboardContextType {
  dashboardData: any[];
  setDashboardData: (data: any[]) => void;
  dashboardColumns: string[];
  setDashboardColumns: (cols: string[]) => void;
  viewType: 'table' | 'chart' | null;
  setViewType: (type: 'table' | 'chart' | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [dashboardColumns, setDashboardColumns] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'table' | 'chart' | null>(null);

  return (
    <DashboardContext.Provider value={{
      dashboardData,
      setDashboardData,
      dashboardColumns,
      setDashboardColumns,
      viewType,
      setViewType
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
};
