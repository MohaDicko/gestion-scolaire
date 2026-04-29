'use client';

import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Clock, CalendarCheck, FileText, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';

export default function HRDashboardPage() {
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
    { label: 'Effectif Total', value: '42', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Absences (Aujourd\'hui)', value: '3', icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Demandes Congés', value: '5', icon: CalendarCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Fiches de Paie (Mois)', value: 'Générées', icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <AppLayout
      title="Espace RH & Paie"
      subtitle={`Bienvenue, ${user?.firstName || ''} (Ressources Humaines)`}
      breadcrumbs={[{ label: 'Tableau de Bord RH' }]}
    >
      <div className="flex flex-col gap-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} variant="glass" className="flex items-center gap-4 p-5 hover:bg-slate-800 transition-colors cursor-default">
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

        {/* Quick Actions */}
        <h3 className="text-lg font-bold text-slate-300 mt-4">Gestion Administrative</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass" className="p-6 hover:border-blue-500/50 cursor-pointer group transition-all" onClick={() => router.push('/employees')}>
            <Briefcase size={28} className="text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold text-white mb-1">Dossiers Employés</h4>
            <p className="text-sm text-slate-400">Gérer les contrats, infos persos et documents.</p>
          </Card>
          
          <Card variant="glass" className="p-6 hover:border-amber-500/50 cursor-pointer group transition-all" onClick={() => router.push('/hr/attendance')}>
            <Clock size={28} className="text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold text-white mb-1">Pointage & Absences</h4>
            <p className="text-sm text-slate-400">Suivi quotidien des présences du personnel.</p>
          </Card>

          <Card variant="glass" className="p-6 hover:border-emerald-500/50 cursor-pointer group transition-all" onClick={() => router.push('/payslips')}>
            <FileText size={28} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
            <h4 className="text-lg font-bold text-white mb-1">Traitement de la Paie</h4>
            <p className="text-sm text-slate-400">Calcul INPS/AMO, génération des fiches de paie.</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
