'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import React, { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Users, School, BookOpen, CalendarCheck,
  Briefcase, FileText, Receipt, Clock, Settings, LogOut,
  ChevronRight, GraduationCap, BadgeDollarSign, BarChart3,
  UserCog, Menu, X, Bell, Award, ClipboardCheck, Landmark,
  Zap, Activity, ShieldAlert
} from 'lucide-react';

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
    title: 'Académique',
    items: [
      { label: 'Élèves & Scolarité', href: '/students',       icon: <Users size={17}/> },
      { label: 'Classes',            href: '/classrooms',     icon: <School size={17}/> },
      { label: 'Matières',           href: '/subjects',       icon: <BookOpen size={17}/> },
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
      { label: 'Bilan Financier',    href: '/finance',        icon: <Landmark size={17}/> },
      { label: 'Factures & Frais',   href: '/invoices',       icon: <Receipt size={17}/> },
      { label: 'Dépenses',           href: '/expenses',       icon: <BarChart3 size={17}/> },
    ]
  },
  {
    title: 'Analytics & BI',
    items: [
      { label: 'Tableau de Bord BI', href: '/reports',        icon: <BarChart3 size={17}/> },
      { label: 'Bulletins de Notes', href: '/reports/bulletins', icon: <Award size={17}/> },
      { label: 'Piste d\'Audit',     href: '/settings/audit', icon: <ShieldAlert size={17}/> },
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
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon"><GraduationCap size={22} /></div>
        <div>
          <div className="logo-title">SchoolERP <span style={{ color: 'var(--primary)' }}>Pro</span></div>
          <div className="logo-school" style={{ color: user?.schoolName ? 'var(--primary)' : 'var(--text-dim)', fontWeight: user?.schoolName ? 700 : 500 }}>
            {user?.schoolName || 'Mali Educational System'}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
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
        {/* Top Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '16px 28px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-2)', flexShrink: 0
        }}>
          {/* Mobile Menu Trigger */}
          <button 
            id="mobile-menu-btn"
            className="btn-icon" 
            style={{ display: 'none' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs / Page Title */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          </div>

          {/* Top actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user?.role === 'SUPER_ADMIN' && user.schoolName && (
               <div style={{ 
                 background: 'rgba(79, 142, 247, 0.1)', border: '1px solid rgba(79, 142, 247, 0.2)', 
                 padding: '4px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px'
               }}>
                  <ShieldAlert size={14} className="text-primary" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode Impersonnalisation</span>
               </div>
            )}
            {actions}
            {/* ── Notification Bell ── */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                className="btn-icon"
                title="Notifications"
                onClick={() => { setNotifOpen(o => !o); if (!notifOpen) loadNotifications(); }}
                style={{ position: 'relative' }}
              >
                <Bell size={18} />
                {notifications.filter(n => n.priority === 'high').length > 0 && (
                  <span style={{
                    position: 'absolute', top: '2px', right: '2px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#ef4444', border: '1.5px solid white'
                  }} />
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '360px', background: 'white', borderRadius: '16px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9',
                  zIndex: 100, overflow: 'hidden'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Notifications</span>
                    <span style={{ background: '#f1f5f9', padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{notifications.length}</span>
                  </div>
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {notifLoading ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Chargement...</div>
                    ) : notifications.length === 0 ? (
                      <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        <Bell size={28} style={{ marginBottom: '8px', opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                        Aucune notification
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id}
                        onClick={() => { router.push(n.href); setNotifOpen(false); }}
                        style={{ padding: '14px 20px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                      >
                        <span style={{ fontSize: '20px', flexShrink: 0, lineHeight: 1 }}>{typeIcon[n.type] || '🔔'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', lineHeight: 1.3 }}>{n.title}</span>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: priorityColor[n.priority], flexShrink: 0, marginTop: '4px' }} />
                          </div>
                          <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                    <button onClick={loadNotifications} style={{ fontSize: '12px', color: '#4f8ef7', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Actualiser</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
            <button className="btn-icon" onClick={handleLogout} title="Déconnexion" style={{ color: 'var(--danger)' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>

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
          {children}
        </div>
      </main>

      <style jsx>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: grid !important; }
          .sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
