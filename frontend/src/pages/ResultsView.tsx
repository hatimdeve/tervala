import React, { useState } from 'react';
import FileDropzone from '../components/ui/FileDropzone';
import TablePreview from '../components/ui/TablePreview';
import ChatBox from '../components/ui/ChatBox';
import  Button  from '../components/ui/Button'; // Assure-toi que tu as ce bouton dans ton UI
import  ChartRenderer  from '../components/ui/ChartRenderer';  // Graphiques via Nivo

export default function ResultsView() {
  const [isDashboardView, setIsDashboardView] = useState(false);  // switch entre vue du tableau et dashboard
  const [data, setData] = useState<any[]>([]); // Données pour le tableau
  const [columns, setColumns] = useState<string[]>([]); // Colonnes pour le tableau
  const [indexBy, setIndexBy] = useState<string | null>(null);
  const [keys, setKeys] = useState<string[]>([]);

  const handlePromptProcessed = (processedData: any[]) => {
    console.log("Prompt traité avec succès", processedData);
    setData(processedData);
    if (processedData.length > 0) {
      setColumns(Object.keys(processedData[0]));

      const sample = processedData[0];
      const stringCols: string[] = [];
      const numericCols: string[] = [];

      for (const [key, value] of Object.entries(sample)) {
        if (typeof value === 'string') stringCols.push(key);
        if (typeof value === 'number') numericCols.push(key);
      }

      setIndexBy(stringCols[0] || null);
      setKeys(numericCols);
    }
  };

  const handleSwitch = () => {
    setIsDashboardView(prevState => !prevState); // Bascule entre tableau et dashboard
  };

  return (
    <div className="p-8 bg-zinc-900 text-white min-h-screen flex flex-col gap-4">
      {/* Zone de téléchargement de fichier */}
      <FileDropzone onFileAccepted={(file) => {/* Traitement du fichier ici */}} />

      {/* Zone de chat */}
      <ChatBox onPromptProcessed={handlePromptProcessed}/>

      {/* Zone pour le tableau ou le dashboard */}
      <div className="flex flex-col gap-4 mt-6">
        <Button onClick={handleSwitch} className="bg-blue-500 hover:bg-blue-400">Switch to {isDashboardView ? "Table" : "Dashboard"}</Button>

        {isDashboardView ? (
          <ChartRenderer data={data} chartType="line" indexBy={indexBy} keys={keys} />
        ) : (
          <div className="overflow-auto max-h-[500px]">
            <TablePreview columns={columns} data={data} />
          </div>
        )}
      </div>
    </div>
  );
}