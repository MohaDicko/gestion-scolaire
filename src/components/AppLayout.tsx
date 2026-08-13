'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, Users, School, BookOpen, CalendarCheck,
  Briefcase, FileText, Receipt, Clock, Settings, LogOut,
  ChevronRight, GraduationCap, BadgeDollarSign, BarChart3,
  UserCog, Menu, X, Bell, Award, ClipboardCheck, Landmark,
  Zap, Activity, ShieldAlert, Plus, Package, Loader2, MessageSquare,
  Moon, Sun, Search, Home, BookMarked, Coins, LibraryBig, ChevronDown, Hash
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
    title: 'Vue Générale',
    items: [
      { label: 'Tableau de Bord', href: '/dashboard', icon: <LayoutDashboard size={16}/> },
    ]
  },
  {
    title: 'Scolarité',
    items: [
      { label: 'Inscriptions',       href: '/students/enroll', icon: <Plus size={16}/> },
      { label: 'Apprenants',         href: '/students',        icon: <Users size={16}/> },
      { label: 'Emploi du Temps',    href: '/timetable',       icon: <Clock size={16}/> },
      { label: 'Présences',          href: '/attendance',      icon: <CalendarCheck size={16}/> },
    ]
  },
  {
    title: 'Pédagogie',
    items: [
      { label: 'Cahier de Texte',    href: '/lessons',            icon: <BookOpen size={16}/> },
      { label: 'Saisie des Notes',   href: '/grades',             icon: <FileText size={16}/> },
      { label: 'Bulletins',          href: '/reports/bulletins',  icon: <Award size={16}/> },
      { label: 'Bibliothèque',       href: '/library',            icon: <LibraryBig size={16}/> },
    ]
  },
  {
    title: 'Finances',
    items: [
      { label: 'Facturation',        href: '/invoices',    icon: <Receipt size={16}/> },
      { label: 'Dépenses',           href: '/expenses',    icon: <Coins size={16}/> },
      { label: 'Bilan Financier',    href: '/finance',     icon: <Landmark size={16}/> },
    ]
  },
  {
    title: 'Administration',
    items: [
      { label: 'Personnel (RH)',     href: '/employees',   icon: <Briefcase size={16}/> },
      { label: 'Classes & Modules',  href: '/classrooms',  icon: <School size={16}/> },
      { label: 'Inventaire',         href: '/inventory',   icon: <Package size={16}/> },
      { label: 'Paramètres',         href: '/settings',    icon: <Settings size={16}/> },
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    const hk = (e: KeyboardEvent) => { if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); setIsCommandPaletteOpen(true); } };
    window.addEventListener('keydown', hk);
    return () => window.removeEventListener('keydown', hk);
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
      fetch('/api/school/config').then(r=>r.json()).then(d=>{if(d&&(d.primaryColor||d.name))setBranding(d);}).catch(()=>{});
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

  const navSections = user?.role === 'STUDENT' ? STUDENT_NAV : user?.role === 'PARENT' ? PARENT_NAV : [
    ...NAV_SECTIONS,
    ...(user?.role === 'SUPER_ADMIN' ? [{ title: '⚡ Super Admin', items: [
      { label: 'Gestion Écoles',  href: '/admin/schools',       icon: <Landmark size={16}/> },
      { label: 'Santé Système',   href: '/admin/system-health', icon: <Activity size={16}/> },
      { label: 'Stress Test',     href: '/admin/stress-test',   icon: <Zap size={16}/> },
    ]}] : [])
  ];

  /* ── SIDEBAR CONTENT ── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-2)', color: 'var(--text)' }}>
      
      {/* Logo Area */}
      <div style={{
        padding: '18px 18px 14px',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
      }}>
        {/* Mali flag top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #14A44D 33%, #FCD116 33% 66%, #CE1126 66%)',
        }} />
        
        <div className="flex items-center gap-3 mt-1">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--primary-grad)',
            display: 'grid', placeItems: 'center',
            boxShadow: 'var(--shadow-glow)',
            flexShrink: 0, overflow: 'hidden', position: 'relative',
          }}>
            <GraduationCap size={20} color="white" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px', lineHeight: 1.2, color: 'var(--text)' }}>
              SahelEdu<span style={{ color: 'var(--primary)' }}>.pro</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
              {branding?.name || user?.schoolName || 'Plateforme Éducative Mali'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {navSections.map(section => (
          <div key={section.title} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 9, fontWeight: 800, color: 'var(--text-dim)',
              textTransform: 'uppercase', letterSpacing: '0.14em',
              padding: '12px 10px 4px',
            }}>
              {section.title}
            </div>
            {section.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10, marginBottom: 1,
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    background: active ? 'var(--primary-dim)' : 'transparent',
                    transition: 'all 0.18s var(--ease)',
                    position: 'relative',
                    textDecoration: 'none',
                  }}
                  className="group nav-link-item"
                >
                  <span style={{ color: active ? 'var(--primary)' : 'var(--text-dim)', flexShrink: 0, transition: 'color 0.18s' }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      background: 'var(--primary)', color: '#fff', borderRadius: 99,
                      fontSize: 9, fontWeight: 800, padding: '1px 6px',
                    }}>{item.badge}</span>
                  )}
                  {active && (
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{
        padding: '12px 12px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-4)',
      }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--primary-grad)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontSize: 13, fontWeight: 800,
            boxShadow: '0 2px 8px var(--primary-glow)',
            flexShrink: 0, letterSpacing: '-0.5px',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {roleLabel}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center',
            color: 'var(--text-dim)', transition: 'all 0.15s', background: 'none', border: 'none', cursor: 'pointer',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Desktop Sidebar ── */}
      <aside style={{ width: 260, height: '100%', flexShrink: 0, padding: '12px 0 12px 12px' }} className="hidden lg:block">
        <div style={{
          width: '100%', height: '100%', borderRadius: 20,
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 12px 12px 6px', overflow: 'hidden', minWidth: 0 }} className="lg:block">
        <div style={{
          flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
          background: 'var(--bg-2)', borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          position: 'relative',
        }}>

          {/* ── TOP HEADER ── */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', height: 58,
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0, zIndex: 30,
            position: 'sticky', top: 0,
          }}>
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
                style={{ padding: 6, borderRadius: 9, color: 'var(--text-muted)', transition: 'all 0.15s', background: 'none', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <Menu size={22} />
              </button>

              {/* Page Title / Breadcrumbs */}
              <div className="hidden sm:block">
                {breadcrumbs && breadcrumbs.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {breadcrumbs.map((b, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <ChevronRight size={13} style={{ color: 'var(--text-dim)' }} />}
                        {b.href ? (
                          <Link href={b.href} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}
                            className="hover:text-primary transition-colors">
                            {b.label}
                          </Link>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{b.label}</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : title ? (
                  <h1 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.3px' }}>
                    {title}
                  </h1>
                ) : null}
              </div>
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2"
                style={{
                  padding: '7px 12px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                  color: 'var(--text-muted)', background: 'var(--bg-4)',
                  border: '1.5px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.18s', width: 200,
                  gap: 8, display: 'flex', alignItems: 'center',
                }}
              >
                <Search size={14} />
                <span style={{ flex: 1, textAlign: 'left' }}>Rechercher...</span>
                <kbd style={{ fontSize: 10, fontWeight: 700, opacity: 0.5, fontFamily: 'monospace' }}>⌘K</kbd>
              </button>

              {user?.role === 'SUPER_ADMIN' && user.schoolName && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 8,
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }} className="hidden lg:flex">
                  <ShieldAlert size={12} style={{ color: '#3b82f6' }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Impersonation</span>
                </div>
              )}

              {actions}

              {/* Theme Toggle */}
              <button onClick={toggleTheme} style={{
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
                    <span style={{ fontWeight: 800, fontSize: 14, fontFamily: 'Outfit, sans-serif' }}>Notifications</span>
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
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
            {/* Page title block */}
            {(title || subtitle) && (
              <div style={{
                padding: '24px 28px 0',
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
                
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, paddingBottom: 18, flexWrap: 'wrap', position: 'relative' }}>
                  <div>
                    <h1 style={{
                      fontSize: 22, fontWeight: 900, color: 'var(--text)',
                      fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.6px', lineHeight: 1.2,
                    }}>
                      {title}
                    </h1>
                    {subtitle && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {actions}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Children */}
            <div style={{ padding: '24px 28px', minHeight: 'calc(100% - 200px)' }}>
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
