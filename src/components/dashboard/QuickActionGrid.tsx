'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, FileText, Receipt, ClipboardCheck, Award, Briefcase, Zap } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';

const ACTIONS = [
  { icon: Users, label: 'Inscrire un élève', href: '/students', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  { icon: FileText, label: 'Saisir des notes', href: '/grades', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  { icon: Receipt, label: 'Émettre une facture', href: '/invoices', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { icon: ClipboardCheck, label: 'Pointer les présences', href: '/attendance', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  { icon: Zap, label: 'Stress Test (Lab)', href: '/admin/stress-test', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
];

export function QuickActionGrid() {
  const router = useRouter();

  return (
    <Card variant="glass" className="h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
          <Zap size={18} />
        </div>
        <CardTitle className="text-base uppercase tracking-tight">Actions Rapides</CardTitle>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action, i) => (
          <button
            key={i}
            onClick={() => router.push(action.href)}
            className="group relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
          >
            <div 
              className="p-3 rounded-xl transition-colors"
              style={{ backgroundColor: action.bg, color: action.color }}
            >
              <action.icon size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
