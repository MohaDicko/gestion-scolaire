'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Receipt, CreditCard, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatsProps {
  stats: any;
  isLoading: boolean;
}

export function ShadcnStats({ stats, isLoading }: StatsProps) {
  const items = [
    { label: 'Total Élèves', value: stats.studentsCount, icon: Users, color: 'text-blue-500', trend: '+12%', bg: 'bg-blue-500/10' },
    { label: 'Personnel', value: stats.employeesCount, icon: Briefcase, color: 'text-purple-500', trend: 'Stable', bg: 'bg-purple-500/10' },
    { label: 'Chiffre d\'Affaires', value: `${(stats.invoicesTotal || 0).toLocaleString()} F`, icon: Receipt, color: 'text-emerald-500', trend: '+8%', bg: 'bg-emerald-500/10' },
    { label: 'Recouvrement', value: `${(stats.invoicesPaid || 0).toLocaleString()} F`, icon: CreditCard, color: 'text-amber-500', trend: '75%', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="border-none bg-bg-3/50 backdrop-blur-xl shadow-xl hover:bg-bg-3 transition-colors group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-muted group-hover:text-text transition-colors">
                {item.label}
              </CardTitle>
              <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text">
                {isLoading ? '...' : item.value}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-white/5 text-[10px] border-none text-text-dim">
                  {item.trend}
                </Badge>
                <span className="text-[10px] text-text-dim font-medium uppercase tracking-wider">vs mois dernier</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
