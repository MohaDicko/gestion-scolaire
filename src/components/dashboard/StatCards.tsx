'use client';

import React from 'react';
import { Users, TrendingUp, AlertTriangle, Briefcase, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  const colorMap = {
    blue: { 
      glow: 'group-hover:bg-blue-500/30', 
      bg: 'bg-blue-500/10', 
      text: 'text-blue-400', 
      border: 'border-blue-500/20',
      top: 'border-t-blue-500'
    },
    emerald: { 
      glow: 'group-hover:bg-emerald-500/30', 
      bg: 'bg-emerald-500/10', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/20',
      top: 'border-t-emerald-500'
    },
    red: { 
      glow: 'group-hover:bg-red-500/30', 
      bg: 'bg-red-500/10', 
      text: 'text-red-400', 
      border: 'border-red-500/20',
      top: 'border-t-red-500'
    },
    sky: { 
      glow: 'group-hover:bg-sky-500/30', 
      bg: 'bg-sky-500/10', 
      text: 'text-sky-400', 
      border: 'border-sky-500/20',
      top: 'border-t-sky-500'
    },
  } as const;

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
      {kpis.map((kpi, i) => {
        const colors = colorMap[kpi.color as keyof typeof colorMap] || colorMap.blue;
        
        return (
          <motion.div key={i} variants={itemVariants}>
            <Card 
              variant="glass" 
              className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1",
                colors.top
              )}
              style={{ 
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Glow effect on hover */}
              <div className={cn("absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl transition-all duration-500", colors.glow)}></div>

              <div className="flex items-start justify-between relative z-10">
                <div className={cn("p-3 rounded-2xl shadow-inner border", colors.bg, colors.text, colors.border)}>
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
        );
      })}
    </motion.div>
  );
}
