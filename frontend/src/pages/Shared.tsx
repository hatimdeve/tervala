import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface SharedFile {
  id: number;
  file_name: string;
  shared_by: string;
  permission_level: string;
  created_at: string;
}

const Shared: React.FC = () => {
  const { getToken } = useAuth();
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedFiles = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/files/shared', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des fichiers partagés');
        }

        const data = await response.json();
        setSharedFiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedFiles();
  }, [getToken]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Fichiers partagés avec moi</h1>
      
      {sharedFiles.length === 0 ? (
        <p>Aucun fichier partagé</p>
      ) : (
        <div className="grid gap-4">
          {sharedFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{file.file_name}</h3>
                  <p className="text-sm text-gray-500">
                    Partagé par {file.shared_by} le {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {file.permission_level}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shared; 