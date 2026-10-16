'use client';

import React from 'react';
import { Users, TrendingUp, AlertTriangle, Briefcase, ArrowUpRight } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

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
        <StatCard
          key={i}
          label={kpi.label}
          value={kpi.value}
          icon={<kpi.icon size={22} />}
          description={kpi.change}
          trend={kpi.trend ? 'Évolution' : undefined}
          loading={isLoading}
          tone={kpi.isDanger ? 'danger' : kpi.isSuccess ? 'success' : 'default'}
        />
      ))}
    </div>
  );
}
