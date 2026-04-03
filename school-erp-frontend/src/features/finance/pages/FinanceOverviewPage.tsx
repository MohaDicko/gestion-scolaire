import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import { TrendingUp, AlertCircle, CheckCircle, Wallet, Calendar } from 'lucide-react';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#8b5cf6', '#ec4899'];

export function FinanceOverviewPage() {
    const { data: invoices = [], isLoading: loadingInvoices } = useQuery<any[]>({
        queryKey: ['invoices'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/invoices'); return data; }
    });
    const { data: payments = [], isLoading: loadingPayments } = useQuery<any[]>({
        queryKey: ['payments'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/payments'); return data; }
    });
    const { data: expenses = [], isLoading: loadingExpenses } = useQuery<any[]>({
        queryKey: ['expenses'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/expenses'); return data; }
    });

    const totalInvoiced = invoices.reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
    const totalCollected = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
    const totalOutstanding = totalInvoiced - totalCollected;
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
    const netBalance = totalCollected - totalExpenses;
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

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

    if (loadingInvoices || loadingPayments || loadingExpenses) {
        return <div className="loading-state">Analyse des données financières...</div>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pilotage Financier Premium</h1>
                    <p className="page-subtitle">Analyse temps-réel du rendement et de la trésorerie</p>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '30px' }}>
                {kpis.map((kpi, idx) => (
                    <div className="stat-card animate-up" key={idx} style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="stat-info">
                            <span className="stat-label">{kpi.label}</span>
                            <span className="stat-value" style={{ color: kpi.color, fontSize: '24px' }}>{kpi.value}</span>
                        </div>
                        <div className="stat-icon" style={{ background: kpi.bg, color: kpi.color }}>
                            <kpi.icon size={26} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px', marginBottom: '25px' }}>
                {/* Revenue Evolution */}
                <div className="card" style={{ height: '400px' }}>
                    <div className="card-header" style={{ marginBottom: '20px' }}>
                        <h3 className="card-title"><Calendar size={18} style={{ marginRight: '8px' }}/> Évolution des Recettes</h3>
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
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                formatter={(value: any) => [formatCurrency(Number(value)), 'Encaissé']}
                            />
                            <Area type="monotone" dataKey="value" stroke="var(--primary)" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Expenses Pie */}
                <div className="card" style={{ height: '400px' }}>
                    <div className="card-header" style={{ marginBottom: '20px' }}>
                        <h3 className="card-title">Répartition des Dépenses</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                {/* Collection Rate Performance */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '15px' }}>Performance du Recouvrement</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--primary-dim)" strokeWidth="12" />
                                <circle 
                                    cx="60" cy="60" r="54" fill="none" stroke="var(--success)" 
                                    strokeWidth="12" strokeDasharray={`${(collectionRate / 100) * 339} 339`}
                                    strokeLinecap="round" transform="rotate(-90 60 60)"
                                    style={{ transition: 'stroke-dasharray 1s ease' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>{collectionRate}%</span>
                            </div>
                        </div>
                        <div style={{ marginLeft: '30px' }}>
                            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 700 }}>{formatCurrency(totalCollected)}</span> encaissés
                            </p>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                Sur {formatCurrency(totalInvoiced)} facturés
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cash Flow Summary */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '15px' }}>Flux de Trésorerie</h3>
                    <div className="table-container">
                        <table className="data-table" style={{ border: 'none' }}>
                            <tbody>
                                <tr style={{ borderBottom: '1px dashed var(--border)' }}>
                                    <td style={{ padding: '12px 0' }}>Encaissements (Revenus)</td>
                                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>+ {formatCurrency(totalCollected)}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px dashed var(--border)' }}>
                                    <td style={{ padding: '12px 0' }}>Dépenses (Charges)</td>
                                    <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }}>- {formatCurrency(totalExpenses)}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '15px 0', fontWeight: 800, fontSize: '16px' }}>Solde de Trésorerie</td>
                                    <td style={{ textAlign: 'right', fontSize: '18px', fontWeight: 800, color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        {formatCurrency(netBalance)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
