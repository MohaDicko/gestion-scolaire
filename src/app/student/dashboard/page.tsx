'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, CalendarCheck, Award, Receipt, Bell, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const kpis = [
    { label: 'Emploi du Temps', value: 'Voir', icon: CalendarCheck, color: 'text-blue-500', href: '/timetable' },
    { label: 'Mes Notes', value: 'Bulletins', icon: Award, color: 'text-emerald-500', href: '/reports/bulletins' },
    { label: 'Factures & Frais', value: 'Paiements', icon: Receipt, color: 'text-amber-500', href: '/invoices' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  } as const;

  return (
    <AppLayout
      title="Mon Espace Élève"
      subtitle={`Bienvenue, ${user?.firstName || 'Élève'} ${user?.lastName || ''}`}
      breadcrumbs={[{ label: 'Mon Espace' }]}
    >
      <motion.div 
        className="flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpis.map((kpi, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card
                variant="glass"
                className="group cursor-pointer relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                style={{ 
                  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
                onClick={() => router.push(kpi.href)}
                noPadding
              >
                {/* Subtle glow */}
                <div className={`absolute -right-8 -top-8 w-32 h-32 ${kpi.color.replace('text-', 'bg-').replace('-500', '-500/20')} rounded-full blur-3xl group-hover:bg-opacity-30 transition-all duration-500`}></div>

                <div className="flex items-center gap-5 p-6 relative z-10">
                  <div className={`p-3.5 rounded-2xl bg-slate-800 shadow-inner border border-slate-700/50 ${kpi.color}`}>
                    <kpi.icon size={26} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                    <div className="text-2xl font-black mt-1 text-white flex items-center justify-between">
                      <span>{kpi.value}</span>
                      <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemVariants}>
          <Card title="Avis & Communications" variant="glass" className="border border-white/5 bg-slate-900/50">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                <Bell size={24} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Aucun nouvel avis</h3>
              <p className="text-slate-400 text-sm max-w-md">Vous n'avez pas de nouveaux messages de l'administration pour le moment.</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
