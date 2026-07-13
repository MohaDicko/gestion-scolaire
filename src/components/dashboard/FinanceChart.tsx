'use client';

import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const REVENUE_DATA = [
  { name: 'Sep', recettes: 1200000, dépenses: 480000 },
  { name: 'Oct', recettes: 2100000, dépenses: 650000 },
  { name: 'Nov', recettes: 1800000, dépenses: 720000 },
  { name: 'Déc', recettes: 2800000, dépenses: 900000 },
  { name: 'Jan', recettes: 2400000, dépenses: 580000 },
  { name: 'Fév', recettes: 3200000, dépenses: 810000 },
  { name: 'Mar', recettes: 3800000, dépenses: 950000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
        <p className="text-xs font-black mb-3 text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label} 2025</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: p.color }} />
              <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">{p.name}</span>
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
              {(p.value / 1000000).toFixed(2)}M F
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function FinanceChart({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shadow-inner">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Flux de Trésorerie</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Analyse des revenus et dépenses sur l'année</p>
        </div>
        
        <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800/50 py-2 px-4 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recettes</span>
            </div>
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <ArrowUpRight size={14} strokeWidth={3} />
              <span className="text-sm font-black">+18%</span>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2 h-2 rounded-full bg-red-500 opacity-80" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dépenses</span>
            </div>
            <div className="flex items-center gap-1 text-red-500">
              <ArrowDownRight size={14} strokeWidth={3} />
              <span className="text-sm font-black">-4%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 h-[320px] w-full p-4 sm:p-6 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              {/* Drop shadows for glowing lines */}
              <filter id="shadowRec" height="200%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#3b82f6" floodOpacity="0.3" />
              </filter>
              <filter id="shadowDep" height="200%">
                <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#ef4444" floodOpacity="0.2" />
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" opacity={0.5} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={11} 
              fontWeight={700}
              tickLine={false} 
              axisLine={false} 
              dy={15}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              fontWeight={700}
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            <Area 
              type="natural" 
              name="Recettes" 
              dataKey="recettes" 
              stroke="#3b82f6" 
              strokeWidth={4} 
              fillOpacity={1} 
              fill="url(#colorRec)" 
              style={{ filter: 'url(#shadowRec)' }}
              animationDuration={1500}
            />
            <Area 
              type="natural" 
              name="Dépenses" 
              dataKey="dépenses" 
              stroke="#ef4444" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorDep)" 
              style={{ filter: 'url(#shadowDep)' }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
