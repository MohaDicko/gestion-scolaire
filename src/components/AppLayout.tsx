'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, Users, School, BookOpenCheck, CalendarDays,
  Briefcase, FileSpreadsheet, ReceiptText, Clock, Settings, LogOut,
  ChevronRight, GraduationCap, BadgeDollarSign, BarChart3,
  UserCog, Menu, X, Bell, Award, ClipboardCheck, Landmark,
  Zap, Activity, ShieldAlert, Plus, PackageCheck, Loader2, MessageSquare,
  Moon, Sun, Search, Home, BookMarked, Coins, LibraryBig, ChevronDown, Hash,
  UserPlus, UserCheck, FileCheck2, Scale, Building2, ShieldCheck, Sliders,
  BookOpen, FileText, Receipt, Package
} from 'lucide-react';

import PushNotificationManager from './PushNotificationManager';
import { CommandPalette } from './ui/CommandPalette';
import { TourGuide } from './ui/TourGuide';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NavItem { label: string; href: string; icon: ReactNode; badge?: string; }
interface NavSection { title: string; items: NavItem[]; }

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Pilotage & État',
    items: [
      { label: 'Tableau de Bord', href: '/dashboard', icon: <LayoutDashboard size={16} strokeWidth={1.75} /> },
    ]
  },
  {
    title: 'Registre Scolarité',
    items: [
      { label: 'Inscriptions & Admissions', href: '/students/enroll', icon: <UserPlus size={16} strokeWidth={1.75} /> },
      { label: 'Fichier des Apprenants',   href: '/students',        icon: <GraduationCap size={16} strokeWidth={1.75} /> },
      { label: 'Planning & Horaires',      href: '/timetable',       icon: <CalendarDays size={16} strokeWidth={1.75} /> },
      { label: 'Émargement & Assiduité',   href: '/attendance',      icon: <UserCheck size={16} strokeWidth={1.75} /> },
    ]
  },
  {
    title: 'Pédagogie & Compétences',
    items: [
      { label: 'Cahier de Texte APC',      href: '/lessons',            icon: <BookOpenCheck size={16} strokeWidth={1.75} /> },
      { label: 'Relevés des Notes',        href: '/grades',             icon: <FileSpreadsheet size={16} strokeWidth={1.75} /> },
      { label: 'Bulletins & Décisions',    href: '/reports/bulletins',  icon: <FileCheck2 size={16} strokeWidth={1.75} /> },
      // NB: 'Relevé Compétences' est réservé aux établissements agro-pastoraux (AGRO)
      { label: 'Fonds Documentaire',       href: '/library',            icon: <LibraryBig size={16} strokeWidth={1.75} /> },
    ]
  },
  {
    title: 'Finances & Recouvrement',
    items: [
      { label: 'Facturation & Échéances',  href: '/invoices',    icon: <ReceiptText size={16} strokeWidth={1.75} /> },
      { label: 'Dépenses & Décaissements', href: '/expenses',    icon: <Scale size={16} strokeWidth={1.75} /> },
      { label: 'Bilan & Balance de Caisse',href: '/finance',     icon: <Landmark size={16} strokeWidth={1.75} /> },
    ]
  },
  {
    title: 'Administration & Tutelle',
    items: [
      { label: 'Corps Formateurs (RH)',    href: '/employees',   icon: <Briefcase size={16} strokeWidth={1.75} /> },
      { label: 'Filières & Référentiels',  href: '/classrooms',  icon: <Building2 size={16} strokeWidth={1.75} /> },
      { label: 'Matériels & Inventaire',   href: '/inventory',   icon: <PackageCheck size={16} strokeWidth={1.75} /> },
      { label: 'Registres d\'Audit État',  href: '/admin/audit', icon: <ShieldCheck size={16} strokeWidth={1.75} /> },
      { label: 'Configuration Système',    href: '/settings',    icon: <Sliders size={16} strokeWidth={1.75} /> },
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
interface Notification { id: string; type: string; priority: 'high'|'medium'|'low'; title: string; message: string; href: string; }

const ROLE_LABELS: Record<string, string> = {
  SCHOOL_ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Super Admin',
  TEACHER: 'Formateur',
  STUDENT: 'Apprenant',
  PARENT: 'Parent',
};

const typeIcon: Record<string, string> = { finance: '💰', hr: '👤', attendance: '📋', system: '⚙️' };

export default function AppLayout({ children, title, subtitle, actions, breadcrumbs }: AppLayoutProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{firstName?:string;lastName?:string;role?:string;email?:string;schoolName?:string}|null>(null);
  const [branding, setBranding] = useState<{primaryColor?:string;logoUrl?:string;name?:string}|null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading]   = useState(false);
  const [isDark, setIsDark]               = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  // Type d'école — conditionne l'affichage de certains modules (ex: Relevé de Compétences)
  const [schoolType, setSchoolType] = useState<string | null>(null);

  // Le système modulaire et le relevé de compétences concernent uniquement AGRO.
  const RELEVE_COMPETENCES_SCHOOL_TYPES = ['AGRO'];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    const hk = (e: KeyboardEvent) => { if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); setIsCommandPaletteOpen(true); } };
    window.addEventListener('keydown', hk);

    // Offline / Online detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('keydown', hk);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) { root.classList.remove('dark'); localStorage.setItem('theme','light'); setIsDark(false); }
    else { root.classList.add('dark'); localStorage.setItem('theme','dark'); setIsDark(true); }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) setUser(JSON.parse(stored));
      fetch('/api/school/config').then(r=>r.json()).then(d=>{
        if(d&&(d.primaryColor||d.name)) setBranding(d);
        if(d?.type) setSchoolType(d.type);
      }).catch(()=>{});
    } catch {}
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try { const r=await fetch('/api/notifications'); if(r.ok){const d=await r.json();setNotifications(d.notifications||[]);} } catch {}
    finally { setNotifLoading(false); }
  }, []);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout',{method:'POST'}); } catch {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const initials = user ? `${user.firstName?.[0]||''}${user.lastName?.[0]||''}`.toUpperCase() : 'A';
  const displayName = user ? `${user.firstName||''} ${user.lastName||''}`.trim() : 'Utilisateur';
  const roleLabel = user?.role ? (ROLE_LABELS[user.role] || user.role) : '';

  // Injecter le lien "Relevé Compétences" uniquement pour les écoles AGRO
  const isReleveCompetencesVisible = schoolType !== null && RELEVE_COMPETENCES_SCHOOL_TYPES.includes(schoolType);

  const navSectionsWithSchoolType: NavSection[] = NAV_SECTIONS.map(section => {
    if (section.title === 'Pédagogie') {
      const items = [...section.items];
      const bulletinsIdx = items.findIndex(i => i.href === '/reports/bulletins');
      if (isReleveCompetencesVisible && !items.find(i => i.href === '/reports/releve-competences')) {
        items.splice(bulletinsIdx + 1, 0, {
          label: 'Relevé Compétences',
          href: '/reports/releve-competences',
          icon: <FileText size={16}/>,
        });
      }
      return { ...section, items };
    }
    return section;
  });

  const navSections: NavSection[] = user?.role === 'STUDENT' ? STUDENT_NAV : user?.role === 'PARENT' ? PARENT_NAV : [
    ...navSectionsWithSchoolType,
    ...(user?.role === 'SUPER_ADMIN' ? [{ title: '⚡ Super Admin', items: [
      { label: 'Gestion Écoles',  href: '/admin/schools',       icon: <Landmark size={16}/> },
      { label: 'Santé Système',   href: '/admin/system-health', icon: <Activity size={16}/> },
      { label: 'Stress Test',     href: '/admin/stress-test',   icon: <Zap size={16}/> },
    ]}] : [])
  ];

  /* ── SIDEBAR CONTENT ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden fiori-sidebar" style={{ background: 'var(--bg-2)', color: 'var(--text)' }}>
      
      {/* Government & State Official Header */}
      <div style={{
        padding: '16px 16px 14px',
        borderBottom: '1px solid var(--border-md)',
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(0, 112, 242, 0.03) 0%, transparent 100%)',
      }}>
        {/* Mali flag top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3.5px',
          background: 'linear-gradient(90deg, #14A44D 33.3%, #FCD116 33.3% 66.6%, #CE1126 66.6%)',
        }} />
        
        <div className="flex items-start gap-3 mt-1.5">
          {/* Institutional Shield Badge */}
          <div style={{
            width: 42, height: 42, borderRadius: 8,
            background: 'linear-gradient(135deg, #0a3b7b 0%, #0070f2 100%)',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 2px 6px rgba(10, 59, 123, 0.25)',
            flexShrink: 0, position: 'relative', border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <Landmark size={22} color="#ffffff" strokeWidth={1.75} />
          </div>
          
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#0a3b7b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                RÉPUBLIQUE DU MALI
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', lineHeight: 1.25, marginTop: 1, letterSpacing: '-0.2px' }} className="truncate">
              {branding?.name ? branding.name.toUpperCase() : (user?.schoolName ? user.schoolName.toUpperCase() : 'ÉTABLISSEMENT NATIONAL')}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, background: 'rgba(0, 112, 242, 0.08)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(0, 112, 242, 0.2)' }}>
              <ShieldCheck size={11} color="#0070f2" strokeWidth={2} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#0070f2', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {schoolType === 'SANTE' ? 'FIO-ERP • SANTÉ & PARAMÉDICAL' : 'FIO-ERP • APC ÉTAT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links with Fiori Active Border Indicator */}
      <nav aria-label="Navigation principale" style={{ flex: 1, padding: '8px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navSections.map(section => (
          <div key={section.title} style={{ marginBottom: 4 }}>
            <div className="fiori-section-label">
              {section.title}
            </div>
            {section.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`fiori-nav-item ${active ? 'active' : ''}`}
                >
                  <span className="fiori-icon">
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      background: '#0070f2', color: '#fff', borderRadius: 3,
                      fontSize: 9, fontWeight: 700, padding: '1px 5px', letterSpacing: '0.04em',
                    }}>{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Institutional User & Agent Footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid var(--border-md)',
        background: 'var(--bg-4)',
      }}>
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 34, height: 34, borderRadius: 6,
            background: 'linear-gradient(135deg, #0070f2 0%, #0a3b7b 100%)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontSize: 12, fontWeight: 800,
            flexShrink: 0, letterSpacing: '-0.3px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#107e3e' }} />
              <span style={{ fontSize: 9.5, color: '#556b82', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {roleLabel} • MAT: AG-2025
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion sécurisée"
            aria-label="Déconnexion"
            style={{
              width: 30, height: 30, borderRadius: 6, display: 'grid', placeItems: 'center',
              color: '#556b82', transition: 'all 0.15s', background: 'none', border: '1px solid transparent', cursor: 'pointer',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(187, 0, 0, 0.08)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(187, 0, 0, 0.2)';
              (e.currentTarget as HTMLElement).style.color = '#bb0000';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'none';
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#556b82';
            }}
          >
            <LogOut size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>

      {/* ── Desktop Sidebar ── */}
      <aside style={{ width: 260, height: '100%', flexShrink: 0, padding: '10px 0 10px 10px' }} className="hidden lg:block">
        <div style={{
          width: '100%', height: '100%', borderRadius: 18,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          position: 'relative',
        }}>
          <SidebarContent />
        </div>
      </aside>

      {/* ── Mobile Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(8,12,24,0.7)', backdropFilter: 'blur(8px)' }}
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              style={{ width: '80%', maxWidth: 300, height: '100%', background: 'var(--bg-2)', boxShadow: 'var(--shadow-xl)' }}
              onClick={e => e.stopPropagation()}
            >
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Area ── */}
      <main id="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: 'clamp(6px, 1.5vw, 12px)', paddingLeft: 'clamp(4px, 1vw, 6px)', overflow: 'hidden', minWidth: 0 }}>
        <div style={{
          flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-2)', borderRadius: 'clamp(12px, 2vw, 18px)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          position: 'relative',
        }}>

          {/* ── OFFLINE BANNER ── */}
          {isOffline && (
            <div style={{
              background: '#ef4444', color: 'white', padding: '6px 12px',
              fontSize: '12px', fontWeight: 600, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '8px',
              zIndex: 40
            }}>
              <span>⚠️ Vous êtes hors-ligne. Vos modifications seront synchronisées une fois la connexion rétablie.</span>
            </div>
          )}

          {/* ── TOP HEADER (SAP FIORI SHELLBAR) ── */}
          <header className="fiori-shellbar" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 clamp(12px, 2vw, 20px)', height: '56px',
            background: 'var(--bg-2)',
            borderBottom: '1px solid var(--border-md)',
            flexShrink: 0, zIndex: 30,
            position: 'sticky', top: 0,
            gap: 12,
          }}>
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
                aria-label="Ouvrir le menu de navigation"
                title="Ouvrir le menu"
                style={{ padding: 6, borderRadius: 6, color: '#556b82', transition: 'all 0.15s', background: 'none', border: '1px solid var(--border-md)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <Menu size={20} strokeWidth={1.75} />
              </button>

              {/* Breadcrumb / Title Fiori */}
              <div className="hidden sm:flex items-center gap-2 min-w-0">
                {breadcrumbs && breadcrumbs.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    {breadcrumbs.map((b, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <ChevronRight size={13} style={{ color: '#556b82' }} />}
                        {b.href ? (
                          <Link href={b.href} style={{ fontWeight: 600, color: '#556b82' }}
                            className="hover:text-blue-600 transition-colors">
                            {b.label}
                          </Link>
                        ) : (
                          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{b.label}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : title ? (
                  <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
                    {title}
                  </h1>
                ) : null}

                {/* Government Official Badges */}
                <div className="hidden xl:flex items-center gap-2 ml-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                  <span className="fiori-badge fiori-badge-info">
                    EXERCICE 2025 - 2026
                  </span>
                  <span className="fiori-badge fiori-badge-positive">
                    <ShieldCheck size={11} strokeWidth={2} />
                    {schoolType === 'SANTE' ? 'AGRÉMENT SANTÉ MSHP • CYCLE DIPLÔMANT' : 'RÉFÉRENTIEL APC CONFORME'}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT ACTIONS (FIORI SHELLBAR TOOLS) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Institutional Search Bar */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2"
                aria-label="Recherche rapide de dossiers"
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12.5, fontWeight: 500,
                  color: 'var(--text-muted)', background: 'var(--bg-4)',
                  border: '1px solid var(--border-md)',
                  cursor: 'pointer', transition: 'all 0.15s', width: 230,
                }}
              >
                <Search size={14} strokeWidth={1.75} style={{ color: '#556b82' }} />
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Rechercher dossier, élève...
                </span>
                <kbd style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, background: 'var(--bg-2)', padding: '1px 4px', borderRadius: 3, border: '1px solid var(--border-md)' }}>⌘K</kbd>
              </button>

              {user?.role === 'SUPER_ADMIN' && user.schoolName && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 8px', borderRadius: 4,
                  background: 'rgba(0, 112, 242, 0.08)',
                  border: '1px solid rgba(0, 112, 242, 0.25)',
                }} className="hidden lg:flex">
                  <ShieldAlert size={12} strokeWidth={2} style={{ color: '#0070f2' }} />
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: '#0070f2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supervision État</span>
                </div>
              )}

              {actions}

              {/* Theme Toggle */}
              <button onClick={toggleTheme} aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'} title={isDark ? 'Thème clair' : 'Thème sombre'} style={{
                width: 36, height: 36, borderRadius: 9,
                display: 'grid', placeItems: 'center',
                color: 'var(--text-muted)', background: 'none',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button style={{
                    width: 36, height: 36, borderRadius: 9, position: 'relative',
                    display: 'grid', placeItems: 'center', color: 'var(--text-muted)',
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                    aria-label="Afficher les notifications"
                    title="Notifications"
                    onClick={loadNotifications}
                  >
                    <Bell size={17} />
                    {notifications.filter(n => n.priority === 'high').length > 0 && (
                      <span style={{
                        position: 'absolute', top: 7, right: 7,
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#ef4444', border: '2px solid var(--bg-3)',
                      }} />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{ width: 320, padding: 0, borderRadius: 16, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-md)', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', background: 'var(--bg-4)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 14, fontFamily: 'var(--font-sans), sans-serif' }}>Notifications</span>
                    <span style={{ background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '2px 8px' }}>{notifications.length}</span>
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifLoading ? (
                      <div style={{ padding: 40, textAlign: 'center' }}>
                        <Loader2 size={22} className="animate-spin" style={{ margin: '0 auto', color: 'var(--primary)' }} />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
                        <Bell size={28} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                        Aucune notification
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} onClick={() => router.push(n.href)}
                        style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'background 0.15s' }}
                        className="hover:bg-primary-surface"
                      >
                        <span style={{ fontSize: 18 }}>{typeIcon[n.type] || '🔔'}</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{n.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '4px 10px 4px 4px', borderRadius: 11,
                    background: 'var(--bg-4)', border: '1.5px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'var(--primary-grad)',
                      display: 'grid', placeItems: 'center',
                      color: '#fff', fontSize: 11, fontWeight: 800,
                    }}>{initials}</div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      className="hidden md:block"
                    >{user?.firstName || 'Admin'}</span>
                    <ChevronDown size={13} style={{ color: 'var(--text-dim)' }} className="hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{ width: 220, borderRadius: 16, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-md)', overflow: 'hidden', padding: 0 }}>
                  <div style={{ padding: '14px 16px', background: 'var(--bg-4)', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{displayName}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{user?.email}</p>
                    <span style={{ display: 'inline-block', marginTop: 6, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', background: 'var(--primary-dim)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 99 }}>
                      {roleLabel}
                    </span>
                  </div>
                  <div style={{ padding: 6 }}>
                    <DropdownMenuItem onClick={() => router.push('/profile')} style={{ borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                      <Users size={14} style={{ color: 'var(--primary)' }} /> Mon Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/settings')} style={{ borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                      <Settings size={14} style={{ color: 'var(--text-muted)' }} /> Paramètres
                    </DropdownMenuItem>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <DropdownMenuItem onClick={handleLogout} style={{ borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>
                      <LogOut size={14} /> Déconnexion
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* ── PAGE CONTENT ── */}
          <div className="app-content-scroll" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
            {/* Page title block */}
            {(title || subtitle) && (
              <div style={{
                padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 28px) 0',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-2)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Subtle gradient accent */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(135deg, rgba(30,58,138,0.03) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }} />
                
                {/* Breadcrumbs inside page */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, position: 'relative' }}>
                    {breadcrumbs.map((b, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <ChevronRight size={12} style={{ color: 'var(--text-dim)' }} />}
                        {b.href ? (
                          <Link href={b.href} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', transition: 'color 0.15s' }}>
                            {b.label}
                          </Link>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{b.label}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingBottom: 'clamp(12px, 2vw, 18px)', flexWrap: 'wrap', position: 'relative' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h1 style={{
                      fontSize: 'clamp(17px, 2.5vw, 22px)', fontWeight: 900, color: 'var(--text)',
                      fontFamily: 'var(--font-sans), sans-serif', letterSpacing: '-0.5px', lineHeight: 1.2,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {title}
                    </h1>
                    {subtitle && (
                      <p style={{ fontSize: 'clamp(11px, 1.5vw, 13px)', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                        {subtitle}
                      </p>
                    )}
                    {/* Mali underline accent */}
                    <div style={{
                      display: 'block', width: 36, height: 3, borderRadius: 99,
                      background: 'linear-gradient(90deg, #14A44D 33%, #FCD116 33% 66%, #CE1126 66%)',
                      marginTop: 8,
                    }} />
                  </div>
                  {actions && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
                      {actions}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Children */}
            <div className="app-page-content" style={{ padding: 'clamp(16px, 2.5vw, 24px) clamp(16px, 3vw, 28px)', minHeight: 'calc(100% - 200px)' }}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {children}
              </motion.div>
            </div>

            {/* Footer */}
            <footer style={{
              padding: '16px 28px',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 8,
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
                © {new Date().getFullYear()} SahelEdu.pro — Plateforme Nationale de Gestion Scolaire du Mali
              </p>
              <a href="https://sahelmultiservices.com" style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>
                SAHEL MULTISERVICES
              </a>
            </footer>
          </div>
        </div>
      </main>

      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
      <TourGuide />
    </div>
  );
}
