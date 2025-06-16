import React from 'react';
import { useUser } from '@clerk/clerk-react';

const Settings: React.FC = () => {
  const { user } = useUser();

  if (!user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-4">Profil</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">Sécurité</h2>
            <p className="text-sm text-gray-500">
              La gestion de la sécurité est gérée par Clerk. Vous pouvez modifier vos paramètres de sécurité
              en cliquant sur le bouton de profil en bas à gauche.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 