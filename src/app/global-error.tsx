'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-900 text-slate-100 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-red-900/40 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Erreur Critique</h1>
          
          <p className="text-slate-400 mb-8">
            L'application a rencontré une erreur majeure lors de son chargement initial. 
            Veuillez recharger la page.
          </p>
          
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/20"
          >
            <RefreshCcw className="w-5 h-5" />
            Recharger l'Application
          </button>
        </div>
      </body>
    </html>
  );
}
