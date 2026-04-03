import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import { useCampuses } from '../../academic/hooks/useClassrooms';
import { TrendingUp, AlertCircle, CheckCircle, Wallet, Calendar, Home, Filter } from 'lucide-react';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#8b5cf6', '#ec4899'];

export function FinanceOverviewPage() {
    const [selectedCampusId, setSelectedCampusId] = useState('');
    const { data: campuses } = useCampuses();

    const { data: dashboard, isLoading: loadingDashboard } = useQuery<any>({
        queryKey: ['finance-dashboard', selectedCampusId],
        queryFn: async () => {
            // Using the current year ID (hardcoded or from settings in a real app, here we might need to get it)
            // For now, let's assume we fetch all invoices and filter locally if dashboard endpoint isn't fully integrated with the UI yet
            // But I just added the /finance/dashboard endpoint, let's use it if we can find an academic year.
            const { data: years } = await apiClient.get('/academic/academic-years');
            const currentYear = years.find((y: any) => y.isCurrent) || years[0];
            if (!currentYear) return null;

            const { data } = await apiClient.get('/finance/dashboard', { 
                params: { academicYearId: currentYear.id, campusId: selectedCampusId || undefined } 
            });
            return data;
        },
        enabled: true
    });

    const { data: invoices = [], isLoading: loadingInvoices } = useQuery<any[]>({
        queryKey: ['invoices', selectedCampusId],
        queryFn: async () => { 
            const { data } = await apiClient.get('/finance/invoices', { 
                params: { campusId: selectedCampusId || undefined } 
            }); 
            return data; 
        }
    });

    const { data: payments = [], isLoading: loadingPayments } = useQuery<any[]>({
        queryKey: ['payments', selectedCampusId],
        queryFn: async () => { 
            const { data } = await apiClient.get('/finance/payments'); 
            // Local filtering for payments as we haven't added campusId to Payment entity yet (it's linked via Invoice -> Student)
            // For better performance, this should be done on backend too.
            return data;
        }
    });

    const { data: expenses = [], isLoading: loadingExpenses } = useQuery<any[]>({
        queryKey: ['expenses'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/expenses'); return data; }
    });

    const totalInvoiced = dashboard?.totalTuitionExpected || invoices.reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
    const totalCollected = dashboard?.totalCollected || payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
    const totalOutstanding = dashboard?.totalOutStanding || (totalInvoiced - totalCollected);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
    const netBalance = totalCollected - totalExpenses;
    const collectionRate = dashboard?.collectionRate || (totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0);

    // Charts data preparation
    const paymentsByMonth = payments.reduce((acc: any, p: any) => {
        const date = new Date(p.paidAt || p.date);
        const month = date.toLocaleDateString('fr-FR', { month: 'short' });
        acc[month] = (acc[month] || 0) + p.amount;
        return acc;
    }, {});

    const barData = Object.entries(paymentsByMonth).map(([name, value]) => ({ name, value }));

    const expenseByCategory = expenses.reduce((acc: any, e: any) => {
        const name = e.categoryName || 'Divers';
        acc[name] = (acc[name] || 0) + e.amount;
        return acc;
    }, {});

    const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    const kpis = [
        { label: 'Total Facturé', value: formatCurrency(totalInvoiced), icon: Wallet, color: 'var(--primary)', bg: 'var(--primary-dim)' },
        { label: 'Encaissements', value: formatCurrency(totalCollected), icon: TrendingUp, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
        { label: 'Impayés', value: formatCurrency(totalOutstanding), icon: AlertCircle, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
        { label: 'Solde Net', value: formatCurrency(netBalance), icon: CheckCircle, color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)', bg: 'var(--surface-alt)' },
    ];

    if (loadingInvoices || loadingPayments || loadingExpenses || loadingDashboard) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-sm font-medium text-dim">Génération des analyses financières en cours...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h1 className="page-title">Pilotage Financier Premium</h1>
                    <p className="page-subtitle">Analyse multi-site de la rentabilité scolaire</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', background: 'white', padding: '8px 15px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Home size={18} className="text-primary" />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Filtrer par Site :</span>
                    </div>
                    <select 
                        value={selectedCampusId} 
                        onChange={(e) => setSelectedCampusId(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 700, minWidth: '150px' }}
                    >
                        <option value="">Tous les Campus</option>
                        {campuses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Filter size={16} style={{ alignSelf: 'center', opacity: 0.3 }} />
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '30px' }}>
                {kpis.map((kpi, idx) => (
                    <div className="stat-card animate-up" key={idx} style={{ animationDelay: `${idx * 0.1}s`, background: 'white', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div className="stat-info">
                            <span className="stat-label" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{kpi.label}</span>
                            <span className="stat-value" style={{ color: kpi.color, fontSize: '26px', fontWeight: 900 }}>{kpi.value}</span>
                        </div>
                        <div className="stat-icon" style={{ background: kpi.bg, color: kpi.color, width: '50px', height: '50px', borderRadius: '14px' }}>
                            <kpi.icon size={26} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px', marginBottom: '25px' }}>
                {/* Revenue Evolution */}
                <div className="card shadow-md" style={{ height: '400px', borderRadius: '20px' }}>
                    <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={18} className="text-primary"/> Flux de Revenus Mensuels
                        </h3>
                        <span className="badge-blue text-xs">Temps Réel</span>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={barData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(val) => `${val/1000}k`} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                                formatter={((value: any) => [formatCurrency(Number(value)), 'Encaissé']) as any}
                            />
                            <Area type="monotone" dataKey="value" stroke="var(--primary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={4} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Expenses Pie */}
                <div className="card shadow-md" style={{ height: '400px', borderRadius: '20px' }}>
                    <div className="card-header" style={{ marginBottom: '20px' }}>
                        <h3 className="card-title">Analyse des Charges</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={((value: any) => formatCurrency(Number(value))) as any} />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                {/* Collection Rate Performance */}
                <div className="card shadow-md" style={{ borderRadius: '20px' }}>
                    <h3 className="card-title" style={{ marginBottom: '20px' }}>Efficacité du Recouvrement</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px' }}>
                        <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                            <svg width="140" height="140" viewBox="0 0 140 140">
                                <circle cx="70" cy="70" r="64" fill="none" stroke="var(--primary-dim)" strokeWidth="14" />
                                <circle 
                                    cx="70" cy="70" r="64" fill="none" stroke="var(--success)" 
                                    strokeWidth="14" strokeDasharray={`${(collectionRate / 100) * 402} 402`}
                                    strokeLinecap="round" transform="rotate(-90 70 70)"
                                    style={{ transition: 'stroke-dasharray 1.5s ease' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--success)' }}>{collectionRate}%</span>
                            </div>
                        </div>
                        <div style={{ marginLeft: '40px' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Réalisé</p>
                                <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{formatCurrency(totalCollected)}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Objectif</p>
                                <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(totalInvoiced)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cash Flow Summary */}
                <div className="card shadow-md" style={{ borderRadius: '20px' }}>
                    <h3 className="card-title" style={{ marginBottom: '20px' }}>Synthèse de Trésorerie</h3>
                    <div className="table-container" style={{ padding: '5px' }}>
                        <table className="data-table" style={{ border: 'none' }}>
                            <tbody>
                                <tr style={{ borderBottom: '1px dashed var(--border)' }}>
                                    <td style={{ padding: '15px 0', fontSize: '14px', fontWeight: 500 }}>Recettes d'Exploitation</td>
                                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 800, fontSize: '15px' }}>+ {formatCurrency(totalCollected)}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px dashed var(--border)' }}>
                                    <td style={{ padding: '15px 0', fontSize: '14px', fontWeight: 500 }}>Charges & Dépenses</td>
                                    <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 800, fontSize: '15px' }}>- {formatCurrency(totalExpenses)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '20px 0', fontWeight: 800, fontSize: '18px' }}>Solde Disponible</td>
                                    <td style={{ textAlign: 'right', fontSize: '22px', fontWeight: 900, color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {formatCurrency(netBalance)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div style={{ marginTop: '10px', background: 'var(--bg-2)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                             <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                Analyse basée sur le site {selectedCampusId ? campuses?.find(c => c.id === selectedCampusId)?.name : 'consolidé (global)'}
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
