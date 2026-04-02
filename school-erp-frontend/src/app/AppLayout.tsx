import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AiAssistant } from '../components/AiAssistant';
import { NotificationBell } from '../components/NotificationBell';
import { GlobalSearch } from '../components/GlobalSearch';
import { ToastContainer } from '../components/ToastContainer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
    LayoutDashboard, Users, BookOpen, GraduationCap, Briefcase, UserCheck, Clock,
    FileText, Calendar, DollarSign, LogOut, School, ChevronRight, CreditCard,
    Wallet, Sun, Moon, TrendingDown, BarChart2, Bell, Settings, Sparkles
} from 'lucide-react';

const navItems = [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Accountant', 'HR_Manager', 'Student'] },
    { label: 'Calendrier', icon: Calendar, path: '/calendar', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Accountant', 'HR_Manager', 'Student'] },
    { label: 'SCOLARITÉ', header: true },
    { label: 'Élèves', icon: Users, path: '/academic/students', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher'] },
    { label: 'Cartes Scolaires', icon: CreditCard, path: '/academic/cards', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher'] },
    { label: 'Classes', icon: BookOpen, path: '/academic/classrooms', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher'] },
    { label: 'Notes', icon: GraduationCap, path: '/academic/grades', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher'] },
    { label: 'Emplois du temps', icon: Clock, path: '/academic/timetable', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Student'] },
    { label: 'Présences', icon: UserCheck, path: '/academic/attendance', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher'] },
    { label: 'Inscriptions', icon: FileText, path: '/academic/enrollments', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher'] },
    { label: 'FINANCE', header: true },
    { label: "Vue d'ensemble", icon: BarChart2, path: '/finance', roles: ['SuperAdmin', 'SchoolAdmin', 'Accountant'] },
    { label: 'Factures', icon: FileText, path: '/finance/invoices', roles: ['SuperAdmin', 'SchoolAdmin', 'Accountant'] },
    { label: 'Paiements', icon: Wallet, path: '/finance/payments', roles: ['SuperAdmin', 'SchoolAdmin', 'Accountant'] },
    { label: 'Dépenses', icon: TrendingDown, path: '/finance/expenses', roles: ['SuperAdmin', 'SchoolAdmin', 'Accountant'] },
    { label: 'RESSOURCES HUMAINES', header: true },
    { label: 'Employés', icon: Briefcase, path: '/hr/employees', roles: ['SuperAdmin', 'SchoolAdmin', 'HR_Manager'] },
    { label: 'Contrats', icon: FileText, path: '/hr/contracts', roles: ['SuperAdmin', 'SchoolAdmin', 'HR_Manager'] },
    { label: 'Congés', icon: Calendar, path: '/hr/leaves', roles: ['SuperAdmin', 'SchoolAdmin', 'HR_Manager'] },
    { label: 'Présences Staff', icon: UserCheck, path: '/hr/attendance', roles: ['SuperAdmin', 'SchoolAdmin', 'HR_Manager'] },
    { label: 'PAIE', header: true },
    { label: 'Salaires & Fiches', icon: DollarSign, path: '/payroll/runs', roles: ['SuperAdmin', 'SchoolAdmin', 'HR_Manager', 'Accountant'] },
    { label: 'ADMINISTRATION', header: true },
    { label: 'Utilisateurs', icon: Users, path: '/admin/users', roles: ['SuperAdmin', 'SchoolAdmin'] },
    { label: 'Notifications', icon: Bell, path: '/notifications/send', roles: ['SuperAdmin', 'SchoolAdmin'] },
    { label: 'Rapport Annuel', icon: FileText, path: '/reports/annual', roles: ['SuperAdmin', 'SchoolAdmin', 'Accountant'] },
    { label: 'Requêtes Smart', icon: Sparkles, path: '/reports/smart', roles: ['SuperAdmin', 'SchoolAdmin', 'Accountant', 'HR_Manager'] },
    { label: 'Paramètres', icon: Settings, path: '/settings', roles: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Accountant', 'HR_Manager', 'Student'] },
];

export function AppLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [theme, setTheme] = useState<'light' | 'dark'>(
        (localStorage.getItem('theme') as 'light' | 'dark') || 'dark'
    );

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleLogout = () => { logout(); navigate('/login'); };
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    return (
        <div className="layout-root">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon"><School size={22} /></div>
                    <div>
                        <p className="logo-title">SchoolERP</p>
                        <p className="logo-school">{user?.schoolName || 'Portail'}</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, idx) =>
                        item.header ? (
                            <p key={idx} className="nav-section-label">{item.label}</p>
                        ) : (
                            <NavLink
                                key={item.path}
                                to={item.path!}
                                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                            >
                                {item.icon && <item.icon size={18} />}
                                <span>{item.label}</span>
                                <ChevronRight size={14} className="nav-arrow" />
                            </NavLink>
                        )
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
                        <div>
                            <p className="user-name">{user?.firstName} {user?.lastName}</p>
                            <p className="user-role">{user?.role}</p>
                        </div>
                    </div>
                    <button onClick={toggleTheme} className="logout-btn" title="Changer de thème" style={{ marginRight: '-4px' }}>
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <NotificationBell />
                    <button onClick={handleLogout} className="logout-btn" title="Déconnexion">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Top bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'rgba(24, 24, 27, 0.4)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', alignSelf: 'center' }}>{/* Optional Title Placeholder */}</div>
                    <GlobalSearch />
                </div>
                <div style={{ flex: 1, paddingBottom: '20px' }}>
                    <Outlet />
                </div>
            </main>
            <AiAssistant />
            <ToastContainer />
            <ConfirmDialog />
        </div>
    );
}
