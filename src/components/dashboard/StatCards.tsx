'use client';

import React from 'react';
import { Users, TrendingUp, AlertTriangle, Briefcase, ArrowUpRight, Loader2 } from 'lucide-react';

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
      color: 'var(--primary)',
      bg: 'var(--primary-dim)',
      change: 'Effectif actif',
      trend: <ArrowUpRight size={11} />
    },
    {
      label: 'Recettes Encaissées',
      value: `${(stats.invoicesPaid / 1000000).toFixed(2)}M XOF`,
      icon: TrendingUp,
      color: 'var(--success)',
      bg: 'var(--success-dim)',
      change: `${paymentRate}% recouvré`,
      isSuccess: true
    },
    {
      label: 'Restes à Recouvrer',
      value: `${(unpaid / 1000).toFixed(0)}k XOF`,
      icon: AlertTriangle,
      color: 'var(--danger)',
      bg: 'var(--danger-dim)',
      change: 'Action requise',
      isDanger: true
    },
    {
      label: 'Personnel Actif',
      value: stats.employeesCount.toLocaleString(),
      icon: Briefcase,
      color: 'var(--info)',
      bg: 'var(--info-dim)',
      change: 'Ens. + Administratifs'
    }
  ];

  return (
    <div className="stats-grid">
      {kpis.map((kpi, i) => (
        <div key={i} className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
            <kpi.icon size={22} />
          </div>
          <div className="stat-body">
            <div className="stat-label">{kpi.label}</div>
            <div className="stat-value">
              {isLoading ? '...' : kpi.value}
            </div>
            <div className={`stat-change ${kpi.isDanger ? 'text-danger' : kpi.isSuccess ? 'text-success' : ''}`} 
                 style={{ backgroundColor: kpi.isDanger ? 'var(--danger-dim)' : kpi.isSuccess ? 'var(--success-dim)' : 'var(--bg-4)' }}>
              {kpi.trend} {kpi.change}
            </div>
          </div>
          {isLoading && <Loader2 className="spin" size={14} style={{ position: 'absolute', top: '10px', right: '10px', opacity: 0.5 }} />}
        </div>
      ))}
    </div>
  );
}
