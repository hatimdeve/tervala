import React from 'react';

export default function TervelSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <img
        src="/images/tervel-logo.png"
        alt="Tervel.A Logo"
        className="w-full h-full object-contain animate-spin"
        style={{ 
          animationDuration: '1.5s',
          filter: 'brightness(0) invert(1)' // Pour rendre le logo blanc
        }}
      />
    </div>
  );
} 