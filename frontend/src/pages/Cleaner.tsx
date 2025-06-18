// src/pages/Cleaner.tsx
import React, { useState, useContext } from 'react';
import FileDropzone from '../components/ui/FileDropzone';
import TablePreview from '../components/ui/TablePreview';
import ChatBox from '../components/ui/ChatBox';
import { Progress } from '../components/ui/progress';
import { parseFile } from '../lib/parseFile';
import { FileContext } from '../context/FileContext';

const Cleaner = () => {
  const [file, setFile] = useState<File | null>(null); // Fichier importé
  const [isLoading, setIsLoading] = useState(false); // Indicateur de chargement
  const [progress, setProgress] = useState<number>(0); // Suivi du progrès
  const { data, setData, columns, setColumns } = useContext(FileContext); // Contexte des données

  // Fonction pour gérer le fichier une fois importé
  const handleFile = async (f: File) => {
    setFile(f); // On garde en mémoire le fichier importé
    setIsLoading(true); // Indiquer que le traitement est en cours
    setProgress(0); // Réinitialiser la progression

    // Simulation de la progression du traitement
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval); // Arrêter l'intervalle une fois la progression terminée
          return prev;
        }
        return prev + 5;
      });
    }, 100); // Mise à jour toutes les 100ms

    try {
      // Traitement du fichier (analyse du contenu via parseFile)
      const result = await parseFile(f);
      console.log("📊 [Cleaner] Colonnes reçues:", result.columns);
      console.log("📊 [Cleaner] Données reçues:", result.data.length, "lignes");
      setColumns(result.columns); // Mise à jour des colonnes du tableau
      setData(result.data); // Mise à jour des données du tableau
      setProgress(100); // Finaliser la progression
    } catch (error) {
      console.error('❌ Erreur lors du parsing du fichier :', error);
    } finally {
      // Fin du traitement
      setTimeout(() => setIsLoading(false), 400); // Délai avant de terminer l'état de chargement
    }
  };

  // Fonction pour traiter les données après un prompt
  const handlePromptProcessed = (processedData: any) => {
    console.log("Prompt traité avec succès", processedData);
    if (processedData && Array.isArray(processedData) && processedData.length > 0) {
      // Si les données sont déjà au format objet, pas besoin de transformation
      if (typeof processedData[0] === 'object' && !Array.isArray(processedData[0])) {
        setData(processedData);
        if (processedData.length > 0) {
          setColumns(Object.keys(processedData[0]));
        }
      } else {
        // Si les données sont au format tableau de tableaux
        const [headers, ...rows] = processedData;
        if (Array.isArray(headers)) {
          const formattedData = rows.map(row => {
            const obj: { [key: string]: any } = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index];
            });
            return obj;
          });
          setColumns(headers);
          setData(formattedData);
        }
      }
    }
  };

  return (
    <main className="flex-1 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
      <div className="h-full p-8 pb-[300px] pl-16">
        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-800 dark:from-white dark:via-zinc-300 dark:to-zinc-400 text-transparent bg-clip-text tracking-tighter">
            Cleaner
          </h1>
        </div>
      
        {/* Zone de dépôt du fichier agrandie et centrée */}
        {!file && (
          <div className="flex items-center justify-center h-[calc(75vh-200px)]">
            <div className="w-full max-w-2xl">
              <FileDropzone onFileAccepted={handleFile} />
            </div>
          </div>
        )}

        {/* Message simple indiquant que le fichier a été chargé */}
        {file && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            ✅ File loaded: <span className="font-semibold">{file.name}</span>
          </p>
        )}

        {/* Progression de traitement */}
        {isLoading && (
          <div className="mt-4">
            <div className="relative w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"/>
              Traitement en cours...
            </div>
          </div>
        )}

        {/* Affichage des données du tableau */}
        <div className="flex flex-col flex-1 overflow-hidden mt-4">
          {file && !isLoading && (
            <div className="flex-1 overflow-auto mb-32">
              <h2 className="text-xl font-semibold mb-2">File Preview:</h2>
              <TablePreview columns={columns} data={data.slice(0, 20)} />
            </div>
          )}
        </div>
      </div>

      {/* Chat box fixe en bas avec hauteur définie */}
      <div className="fixed bottom-0 left-[280px] right-0 h-[300px] bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-lg">
        <div className="h-full px-8">
          <ChatBox onPromptProcessed={handlePromptProcessed} />
        </div>
      </div>
    </main>
  );
};

export default Cleaner;