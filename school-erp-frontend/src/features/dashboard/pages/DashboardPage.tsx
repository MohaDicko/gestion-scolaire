import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { FinancialChart } from '../components/FinancialChart';
import {
    Users, Briefcase, GraduationCap, CreditCard, Sparkles,
    TrendingUp, BookOpen, ArrowUpRight, Wallet
} from 'lucide-react';

const recentActivity = [
    { action: 'Nouvelle inscription', detail: 'Amadou Diallo — 6ème A', time: 'il y a 2h', color: '#6366f1' },
    { action: 'Contrat signé', detail: 'Fatoumata Koné — CDI', time: 'il y a 5h', color: '#10b981' },
    { action: 'Congé approuvé', detail: 'Ibrahim Coulibaly — 5j', time: 'hier', color: '#f59e0b' },
    { action: 'Paie finalisée', detail: 'Mars 2026 — 87 fiches', time: 'juste maintenant', color: '#ec4899' },
];

export function DashboardPage() {
    const { user } = useAuthStore();
    const { data: stats, isLoading } = useDashboardStats();

    const statsConfig = [
        { label: 'Élèves inscrits', value: stats?.totalStudents ?? 0, icon: Users, color: '#6366f1' },
        { label: 'Employés actifs', value: stats?.totalEmployees ?? 0, icon: Briefcase, color: '#10b981' },
        { label: 'Classes ouvertes', value: stats?.totalClassrooms ?? 0, icon: BookOpen, color: '#f59e0b' },
        { label: 'Impayés (FCFA)', value: stats?.totalArrearsAmount ?? 0, icon: Wallet, color: '#ef4444' },
    ];

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tableau de bord</h1>
                    <p className="page-subtitle">Bienvenue, {user?.firstName} — Vue d'ensemble de {user?.schoolName || 'votre école'}</p>
                </div>
                <div className="badge-role">{user?.role}</div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statsConfig.map(stat => (
                    <div key={stat.label} className="stat-card">
                        <div className="stat-icon" style={{ background: stat.color + '20', color: stat.color }}>
                            <stat.icon size={22} />
                        </div>
                        <div className="stat-body">
                            <p className="stat-label">{stat.label}</p>
                            <p className="stat-value">{isLoading ? '...' : stat.value.toLocaleString()}</p>
                        </div>
                        <div className="stat-change">
                            <TrendingUp size={14} />
                            <span>Suivi réel</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Financial Performance Chart */}
            <div style={{ marginBottom: '24px' }}>
                <FinancialChart />
            </div>

            {/* Content Grid */}
            <div className="dashboard-grid">
                {/* Recent Activity */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Activité récente</h2>
                        <button className="btn-ghost" title="Voir tout">Voir tout <ArrowUpRight size={14} /></button>
                    </div>
                    <div className="activity-list">
                        {recentActivity.map((item, i) => (
                            <div key={i} className="activity-item">
                                <div className="activity-dot" style={{ background: item.color }} />
                                <div className="activity-body">
                                    <p className="activity-action">{item.action}</p>
                                    <p className="activity-detail">{item.detail}</p>
                                </div>
                                <span className="activity-time">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">Actions rapides</h2>
                    </div>
                    <div className="quick-actions">
                        {[
                            { label: 'Impression Cartes', icon: CreditCard, color: '#6366f1', path: '/academic/cards' },
                            { label: 'Requêtes Smart', icon: Sparkles, color: '#8b5cf6', path: '/reports/smart' },
                            { label: 'Saisie de Notes', icon: GraduationCap, color: '#f59e0b', path: '/academic/grades' },
                            { label: 'Inscriptions', icon: Users, color: '#10b981', path: '/academic/students' },
                        ].map(action => (
                            <Link key={action.label} to={action.path} className="quick-action-btn">
                                <div className="qa-icon" style={{ background: action.color + '20', color: action.color }}>
                                    <action.icon size={20} />
                                </div>
                                <span>{action.label}</span>
                                <ArrowUpRight size={14} className="qa-arrow" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
