'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-lg m-4 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
      
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Oups! Quelque chose s'est mal passé.
      </h2>
      
      <p className="text-slate-600 dark:text-slate-400 max-w-md text-center mb-8">
        Une erreur inattendue s'est produite. Nous nous en excusons. Notre équipe technique a été notifiée de l'incident.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Réessayer
        </button>
        
        <Link 
          href="/dashboard" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
