// src/pages/DashboardPage.tsx
import React, { useState } from 'react';
import Cleaner from './Cleaner'; // Le fichier contenant le tableau
import Dashboard from './Dashboard'; // Le fichier contenant les graphiques

export default function DashboardPage() {
  const [showDashboard, setShowDashboard] = useState(false); // Contrôle l'affichage des dashboards

  return (
    <div className="p-8 bg-zinc-900 text-white min-h-screen">
      {/* Switch entre le tableau et les graphiques */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowDashboard(false)} // Affiche le tableau
          className={showDashboard ? "bg-zinc-800" : "bg-blue-600 text-white"}
        >
          Afficher les données
        </button>
        <button
          onClick={() => setShowDashboard(true)} // Affiche le dashboard
          className={showDashboard ? "bg-blue-600 text-white" : "bg-zinc-800"}
        >
          Voir les graphiques
        </button>
      </div>

      {/* Affichage conditionnel basé sur la vue sélectionnée */}
      {showDashboard ? (
        <Dashboard /> // Affichage des graphiques
      ) : (
        <Cleaner /> // Affichage du tableau des données
      )}
    </div>
  );
}