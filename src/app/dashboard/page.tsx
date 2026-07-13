'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Clock, UserCheck, GraduationCap, BookOpen, ChevronRight, Sun, Moon, CloudSun } from 'lucide-react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';

// Extracted Components
import dynamic from 'next/dynamic';
import { ShadcnStats } from '@/components/dashboard/ShadcnStats';
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid';
import { SystemHealth } from '@/components/shared/SystemHealth';

// Dynamically import heavy components
const FinanceChart = dynamic(() => import('@/components/dashboard/FinanceChart').then(mod => mod.FinanceChart), { ssr: false, loading: () => <div className="h-[280px] w-full animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-3xl m-2" /> });
const ActivityFeed = dynamic(() => import('@/components/dashboard/ActivityFeed').then(mod => mod.ActivityFeed), { loading: () => <div className="h-[200px] w-full animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-3xl m-2" /> });

import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [WeatherIcon, setWeatherIcon] = useState<any>(Sun);
  const [stats, setStats] = useState({
    studentsCount: 0,
    employeesCount: 0,
    invoicesTotal: 0,
    invoicesPaid: 0,
    pendingLeaves: 0,
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bonjour');
      setWeatherIcon(CloudSun);
    } else if (hour < 18) {
      setGreeting('Bon après-midi');
      setWeatherIcon(Sun);
    } else {
      setGreeting('Bonsoir');
      setWeatherIcon(Moon);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      toast.error('Échec du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        switch (u.role) {
          case 'STUDENT': router.push('/student/dashboard'); return;
          case 'TEACHER': router.push('/teacher/dashboard'); return;
          case 'ACCOUNTANT': router.push('/finance/dashboard'); return;
          case 'HR_MANAGER': router.push('/hr/dashboard'); return;
          case 'SUPER_ADMIN': router.push('/admin/schools'); return;
          case 'PARENT': router.push('/parent'); return;
          case 'CENSEUR':
          case 'SURVEILLANT': router.push('/attendance'); return;
        }
      }
    } catch {}
    fetchStats(); 
  }, [fetchStats, router]);

  const secondaryKpis = [
    { label: 'Congés en attente', value: stats.pendingLeaves || 3, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', href: '/hr/leaves' },
    { label: 'Taux de présence', value: '92%', icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', href: '/attendance' },
    { label: 'Classes actives', value: '12', icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10', href: '/classrooms' },
    { label: 'Cours planifiés', value: '48', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10', href: '/timetable' },
  ];

  return (
    <AppLayout
      title={`${greeting}, Ousmane 👋`}
      subtitle="Voici un aperçu en temps réel de votre établissement."
      breadcrumbs={[{ label: 'Tableau de bord' }]}
      actions={
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <WeatherIcon size={18} className="text-amber-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <Button 
            onClick={fetchStats} 
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            <Activity size={16} className="mr-2" />
            Actualiser
          </Button>
        </div>
      }
    >
      <motion.div 
        className="flex flex-col gap-8 pb-10"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
          }
        }}
      >
        
        {/* KPI Grid (Top) */}
        <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
          <ShadcnStats stats={stats} isLoading={isLoading} />
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Chart Section (Spans 8 cols) */}
          <motion.div 
            className="lg:col-span-8 flex flex-col gap-6"
            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
          >
            <FinanceChart isLoading={isLoading} />
            
            {/* Secondary KPIs (Horizontal Scroll on Mobile, Grid on Desktop) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {secondaryKpis.map((kpi, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => router.push(kpi.href)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-slate-100 dark:to-slate-800/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4`}>
                      <kpi.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                      {isLoading ? '...' : kpi.value}
                    </div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>{kpi.label}</span>
                      <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <ActivityFeed />
          </motion.div>

          {/* Right Sidebar Section (Spans 4 cols) */}
          <motion.div 
            className="lg:col-span-4 flex flex-col gap-6"
            variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
          >
            <QuickActionGrid />
            
            {/* Ad / Banner Block (Realistic SaaS touch) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-xl shadow-indigo-500/20">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-black/10 blur-2xl" />
              
              <div className="relative z-10">
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                  Nouveau
                </div>
                <h3 className="text-xl font-black mb-2 leading-tight">Portail Parents Actif</h3>
                <p className="text-sm text-indigo-100 font-medium mb-6">
                  Invitez les parents à consulter les notes et absences de leurs enfants en temps réel via leur portail.
                </p>
                <Button className="w-full bg-white text-indigo-600 hover:bg-slate-50 font-bold rounded-xl shadow-lg">
                  Gérer les accès
                </Button>
              </div>
            </div>

            <SystemHealth />
          </motion.div>
          
        </div>

      </motion.div>
    </AppLayout>
  );
}
