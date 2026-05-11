'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, FileText, TrendingUp, AlertCircle, PieChart, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { FinanceChart } from '@/components/dashboard/FinanceChart';

export default function FinanceDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const stats = [
    { label: 'Recouvrement', value: '78%', icon: PieChart, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Factures Impayées', value: '45', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Revenus du mois', value: '12.5M FCFA', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Dépenses', value: '3.2M FCFA', icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <AppLayout
      title="Espace Comptabilité"
      subtitle={`Bienvenue, ${user?.firstName || ''} (Service Financier)`}
      breadcrumbs={[{ label: 'Tableau de Bord Financier' }]}
    >
      <div className="flex flex-col gap-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} variant="glass" className="flex items-center gap-4 p-5">
              <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                <s.icon size={22} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
                <div className="text-xl font-black text-white">{s.value}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts & Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <FinanceChart isLoading={false} />
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-300">Actions Financières</h3>
            <Card variant="glass" className="p-4 flex items-center justify-between hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => router.push('/invoices')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><FileText size={18} /></div>
                <span className="font-semibold text-white">Gestion des Factures</span>
              </div>
              <ChevronRightIcon />
            </Card>
            <Card variant="glass" className="p-4 flex items-center justify-between hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => router.push('/expenses')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><DollarSign size={18} /></div>
                <span className="font-semibold text-white">Journal des Dépenses</span>
              </div>
              <ChevronRightIcon />
            </Card>
            <Card variant="glass" className="p-4 flex items-center justify-between hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => router.push('/reports/finance')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><Download size={18} /></div>
                <span className="font-semibold text-white">Exporter le Bilan</span>
              </div>
              <ChevronRightIcon />
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ChevronRightIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><polyline points="9 18 15 12 9 6"></polyline></svg>;
}
