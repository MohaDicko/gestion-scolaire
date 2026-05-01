'use client';

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
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#060b18] text-white p-6">
      <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-8">
        <AlertTriangle size={40} className="text-rose-500" />
      </div>
      
      <h2 className="text-2xl font-black mb-2 text-center">Une erreur est survenue</h2>
      <p className="text-slate-400 text-center mb-10 max-w-md">
        Nous avons rencontré un problème lors de la récupération de vos données. L'équipe technique a été notifiée.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all"
        >
          <RefreshCcw size={18} /> Réessayer
        </button>
        
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
        >
          <Home size={18} /> Accueil
        </Link>
      </div>
    </div>
  );
}
