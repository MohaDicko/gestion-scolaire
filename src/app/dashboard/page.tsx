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

  // Tuiles Numériques SAP Fiori Horizon (Launchpad KPI Tiles)
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
      accentColor: '#0070F2', // Fiori Horizon Blue
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
      accentColor: '#107E3E', // Fiori Positive Green
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
      accentColor: '#0284c7', // Cyan Horizon
      statusLabel: 'Régulier',
      statusType: 'info' as const,
    },
    {
      category: 'Personnel & Vacations',
      title: 'Corps Formateurs',
      value: stats.employeesCount || 21,
      unit: 'vacataires & perm.',
      trend: '1 750 FCFA/h conventionné',
      trendPositive: true,
      subtext: `${stats.pendingLeaves || 3} demandes d'arbitrage congé`,
      href: '/employees',
      icon: Briefcase,
      accentColor: '#5c35cc', // Fiori Purple
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
      accentColor: '#c55305', // Fiori Orange
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
      statusLabel: 'Contentieux / Relance',
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
      statusLabel: 'Arbitrage Requis',
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

        {/* ── 1. FIORI SHELL CONTEXT BANNER (En-tête Institutionnel Fiori Horizon) ── */}
        <motion.section
          variants={fadeUp}
          className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          {/* Accent Fiori Horizon discret */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0070F2] via-[#0284c7] to-[#107E3E]" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center shrink-0 text-[#0070F2] dark:text-blue-400 font-black shadow-xs">
                <Landmark size={24} strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    CFP-PAS de Gao
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0070F2]/10 text-[#0070F2] dark:text-blue-400 uppercase tracking-wider border border-[#0070F2]/20">
                    Exercice 2025 - 2026
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Référentiel APC
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {greeting}{user?.firstName ? `, ${user.firstName}` : ''} • Console d'arbitrage administratif, financier et de conformité académique.
                </p>
              </div>
            </div>

            {/* Fiori Context Data Points */}
            <div className="flex items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Territoire</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Gao, République du Mali</span>
              </div>
              <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rôle Opérateur</span>
                <span className="font-bold text-[#0070F2] dark:text-blue-400">
                  {user?.role === 'SUPER_ADMIN' ? 'Superviseur National' : 'Direction Établissement'}
                </span>
              </div>
              <div className="w-px h-7 bg-slate-200 dark:bg-slate-800" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Caisse & Dépenses</span>
                <span className="font-bold text-[#107E3E] dark:text-emerald-400 flex items-center gap-1">
                  <CheckCheck size={13} strokeWidth={2} />
                  Équilibré
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 2. FIORI HORIZON KPI LAUNCHPAD TILES (Numeric Cards) ── */}
        <motion.section variants={fadeUp} aria-labelledby="fiori-tiles-title">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0070F2]" />
              <h2 id="fiori-tiles-title" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Indicateurs Clés de Performance (Fiori Horizon Launchpad)
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Agrégation en direct</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {fioriTiles.map((tile, i) => {
              const Icon = tile.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => router.push(tile.href)}
                  className="group relative cursor-pointer rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,112,242,0.08)] hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                  style={{ borderTopWidth: '3px', borderTopColor: tile.accentColor }}
                >
                  <div>
                    {/* Header: Catégorie + Icône Fiori encadrée */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                        {tile.category}
                      </span>
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                        style={{ backgroundColor: `${tile.accentColor}14`, color: tile.accentColor }}
                      >
                        <Icon size={16} strokeWidth={1.75} />
                      </div>
                    </div>

                    {/* Intitulé Métier */}
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {tile.title}
                    </h3>

                    {/* Valeur Chiffrée Géante (Tabular Nums) */}
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
                        {isLoading ? (
                          <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        ) : (
                          tile.value
                        )}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 truncate">
                        {tile.unit}
                      </span>
                    </div>
                  </div>

                  {/* Footer de la tuile Fiori : Tendance & Badge sémantique */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span
                      className={`font-bold tabular-nums flex items-center gap-0.5 ${
                        tile.trendPositive
                          ? 'text-[#107E3E] dark:text-emerald-400'
                          : 'text-[#C55305] dark:text-amber-400'
                      }`}
                    >
                      {tile.trend}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        tile.statusType === 'success'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60'
                          : tile.statusType === 'warning'
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60'
                          : tile.statusType === 'info'
                          ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60'
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
          <motion.div variants={fadeUp} className="xl:col-span-2 flex flex-col gap-4">
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
              
              {/* Header de la Worklist Fiori */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderCheck size={18} strokeWidth={1.75} className="text-[#0070F2] dark:text-blue-400" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      File d'Arbitrage des Dossiers & Contentieux
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#0070F2]/10 text-[#0070F2] dark:text-blue-400">
                      {dossiersList.length} actifs
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Instruction des impayés, congés du corps enseignant et clôtures officielles
                  </p>
                </div>

                {/* Filtres d'état (Fiori Segmented Buttons) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs self-start sm:self-auto font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
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
                        ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-red-600'
                    }`}
                  >
                    Critiques (1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'pending'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                    }`}
                  >
                    En Attente (2)
                  </button>
                </div>
              </div>

              {/* Tableau épuré des Dossiers Fiori (High Density Table) */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Réf. Dossier</th>
                      <th className="py-3 px-4">Objet & Instruction</th>
                      <th className="py-3 px-4">Tiers Concerné</th>
                      <th className="py-3 px-4">Montant / Volume</th>
                      <th className="py-3 px-4">Statut Fiori</th>
                      <th className="py-3 px-4 text-right">Action Directe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {filteredDossiers.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Réf Dossier */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <ItemIcon size={14} strokeWidth={1.75} className="text-slate-400" />
                              <span>{item.refCode}</span>
                            </div>
                          </td>

                          {/* Objet & Nature */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {item.dueDate}
                            </div>
                          </td>

                          {/* Tiers / Concerné */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                            {item.concerned}
                          </td>

                          {/* Impact / Montant */}
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {item.impact}
                          </td>

                          {/* Statut Fiori */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                item.status === 'CRITICAL'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200'
                                  : item.status === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.status === 'CRITICAL'
                                    ? 'bg-red-600'
                                    : item.status === 'PENDING'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              {item.statusLabel}
                            </span>
                          </td>

                          {/* Bouton d'action directe */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => router.push(item.href)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0070F2] dark:bg-blue-950/50 dark:hover:bg-blue-900/50 dark:text-blue-300 font-bold text-xs transition-colors cursor-pointer"
                            >
                              <span>{item.actionText}</span>
                              <ChevronRight size={13} strokeWidth={2} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pied de tableau */}
              <div className="p-3 bg-slate-50/60 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Régularisations prioritaires soumises au visa du chef d'établissement</span>
                <button
                  type="button"
                  onClick={() => router.push('/invoices')}
                  className="font-bold text-[#0070F2] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Ouvrir le registre complet des factures & impayés
                  <ArrowRight size={13} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* ── 4. CATALOGUE DES SERVICES MÉTIERS (Fiori Action Tiles) ── */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#107E3E]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Catalogue des Procédures Opérationnelles (Guichet Établissement)
                  </h2>
                </div>
                <span className="text-xs text-slate-400">Accès rapide par code</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fioriServices.map((srv) => {
                  const SrvIcon = srv.icon;
                  return (
                    <motion.button
                      key={srv.id}
                      type="button"
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => router.push(srv.href)}
                      className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black"
                          style={{ backgroundColor: `${srv.color}14`, color: srv.color }}
                        >
                          <SrvIcon size={16} strokeWidth={1.75} />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-[#0070F2] transition-colors">
                          {srv.code}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#0070F2] dark:group-hover:text-blue-400 transition-colors">
                          {srv.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
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

            {/* Widget Recouvrement par Filière (Fiori Analytical Card) */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-50 text-[#107E3E] dark:bg-emerald-950/40 dark:text-emerald-400">
                    <TrendingUp size={16} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Recouvrement par Filière
                  </h3>
                </div>
                <span className="text-xs font-black text-[#107E3E] dark:text-emerald-400 tabular-nums">
                  Global : 85%
                </span>
              </div>

              <div className="space-y-4">
                {[
                  { name: '1ère Année TE (Transformation)', current: 48, total: 52, pct: 92, color: 'bg-emerald-600' },
                  { name: '1ère Année EA (Élevage & Agri)', current: 37, total: 44, pct: 84, color: 'bg-blue-600' },
                  { name: '2ème Année EA (Spécialisation)', current: 28, total: 35, pct: 79, color: 'bg-amber-500' },
                ].map((row, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {row.name}
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {row.pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.color}`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                      <span>{row.current} apprenants en règle</span>
                      <span>{row.total - row.current} relances en cours</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Recettes Encaissées</span>
                <span className="font-mono font-black text-slate-900 dark:text-white tabular-nums">
                  12 500 000 FCFA
                </span>
              </div>
            </div>

            {/* Fiche d'Accréditation Institutionnelle (CFP-PAS de Gao) */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#0070F2] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Shield size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Conformité Institutionnelle
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Agrément Ministériel • Enseignement Technique
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-500">Statut Établissement</span>
                  <span className="font-bold text-[#107E3E] dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={13} strokeWidth={2} />
                    Agréé & Conforme
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-500">Mode Pédagogique</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">APC Modulaire</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-500">Grille Formateurs</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">1 750 FCFA / h</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-slate-500">Isolation Multi-Tenant</span>
                  <span className="font-bold text-[#0070F2] dark:text-blue-400">Active (Partition 100%)</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Région de Gao (Mali)</span>
                <span className="font-mono">ERP v1.1.0 Fiori</span>
              </div>
            </div>

          </motion.div>

        </div>

      </motion.div>
    </AppLayout>
  );
}
