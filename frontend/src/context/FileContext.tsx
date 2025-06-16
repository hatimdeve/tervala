// src/context/FileContext.tsx
import React, { createContext, useState } from 'react';

export const FileContext = createContext<any>(null);

export const FileProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<string[][]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  
  return (
    <FileContext.Provider value={{ data, setData, columns, setColumns }}>
      {children}
    </FileContext.Provider>
  );
};