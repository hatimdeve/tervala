import React, { useState, useEffect } from 'react';
import { useDashboardContext } from '../context/DashboardContext';
import FileDropzone from '../components/ui/FileDropzone'; // Zone de dépôt du fichier
import ChartRenderer from '../components/ui/ChartRenderer'; // Affichage des graphiques
import TablePreview from '../components/ui/TablePreview'; // Affichage du tableau
import KpiChatBox from '../components/ui/KpiChatBox'; // Chatbox pour interagir avec les données traitées
import { parseFile } from '../lib/parseFile';

const Dashboard = () => {
  const {
    dashboardData: fileData,
    setDashboardData: setData,
    dashboardColumns: columns,
    setDashboardColumns: setColumns,
    viewType,
    setViewType
  } = useDashboardContext();

  const [chartType, setChartType] = useState<string>('bar'); // Type de graphique
  const [fileUploaded, setFileUploaded] = useState<boolean>(false); // Vérifier si un fichier a été téléchargé
  const [indexBy, setIndexBy] = useState<string | null>(null);
  const [keys, setKeys] = useState<string[]>([]);

  // Fonction de gestion du fichier importé
  const handleFileAccepted = async (file: File) => {
    console.log('Fichier accepté', file);
    const parsed = await parseFile(file);
    setColumns(parsed.columns);
    setData(parsed.data);
    setFileUploaded(true); // Marque le fichier comme chargé
  };

  // Fonction de gestion du prompt
  const handlePromptProcessed = (processedData: any, columns: string[]) => {
    if (processedData && Array.isArray(processedData) && processedData.length > 0) {
      setData(processedData);
      setColumns(columns);
      
      const sample = processedData[0];
      const stringCols: string[] = [];
      const numericCols: string[] = [];

      for (const [key, value] of Object.entries(sample)) {
        if (typeof value === 'string') stringCols.push(key);
        if (typeof value === 'number') numericCols.push(key);
      }

      setIndexBy(stringCols[0] || null);
      setKeys(numericCols);
      setViewType('table'); // Afficher le tableau après le traitement du prompt
    }
  };

  return (
    <main className="flex-1 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
      <div className="h-full p-8 pb-[300px] pl-16">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 dark:from-white dark:via-zinc-300 dark:to-zinc-400 text-transparent bg-clip-text tracking-tighter">
            Dashboard
          </h1>
        </div>

        {!fileUploaded ? (
          <div className="flex items-center justify-center h-[calc(75vh-200px)]">
            <div className="w-full max-w-2xl">
              <FileDropzone onFileAccepted={handleFileAccepted} />
            </div>
          </div>
        ) : (
          <>
            {/* Toggle affiché seulement si un prompt a été traité */}
            {viewType !== null && (
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setViewType(viewType === 'table' ? 'chart' : 'table')}
                  className={`relative inline-flex items-center h-6 rounded-full w-12 transition-colors ${
                    viewType === 'chart' ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute inline-flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-md transition-transform ${
                      viewType === 'chart' ? 'translate-x-[28px]' : 'translate-x-1'
                    }`}
                  >
                    {viewType === 'chart' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 17v-6m4 6V7m4 10v-4" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15M4.5 12h15M4.5 17.25h15" />
                      </svg>
                    )}
                  </span>
                </button>
                <span className="ml-4 text-xs text-zinc-500 dark:text-zinc-400">
                  {viewType === 'chart' ? 'Chart' : 'Table'}
                </span>
              </div>
            )}

            {/* Zone pour le tableau ou le dashboard */}
            <div className="mb-32">
              {viewType !== null && fileData && fileData.length > 0 && (
                viewType === 'table' ? (
                  <TablePreview columns={columns} data={fileData} />
                ) : (
                  <ChartRenderer data={fileData} chartType={chartType} indexBy={indexBy} keys={keys} />
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Chat box fixe en bas avec hauteur définie */}
      <div className="fixed bottom-0 left-[280px] right-0 h-[300px] bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-lg">
        <div className="h-full px-8">
          <KpiChatBox onPromptProcessed={handlePromptProcessed} />
        </div>
      </div>
    </main>
  );
};

export default Dashboard;