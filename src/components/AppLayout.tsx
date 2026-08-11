'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import React, { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Users, School, BookOpen, CalendarCheck,
  Briefcase, FileText, Receipt, Clock, Settings, LogOut,
  ChevronRight, GraduationCap, BadgeDollarSign, BarChart3,
  UserCog, Menu, X, Bell, Award, ClipboardCheck, Landmark,
  Zap, Activity, ShieldAlert, Plus, Package, Loader2, MessageSquare, Moon, Sun, Search
} from 'lucide-react';

import PushNotificationManager from './PushNotificationManager';
import { CommandPalette } from './ui/CommandPalette';
import { TourGuide } from './ui/TourGuide';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Mon Espace',
    items: [
      { label: 'Tableau de Bord',   href: '/dashboard',       icon: <LayoutDashboard size={18}/> },
    ]
  },
  {
    title: 'Scolarité & Vie Scolaire',
    items: [
      { label: 'Inscriptions',        href: '/students/enroll', icon: <Plus size={18}/> },
      { label: 'Gestion des Élèves', href: '/students',       icon: <Users size={18}/> },
      { label: 'Emploi du Temps',    href: '/timetable',      icon: <Clock size={18}/> },
      { label: 'Appel & Présences',  href: '/attendance',     icon: <CalendarCheck size={18}/> },
    ]
  },
  {
    title: 'Pédagogie & Évaluations',
    items: [
      { label: 'Cahier de Texte',    href: '/lessons',        icon: <BookOpen size={18}/> },
      { label: 'Saisie des Notes',   href: '/grades',         icon: <FileText size={18}/> },
      { label: 'Bulletins',          href: '/reports/bulletins', icon: <Award size={18}/> },
    ]
  },
  {
    title: 'Comptabilité',
    items: [
      { label: 'Facturation & Caisse', href: '/invoices',       icon: <Receipt size={18}/> },
      { label: 'Journal des Dépenses', href: '/expenses',       icon: <BadgeDollarSign size={18}/> },
      { label: 'Bilan Financier',      href: '/finance',        icon: <Landmark size={18}/> },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Personnel (RH)',     href: '/employees',      icon: <Briefcase size={18}/> },
      { label: 'Classes & Matières', href: '/classrooms',     icon: <School size={18}/> },
      { label: 'Paramètres',         href: '/settings',       icon: <Settings size={18}/> },
    ]
  }
];

const STUDENT_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Vue Générale',
    items: [
      { label: 'Mon Espace',        href: '/dashboard',       icon: <LayoutDashboard size={18}/> },
    ]
  },
  {
    title: 'Scolarité',
    items: [
      { label: 'Emploi du Temps',   href: '/timetable',       icon: <Clock size={18}/> },
      { label: 'Mes Notes',         href: '/reports/bulletins', icon: <Award size={18}/> },
      { label: 'Factures & Frais',  href: '/invoices',        icon: <Receipt size={18}/> },
    ]
  }
];

const PARENT_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Espace Famille',
    items: [
      { label: 'Mes Enfants',       href: '/parent',          icon: <Users size={18}/> },
      { label: 'Scolarité & Notes', href: '/parent/grades',   icon: <Award size={18}/> },
      { label: 'Factures & Paiement', href: '/parent/invoices', icon: <Receipt size={18}/> },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messagerie',        href: '/chat',            icon: <MessageSquare size={18}/> },
    ]
  }
];

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

interface Notification { id: string; type: string; priority: 'high' | 'medium' | 'low'; title: string; message: string; href: string; }

export default function AppLayout({ children, title, subtitle, actions, breadcrumbs }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; role?: string; email?: string; schoolName?: string } | null>(null);
  const [branding, setBranding] = useState<{ primaryColor?: string; secondaryColor?: string; logoUrl?: string } | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const r = await fetch('/api/notifications');
      if (r.ok) { const d = await r.json(); setNotifications(d.notifications || []); }
    } catch {}
    finally { setNotifLoading(false); }
  }, []);

  const priorityColor: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const typeIcon: Record<string, string> = { finance: '💰', hr: '👤', attendance: '📋', system: '⚙️' };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) setUser(JSON.parse(stored));
      fetch('/api/school/config').then(r => r.json()).then(data => {
          if (data && data.primaryColor) setBranding(data);
      }).catch(() => {});
    } catch {}
  }, []);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'A';
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Utilisateur';

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          {branding?.logoUrl ? (
            <Image src={branding.logoUrl} alt="Logo" width={24} height={24} className="object-contain" />
          ) : (
            <GraduationCap size={22} className="text-white" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-lg tracking-tight truncate leading-tight">SchoolERP<span className="text-indigo-600 dark:text-indigo-400">.pro</span></h2>
          <p className="text-[10px] uppercase font-bold text-zinc-500 truncate mt-0.5">{user?.schoolName || 'Mali Educational System'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
        {(
          user?.role === 'STUDENT' ? STUDENT_NAV_SECTIONS : 
          user?.role === 'PARENT' ? PARENT_NAV_SECTIONS :
          [
            ...NAV_SECTIONS,
            ...(user?.role === 'SUPER_ADMIN' ? [{
              title: 'Super Admin Lab',
              items: [
                { label: 'Gestion Écoles',    href: '/admin/schools',       icon: <Landmark size={18}/> },
                { label: 'Santé Système',     href: '/admin/system-health', icon: <Activity size={18}/> },
                { label: 'Stress Test',       href: '/admin/stress-test',   icon: <Zap size={18}/> },
              ]
            }] : [])
          ]
        ).map(section => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100 dark:border-indigo-500/20' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
                    }`}
                  >
                    <span className={`transition-colors duration-200 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-[13px]">{item.label}</span>
                    {active && <ChevronRight size={14} className="text-indigo-400 dark:text-indigo-500 opacity-60" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-sm shrink-0 border border-indigo-200 dark:border-indigo-800">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{displayName}</p>
            <p className="text-[11px] font-semibold text-zinc-500 truncate">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-950 font-sans overflow-hidden">
      
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-72 h-full p-3 pr-0">
        <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800 overflow-hidden flex flex-col relative z-20">
           <SidebarContent />
        </div>
      </aside>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-zinc-900/60 backdrop-blur-sm lg:hidden flex"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="w-4/5 max-w-sm h-full bg-white dark:bg-zinc-950 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-full lg:p-3 overflow-hidden relative">
        <div className="flex-1 w-full h-full bg-white dark:bg-zinc-950 lg:rounded-2xl shadow-sm border-x lg:border border-zinc-200/60 dark:border-zinc-800 flex flex-col overflow-hidden relative z-10">
          
          {/* Top Header */}
          <header className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/60 z-30 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-xl">
                <Menu size={24} />
              </button>
              
              {/* Breadcrumbs / Title */}
              <div className="hidden sm:block">
                {breadcrumbs && breadcrumbs.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm">
                    {breadcrumbs.map((b, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <ChevronRight size={14} className="text-zinc-400" />}
                        {b.href ? (
                          <Link href={b.href} className="font-semibold text-zinc-500 hover:text-indigo-600 transition-colors">
                            {b.label}
                          </Link>
                        ) : (
                          <span className="font-bold text-zinc-900 dark:text-white">{b.label}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : title ? (
                  <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h1>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <button 
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-500 transition-colors w-[220px]"
              >
                <Search size={16} />
                <span className="text-sm font-medium mr-auto">Rechercher...</span>
                <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] font-bold opacity-60">
                  <span className="text-[11px]">⌘</span>K
                </kbd>
              </button>

              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>

              {user?.role === 'SUPER_ADMIN' && user.schoolName && (
                 <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                    <ShieldAlert size={14} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Impersonnalisation</span>
                 </div>
              )}

              {actions}

              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                    <Bell size={20} />
                    {notifications.filter(n => n.priority === 'high').length > 0 && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-zinc-950" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-bold">Notifications</h3>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">{notifications.length}</Badge>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-8 text-center"><Loader2 size={24} className="animate-spin mx-auto text-indigo-400" /></div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-zinc-400 text-sm font-medium">
                        <Bell size={32} className="mx-auto mb-3 opacity-20" />
                        Aucune notification
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} onClick={() => router.push(n.href)} className="p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors flex gap-3">
                         <span className="text-xl">{typeIcon[n.type] || '🔔'}</span>
                         <div>
                           <p className="text-sm font-bold">{n.title}</p>
                           <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{n.message}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1 h-auto flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl border border-transparent">
                    <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                      {initials}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl border-zinc-200 dark:border-zinc-800">
                  <div className="p-3">
                    <p className="text-sm font-bold truncate">{displayName}</p>
                    <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="rounded-xl m-1 cursor-pointer">
                    <Users size={16} className="mr-2 text-indigo-600" /> Mon Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-xl m-1 cursor-pointer">
                    <Settings size={16} className="mr-2 text-zinc-500" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl m-1 cursor-pointer text-red-600 hover:text-red-700 focus:bg-red-50 dark:focus:bg-red-500/10">
                    <LogOut size={16} className="mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </header>

          {/* Page Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50">
            {title && (!breadcrumbs || breadcrumbs.length === 0) && (
              <div className="px-8 pt-8 pb-4">
                <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">{title}</h1>
                {subtitle && <p className="text-zinc-500 text-sm mt-1 font-medium">{subtitle}</p>}
              </div>
            )}
            
            <div className="p-6 md:p-8 min-h-full flex flex-col">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                {children}
              </motion.div>
              
              <footer className="mt-12 pt-6 border-t border-zinc-200/60 dark:border-zinc-800 text-center">
                <p className="text-xs font-medium text-zinc-400 flex items-center justify-center gap-1.5 flex-wrap">
                  © {new Date().getFullYear()} SchoolERP Pro — Conçu avec excellence par 
                  <a href="https://sahelmultiservices.com" className="font-bold text-indigo-500 hover:text-indigo-600 transition-colors ml-1">
                    SAHEL MULTISERVICES
                  </a>
                </p>
              </footer>
            </div>
          </div>
        </div>
      </main>

      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      <TourGuide />
    </div>
  );
}
