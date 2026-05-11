'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Clock, UserCheck, GraduationCap, BookOpen, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Extracted Components
import { ShadcnStats } from '@/components/dashboard/ShadcnStats';
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { FinanceChart } from '@/components/dashboard/FinanceChart';
import { SystemHealth } from '@/components/shared/SystemHealth';

import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    studentsCount: 0,
    employeesCount: 0,
    invoicesTotal: 0,
    invoicesPaid: 0,
    pendingLeaves: 0,
  });

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
          case 'STUDENT':
            router.push('/student/dashboard');
            return;
          case 'TEACHER':
            router.push('/teacher/dashboard');
            return;
          case 'ACCOUNTANT':
            router.push('/finance/dashboard');
            return;
          case 'HR_MANAGER':
            router.push('/hr/dashboard');
            return;
          case 'SUPER_ADMIN':
            router.push('/admin/schools');
            return;
          case 'PARENT':
            router.push('/parent/dashboard');
            return;
          case 'CENSEUR':
          case 'SURVEILLANT':
            router.push('/attendance');
            return;
          // SCHOOL_ADMIN and others stay on /dashboard
        }
      }
    } catch {}
    fetchStats(); 
  }, [fetchStats, router]);

  const secondaryKpis = [
    { label: 'Congés en attente', value: stats.pendingLeaves || 3, icon: Clock, color: 'text-amber-500', href: '/hr/leaves' },
    { label: 'Taux de présence', value: '92%', icon: UserCheck, color: 'text-emerald-500', href: '/attendance' },
    { label: 'Classes actives', value: '12', icon: GraduationCap, color: 'text-blue-500', href: '/classrooms' },
    { label: 'Cours planifiés', value: '48', icon: BookOpen, color: 'text-purple-500', href: '/timetable' },
  ];

  return (
    <AppLayout
      title="Vue Stratégique"
      subtitle={`Tableau de bord exécutif — ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      breadcrumbs={[{ label: 'Dashboard' }]}
      actions={
        <Button variant="ghost" size="sm" onClick={fetchStats}>
          <Activity size={15} className="mr-2" />
          Actualiser
        </Button>
      }
    >
      <motion.div 
        className="flex flex-col gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        
        {/* KPI Grid */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <ShadcnStats stats={stats} isLoading={isLoading} />
        </motion.div>

        {/* Secondary Indicators */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        >
          {secondaryKpis.map((kpi, i) => (
            <Card
              key={i}
              variant="glass"
              className="group cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-[0.98]"
              onClick={() => router.push(kpi.href)}
              noPadding
            >
              <div className="flex items-center gap-4 p-4">
                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${kpi.color}`}>
                  <kpi.icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {isLoading ? '...' : kpi.value}
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Card>
          ))}
        </motion.div>

        {/* Charts & Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div 
            className="xl:col-span-2 space-y-6"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
             <FinanceChart isLoading={isLoading} />
             <ActivityFeed />
          </motion.div>
          
          <motion.div 
            className="xl:col-span-1 space-y-6"
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          >
             <QuickActionGrid />
             <SystemHealth />
          </motion.div>
        </div>

      </motion.div>
    </AppLayout>
  );
}
