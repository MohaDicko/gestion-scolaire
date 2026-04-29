'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Users, CreditCard, Activity, ShieldCheck, ArrowRight, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {}
    
    fetchStats();
  }, []);

  const fetchStats = async () => {
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
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  };

  const kpis = stats ? [
    { label: 'Établissements Actifs', value: `${stats.activeSchools} / ${stats.totalSchools}`, icon: Building2, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Élèves (Réseau Global)', value: stats.totalStudents.toLocaleString('fr-FR'), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Comptes Utilisateurs', value: stats.totalUsers.toLocaleString('fr-FR'), icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Volume Financier (MRR)', value: formatCurrency(stats.totalRevenue), icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10' },
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
              <Card key={i} variant="glass" className="h-28 animate-pulse" />
            ))
          ) : (
            kpis.map((kpi, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card variant="glass" className="flex items-center gap-4 p-5 border border-slate-700/50 hover:border-indigo-500/50 transition-colors">
                  <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                    <kpi.icon size={26} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</div>
                    <div className="text-2xl font-black text-white mt-1">{kpi.value}</div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Tenants */}
          <Card variant="glass" className="xl:col-span-2">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="text-blue-400" size={20} />
                Nouveaux Locataires (Tenants)
              </h3>
              <button 
                onClick={() => router.push('/admin/schools')}
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                Gérer <ArrowRight size={16} />
              </button>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Établissement</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Ville</th>
                    <th className="p-4 font-semibold">Date d'inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {isLoading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chargement...</td></tr>
                  ) : stats?.recentSchools.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500">Aucun établissement</td></tr>
                  ) : (
                    stats?.recentSchools.map((school) => (
                      <tr key={school.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 font-bold text-white">{school.name}</td>
                        <td className="p-4 text-slate-300 text-sm">
                          <span className="px-2 py-1 rounded bg-slate-800 text-xs border border-slate-700">{school.type}</span>
                        </td>
                        <td className="p-4 text-slate-300 text-sm">{school.city}</td>
                        <td className="p-4 text-slate-400 text-sm">
                          {new Date(school.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick SaaS Management Actions */}
          <div className="space-y-6">
            <Card variant="glass" className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Server className="text-emerald-400" size={20} />
                Santé du Système
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Base de données (Supabase)</span>
                    <span className="text-emerald-400 font-bold">Connecté</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[15%]" />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">15% de l'espace alloué utilisé</div>
                </div>
                
                <button 
                  onClick={() => router.push('/admin/system-health')}
                  className="w-full py-3 mt-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold text-white transition-colors"
                >
                  Voir les logs détaillés
                </button>
              </div>
            </Card>

            <Card variant="glass" className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
              <h3 className="text-lg font-bold text-white mb-2">Simulations</h3>
              <p className="text-sm text-slate-400 mb-4">Générer du trafic ou des données pour éprouver la plateforme (Stress Test).</p>
              <button 
                onClick={() => router.push('/admin/stress-test')}
                className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
              >
                Lancer un Stress Test
              </button>
            </Card>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
