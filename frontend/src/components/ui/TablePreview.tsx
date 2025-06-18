// src/components/ui/TablePreview.tsx
import React, { useState } from 'react';

type TablePreviewProps = {
  columns: string[];
  data: { [key: string]: any }[];
};

export default function TablePreview({ columns, data }: TablePreviewProps) {
  // État pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Auto-réparation si les colonnes sont du type ['0', '1', ...]
  const numericColumnPattern = /^[0-9]+$/;
  const shouldInferColumns = columns.every(col => numericColumnPattern.test(col));
  const correctedColumns = shouldInferColumns && data.length > 0
    ? Object.keys(data[0])
    : columns;

  // Calculs pour la pagination
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Gestion des changements de page
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <div className="w-full max-w-[1475px] overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-inner bg-white dark:bg-zinc-900">
        <table className="table-auto text-[10px] text-zinc-900 dark:text-zinc-100 border-collapse min-w-full">
          <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800 backdrop-blur bg-opacity-80 text-zinc-500 dark:text-zinc-400 uppercase tracking-wide z-10">
            <tr>
              {correctedColumns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-2 py-1 border-b border-zinc-200 dark:border-zinc-700 text-left whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`
                  ${rowIdx % 2 === 0 
                    ? 'bg-white dark:bg-zinc-900' 
                    : 'bg-zinc-50 dark:bg-zinc-800'
                  }
                  hover:bg-zinc-100 dark:hover:bg-zinc-700
                `}
              >
                {correctedColumns.map((col, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-2 py-1 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap max-w-[200px] truncate"
                  >
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center justify-between w-full max-w-[1475px] px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <div className="flex items-center space-x-2 text-[10px] text-zinc-600 dark:text-zinc-400">
          <span>Lignes par page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>
            {startIndex + 1}-{Math.min(endIndex, data.length)} sur {data.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ««
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            «
          </button>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            »
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            »»
          </button>
        </div>
      </div>
    </div>
  );
}