import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
    Users, Briefcase, BookOpen, Wallet, GraduationCap, 
    TrendingUp, CreditCard 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useDashboardStats } from '../hooks/useDashboardStats';

// Placeholder or real recent activity
const recentActivity = [
    { action: "Nouvelle inscription", detail: "Oumar Touré (SAGE)", time: "il y a 2h", color: "#10b981" },
    { action: "Paiement reçu", detail: "Fatim Keita (Licence 2)", time: "il y a 5h", color: "#6366f1" },
    { action: "Paie générée", detail: "Mois de Mars 2024", time: "Hier", color: "#ec4899" },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function DashboardPage() {
    const { user } = useAuthStore();
    const { data: stats, isLoading } = useDashboardStats();

    const statsConfig = [
        { label: 'Élèves inscrits', value: stats?.totalStudents ?? 0, icon: Users, color: '#6366f1' },
        { label: 'Employés actifs', value: stats?.totalEmployees ?? 0, icon: Briefcase, color: '#10b981' },
        { label: 'Classes ouvertes', value: stats?.totalClassrooms ?? 0, icon: BookOpen, color: '#f59e0b' },
        { label: 'Impayés (FCFA)', value: stats?.totalArrearsAmount ?? 0, icon: Wallet, color: '#ef4444' },
    ];

    const specialtyData = stats?.studentsBySpecialty || [];

    return (
        <div className="page animate-fade">
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 className="page-title">Tableau de bord</h1>
                    <p className="page-subtitle">Bienvenue, {user?.firstName} — Vue d'ensemble de {user?.schoolName || 'votre école'}</p>
                </div>
                <div className="badge-role" style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    {user?.role}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid" style={{ marginBottom: '30px' }}>
                {statsConfig.map(stat => (
                    <div key={stat.label} className="stat-card glass">
                        <div className="stat-icon" style={{ background: stat.color + '20', color: stat.color }}>
                            <stat.icon size={22} />
                        </div>
                        <div className="stat-body">
                            <p className="stat-label">{stat.label}</p>
                            <p className="stat-value">{isLoading ? '...' : stat.value.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                 {/* Financial Health */}
                 <div className="card glass">
                    <div className="card-header">
                        <h2 className="card-title"><TrendingUp size={18} /> Croissance des Revenus</h2>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={stats?.recentRevenue || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                                <RechartsTooltip 
                                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Students by Specialty */}
                 <div className="card glass">
                    <div className="card-header">
                        <h2 className="card-title"><GraduationCap size={18} /> Répartition par Filière</h2>
                    </div>
                    <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1, height: '100%' }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={specialtyData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {specialtyData.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {specialtyData.map((entry: any, index: number) => (
                                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS[index % COLORS.length] }} />
                                    <span style={{ fontWeight: 600 }}>{entry.name}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>{entry.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
            </div>

            {/* Bottom Grid */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
                {/* Recent Activity */}
                <div className="card glass">
                    <div className="card-header">
                        <h2 className="card-title">Flux d'Activité</h2>
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
                <div className="card glass">
                    <div className="card-header">
                        <h2 className="card-title">Raccourcis</h2>
                    </div>
                    <div className="quick-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                            { label: 'Cartes Scolaires', icon: CreditCard, color: '#6366f1', path: '/academic/cards' },
                            { label: 'Paie Mensuelle', icon: Wallet, color: '#ec4899', path: '/payroll/runs' },
                            { label: 'Notes & Bulletins', icon: GraduationCap, color: '#f59e0b', path: '/academic/grades' },
                            { label: 'Inscriptions', icon: Users, color: '#10b981', path: '/academic/students' },
                        ].map(action => (
                            <Link key={action.label} to={action.path} className="quick-action-card">
                                <div className="qa-icon" style={{ background: action.color + '20', color: action.color }}>
                                    <action.icon size={20} />
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>{action.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

