import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';

interface File {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

const Files: React.FC = () => {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/files', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des fichiers');
        }

        const data = await response.json();
        setFiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [getToken]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Mes fichiers</h1>
      
      {files.length === 0 ? (
        <p>Aucun fichier trouvé</p>
      ) : (
        <div className="grid gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{file.file_name}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {(file.file_size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Files; 