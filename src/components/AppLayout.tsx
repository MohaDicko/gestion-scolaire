'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, School, BookOpen, CalendarCheck,
  Briefcase, FileText, Receipt, Clock, Settings, LogOut,
  ChevronRight, GraduationCap, BadgeDollarSign, BarChart3,
  UserCog, Menu, X, Bell, Award, ClipboardCheck, Landmark
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
    title: 'Administration',
    items: [
      { label: 'Utilisateurs',       href: '/users',          icon: <UserCog size={17}/> },
      { label: 'Paramètres',         href: '/settings',       icon: <Settings size={17}/> },
    ]
  }
];

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  /** The breadcrumb trail */
  breadcrumbs?: { label: string; href?: string }[];
}

export default function AppLayout({ children, title, subtitle, actions, breadcrumbs }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; role?: string; email?: string } | null>(null);

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

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'A';
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Utilisateur';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const Sidebar = () => (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <GraduationCap size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div className="logo-title">SchoolERP <span style={{ color: 'var(--primary)' }}>Pro</span></div>
          <div className="logo-school">Gestion scolaire</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.title}>
            <div className="nav-section-label">{section.title}</div>
            {section.items.map(item => (
              <div
                key={item.href}
                className={`nav-item${isActive(item.href) ? ' active' : ''}`}
                onClick={() => { router.push(item.href); setSidebarOpen(false); }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive(item.href) && <ChevronRight size={14} className="nav-arrow" />}
              </div>
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
    </div>
  );

  return (
    <div className="layout-root">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex'
        }} onClick={() => setSidebarOpen(false)}>
          <div style={{ width: 'var(--sidebar-w)', height: '100%', background: 'var(--bg-2)' }} onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '16px 28px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-2)', flexShrink: 0
        }}>
          {/* Mobile menu button */}
          <button
            className="btn-icon"
            style={{ display: 'none' }}
            onClick={() => setSidebarOpen(true)}
            id="mobile-menu-btn"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs */}
          <div style={{ flex: 1 }}>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                {breadcrumbs.map((b, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {i > 0 && <ChevronRight size={13} />}
                    {b.href ? (
                      <button
                        onClick={() => router.push(b.href!)}
                        style={{ color: i === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === breadcrumbs.length - 1 ? 600 : 400, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                      >{b.label}</button>
                    ) : (
                      <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === breadcrumbs.length - 1 ? 600 : 400 }}>{b.label}</span>
                    )}
                  </span>
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
            {actions}
            <button className="btn-icon" title="Notifications">
              <Bell size={18} />
            </button>
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
          </div>
        )}

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: grid !important; }
          .layout-root > .sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
