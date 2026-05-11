'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-black mb-2 text-slate-500 uppercase tracking-widest">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[11px] font-bold text-slate-400">{p.name}:</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">{(p.value / 1000000).toFixed(2)}M XOF</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function FinanceChart({ isLoading }: { isLoading: boolean }) {
  return (
    <Card variant="glass" noPadding className="overflow-hidden">
      <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <TrendingUp size={18} />
          </div>
          <CardTitle className="text-base uppercase tracking-tight">Flux de Trésorerie</CardTitle>
        </div>
        
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-1 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Recettes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-1 rounded-full bg-red-500 opacity-60" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Dépenses</span>
          </div>
        </div>
      </CardHeader>
      
      <div className="h-[280px] w-full p-2 pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={REVENUE_DATA} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              fontSize={10} 
              fontWeight={700}
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={10} 
              fontWeight={700}
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              name="Recettes" 
              dataKey="recettes" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorRec)" 
            />
            <Area 
              type="monotone" 
              name="Dépenses" 
              dataKey="dépenses" 
              stroke="#f43f5e" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              fillOpacity={1} 
              fill="url(#colorDep)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
