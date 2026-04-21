'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, BookOpen, FileText, CreditCard, Activity, TrendingUp, 
  Loader2, BadgeCheck, GraduationCap, Briefcase, Wallet
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

export default function DashboardPage() {
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        studentsCount: 0,
        employeesCount: 0,
        invoicesTotal: 0,
        invoicesPaid: 0
    });
    
    const revenueData = [
        { name: 'Jan', total: 1200000 },
        { name: 'Fév', total: 2100000 },
        { name: 'Mar', total: 1800000 },
        { name: 'Avr', total: 2800000 },
        { name: 'Mai', total: 2400000 },
        { name: 'Jun', total: 3400000 },
    ];

    const enrollmentData = [
        { name: '2021', eleves: 320 },
        { name: '2022', eleves: 450 },
        { name: '2023', eleves: 490 },
        { name: '2024', eleves: 680 },
        { name: '2025', eleves: 850 },
    ];

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            toast.error("Échec de la récupération des statistiques");
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const paymentRate = stats.invoicesTotal > 0 
        ? Math.round((stats.invoicesPaid / stats.invoicesTotal) * 100) 
        : 0;

    return (
        <AppLayout
            title="Tableau de Bord Académique"
            subtitle="Indicateurs clés de performance et pilotage de établissement"
            breadcrumbs={[{ label: 'Vision Globale' }]}
        >
            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card animate-up">
                    <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                        <Users size={22} />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Élèves Inscrits</div>
                        <div className="stat-value">{isLoading ? <Loader2 className="spin" size={20}/> : stats.studentsCount}</div>
                        <div className="stat-change" style={{ color: 'var(--success)' }}>↑ Inscriptions actives</div>
                    </div>
                </div>

                <div className="stat-card animate-up" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-icon" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
                        <Wallet size={22} />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Recettes</div>
                        <div className="stat-value">{isLoading ? <Loader2 className="spin" size={20}/> : stats.invoicesPaid.toLocaleString()} <span style={{fontSize: '14px'}}>XOF</span></div>
                        <div className="stat-change" style={{ background: 'var(--success-dim)', color: 'var(--success)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>
                            {paymentRate}% recouvré
                        </div>
                    </div>
                </div>

                <div className="stat-card animate-up" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-icon" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                        <FileText size={22} />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Restes à recouvrer</div>
                        <div className="stat-value">{isLoading ? <Loader2 className="spin" size={20}/> : (stats.invoicesTotal - stats.invoicesPaid).toLocaleString()} <span style={{fontSize: '14px'}}>XOF</span></div>
                        <div className="stat-change" style={{ color: 'var(--danger)' }}>Action requise</div>
                    </div>
                </div>

                <div className="stat-card animate-up" style={{ animationDelay: '0.3s' }}>
                    <div className="stat-icon" style={{ background: 'var(--info-dim)', color: 'var(--info)' }}>
                        <Briefcase size={22} />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Staff Total</div>
                        <div className="stat-value">{isLoading ? <Loader2 className="spin" size={20}/> : stats.employeesCount}</div>
                        <div className="stat-change">Administratifs & Enseignants</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                <div className="card shadow-md">
                    <div className="card-header" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TrendingUp size={18} className="text-primary" /> Revenues Mensuels
                        </h3>
                        <span className="badge badge-primary">2025</span>
                    </div>
                    <div style={{ height: 350, padding: '20px 10px 10px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000000}M`} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
                                    itemStyle={{ color: 'var(--primary)', fontWeight: 700 }}
                                />
                                <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card shadow-md">
                    <div className="card-header" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Activity size={18} className="text-success" /> Croissance Étudiante
                        </h3>
                    </div>
                    <div style={{ height: 350, padding: '20px 10px 10px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={enrollmentData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{ fill: 'var(--bg-3)', opacity: 0.5 }}
                                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                />
                                <Bar dataKey="eleves" fill="var(--success)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Activity & Quick Actions */}
            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
                <div className="card">
                    <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                        <h3 className="card-title">Alertes & Activités Récentes</h3>
                    </div>
                    <div style={{ padding: '0 24px' }}>
                        {[
                            { icon: <GraduationCap size={16}/>, label: 'Nouvelle inscription', value: 'Issa Mariko (Terminale)', time: 'Il y a 10 min', color: 'var(--info)' },
                            { icon: <FileText size={16}/>, label: 'Saisie de notes', value: 'Mathématiques DS2 (3ème A)', time: 'Il y a 1h', color: 'var(--primary)' },
                            { icon: <Wallet size={16}/>, label: 'Paiement reçu', value: '45,000 XOF - Frais Scolarité', time: 'Il y a 3h', color: 'var(--success)' },
                            { icon: <BadgeCheck size={16}/>, label: 'Conseil de classe', value: 'Planification Semestre 1 terminée', time: 'Aujourd\'hui', color: 'var(--purple)' },
                        ].map((item, idx) => (
                            <div key={idx} style={{ 
                                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', 
                                borderBottom: idx === 3 ? 'none' : '1px solid var(--border)' 
                            }}>
                                <div style={{ 
                                    width: '36px', height: '36px', borderRadius: '10px', 
                                    background: `${item.color}15`, color: item.color, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                }}>
                                    {item.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.label}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.value}</div>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.time}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', background: 'var(--bg-fluid)', border: '1px solid var(--primary-dim)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '16px' }}>Actions Rapides</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="btn-primary" style={{ justifyContent: 'start', padding: '12px 16px' }} onClick={() => router.push('/students')}>
                            <Users size={16} /> Inscrire un élève
                        </button>
                        <button className="btn-ghost" style={{ justifyContent: 'start', padding: '12px 16px', background: 'var(--bg-2)' }} onClick={() => router.push('/grades')}>
                            <FileText size={16} /> Saisir des notes
                        </button>
                        <button className="btn-ghost" style={{ justifyContent: 'start', padding: '12px 16px', background: 'var(--bg-2)' }} onClick={() => router.push('/invoices')}>
                            <Wallet size={16} /> Émettre une facture
                        </button>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @media (max-width: 900px) {
                    .grid-responsive { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </AppLayout>
    );
}
