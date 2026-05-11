'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Users, Calendar, CheckSquare, Clock, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';

export default function TeacherDashboardPage() {
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
    { label: 'Mes Classes', value: '4', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Heures de Cours', value: '18h', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Évaluations à corriger', value: '2', icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Prochain Cours', value: '10:00', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  const quickLinks = [
    { title: 'Saisir les Notes', desc: 'Évaluations du T1', icon: BookOpen, path: '/grades' },
    { title: 'Faire l\'Appel', desc: 'Présences du jour', icon: CheckSquare, path: '/attendance' },
    { title: 'Mon Emploi du Temps', desc: 'Planning hebdomadaire', icon: Calendar, path: '/timetable' },
    { title: 'Mes Élèves', desc: 'Liste de mes classes', icon: GraduationCap, path: '/classrooms' },
  ];

  return (
    <AppLayout
      title="Espace Enseignant"
      subtitle={`Bienvenue, Pr. ${user?.lastName || ''}`}
      breadcrumbs={[{ label: 'Mon Tableau de Bord' }]}
    >
      <div className="flex flex-col gap-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <Card key={i} variant="glass" className="flex items-center gap-4 p-5 hover:border-slate-600 transition-colors">
              <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                <s.icon size={22} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
                <div className="text-2xl font-black text-white">{s.value}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <h3 className="text-lg font-bold text-slate-300 mt-4">Accès Rapide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                variant="glass" 
                className="cursor-pointer flex items-start gap-4 p-6 hover:bg-slate-800/50 transition-all border border-slate-700/50 group"
                onClick={() => router.push(link.path)}
              >
                <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-blue-500 group-hover:text-white text-blue-400 transition-colors">
                  <link.icon size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{link.title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{link.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
