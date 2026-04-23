'use client';

import React from 'react';
import { Users, TrendingUp, AlertTriangle, Briefcase, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface StatCardsProps {
  stats: {
    studentsCount: number;
    employeesCount: number;
    invoicesTotal: number;
    invoicesPaid: number;
  };
  isLoading: boolean;
}

export function StatCards({ stats, isLoading }: StatCardsProps) {
  const paymentRate = stats.invoicesTotal > 0
    ? Math.round((stats.invoicesPaid / stats.invoicesTotal) * 100)
    : 0;
  
  const unpaid = stats.invoicesTotal - stats.invoicesPaid;

  const kpis = [
    {
      label: 'Élèves Inscrits',
      value: stats.studentsCount.toLocaleString(),
      icon: Users,
      color: 'blue',
      change: 'Effectif actif',
      trend: <ArrowUpRight size={11} />
    },
    {
      label: 'Recettes Encaissées',
      value: `${(stats.invoicesPaid / 1000000).toFixed(2)}M XOF`,
      icon: TrendingUp,
      color: 'emerald',
      change: `${paymentRate}% recouvré`,
      isSuccess: true
    },
    {
      label: 'Restes à Recouvrer',
      value: `${(unpaid / 1000).toFixed(0)}k XOF`,
      icon: AlertTriangle,
      color: 'red',
      change: 'Action requise',
      isDanger: true
    },
    {
      label: 'Personnel Actif',
      value: stats.employeesCount.toLocaleString(),
      icon: Briefcase,
      color: 'sky',
      change: 'Ens. + Administratifs'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <Card 
          key={i} 
          variant="glass" 
          className="border-t-4"
          style={{ borderTopColor: `var(--${kpi.color})` }}
        >
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl bg-${kpi.color}-500/10 text-${kpi.color}-500`}>
              <kpi.icon size={22} />
            </div>
            {isLoading && <Loader2 className="animate-spin text-slate-400" size={16} />}
          </div>
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{kpi.label}</div>
            <div className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
              {isLoading ? '...' : kpi.value}
            </div>
            <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
              kpi.isSuccess ? 'bg-emerald-500/10 text-emerald-600' : 
              kpi.isDanger ? 'bg-red-500/10 text-red-600' : 
              'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {kpi.trend} {kpi.change}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
