'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity, Clock, UserCheck, GraduationCap, BookOpen,
  ChevronRight, AlertCircle, CheckCircle2, Plus, Receipt,
  FileText, ArrowRight, Wallet, TrendingUp, Users, BookMarked,
  Coins, BarChart3, Calendar, Award, Zap, Shield, Search,
  CheckCircle, ArrowUpRight, ArrowDownRight, Filter, AlertTriangle,
  Building2, School, Landmark, Sparkles, FolderCheck, CreditCard,
  CalendarCheck2, Briefcase, FileSpreadsheet, FileCheck2,
  ReceiptText, AlertOctagon, Scale, BadgePercent, Clock4,
  UserPlus, Layers, CheckCheck, IdCard, type LucideIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const FinanceChart = dynamic(
  () => import('@/components/dashboard/FinanceChart').then((mod) => mod.FinanceChart),
  { ssr: false }
);

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
};
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

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
  const [user, setUser] = useState<{ firstName?: string; role?: string } | null>(null);

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
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // Données de référence
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

  // Recouvrement
  const recouvrementRate = stats.invoicesTotal > 0
    ? Math.round((stats.invoicesPaid / stats.invoicesTotal) * 100)
    : 85;
  const resteARecouvrer = Math.max(0, stats.invoicesTotal - stats.invoicesPaid);

  // Tuiles Numériques SAP Fiori Horizon (Launchpad KPI Tiles enrichies)
  const fioriTiles = [
    {
      category: 'Scolarité • Effectifs',
      title: 'Apprenants Inscrits',
      value: stats.studentsCount || 131,
      unit: 'inscrits',
      trend: '+12% vs N-1',
      trendPositive: true,
      subtext: '3 filières actives (TE, EA1, EA2)',
      href: '/students',
      icon: GraduationCap,
      accentColor: '#1d4ed8',
      gradient: 'from-blue-600 to-indigo-600',
      iconGradient: 'from-blue-500 to-indigo-600',
      progress: 88,
      statusLabel: 'Conforme',
      statusType: 'success' as const,
    },
    {
      category: 'Recouvrement & Primes',
      title: 'Taux d\'Encaissement',
      value: `${recouvrementRate}%`,
      unit: `${(stats.invoicesPaid / 1000000).toFixed(1)}M FCFA`,
      trend: `${(resteARecouvrer / 1000).toLocaleString('fr-FR')} k F restants`,
      trendPositive: recouvrementRate >= 80,
      subtext: '12 dossiers d\'impayés à relancer',
      href: '/invoices',
      icon: BadgePercent,
      accentColor: '#059669',
      gradient: 'from-emerald-600 to-teal-600',
      iconGradient: 'from-emerald-500 to-teal-600',
      progress: recouvrementRate,
      statusLabel: recouvrementRate >= 80 ? 'Objectif Atteint' : 'Sous Vigilance',
      statusType: recouvrementRate >= 80 ? 'success' as const : 'warning' as const,
    },
    {
      category: 'Assiduité & Registre',
      title: 'Présence Quotidienne',
      value: '94.2%',
      unit: 'taux du jour',
      trend: '+2.1% cette semaine',
      trendPositive: true,
      subtext: '4 absences non justifiées à Gao',
      href: '/attendance',
      icon: CalendarCheck2,
      accentColor: '#0284c7',
      gradient: 'from-cyan-600 to-blue-600',
      iconGradient: 'from-cyan-500 to-sky-600',
      progress: 94,
      statusLabel: 'Régulier',
      statusType: 'info' as const,
    },
    {
      category: 'Personnel & Vacations',
      title: 'Corps Formateurs',
      value: stats.employeesCount || 21,
      unit: 'vacataires & perm.',
      trend: '1 750 FCFA/h conv.',
      trendPositive: true,
      subtext: `${stats.pendingLeaves || 3} demandes de congé à valider`,
      href: '/employees',
      icon: Briefcase,
      accentColor: '#7c3aed',
      gradient: 'from-violet-600 to-purple-600',
      iconGradient: 'from-violet-500 to-purple-600',
      progress: 75,
      statusLabel: '3 En Attente',
      statusType: 'warning' as const,
    },
    {
      category: 'Ingénierie Pédagogique',
      title: 'Référentiel APC',
      value: stats.subjectsCount || 116,
      unit: 'modules agréés',
      trend: '81 créneaux / sem.',
      trendPositive: true,
      subtext: 'Grille horaire 100% planifiée',
      href: '/classrooms',
      icon: Layers,
      accentColor: '#d97706',
      gradient: 'from-amber-500 to-orange-600',
      iconGradient: 'from-amber-500 to-yellow-600',
      progress: 100,
      statusLabel: 'Planifié',
      statusType: 'neutral' as const,
    },
  ];

  // Dossiers d'arbitrage institutionnel (Claims & Underwriting Worklist)
  const dossiersList: DossierItem[] = [
    {
      id: 'd1',
      refCode: 'DOS-FAC-2026-042',
      category: 'FINANCE',
      title: 'Échéance de Scolarité Non Soldée',
      concerned: '12 apprenants • 1ère Année TE',
      dueDate: 'Échu depuis 5 jours',
      impact: '900 000 FCFA',
      status: 'CRITICAL',
      statusLabel: 'Impayé / À relancer',
      href: '/invoices',
      actionText: 'Émettre Relances',
      icon: AlertOctagon,
    },
    {
      id: 'd2',
      refCode: 'DOS-RH-CONG-003',
      category: 'RH',
      title: 'Demande d\'Autorisation d\'Absence',
      concerned: 'M. Diallo — Formateur Électromécanique',
      dueDate: 'Période : 24 au 27 Oct.',
      impact: '3 jours ouvrés',
      status: 'PENDING',
      statusLabel: 'À valider',
      href: '/hr/leaves',
      actionText: 'Arbitrer la demande',
      icon: Clock4,
    },
    {
      id: 'd3',
      refCode: 'DOS-PED-BUL-T1',
      category: 'ACADEMIC',
      title: 'Validation des Bulletins 1er Trimestre',
      concerned: 'Filière Élevage Agro-pastoral (2ème EA)',
      dueDate: 'Clôture dans 48h',
      impact: '42 bulletins prêts',
      status: 'READY',
      statusLabel: 'Prêt pour Signature',
      href: '/reports/bulletins',
      actionText: 'Valider & Signer',
      icon: FileCheck2,
    },
    {
      id: 'd4',
      refCode: 'DOS-PAY-NOV-2025',
      category: 'RH',
      title: 'Clôture de la Pré-Paie Formateurs',
      concerned: '21 vacataires • CFP-PAS de Gao',
      dueDate: 'Échéance 30 du mois',
      impact: '2 850 000 FCFA estimé',
      status: 'PENDING',
      statusLabel: 'En Contrôle',
      href: '/payslips',
      actionText: 'Vérifier Émargements',
      icon: ReceiptText,
    },
  ];

  const filteredDossiers = dossiersList.filter((item) => {
    if (activeTab === 'critical') return item.status === 'CRITICAL';
    if (activeTab === 'pending') return item.status === 'PENDING';
    if (activeTab === 'resolved') return item.status === 'READY' || item.status === 'RESOLVED';
    return true;
  });

  // Services Métiers Fiori (Actions Directes de Traitement)
  const fioriServices = [
    {
      id: 'enroll',
      title: 'Nouvelle Admission',
      desc: 'Enregistrement de dossier apprenant & pièces',
      code: 'ADM-01',
      href: '/students/enroll',
      icon: UserPlus,
      color: '#0070F2',
    },
    {
      id: 'payments',
      title: 'Encaissement Guichet',
      desc: 'Émission de quittance & lettrage comptable',
      code: 'ENC-02',
      href: '/finance/payments',
      icon: CreditCard,
      color: '#107E3E',
    },
    {
      id: 'attendance',
      title: 'Registre d\'Appel',
      desc: 'Contrôle des présences & retards par classe',
      code: 'APP-03',
      href: '/attendance',
      icon: CalendarCheck2,
      color: '#0284c7',
    },
    {
      id: 'grades',
      title: 'Saisie des Évaluations',
      desc: 'Notes semestrielles & compétences APC',
      code: 'NOT-04',
      href: '/grades',
      icon: FileSpreadsheet,
      color: '#5c35cc',
    },
    {
      id: 'bulletins',
      title: 'Bulletins & Certificats',
      desc: 'Génération certifiée & relevés officiels',
      code: 'DOC-05',
      href: '/reports/bulletins',
      icon: FileCheck2,
      color: '#b00',
    },
    {
      id: 'expenses',
      title: 'Ordres de Dépense',
      desc: 'Décaissements, pièces justificatives & caisse',
      code: 'DEP-06',
      href: '/expenses',
      icon: ReceiptText,
      color: '#c55305',
    },
  ];

  return (
    <AppLayout
      actions={
        <div className="flex items-center gap-2 font-['72',var(--font-fiori),sans-serif]">
          {/* Badge Système Opérationnel */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>SAP Service Layer Actif</span>
          </div>

          {/* Horodatage officiel */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold">
            <Calendar size={13} strokeWidth={1.75} className="text-[#0070F2] dark:text-blue-400" />
            <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      }
    >
      <motion.div
        className="flex flex-col gap-6 font-['72',var(--font-fiori),sans-serif]"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >

        {/* ── 1. CONTEXT BANNER INSTITUTIONNEL & ÉTAT (Deep Sapphire & Gold Prestige) ── */}
        <motion.section
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0A2558] to-[#123668] text-white p-5 sm:p-6 shadow-xl shadow-blue-950/20 border border-blue-900/40"
        >
          {/* Liseré Tricolore National de la République du Mali */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#14B866] via-[#FCD116] to-[#CE1126]" />

          {/* Sphères d'ambiance lumineuse discrète */}
          <div className="pointer-events-none absolute -right-8 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute right-48 -top-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                <Landmark size={26} strokeWidth={2.2} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    CFP-PAS de Gao
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                    Exercice 2025 - 2026
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    Référentiel APC Homologué
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-100/80 font-medium">
                  {greeting}{user?.firstName ? `, ${user.firstName}` : ''} • Plateforme Nationale de Gestion & de Pilotage de l'Établissement
                </p>
              </div>
            </div>

            {/* Context Data Points en Verre Dépoli */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="flex flex-col px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/70">Territoire</span>
                <span className="font-bold text-white text-xs mt-0.5">Gao (Région VII)</span>
              </div>
              <div className="flex flex-col px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/70">Rôle Opérateur</span>
                <span className="font-bold text-amber-300 text-xs mt-0.5">
                  {user?.role === 'SUPER_ADMIN' ? 'Superviseur National' : 'Direction École'}
                </span>
              </div>
              <div className="flex flex-col px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200/70">Caisse & Trésor</span>
                <span className="font-bold text-emerald-300 text-xs mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Équilibré
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 1b. ACTIONS COURANTES (6 Cartes Colorées Dynamiques & Intuitives) ── */}
        <motion.section variants={fadeUp} aria-labelledby="quick-actions-title">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600" />
              <h2 id="quick-actions-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                Que voulez-vous faire ?
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accès direct aux opérations courantes</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
            {[
              {
                label: 'Inscrire un élève',
                hint: 'Nouvelle admission',
                href: '/students/enroll',
                icon: UserPlus,
                accent: '#2563eb',
                bgGradient: 'from-blue-600 to-indigo-600',
                glow: 'hover:shadow-blue-500/20 hover:border-blue-400',
                softBg: 'group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/20',
              },
              {
                label: 'Encaisser paiement',
                hint: 'Scolarité & reçus',
                href: '/finance/payments',
                icon: Wallet,
                accent: '#059669',
                bgGradient: 'from-emerald-600 to-teal-600',
                glow: 'hover:shadow-emerald-500/20 hover:border-emerald-400',
                softBg: 'group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-950/20',
              },
              {
                label: 'Faire l\'appel',
                hint: 'Présences du jour',
                href: '/attendance',
                icon: CalendarCheck2,
                accent: '#0284c7',
                bgGradient: 'from-cyan-600 to-sky-600',
                glow: 'hover:shadow-cyan-500/20 hover:border-cyan-400',
                softBg: 'group-hover:bg-cyan-50/50 dark:group-hover:bg-cyan-950/20',
              },
              {
                label: 'Saisir les notes',
                hint: 'Évaluations APC',
                href: '/grades',
                icon: FileSpreadsheet,
                accent: '#ea580c',
                bgGradient: 'from-amber-500 to-orange-600',
                glow: 'hover:shadow-orange-500/20 hover:border-orange-400',
                softBg: 'group-hover:bg-amber-50/50 dark:group-hover:bg-amber-950/20',
              },
              {
                label: 'Imprimer bulletin',
                hint: 'Bulletins & certificats',
                href: '/reports/bulletins',
                icon: FileCheck2,
                accent: '#7c3aed',
                bgGradient: 'from-purple-600 to-violet-700',
                glow: 'hover:shadow-purple-500/20 hover:border-purple-400',
                softBg: 'group-hover:bg-purple-50/50 dark:group-hover:bg-purple-950/20',
              },
              {
                label: 'Emploi du temps',
                hint: 'Planning des salles',
                href: '/timetable',
                icon: Calendar,
                accent: '#e11d48',
                bgGradient: 'from-rose-500 to-pink-600',
                glow: 'hover:shadow-rose-500/20 hover:border-rose-400',
                softBg: 'group-hover:bg-rose-50/50 dark:group-hover:bg-rose-950/20',
              },
            ].map((a) => {
              const QIcon = a.icon;
              return (
                <button
                  key={a.href}
                  id={`quick-action-${a.href.replace(/\W+/g, '-')}`}
                  onClick={() => router.push(a.href)}
                  className={`group relative text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${a.glow} ${a.softBg} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer overflow-hidden flex flex-col justify-between`}
                  style={{ borderTop: `3.5px solid ${a.accent}` }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${a.bgGradient} shadow-md shadow-black/10 group-hover:scale-105 transition-transform duration-200`}
                      >
                        <QIcon size={22} strokeWidth={2} />
                      </span>
                      <ArrowRight
                        size={15}
                        strokeWidth={2.2}
                        className="text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-1 transition-all"
                      />
                    </div>
                    <span className="block text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                      {a.label}
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                      {a.hint}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.section>

        {/* ── 2. CHIFFRES CLÉS ENRICHIS (KPI Launchpad Tiles avec Barres Visuelles) ── */}
        <motion.section variants={fadeUp} aria-labelledby="fiori-tiles-title">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 rounded-full bg-gradient-to-b from-emerald-600 to-teal-600" />
              <h2 id="fiori-tiles-title" className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Chiffres clés & Performances de l'école
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Synchronisation direct État
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {fioriTiles.map((tile, i) => {
              const Icon = tile.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => router.push(tile.href)}
                  className="group relative cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4.5 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-black/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden"
                  style={{ borderTop: `4px solid ${tile.accentColor}` }}
                >
                  <div>
                    {/* Header: Catégorie + Icône en Dégradé Vibrant */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                        {tile.category}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${tile.iconGradient} shadow-sm group-hover:scale-110 transition-transform`}
                      >
                        <Icon size={17} strokeWidth={2} />
                      </div>
                    </div>

                    {/* Intitulé Métier */}
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {tile.title}
                    </h3>

                    {/* Valeur Chiffrée Géante (Tabular Nums) */}
                    <div className="flex items-baseline gap-2 mb-2.5">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {isLoading ? (
                          <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        ) : (
                          tile.value
                        )}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 truncate">
                        {tile.unit}
                      </span>
                    </div>

                    {/* Mini-jauge de progression visuelle */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${tile.gradient} transition-all duration-500`}
                        style={{ width: `${Math.min(100, tile.progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer de la tuile : Tendance & Badge sémantique */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span
                      className={`font-extrabold tabular-nums flex items-center gap-0.5 ${
                        tile.trendPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {tile.trend}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                        tile.statusType === 'success'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : tile.statusType === 'warning'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : tile.statusType === 'info'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {tile.statusLabel}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ── 3. WORKLIST TYPE ASSURANCE & ANALYTICS ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* COLONNE GAUCHE (2 tiers) : WORKLIST "DOSSIERS EN ARBITRAGE" */}
          <motion.div variants={fadeUp} className="xl:col-span-2 flex flex-col gap-5">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
              
              {/* Header de la Worklist Fiori */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 via-blue-50/30 to-transparent dark:from-slate-850 dark:to-transparent">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
                      <FolderCheck size={18} strokeWidth={2} />
                    </div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                      Dossiers prioritaires à traiter
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {dossiersList.length} actifs
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-10.5">
                    Régularisations financières, approbations RH et visas de bulletins
                  </p>
                </div>

                {/* Filtres d'état (Fiori Segmented Buttons) */}
                <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl text-xs self-start sm:self-auto font-bold border border-slate-200/70 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Tous ({dossiersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('critical')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'critical'
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    Critiques (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'pending'
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    }`}
                  >
                    En Attente (2)
                  </button>
                </div>
              </div>

              {/* Tableau épuré des Dossiers (High Density Table) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/50 border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">N° dossier</th>
                      <th className="py-3.5 px-4">Ce qu'il faut faire</th>
                      <th className="py-3.5 px-4">Personne concernée</th>
                      <th className="py-3.5 px-4">Montant / Volume</th>
                      <th className="py-3.5 px-4">État</th>
                      <th className="py-3.5 px-4 text-right">Action directe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredDossiers.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Réf Dossier */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <ItemIcon size={14} strokeWidth={2} className="text-blue-600 dark:text-blue-400" />
                              <span>{item.refCode}</span>
                            </div>
                          </td>

                          {/* Objet & Nature */}
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 dark:text-white">
                              {item.title}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              {item.dueDate}
                            </div>
                          </td>

                          {/* Tiers / Concerné */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                            {item.concerned}
                          </td>

                          {/* Impact / Montant */}
                          <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white tabular-nums">
                            {item.impact}
                          </td>

                          {/* Statut Fiori */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide ${
                                item.status === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : item.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  item.status === 'CRITICAL'
                                    ? 'bg-rose-600 animate-ping'
                                    : item.status === 'PENDING'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              {item.statusLabel}
                            </span>
                          </td>

                          {/* Bouton d'action directe coloré */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => router.push(item.href)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer ${
                                item.status === 'CRITICAL'
                                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-500/20 hover:shadow-md'
                                  : item.status === 'PENDING'
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-500/20 hover:shadow-md'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20 hover:shadow-md'
                              }`}
                            >
                              <span>{item.actionText}</span>
                              <ChevronRight size={13} strokeWidth={2.5} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pied de tableau */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Régularisations prioritaires soumises au visa du chef d'établissement</span>
                <button
                  type="button"
                  onClick={() => router.push('/invoices')}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ouvrir le registre complet des factures & impayés
                  <ArrowRight size={13} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* ── 4. CATALOGUE DES SERVICES MÉTIERS (Action Tiles Colorées) ── */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-5 rounded-full bg-gradient-to-b from-emerald-600 to-teal-600" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Tous les services & registres de l'école
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">Accès rapide</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'enroll', title: 'Nouvelle Admission', desc: 'Dossier apprenant & pièces', code: 'ADM-01', href: '/students/enroll', icon: UserPlus, gradient: 'from-blue-600 to-indigo-600', borderHover: 'hover:border-blue-400' },
                  { id: 'payments', title: 'Encaissement Guichet', desc: 'Quittance & caisse', code: 'ENC-02', href: '/finance/payments', icon: CreditCard, gradient: 'from-emerald-600 to-teal-600', borderHover: 'hover:border-emerald-400' },
                  { id: 'attendance', title: 'Registre d\'Appel', desc: 'Présences par filière', code: 'APP-03', href: '/attendance', icon: CalendarCheck2, gradient: 'from-cyan-600 to-sky-600', borderHover: 'hover:border-cyan-400' },
                  { id: 'grades', title: 'Saisie Évaluations', desc: 'Notes semestrielles APC', code: 'NOT-04', href: '/grades', icon: FileSpreadsheet, gradient: 'from-amber-500 to-orange-600', borderHover: 'hover:border-orange-400' },
                  { id: 'bulletins', title: 'Bulletins & Relevés', desc: 'Génération certifiée', code: 'DOC-05', href: '/reports/bulletins', icon: FileCheck2, gradient: 'from-purple-600 to-violet-700', borderHover: 'hover:border-purple-400' },
                  { id: 'expenses', title: 'Ordres de Dépense', desc: 'Bons de décaissement', code: 'DEP-06', href: '/expenses', icon: ReceiptText, gradient: 'from-rose-500 to-pink-600', borderHover: 'hover:border-rose-400' },
                ].map((srv) => {
                  const SrvIcon = srv.icon;
                  return (
                    <motion.button
                      key={srv.id}
                      type="button"
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => router.push(srv.href)}
                      className={`group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 ${srv.borderHover} hover:shadow-md text-left transition-all cursor-pointer`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${srv.gradient} shadow-sm group-hover:scale-105 transition-transform`}
                        >
                          <SrvIcon size={17} strokeWidth={2} />
                        </div>
                        <span className="font-mono text-[10px] font-black text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {srv.code}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {srv.title}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {srv.desc}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* COLONNE DROITE (1 tiers) : SYNTHÈSE ANALYTIQUE & SÉCURITÉ INSTITUTIONNELLE */}
          <motion.div variants={fadeUp} className="flex flex-col gap-5">

            {/* Widget Recouvrement par Filière (Analytical Card aux Couleurs Vives) */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <TrendingUp size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Recouvrement par Filière
                    </h3>
                    <p className="text-[11px] text-slate-400">Progression des frais de scolarité</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 tabular-nums">
                  85% global
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { name: '1ère Année TE (Transformation)', current: 48, total: 52, pct: 92, gradient: 'from-emerald-500 via-teal-400 to-emerald-400' },
                  { name: '1ère Année EA (Élevage & Agri)', current: 37, total: 44, pct: 84, gradient: 'from-blue-500 via-indigo-400 to-cyan-400' },
                  { name: '2ème Année EA (Spécialisation)', current: 28, total: 35, pct: 79, gradient: 'from-amber-500 via-orange-400 to-yellow-400' },
                ].map((row, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                        {row.name}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white tabular-nums">
                        {row.pct}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${row.gradient}`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 tabular-nums">
                      <span>{row.current} apprenants en règle</span>
                      <span className="text-amber-600 dark:text-amber-400">{row.total - row.current} relances en cours</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Recettes Encaissées</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  12 500 000 FCFA
                </span>
              </div>
            </div>

            {/* Fiche d'Accréditation Institutionnelle (Sceau Souverain de l'État) */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white p-5 border border-blue-900/40 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600" />
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md shadow-amber-500/20">
                  <Shield size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Conformité Institutionnelle
                  </h3>
                  <p className="text-[11px] text-blue-200/70">
                    Ministère de l'Éducation Nationale • Mali
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-blue-200/80">Statut Établissement</span>
                  <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} strokeWidth={2.5} />
                    Agréé & Conforme
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-blue-200/80">Mode Pédagogique</span>
                  <span className="font-extrabold text-amber-300">APC Modulaire</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-blue-200/80">Convention Formateurs</span>
                  <span className="font-extrabold text-white tabular-nums">1 750 FCFA / h</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <span className="text-blue-200/80">Partitionnement Données</span>
                  <span className="font-extrabold text-blue-300">100% Isolé Multi-Tenant</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/60 font-semibold">
                <span>Région de Gao (Mali)</span>
                <span className="text-amber-400 font-mono">ERP v1.1.0 Homologué</span>
              </div>
            </div>

          </motion.div>

        </div>

      </motion.div>
    </AppLayout>
  );
}
