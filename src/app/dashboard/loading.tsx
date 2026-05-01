import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#060b18]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
          </div>
        </div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">
          SchoolERP Pro
        </p>
      </div>
    </div>
  );
}
