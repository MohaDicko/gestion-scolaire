'use client';

import React from 'react';
import { Users, TrendingUp, AlertTriangle, Briefcase, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {kpis.map((kpi, i) => (
        <motion.div key={i} variants={itemVariants}>
          <Card 
            variant="glass" 
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            style={{ 
              background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderTop: `2px solid var(--${kpi.color})` 
            }}
          >
            {/* Glow effect on hover */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 bg-${kpi.color}-500/20 rounded-full blur-3xl group-hover:bg-${kpi.color}-500/30 transition-all duration-500`}></div>

            <div className="flex items-start justify-between relative z-10">
              <div className={`p-3 rounded-2xl bg-${kpi.color}-500/10 text-${kpi.color}-400 shadow-inner border border-${kpi.color}-500/20`}>
                <kpi.icon size={24} strokeWidth={1.5} />
              </div>
              {isLoading && <Loader2 className="animate-spin text-slate-400" size={18} />}
            </div>
            
            <div className="mt-5 relative z-10">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{kpi.label}</div>
              <div className="text-3xl font-black mt-2 text-white tracking-tight">
                {isLoading ? '...' : kpi.value}
              </div>
              <div className={`flex items-center gap-1.5 mt-4 text-[11px] font-bold px-2.5 py-1 rounded-lg w-fit transition-colors ${
                kpi.isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                kpi.isDanger ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {kpi.trend} {kpi.change}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
