'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Receipt, CreditCard, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatsProps {
  stats: any;
  isLoading: boolean;
}

const generateMockData = (base: number, volatility: number) => {
  return Array.from({ length: 14 }).map((_, i) => ({
    value: base + Math.sin(i) * volatility + (Math.random() * volatility * 0.5)
  }));
};

export function ShadcnStats({ stats, isLoading }: StatsProps) {
  const items = [
    { 
      label: 'Total Élèves', 
      value: stats.studentsCount, 
      icon: Users, 
      color: 'text-indigo-500', 
      trend: '+12%', 
      bg: 'bg-indigo-500/10',
      chartColor: '#6366f1',
      data: generateMockData(500, 50)
    },
    { 
      label: 'Personnel', 
      value: stats.employeesCount, 
      icon: Briefcase, 
      color: 'text-purple-500', 
      trend: '+2%', 
      bg: 'bg-purple-500/10',
      chartColor: '#a855f7',
      data: generateMockData(100, 5)
    },
    { 
      label: 'Chiffre d\'Affaires', 
      value: `${(stats.invoicesTotal || 0).toLocaleString()} F`, 
      icon: Receipt, 
      color: 'text-emerald-500', 
      trend: '+8%', 
      bg: 'bg-emerald-500/10',
      chartColor: '#10b981',
      data: generateMockData(1000000, 200000)
    },
    { 
      label: 'Recouvrement', 
      value: `${(stats.invoicesPaid || 0).toLocaleString()} F`, 
      icon: CreditCard, 
      color: 'text-amber-500', 
      trend: '75%', 
      bg: 'bg-amber-500/10',
      chartColor: '#f59e0b',
      data: generateMockData(500000, 100000)
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, ease: "easeOut", duration: 0.5 }}
          className="relative group"
        >
          {/* Subtle Glow Behind Card */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" />
          
          <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 transform group-hover:-translate-y-1">
            
            {/* Top Section */}
            <div className="p-5 pb-0 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isLoading ? (
                    <span className="inline-block h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  ) : (
                    item.value
                  )}
                </h3>
              </div>
              <div className={`p-2.5 rounded-xl ${item.bg} ${item.color} shadow-inner`}>
                <item.icon size={20} strokeWidth={2.5} />
              </div>
            </div>

            {/* Middle Section: Sparkline */}
            <div className="h-[45px] w-full mt-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={item.data}>
                  <defs>
                    <linearGradient id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={item.chartColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={item.chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={item.chartColor} 
                    strokeWidth={2}
                    fill={`url(#gradient-${i})`} 
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Section */}
            <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <TrendingUp size={14} strokeWidth={3} />
                <span className="text-xs font-bold">{item.trend}</span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase">30 derniers jours</span>
            </div>
            
          </div>
        </motion.div>
      ))}
    </div>
  );
}
