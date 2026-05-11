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
  Zap, Activity, ShieldAlert, Plus, Package, Loader2, MessageSquare
} from 'lucide-react';
import AIDashboardAssistant from './AIDashboardAssistant';
import PushNotificationManager from './PushNotificationManager';

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
    title: 'Vue Générale',
    items: [
      { label: 'Tableau de Bord',   href: '/dashboard',       icon: <LayoutDashboard size={17}/> },
    ]
  },
  {
    title: 'Communication',
    items: [
      { label: 'Messagerie Chat',    href: '/chat',            icon: <MessageSquare size={17}/> },
    ]
  },
  {
    title: 'Académique',
    items: [
      { label: 'Élèves & Scolarité', href: '/students',       icon: <Users size={17}/> },
      { label: 'Inscriptions',        href: '/students/enroll', icon: <Plus size={17}/> },
      { label: 'Classes',            href: '/classrooms',     icon: <School size={17}/> },
      { label: 'Matières',           href: '/subjects',       icon: <BookOpen size={17}/> },
      { label: 'Cahier de Texte',    href: '/lessons',        icon: <ClipboardCheck size={17}/> },
      { label: 'Bibliothèque',       href: '/library',        icon: <BookOpen size={17}/> },
      { label: 'Saisie des Notes',   href: '/grades',         icon: <FileText size={17}/> },
      { label: 'Bulletins & Résultats', href: '/reports/bulletins', icon: <Award size={17}/> },
      { label: 'Relevés de Notes',   href: '/reports/transcripts', icon: <FileText size={17}/> },
      { label: 'Présences',          href: '/attendance',     icon: <CalendarCheck size={17}/> },
      { label: 'Emploi du Temps',    href: '/timetable',      icon: <Clock size={17}/> },
    ]
  },
  {
    title: 'Ressources Humaines',
    items: [
      { label: 'Personnel',          href: '/employees',      icon: <Briefcase size={17}/> },
      { label: 'Présence Staff',     href: '/hr/attendance',  icon: <ClipboardCheck size={17}/> },
      { label: 'Congés & Absences',  href: '/hr/leaves',      icon: <CalendarCheck size={17}/> },
      { label: 'Bulletins de Paie',  href: '/payslips',       icon: <BadgeDollarSign size={17}/> },
    ]
  },
  {
    title: 'Finance',
    items: [
      { label: 'Bilan Financier',    href: '/finance',         icon: <Landmark size={17}/> },
      { label: 'Grand Livre',        href: '/finance/ledger',  icon: <FileText size={17}/> },
      { label: 'Rapport Annuel PDF', href: '/finance/report',  icon: <BarChart3 size={17}/> },
      { label: 'Factures & Frais',   href: '/invoices',        icon: <Receipt size={17}/> },
      { label: 'Gestion des Stocks', href: '/inventory',       icon: <Package size={17}/> },
      { label: 'Dépenses',           href: '/expenses',        icon: <BarChart3 size={17}/> },
    ]
  },
  {
    title: 'Analytics & BI',
    items: [
      { label: 'Tableau de Bord BI', href: '/reports',        icon: <BarChart3 size={17}/> },
      { label: 'Bulletins de Notes', href: '/reports/bulletins', icon: <Award size={17}/> },
      { label: 'Relevés Annuels',   href: '/reports/transcripts', icon: <FileText size={17}/> },
      { label: 'Journal d\'Audit',   href: '/admin/audit',    icon: <ShieldAlert size={17}/> },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'Utilisateurs',       href: '/users',          icon: <UserCog size={17}/> },
      { label: 'Paramètres',         href: '/settings',       icon: <Settings size={17}/> },
    ]
  }
];

const STUDENT_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Vue Générale',
    items: [
      { label: 'Mon Espace',        href: '/dashboard',       icon: <LayoutDashboard size={17}/> },
    ]
  },
  {
    title: 'Scolarité',
    items: [
      { label: 'Emploi du Temps',   href: '/timetable',       icon: <Clock size={17}/> },
      { label: 'Mes Notes',         href: '/reports/bulletins', icon: <Award size={17}/> },
      { label: 'Factures & Frais',  href: '/invoices',        icon: <Receipt size={17}/> },
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
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const r = await fetch('/api/notifications');
      if (r.ok) { const d = await r.json(); setNotifications(d.notifications || []); }
    } catch {}
    finally { setNotifLoading(false); }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const priorityColor: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
  const typeIcon: Record<string, string> = { finance: '💰', hr: '👤', attendance: '📋', system: '⚙️' };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) setUser(JSON.parse(stored));
      
      // Fetch branding
      fetch('/api/school/config')
        .then(r => r.json())
        .then(data => {
          if (data && data.primaryColor) {
            setBranding({
              primaryColor: data.primaryColor,
              secondaryColor: data.secondaryColor,
              logoUrl: data.logoUrl
            });
          }
        })
        .catch(() => {});
    } catch {}
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
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
    <>
      {/* Logo (Header) */}
      <header className="sidebar-logo">
        <div className="logo-icon">
          {branding?.logoUrl ? (
            <Image src={branding.logoUrl} alt="Logo établissement" fill style={{ objectFit: 'contain' }} />
          ) : (
            <GraduationCap size={22} />
          )}
        </div>
        <div>
          <div className="logo-title">SchoolERP <span style={{ color: 'var(--primary)' }}>Pro</span></div>
          <div className="logo-school" style={{ color: user?.schoolName ? 'var(--primary)' : 'var(--text-dim)', fontWeight: user?.schoolName ? 700 : 500 }}>
            {user?.schoolName || 'Mali Educational System'}
          </div>
        </div>
      </header>

      {/* Navigation (Nav) */}
      <nav className="sidebar-nav" aria-label="Menu principal" style={{ flex: 1, overflowY: 'auto' }}>
        {(user?.role === 'STUDENT' ? STUDENT_NAV_SECTIONS : [
          ...NAV_SECTIONS,
          ...(user?.role === 'SUPER_ADMIN' ? [{
            title: 'Super Admin Lab',
            items: [
              { label: 'Gestion Écoles',    href: '/admin/schools',       icon: <Landmark size={17}/> },
              { label: 'Santé Système',     href: '/admin/system-health', icon: <Activity size={17}/> },
              { label: 'Stress Test',       href: '/admin/stress-test',   icon: <Zap size={17}/> },
            ]
          }] : [])
        ]).map(section => (
          <div key={section.title}>
            <div className="nav-section-label">{section.title}</div>
            {section.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${isActive(item.href) ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive(item.href) && <ChevronRight size={14} className="nav-arrow" />}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{displayName}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Déconnexion">
          <LogOut size={15} />
        </button>
      </div>
    </>
  );

  return (
    <div className="layout-root">
      {/* Branding Injection */}
      {branding?.primaryColor && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${branding.primaryColor};
            --primary-dim: ${branding.primaryColor}22;
            --primary-light: ${branding.primaryColor}88;
          }
        `}} />
      )}

      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex'
          }} 
          onClick={() => setSidebarOpen(false)}
        >
          <div 
            className="sidebar"
            style={{ width: 'var(--sidebar-w)', height: '100%', borderRadius: 0 }} 
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Bar (Header) */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '16px 28px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-2)', flexShrink: 0
        }}>
          {/* Mobile Menu Trigger */}
          <button 
            id="mobile-menu-btn"
            aria-label="Ouvrir le menu"
            className="btn-icon" 
            style={{ display: 'none' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs / Page Title */}
          <nav aria-label="Fil d'Ariane" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {breadcrumbs.map((b, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>/</span>}
                    {b.href ? (
                      <Link href={b.href} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {b.label}
                      </Link>
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{b.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : title ? (
              <div>
                <h1 className="page-title" style={{ fontSize: '18px', marginBottom: 0 }}>{title}</h1>
                {subtitle && <p className="page-subtitle" style={{ fontSize: '12px' }}>{subtitle}</p>}
              </div>
            ) : null}
          </nav>

          {/* Top actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user?.role === 'SUPER_ADMIN' && user.schoolName && (
               <div role="alert" style={{ 
                 background: 'rgba(79, 142, 247, 0.1)', border: '1px solid rgba(79, 142, 247, 0.2)', 
                 padding: '4px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px'
               }}>
                  <ShieldAlert size={14} className="text-primary" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode Impersonnalisation</span>
               </div>
            )}
            {actions}
            <PushNotificationManager />
            <div className="flex items-center gap-3">
              {/* ── Notifications Dropdown ── */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full bg-bg-3/50 hover:bg-bg-3 border border-border/40">
                    <Bell size={18} />
                    {notifications.filter(n => n.priority === 'high').length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-bg-3" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[380px] bg-bg-3 border-border-light shadow-xl p-0 overflow-hidden rounded-xl">
                  <div className="p-4 border-b border-border flex justify-between items-center bg-bg-2/50">
                    <h3 className="font-bold text-sm">Centre d'Alertes</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">{notifications.length}</Badge>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifLoading ? (
                      <div className="p-8 text-center"><Loader2 size={24} className="spin mx-auto text-primary/40" /></div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-text-dim text-sm">
                        <Bell size={32} className="mx-auto mb-2 opacity-10" />
                        Aucune nouvelle notification
                      </div>
                    ) : notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => router.push(n.href)}
                        className="p-4 border-b border-border/40 cursor-pointer hover:bg-primary-surface transition-colors flex gap-3 group"
                      >
                         <span className="text-xl flex-shrink-0 grayscale group-hover:grayscale-0 transition-all">{typeIcon[n.type] || '🔔'}</span>
                         <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start gap-2">
                             <span className="text-xs font-bold text-text leading-tight">{n.title}</span>
                             <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: priorityColor[n.priority], boxShadow: `0 0 8px ${priorityColor[n.priority]}` }} />
                           </div>
                           <p className="text-[11px] text-text-muted mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-border bg-bg-2/30 text-center">
                    <Button variant="ghost" size="sm" className="text-[11px] font-bold text-primary w-full" onClick={loadNotifications}>
                      Actualiser les flux
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-4 w-[1px] bg-border mx-1" />

              {/* ── User Profile Dropdown ── */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1 h-auto flex items-center gap-2 hover:bg-bg-3 rounded-full border border-border/20 pr-3">
                    <div className="h-8 w-8 rounded-full bg-primary-grad flex items-center justify-center text-white font-black text-xs shadow-glow">
                      {user?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden sm:flex flex-col items-start text-left">
                       <span className="text-[11px] font-bold leading-none text-text">{user?.firstName}</span>
                       <span className="text-[9px] font-medium text-text-dim uppercase tracking-tighter mt-1">{user?.role}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-bg-3 border-border-light shadow-xl rounded-xl">
                  <DropdownMenuLabel className="text-xs text-text-muted">Mon Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer focus:bg-primary-surface">
                    <Users size={14} className="mr-2 text-primary" /> Profil & Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/chat')} className="cursor-pointer focus:bg-primary-surface">
                    <MessageSquare size={14} className="mr-2 text-emerald-400" /> Messagerie Interne
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-500">
                    <LogOut size={14} className="mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page-level header (title + actions) when breadcrumbs are shown */}
        {title && breadcrumbs && breadcrumbs.length > 0 && (
          <div className="page-header" style={{ padding: '24px 32px 0' }}>
            <div>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
          </div>
        )}

        <div className="page" style={{ flex: 1, overflowY: 'auto' }}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
          
          <footer style={{ 
            padding: '40px 40px', 
            textAlign: 'center', 
            marginTop: 'auto',
            borderTop: '1px solid var(--border)', 
            fontSize: '11px', 
            fontWeight: 500,
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div className="flex items-center gap-2">
              <span className="opacity-60">© {new Date().getFullYear()} SchoolERP Pro — Propulsion digitale par</span>
              <a 
                href="https://sahelmultiservices.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--primary)', 
                  fontWeight: 900, 
                  textDecoration: 'none', 
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  background: 'var(--primary-dim)',
                  borderRadius: '6px'
                }}
              >
                SAHEL MULTISERVICES
              </a>
            </div>
            <div className="text-[10px] opacity-30 font-black tracking-widest">
              INNOVATION • PERFORMANCE • EXCELLENCE
            </div>
          </footer>
        </div>
      </main>

      <AIDashboardAssistant />

      <style jsx>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: grid !important; }
          .sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
