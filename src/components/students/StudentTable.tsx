'use client';

import React from 'react';
import { Eye, Users, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Féminin', OTHER: 'Autre' };

interface StudentTableProps {
  items: any[];
  isLoading: boolean;
  totalCount: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export function StudentTable({ items, isLoading, totalCount, searchTerm, onSearchChange }: StudentTableProps) {
  const router = useRouter();

  return (
    <Card variant="glass" noPadding className="overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher un élève, matricule..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
          {totalCount} Élève(s)
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-sm font-medium">Recherche en cours...</p>
          </div>
        ) : items.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Matricule</th>
                <th className="px-6 py-4">Identité</th>
                <th className="px-6 py-4">Genre</th>
                <th className="px-6 py-4">Parent / Tuteur</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {items.map((s) => (
                <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black rounded-lg">
                      {s.studentNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {s.firstName} {s.lastName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.nationalId || 'Sans CNI'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      s.gender === 'FEMALE' ? 'bg-purple-500/10 text-purple-600' : 'bg-sky-500/10 text-sky-600'
                    }`}>
                      {GENDER_LABELS[s.gender] || s.gender}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-300">{s.parentName}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.parentPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => router.push(`/students/${s.id}`)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 opacity-30">
            <Users size={64} className="mb-4" />
            <h3 className="text-lg font-black uppercase tracking-widest">Aucun résultat</h3>
          </div>
        )}
      </div>
    </Card>
  );
}
