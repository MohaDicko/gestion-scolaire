'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  GraduationCap, UserCheck, Receipt, Briefcase, Calendar,
  ArrowRight, Search, Plus, CreditCard, FileSpreadsheet,
  FileCheck2, CheckCircle2, AlertCircle, Clock, ChevronRight,
  TrendingUp, Users, Building2, BookOpen, Layers,
  Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, type LucideIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

const FinanceChart = dynamic(
  () => import('@/components/dashboard/FinanceChart').then((mod) => mod.FinanceChart),
  { ssr: false }
);

type WorklistTab = 'all' | 'critical' | 'pending' | 'resolved';

interface DossierItem {
  id: string;
  refCode: string;
  category: 'FINANCE' | 'RH' | 'ACADEMIC' | 'PEDAGOGY';
  title: string;
  concerned: string;
  dueDate: string;
  impact: string;
  status: 'CRITICAL' | 'PENDING' | 'READY' | 'RESOLVED';
  statusLabel: string;
  href: string;
  actionText: string;
  icon: LucideIcon;
}

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Bonjour');
  const [activeTab, setActiveTab] = useState<WorklistTab>('all');
  const [stats, setStats] = useState({
    studentsCount: 131,
    employeesCount: 21,
    invoicesTotal: 14750000,
    invoicesPaid: 12500000,
    pendingLeaves: 3,
    classroomsCount: 3,
    subjectsCount: 116,
    timetableCount: 81,
  });
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; role?: string; schoolName?: string } | null>(null);
  const [school, setSchool] = useState<{
    id?: string;
    name?: string;
    code?: string;
    city?: string;
    type?: string;
    motto?: string;
    gradingScale?: number;
  } | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');

    try {
      const s = localStorage.getItem('auth_user');
      if (s) setUser(JSON.parse(s));
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resStats, resConfig] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/school/config')
      ]);
      if (resStats.ok) {
        const data = await resStats.json();
        setStats((prev) => ({ ...prev, ...data }));
      }
      if (resConfig.ok) {
        const cfg = await resConfig.json();
        if (cfg && (cfg.name || cfg.type)) {
          setSchool(cfg);
        }
      }
    } catch {
      // Données de secours
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

  const isHealth = school?.type === 'SANTE' || (user?.schoolName && /sant|kouchner|esbk/i.test(user.schoolName));
  const schoolDisplayName = school?.name || user?.schoolName || (isHealth ? 'École de Santé Bernard Kouchner (ESBK)' : 'CFP-PAS de Gao');

  // Recouvrement
  const recouvrementRate = stats.invoicesTotal > 0
    ? Math.round((stats.invoicesPaid / stats.invoicesTotal) * 100)
    : 85;
  const resteARecouvrer = Math.max(0, stats.invoicesTotal - stats.invoicesPaid);

  // Dossiers d'arbitrage (Adaptatifs selon Santé vs Général/Agro)
  const healthDossiersList: DossierItem[] = [
    {
      id: 'd1',
      refCode: 'DOS-STG-012',
      category: 'PEDAGOGY',
      title: 'Validation des carnets de stage clinique (MSP)',
      concerned: 'Promotion IDE 1 • Hôpital Point G & Gabriel Touré',
      dueDate: 'Échéance dans 48h',
      impact: '38 carnets cliniques',
      status: 'CRITICAL',
      statusLabel: 'Visa Requis',
      href: '/attendance',
      actionText: 'Valider',
      icon: UserCheck,
    },
    {
      id: 'd2',
      refCode: 'DOS-FAC-044',
      category: 'FINANCE',
      title: 'Échéances de scolarité & matériel de soins',
      concerned: '14 étudiantes • Filière Sages-Femmes (SF)',
      dueDate: 'Échu depuis 3 jours',
      impact: '1 250 000 FCFA',
      status: 'PENDING',
      statusLabel: 'En attente',
      href: '/invoices',
      actionText: 'Relancer',
      icon: Receipt,
    },
    {
      id: 'd3',
      refCode: 'DOS-RH-009',
      category: 'RH',
      title: 'Demande d\'absence pour garde médicale',
      concerned: 'Dr. Coulibaly — Médecin Formateur',
      dueDate: 'Période : 25 au 27 Oct.',
      impact: 'Garde Hôpital de Kati',
      status: 'PENDING',
      statusLabel: 'À arbitrer',
      href: '/hr/leaves',
      actionText: 'Examiner',
      icon: Clock,
    },
    {
      id: 'd4',
      refCode: 'DOS-EXAM-S1',
      category: 'ACADEMIC',
      title: 'Clôture des notes de partiels du Semestre 1',
      concerned: 'Filière Laboratoire & Biologie Médicale',
      dueDate: 'Délibération imminente',
      impact: 'Barème /20 • Note éliminatoire <10',
      status: 'READY',
      statusLabel: 'Prêt',
      href: '/grades',
      actionText: 'Vérifier',
      icon: FileCheck2,
    },
  ];

  const agroDossiersList: DossierItem[] = [
    {
      id: 'd1',
      refCode: 'DOS-FAC-042',
      category: 'FINANCE',
      title: 'Échéance de scolarité 1er trimestre non soldée',
      concerned: '12 apprenants • 1ère Année TE',
      dueDate: 'Échu depuis 5 jours',
      impact: '900 000 FCFA',
      status: 'CRITICAL',
      statusLabel: 'Impayé',
      href: '/invoices',
      actionText: 'Relancer',
      icon: Receipt,
    },
    {
      id: 'd2',
      refCode: 'DOS-RH-003',
      category: 'RH',
      title: 'Demande d\'autorisation d\'absence formateur',
      concerned: 'M. Diallo — Formateur Électromécanique',
      dueDate: 'Période : 24 au 27 Oct.',
      impact: '3 jours ouvrés',
      status: 'PENDING',
      statusLabel: 'À valider',
      href: '/hr/leaves',
      actionText: 'Valider',
      icon: Clock,
    },
    {
      id: 'd3',
      refCode: 'DOS-PED-T1',
      category: 'ACADEMIC',
      title: 'Validation des bulletins du 1er Trimestre',
      concerned: 'Filière Élevage Agro-pastoral (2ème EA)',
      dueDate: 'Clôture dans 48h',
      impact: '42 bulletins prêts',
      status: 'READY',
      statusLabel: 'Prêt signature',
      href: '/reports/bulletins',
      actionText: 'Signer',
      icon: FileCheck2,
    },
    {
      id: 'd4',
      refCode: 'DOS-PAY-NOV',
      category: 'RH',
      title: 'Clôture de la pré-paie des formateurs vacataires',
      concerned: '21 vacataires • CFP-PAS de Gao',
      dueDate: 'Échéance fin de mois',
      impact: '2 850 000 FCFA estimé',
      status: 'PENDING',
      statusLabel: 'En contrôle',
      href: '/payslips',
      actionText: 'Contrôler',
      icon: Briefcase,
    },
  ];

  const dossiersList = isHealth ? healthDossiersList : agroDossiersList;

  const filteredDossiers = dossiersList.filter((item) => {
    if (activeTab === 'critical') return item.status === 'CRITICAL';
    if (activeTab === 'pending') return item.status === 'PENDING';
    if (activeTab === 'resolved') return item.status === 'READY' || item.status === 'RESOLVED';
    return true;
  });

  const currentDateFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <AppLayout
      title="Tableau de bord"
      subtitle={`${greeting}${user?.firstName ? `, ${user.firstName}` : ''} • ${schoolDisplayName} — ${currentDateFormatted}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/finance/payments')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <Wallet size={14} className="text-slate-500" />
            <span>Encaisser</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/students/enroll')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Nouvel élève</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">

        {/* ── 1. METRICS ESSENTIELLES (4 CARTES PROPRES & CALMES) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Carte 1: Effectif */}
          <div
            onClick={() => router.push('/students')}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isHealth ? 'Étudiants en Santé' : 'Élèves inscrits'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <GraduationCap size={18} strokeWidth={2} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                {isLoading ? '...' : (stats.studentsCount || 131)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>{isHealth ? 'Promotions IDE, SF, TLB' : '3 filières actives'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+12% vs N-1</span>
              </div>
            </div>
          </div>

          {/* Carte 2: Présences du jour */}
          <div
            onClick={() => router.push('/attendance')}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Présence aujourd'hui
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck size={18} strokeWidth={2} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                94.2%
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Appel effectué</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">4 absents à justifier</span>
              </div>
            </div>
          </div>

          {/* Carte 3: Recouvrement */}
          <div
            onClick={() => router.push('/invoices')}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Recouvrement scolarités
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Receipt size={18} strokeWidth={2} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {recouvrementRate}%
                </span>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {(stats.invoicesPaid / 1000000).toFixed(1)}M / {(stats.invoicesTotal / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Reste à recouvrer</span>
                <span className="text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
                  {(resteARecouvrer / 1000).toLocaleString('fr-FR')} k FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Carte 4: Formateurs & Enseignants */}
          <div
            onClick={() => router.push('/employees')}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isHealth ? 'Médecins & Formateurs' : 'Personnel & Formateurs'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Briefcase size={18} strokeWidth={2} />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight tabular-nums">
                {isLoading ? '...' : (stats.employeesCount || 21)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>81 créneaux / semaine</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">Actifs</span>
              </div>
            </div>
          </div>

        </div>

        {/* ── 3. RACCOURCIS RAPIDES OPÉRATIONNELS (Clean, Compact, Utile) ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Opérations fréquentes
            </h2>
            <span className="text-xs text-slate-400">Accès direct</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Inscrire un élève', hint: 'Admission & dossier', href: '/students/enroll', icon: GraduationCap },
              { label: 'Encaisser reçu', hint: 'Paiement scolarité', href: '/finance/payments', icon: CreditCard },
              { label: 'Faire l\'appel', hint: 'Présences du jour', href: '/attendance', icon: UserCheck },
              { label: 'Saisir les notes', hint: 'Évaluations semestrielles', href: '/grades', icon: FileSpreadsheet },
              { label: 'Emploi du temps', hint: 'Planning & salles', href: '/timetable', icon: Calendar },
              { label: 'Imprimer bulletins', hint: 'Relevés officiels', href: '/reports/bulletins', icon: FileCheck2 },
            ].map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => router.push(action.href)}
                  className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-left hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors shadow-2xs group cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 transition-colors">
                      <ActionIcon size={16} strokeWidth={2} />
                    </span>
                    <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {action.label}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {action.hint}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 4. GRILLE PRINCIPALE (2 TIERS GAUCHE / 1 TIERS DROITE) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* COLONNE GAUCHE (2 Tiers) : TABLEAU DES DOSSIERS & GRAPHIQUE FINANCIER */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Tableau des Dossiers Prioritaires */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Dossiers prioritaires à traiter
                    </h2>
                    <span className="px-2 py-0.2 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {dossiersList.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Régularisations financières, assiduité et validations en attente
                  </p>
                </div>

                {/* Filtres simples */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs self-start sm:self-auto font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Tous ({dossiersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('critical')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'critical'
                        ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Urgents
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'pending'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    En attente
                  </button>
                </div>
              </div>

              {/* Tableau lisible et dense */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Réf.</th>
                      <th className="py-3 px-4">Objet</th>
                      <th className="py-3 px-4">Personne / Promotion</th>
                      <th className="py-3 px-4">Montant / Volume</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDossiers.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {item.refCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.dueDate}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {item.concerned}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white tabular-nums">
                          {item.impact}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900'
                                : item.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === 'CRITICAL'
                                  ? 'bg-rose-500'
                                  : item.status === 'PENDING'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            {item.statusLabel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => router.push(item.href)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <span>{item.actionText}</span>
                            <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Dossiers nécessitant un arbitrage de la direction</span>
                <button
                  type="button"
                  onClick={() => router.push('/invoices')}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Voir tous les dossiers
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>

            {/* Graphique de Trésorerie */}
            <FinanceChart isLoading={isLoading} />

          </div>

          {/* COLONNE DROITE (1 Tiers) : AUJOURD'HUI & FILIÈRES */}
          <div className="flex flex-col gap-6">

            {/* Widget 1: Aujourd'hui à l'établissement */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Planning du jour
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Activités & cours en cours</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/timetable')}
                  className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  Voir planning
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="w-1.5 h-10 rounded-full bg-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {isHealth ? 'Soins Infirmiers Fondamentaux' : 'Électromécanique & Maintenance'}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                        08:00 - 10:00
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {isHealth ? 'Salle 2 • Promotion IDE 1' : 'Atelier 1 • 1ère Année TE'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="w-1.5 h-10 rounded-full bg-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {isHealth ? 'Obstétrique & Santé Maternelle' : 'Agro-pastoral & Élevage'}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        10:15 - 12:15
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {isHealth ? 'Amphi B • Promotion SF 1' : 'Salle 4 • 2ème Année EA'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="w-1.5 h-10 rounded-full bg-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {isHealth ? 'Biologie & Hématologie Clinique' : 'Gestion d\'Exploitation & Normes'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                        14:30 - 16:30
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {isHealth ? 'Laboratoire • TLB 1' : 'Salle 1 • Filière EA'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget 2: Recouvrement par filière */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Recouvrement par filière
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Progression des paiements</p>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {recouvrementRate}% global
                </span>
              </div>

              <div className="space-y-4">
                {(isHealth ? [
                  { name: "Infirmiers Diplômés d'État (IDE)", current: 38, total: 45, pct: 84 },
                  { name: "Sages-Femmes d'État (SF)", current: 30, total: 35, pct: 86 },
                  { name: "Techniciens de Laboratoire (TLB)", current: 24, total: 30, pct: 80 },
                ] : [
                  { name: 'Transformation Agro (TE 1)', current: 48, total: 52, pct: 92 },
                  { name: 'Élevage & Agri (EA 1)', current: 37, total: 44, pct: 84 },
                  { name: 'Spécialisation Élevage (EA 2)', current: 28, total: 35, pct: 79 },
                ]).map((row, idx) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {row.name}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {row.pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{row.current} soldés sur {row.total}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {row.total - row.current} relances
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total encaissé</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  12 500 000 FCFA
                </span>
              </div>
            </div>

            {/* Widget 3: Synthèse & Modules d'administration */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Modules de gestion
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => router.push('/classrooms')}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <Building2 size={16} className="text-slate-600 dark:text-slate-400 mb-1" />
                  <span className="block font-semibold text-slate-900 dark:text-white">Classes & Salles</span>
                  <span className="text-[10px] text-slate-400">{stats.classroomsCount} divisions</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/library')}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <BookOpen size={16} className="text-slate-600 dark:text-slate-400 mb-1" />
                  <span className="block font-semibold text-slate-900 dark:text-white">Bibliothèque</span>
                  <span className="text-[10px] text-slate-400">Ouvrages & prêts</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/payslips')}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <Receipt size={16} className="text-slate-600 dark:text-slate-400 mb-1" />
                  <span className="block font-semibold text-slate-900 dark:text-white">Fiches de Paie</span>
                  <span className="text-[10px] text-slate-400">Vacations & RH</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/inventory')}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <Layers size={16} className="text-slate-600 dark:text-slate-400 mb-1" />
                  <span className="block font-semibold text-slate-900 dark:text-white">Matériel</span>
                  <span className="text-[10px] text-slate-400">Inventaire école</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </AppLayout>
  );
}
