'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Users, CreditCard, Activity, ShieldCheck, ArrowRight, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

interface AdminStats {
  totalSchools: number;
  activeSchools: number;
  totalStudents: number;
  totalEmployees: number;
  totalUsers: number;
  totalRevenue: number;
  recentSchools: any[];
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error('Erreur lors du chargement des statistiques SaaS.');
      }
    } catch (e) {
      toast.error('Erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
    
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  const kpis = stats ? [
    { label: 'Établissements Actifs', value: `${stats.activeSchools} / ${stats.totalSchools}`, icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Élèves (Réseau Global)', value: stats.totalStudents.toLocaleString('fr-FR'), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Comptes Utilisateurs', value: stats.totalUsers.toLocaleString('fr-FR'), icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Volume Financier (MRR)', value: formatCurrency(stats.totalRevenue), icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ] : [];

  return (
    <AppLayout
      title="SaaS Global Control Center"
      subtitle={`Super Administrateur : ${user?.firstName || ''} ${user?.lastName || ''}`}
      breadcrumbs={[{ label: 'Dashboard Global' }]}
    >
      <div className="flex flex-col gap-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ))
          ) : (
            kpis.map((kpi, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm transition-transform flex items-center gap-4"
              >
                <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color} shrink-0`}>
                  <kpi.icon size={28} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{kpi.label}</div>
                  <div className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{kpi.value}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Tenants */}
          <div className="xl:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Building2 className="text-indigo-500" size={20} />
                Nouveaux Locataires (Tenants)
              </h3>
              <button 
                onClick={() => router.push('/admin/schools')}
                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                Gérer <ArrowRight size={16} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Établissement</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Ville</th>
                    <th className="px-6 py-4">Date d'inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-zinc-400 font-medium">Chargement des données...</td></tr>
                  ) : stats?.recentSchools.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-zinc-400 font-medium">Aucun établissement enregistré.</td></tr>
                  ) : (
                    stats?.recentSchools.map((school) => (
                      <tr key={school.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">{school.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                            {school.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-600 dark:text-zinc-400 text-sm">{school.city}</td>
                        <td className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-500 text-sm">
                          {new Date(school.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick SaaS Management Actions */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px] -z-0" />
              <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                <Server className="text-emerald-500" size={20} />
                Santé du Système
              </h3>
              <div className="space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-zinc-600 dark:text-zinc-400">Base de données</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">Connecté</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '15%' }}
                      transition={{ duration: 1 }}
                      className="h-full bg-emerald-500 rounded-full" 
                    />
                  </div>
                  <div className="text-[11px] font-bold text-zinc-400 mt-2">15% de l'espace alloué utilisé</div>
                </div>
                
                <button 
                  onClick={() => router.push('/admin/system-health')}
                  className="w-full py-3 mt-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Ouvrir l'Analyseur
                </button>
              </div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full -z-0" />
              <h3 className="text-lg font-black text-indigo-700 dark:text-indigo-400 mb-2 relative z-10">Simulations de Charge</h3>
              <p className="text-sm font-medium text-indigo-900/70 dark:text-indigo-200/70 mb-5 relative z-10">
                Générer du trafic artificiel ou des données factices pour éprouver la résilience de la plateforme.
              </p>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/admin/stress-test')}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors relative z-10"
              >
                Lancer un Stress Test
              </motion.button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
