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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-md">
        <p className="text-[11px] font-semibold mb-2 text-slate-500 dark:text-slate-400">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 mb-1 last:mb-0 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-xs" style={{ backgroundColor: p.color }} />
              <span className="text-slate-600 dark:text-slate-300 font-medium">{p.name}</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {(p.value / 1000000).toFixed(2)}M FCFA
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Flux de Trésorerie</h2>
            <span className="text-xs text-slate-400 font-normal">• Recettes vs Dépenses</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Évolution mensuelle des encaissements et décaissements</p>
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Recettes (+18%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-400 dark:bg-slate-600" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Dépenses</span>
          </div>
        </div>
      </div>
      
      <div className="h-[280px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#64748b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
            
            <Area 
              type="monotone" 
              name="Recettes" 
              dataKey="recettes" 
              stroke="#2563eb" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorRec)" 
            />
            <Area 
              type="monotone" 
              name="Dépenses" 
              dataKey="dépenses" 
              stroke="#64748b" 
              strokeWidth={1.5} 
              strokeDasharray="4 4"
              fillOpacity={1} 
              fill="url(#colorDep)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
