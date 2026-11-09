'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, Users, BookOpenCheck, CalendarDays,
  Briefcase, FileSpreadsheet, ReceiptText, Clock, Settings, LogOut,
  ChevronRight, GraduationCap, Menu, Bell, Award, Landmark,
  Zap, Activity, PackageCheck, Loader2, Moon, Sun, Search, Home,
  LibraryBig, ChevronDown, UserPlus, UserCheck, FileCheck2, Scale,
  Building2, ShieldCheck, Sliders, FileText, Receipt, Wifi, WifiOff,
  Sprout, Stethoscope
} from 'lucide-react';

import { CommandPalette } from './ui/CommandPalette';
import { TourGuide } from './ui/TourGuide';
import { getGradingPolicyBySchoolType } from '@/lib/gradingPolicy';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem { label: string; href: string; icon: ReactNode; badge?: string; }
interface NavSection { title: string; items: NavItem[]; }

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Pilotage & Synthèse',
    items: [
      { label: 'Tableau de Bord', href: '/dashboard', icon: <LayoutDashboard size={16} strokeWidth={1.9} /> },
    ]
  },
  {
    title: 'Registre Scolarité',
    items: [
      { label: 'Inscriptions & Admissions', href: '/students/enroll', icon: <UserPlus size={16} strokeWidth={1.9} /> },
      { label: 'Fichier des Apprenants',   href: '/students',        icon: <GraduationCap size={16} strokeWidth={1.9} /> },
      { label: 'Planning & Horaires',      href: '/timetable',       icon: <CalendarDays size={16} strokeWidth={1.9} /> },
      { label: 'Émargement & Assiduité',   href: '/attendance',      icon: <UserCheck size={16} strokeWidth={1.9} /> },
    ]
  },
  {
    title: 'Pédagogie & Évaluations',
    items: [
      { label: 'Cahier de Texte',             href: '/lessons',           icon: <BookOpenCheck size={16} strokeWidth={1.9} /> },
      { label: 'Tableau Utilitaire (Heures)', href: '/hr/timesheet',      icon: <Clock size={16} strokeWidth={1.9} /> },
      { label: 'Saisie des Notes',            href: '/grades',            icon: <FileSpreadsheet size={16} strokeWidth={1.9} /> },
      { label: 'Bulletins & Décisions',       href: '/reports/bulletins', icon: <FileCheck2 size={16} strokeWidth={1.9} /> },
      { label: 'Fonds Documentaire',          href: '/library',           icon: <LibraryBig size={16} strokeWidth={1.9} /> },
    ]
  },
  {
    title: 'Finances & SYSCOHADA',
    items: [
      { label: 'Facturation & Échéances',      href: '/invoices', icon: <ReceiptText size={16} strokeWidth={1.9} /> },
      { label: 'Dépenses & Décaissements',     href: '/expenses', icon: <Scale size={16} strokeWidth={1.9} /> },
      { label: 'Bilan & Trésorerie',           href: '/finance',  icon: <Landmark size={16} strokeWidth={1.9} /> },
      { label: 'Honoraires Vacataires & Paie', href: '/payslips', icon: <FileText size={16} strokeWidth={1.9} /> },
    ]
  },
  {
    title: 'Administration & Audit',
    items: [
      { label: 'Corps Enseignant & RH',  href: '/employees',   icon: <Briefcase size={16} strokeWidth={1.9} /> },
      { label: 'Filières & Classes',     href: '/classrooms',  icon: <Building2 size={16} strokeWidth={1.9} /> },
      { label: 'Matériels & Inventaire', href: '/inventory',   icon: <PackageCheck size={16} strokeWidth={1.9} /> },
      { label: 'Journal d\'Audit',       href: '/admin/audit', icon: <ShieldCheck size={16} strokeWidth={1.9} /> },
      { label: 'Paramètres Système',     href: '/settings',    icon: <Sliders size={16} strokeWidth={1.9} /> },
    ]
  }
];

const STUDENT_NAV: NavSection[] = [
  { title: 'Mon Espace', items: [
    { label: 'Accueil',         href: '/dashboard',         icon: <Home size={16}/> },
    { label: 'Emploi du Temps', href: '/timetable',         icon: <Clock size={16}/> },
    { label: 'Mes Notes',       href: '/reports/bulletins', icon: <Award size={16}/> },
    { label: 'Factures',        href: '/invoices',          icon: <Receipt size={16}/> },
  ]}
];

const PARENT_NAV: NavSection[] = [
  { title: 'Espace Famille', items: [
    { label: 'Mes Enfants',          href: '/parent',          icon: <Users size={16}/> },
    { label: 'Factures & Paiements', href: '/parent/invoices', icon: <Receipt size={16}/> },
  ]}
];

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

interface Notification {
  id: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  href: string;
}

const ROLE_LABELS: Record<string, string> = {
  SCHOOL_ADMIN: 'Directeur / Admin',
  SUPER_ADMIN: 'Super Administrateur',
  ACCOUNTANT: 'Comptable / Économe',
  HR_MANAGER: 'Responsable RH',
  CENSEUR: 'Censeur / Dir. Études',
  SURVEILLANT: 'Surveillant Général',
  TEACHER: 'Formateur / Professeur',
  STUDENT: 'Apprenant',
  PARENT: 'Parent d\'élève',
};

export default function AppLayout({ children, title, subtitle, actions, breadcrumbs }: AppLayoutProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{
    firstName?: string;
    lastName?: string;
    role?: string;
    email?: string;
    schoolName?: string;
    schoolType?: string;
    gradingScale?: number;
  } | null>(null);
  const [branding, setBranding] = useState<{
    primaryColor?: string;
    logoUrl?: string;
    name?: string;
    type?: string;
    gradingScale?: number;
  } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading]   = useState(false);
  const [isDark, setIsDark]               = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [schoolType, setSchoolType] = useState<string | null>(null);

  const RELEVE_COMPETENCES_SCHOOL_TYPES = ['AGRO', 'TECHNIQUE'];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    const hk = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', hk);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        navigator.serviceWorker.getRegistrations().then(regs => {
          for (const r of regs) r.unregister();
        }).catch(() => {});
        if ('caches' in window) {
          caches.keys().then(keys => {
            for (const k of keys) caches.delete(k);
          }).catch(() => {});
        }
      }
    }

    return () => {
      window.removeEventListener('keydown', hk);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        if (parsed.schoolType) setSchoolType(parsed.schoolType);
      }
      fetch('/api/school/config')
        .then(r => r.json())
        .then(d => {
          if (d && (d.primaryColor || d.name)) setBranding(d);
          if (d?.type) setSchoolType(d.type);
        })
        .catch(() => {});
    } catch {}
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const r = await fetch('/api/notifications');
      if (r.ok) {
        const d = await r.json();
        setNotifications(d.notifications || []);
      }
    } catch {}
    finally {
      setNotifLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('school_grading_policy');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'AD'
    : 'AD';
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Administrateur'
    : 'Administrateur';
  const roleLabel = user?.role ? (ROLE_LABELS[user.role] || user.role) : 'Direction';

  const activePolicy = getGradingPolicyBySchoolType(
    schoolType || user?.schoolType,
    branding?.gradingScale || user?.gradingScale
  );

  const isReleveCompetencesVisible =
    schoolType !== null && RELEVE_COMPETENCES_SCHOOL_TYPES.includes(schoolType);

  const navSectionsWithSchoolType: NavSection[] = NAV_SECTIONS.map(section => {
    if (section.title === 'Pédagogie & Évaluations') {
      const items = [...section.items];
      const bulletinsIdx = items.findIndex(i => i.href === '/reports/bulletins');
      if (isReleveCompetencesVisible && !items.find(i => i.href === '/reports/releve-competences')) {
        items.splice(bulletinsIdx + 1, 0, {
          label: 'Relevé Compétences',
          href: '/reports/releve-competences',
          icon: <Award size={16} strokeWidth={1.9} />,
        });
      }
      return { ...section, items };
    }
    return section;
  });

  const navSections: NavSection[] =
    user?.role === 'STUDENT'
      ? STUDENT_NAV
      : user?.role === 'PARENT'
      ? PARENT_NAV
      : [
          ...navSectionsWithSchoolType,
          ...(user?.role === 'SUPER_ADMIN'
            ? [
                {
                  title: 'Super Administration',
                  items: [
                    { label: 'Gestion Écoles', href: '/admin/schools', icon: <Landmark size={16} /> },
                    { label: 'Santé Système', href: '/admin/system-health', icon: <Activity size={16} /> },
                    { label: 'Stress Test', href: '/admin/stress-test', icon: <Zap size={16} /> },
                  ],
                },
              ]
            : []),
        ];

  const SchoolBrandIcon =
    activePolicy.profileKey === 'AGRO_TECHNIQUE'
      ? Sprout
      : activePolicy.profileKey === 'SANTE_SUPERIEUR'
      ? Stethoscope
      : GraduationCap;

  /* ── SIDEBAR CONTENT ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/90">
      {/* School Identity Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <SchoolBrandIcon size={19} strokeWidth={2.1} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight">
              {branding?.name || user?.schoolName || 'CFP-PAS de Gao'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                /{activePolicy.defaultScale}
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {activePolicy.shortLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Navigation principale" className="flex-1 py-3.5 px-2.5 overflow-y-auto space-y-5">
        {navSections.map(section => (
          <div key={section.title}>
            <div className="px-2.5 pb-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className={`shrink-0 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="bg-blue-600 text-white rounded-full text-[10px] font-bold px-1.5 py-0.2">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {roleLabel}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            aria-label="Déconnexion"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut size={15} strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:block w-64 h-full shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="w-72 max-w-[82%] h-full bg-white dark:bg-slate-900 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Column ── */}
      <main id="main-content" className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* ── OFFLINE BANNER ── */}
        {isOffline && (
          <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 z-40 border-b border-amber-700">
            <WifiOff size={14} />
            <span>Mode Hors-ligne actif — Vos saisies restent en sécurité sur cet appareil et seront synchronisées au retour du réseau.</span>
          </div>
        )}

        {/* ── TOP HEADER BAR ── */}
        <header className="h-14 px-4 sm:px-6 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Ouvrir le menu de navigation"
              title="Ouvrir le menu"
            >
              <Menu size={18} strokeWidth={1.9} />
            </button>

            <div className="hidden sm:flex items-center gap-2 min-w-0">
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <div className="flex items-center gap-1.5 text-xs">
                  {breadcrumbs.map((b, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <ChevronRight size={13} className="text-slate-400" />}
                      {b.href ? (
                        <Link
                          href={b.href}
                          className="font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {b.label}
                        </Link>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">{b.label}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : title ? (
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {title}
                </span>
              ) : null}

              <div className="hidden xl:flex items-center gap-2 ml-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  2025-2026
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                  {activePolicy.badgeText}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              aria-label="Recherche rapide de dossiers"
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer w-56"
            >
              <Search size={14} className="text-slate-400 shrink-0" />
              <span className="flex-1 text-left truncate">Rechercher élève, reçu...</span>
              <kbd className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Live Connectivity Pill */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isOffline
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
              }`}
              title={
                isOffline
                  ? 'Connexion interrompue : modifications conservées localement'
                  : 'Connecté et synchronisé en temps réel'
              }
            >
              <Wifi size={12} className={isOffline ? 'text-amber-500' : 'text-emerald-500'} />
              <span>{isOffline ? 'Hors-ligne' : 'En ligne'}</span>
            </div>

            {actions}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
              title={isDark ? 'Thème clair' : 'Thème sombre'}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Afficher les notifications"
                  title="Notifications"
                  onClick={loadNotifications}
                  className="w-8 h-8 rounded-lg relative flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Bell size={16} />
                  {notifications.filter(n => n.priority === 'high').length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Notifications</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {notifications.length}
                  </span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="p-8 text-center">
                      <Loader2 size={20} className="animate-spin mx-auto text-blue-600" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      <Bell size={24} className="mx-auto mb-2 opacity-30" />
                      Aucune notification récente
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => router.push(n.href)}
                        className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 transition-colors cursor-pointer">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {initials}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[90px] truncate hidden md:block">
                    {user?.firstName || 'Admin'}
                  </span>
                  <ChevronDown size={12} className="text-slate-400 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{displayName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {roleLabel}
                  </span>
                </div>
                <div className="p-1.5">
                  <DropdownMenuItem
                    onClick={() => router.push('/profile')}
                    className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer flex items-center gap-2"
                  >
                    <Users size={14} className="text-blue-600" /> Mon Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/settings')}
                    className="rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer flex items-center gap-2"
                  >
                    <Settings size={14} className="text-slate-500" /> Paramètres
                  </DropdownMenuItem>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-2 text-xs font-bold text-rose-600 cursor-pointer flex items-center gap-2"
                  >
                    <LogOut size={14} /> Déconnexion
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── SCROLLABLE WORKSPACE AREA ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Page Header Banner */}
          {(title || subtitle) && (
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-2 shrink-0">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Page Children */}
          <div className="p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-180px)]">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </div>

          {/* Workspace Footer */}
          <footer className="px-6 py-4 border-t border-slate-200/70 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <p className="font-medium">
              © {new Date().getFullYear()} {branding?.name || 'CFP-PAS de Gao'} — EduGestion ERP
            </p>
            <span className="font-semibold text-slate-400">
              {activePolicy.badgeText} • v2.5
            </span>
          </footer>
        </div>
      </main>

      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      <TourGuide />
    </div>
  );
}
