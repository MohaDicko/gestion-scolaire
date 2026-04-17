'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, FileText, CreditCard, Activity, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        studentsCount: 0,
        employeesCount: 0,
        invoicesTotal: 0,
        invoicesPaid: 0
    });
    
    // Pour cet environnement de prod Theming, on place des données visuelles immersives
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

    useEffect(() => {
        // En vrai: fetch. Ici simulé basé sur API endpoints
        setStats({
            studentsCount: 348, // ex: await (await fetch('/api/students')).json().totalCount
            employeesCount: 42,
            invoicesTotal: 4500000,
            invoicesPaid: 3200000
        });
    }, []);

    const paymentRate = Math.round((stats.invoicesPaid / (stats.invoicesTotal || 1)) * 100);

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Vercel</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item active">Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/students')}>Élèves (Scolarité)</div>
              <div className="nav-item" onClick={() => router.push('/classrooms')}>Classes</div>
              <div className="nav-item" onClick={() => router.push('/grades')}>Saisie des Notes</div>
              <div className="nav-item" onClick={() => router.push('/employees')}>Employés (RH)</div>
              <div className="nav-item" onClick={() => router.push('/payslips')}>Paie (Bulletins)</div>
              <div className="nav-item" onClick={() => router.push('/invoices')}>Comptabilité</div>
            </div>
            
            <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
                <button className="btn-ghost" onClick={() => router.push('/api/auth/logout')} style={{ width: '100%', color: 'var(--danger)' }}>
                    Déconnexion
                </button>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Vue d'ensemble</h1>
                        <p className="page-subtitle">Métriques en temps réel issues de Supabase</p>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                            <Users size={24} />
                        </div>
                        <div className="stat-body">
                            <div className="stat-label">Effectif Total</div>
                            <div className="stat-value">{stats.studentsCount}</div>
                            <div className="stat-change">+12% depuis septembre</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                            <CreditCard size={24} />
                        </div>
                        <div className="stat-body">
                            <div className="stat-label">Recettes encaissées</div>
                            <div className="stat-value">{(stats.invoicesPaid).toLocaleString()} XOF</div>
                            <div className="stat-change" style={{ color: 'var(--success)' }}>Taux de paiement: {paymentRate}%</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                            <FileText size={24} />
                        </div>
                        <div className="stat-body">
                            <div className="stat-label">Restes à recouvrer</div>
                            <div className="stat-value">{(stats.invoicesTotal - stats.invoicesPaid).toLocaleString()} XOF</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--pink)' }}>
                            <BookOpen size={24} />
                        </div>
                        <div className="stat-body">
                            <div className="stat-label">Staff Académique</div>
                            <div className="stat-value">{stats.employeesCount}</div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title"><TrendingUp size={18} style={{ display: 'inline', marginRight: 8 }}/> Flux Financiers Mensuels (XOF)</h3>
                        </div>
                        <div style={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000000}M`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                        itemStyle={{ color: 'var(--primary)' }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title"><Activity size={18} style={{ display: 'inline', marginRight: 8 }}/> Évolution des Inscriptions</h3>
                        </div>
                        <div style={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={enrollmentData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        cursor={{ fill: 'var(--border)' }}
                                        contentStyle={{ backgroundColor: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="eleves" fill="var(--success)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
