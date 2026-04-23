'use client';

import React from 'react';
import { Bell, GraduationCap, AlertTriangle, FileText, Wallet, Clock, BadgeCheck } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';

const RECENT_EVENTS = [
  { icon: GraduationCap, label: 'Nouvelle inscription', value: 'Issa Mariko — Terminale A', time: '10 min', color: '#3b82f6', urgent: false },
  { icon: AlertTriangle, label: 'Facture impayée', value: 'Scolarité Fatima Sidibé — 75 000 XOF', time: '1h', color: '#f43f5e', urgent: true },
  { icon: FileText, label: 'Notes saisies', value: 'Mathématiques DS2 — 3ème A (32 élèves)', time: '2h', color: '#8b5cf6', urgent: false },
  { icon: Wallet, label: 'Paiement reçu', value: '45 000 XOF — Frais de scolarité', time: '3h', color: '#10b981', urgent: false },
  { icon: Clock, label: 'Congé soumis', value: 'M. Diallo — 5 jours maladie', time: '4h', color: '#f59e0b', urgent: false },
  { icon: BadgeCheck, label: 'Bulletin générés', value: 'Délibération Terminale — Trimestre 2', time: 'Hier', color: '#6366f1', urgent: false },
];

export function ActivityFeed() {
  const urgentCount = RECENT_EVENTS.filter(e => e.urgent).length;

  return (
    <Card variant="glass" noPadding className="overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-blue-500" />
          <CardTitle className="text-base uppercase tracking-tight">Activités & Alertes</CardTitle>
        </div>
        {urgentCount > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">
            {urgentCount} URGENT
          </span>
        )}
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {RECENT_EVENTS.map((ev, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-4 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
              ev.urgent ? 'bg-red-500/[0.03]' : ''
            }`}
          >
            <div 
              className="mt-1 p-2 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${ev.color}15`, color: ev.color }}
            >
              <ev.icon size={16} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{ev.label}</span>
                {ev.urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{ev.value}</p>
            </div>
            
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap pt-1">
              {ev.time}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
