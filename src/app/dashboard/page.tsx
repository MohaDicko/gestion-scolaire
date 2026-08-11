'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Activity, Clock, UserCheck, GraduationCap, BookOpen, 
  ChevronRight, Sun, Moon, CloudSun, AlertCircle, 
  CheckCircle2, Plus, Receipt, FileText, ArrowRight, Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
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
      // toast.error('Échec du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Actions métier rapides
  const quickActions = [
    { label: "Nouvelle Inscription", icon: Plus, desc: "Ajouter un élève", color: "bg-indigo-500", href: "/students/enroll" },
    { label: "Encaisser un paiement", icon: Wallet, desc: "Frais de scolarité", color: "bg-emerald-500", href: "/finance/payments" },
    { label: "Saisie des notes", icon: FileText, desc: "Trimestre en cours", color: "bg-purple-500", href: "/grades" },
    { label: "Faire l'appel", icon: UserCheck, desc: "Présences du jour", color: "bg-amber-500", href: "/attendance" },
  ];

  // Tâches en attente (Logique métier pure)
  const pendingTasks = [
    { id: 1, type: 'finance', title: '12 factures échues', desc: 'Frais de scolarité non réglés (Novembre)', priority: 'high', action: 'Relancer' },
    { id: 2, type: 'hr', title: '3 demandes de congé', desc: 'Professeurs absents pour la semaine prochaine', priority: 'medium', action: 'Examiner' },
    { id: 3, type: 'academic', title: 'Validation des bulletins', desc: 'Bulletins du 1er trimestre prêts pour signature', priority: 'medium', action: 'Valider' },
  ];

  return (
    <AppLayout
      title={`${greeting} 👋`}
      subtitle="Que souhaitez-vous faire aujourd'hui ?"
      breadcrumbs={[{ label: 'Espace de Travail' }]}
      actions={
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <WeatherIcon size={18} className="text-amber-500" />
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      }
    >
      <motion.div 
        className="flex flex-col gap-8 pb-10 max-w-6xl mx-auto"
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
        
        {/* ── Section : Raccourcis Métier ── */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
          <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-indigo-500" />
            Actions Rapides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <div
                key={idx}
                onClick={() => router.push(action.href)}
                className="group cursor-pointer bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${action.color}/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-12 h-12 rounded-xl ${action.color} text-white flex items-center justify-center mb-4 shadow-lg shadow-${action.color}/30`}>
                  <action.icon size={24} />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {action.label}
                </h3>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {action.desc}
                </p>
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={20} className="text-indigo-500" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          
          {/* ── Section : Actions Requises (To-Do) ── */}
          <motion.div className="lg:col-span-2 flex flex-col gap-4" variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              Tâches en attente
            </h2>
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-2 shadow-sm">
              {pendingTasks.map((task, idx) => (
                <div key={task.id} className={`flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 sm:p-5 ${idx !== pendingTasks.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/60' : ''} hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`} />
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white text-base leading-snug">{task.title}</h4>
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{task.desc}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="shrink-0 w-full sm:w-auto font-bold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 border-zinc-200 dark:border-zinc-700">
                    {task.action}
                  </Button>
                </div>
              ))}
              <div className="p-4 text-center">
                <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Voir toutes les tâches (12)
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Section : État Rapide ── */}
          <motion.div className="flex flex-col gap-4" variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              État de la journée
            </h2>
            
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex flex-col gap-6">
                <div>
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Présence Élèves</div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">94%</span>
                    <span className="text-sm font-medium text-emerald-400 mb-1">+2% vs hier</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>

                <div className="h-px w-full bg-white/10" />

                <div>
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Recouvrement</div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">12.5M</span>
                    <span className="text-sm font-medium text-indigo-200 mb-1">FCFA</span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-2 font-medium">85% des frais du mois réglés</p>
                </div>
              </div>
            </div>

            {/* Aide rapide */}
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-5 mt-2">
              <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Besoin d'aide ?</h4>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 font-medium mb-4 leading-relaxed">
                Notre nouvel assistant IA peut vous aider à générer des rapports ou trouver un élève instantanément.
              </p>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
                Ouvrir l'Assistant
              </Button>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </AppLayout>
  );
}
