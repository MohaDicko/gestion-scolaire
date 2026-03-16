import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

export function FinanceOverviewPage() {
    const { data: invoices = [] } = useQuery<any[]>({
        queryKey: ['invoices'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/invoices'); return data; }
    });
    const { data: payments = [] } = useQuery<any[]>({
        queryKey: ['payments'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/payments'); return data; }
    });
    const { data: expenses = [] } = useQuery<any[]>({
        queryKey: ['expenses'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/expenses'); return data; }
    });

    const totalInvoiced = invoices.reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
    const totalCollected = payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
    const totalOutstanding = totalInvoiced - totalCollected;
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
    const netBalance = totalCollected - totalExpenses;
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    const kpis = [
        { label: 'Total Facturé', value: formatCurrency(totalInvoiced), icon: DollarSign, color: 'var(--primary)', bg: 'var(--primary-dim)' },
        { label: 'Encaissements', value: formatCurrency(totalCollected), icon: TrendingUp, color: 'var(--success)', bg: 'rgba(16, 185, 129, 0.1)' },
        { label: 'Impayés', value: formatCurrency(totalOutstanding), icon: AlertCircle, color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' },
        { label: 'Total Dépenses', value: formatCurrency(totalExpenses), icon: TrendingDown, color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.1)' },
        { label: 'Solde Net', value: formatCurrency(netBalance), icon: CheckCircle, color: netBalance >= 0 ? 'var(--success)' : 'var(--danger)', bg: netBalance >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' },
        { label: 'Taux de Recouvrement', value: `${collectionRate}%`, icon: TrendingUp, color: collectionRate >= 80 ? 'var(--success)' : collectionRate >= 50 ? 'var(--warning)' : 'var(--danger)', bg: 'var(--primary-dim)' },
    ];

    // Break down expenses by category
    const expenseByCategory = expenses.reduce((acc: any, e: any) => {
        const key = e.categoryName || 'Divers';
        acc[key] = (acc[key] || 0) + e.amount;
        return acc;
    }, {});

    // Break down payments by month
    const paymentsByMonth: Record<string, number> = {};
    payments.forEach((p: any) => {
        const month = new Date(p.paidAt || p.date).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        paymentsByMonth[month] = (paymentsByMonth[month] || 0) + p.amount;
    });
    const sortedMonths = Object.entries(paymentsByMonth).slice(-6);
    const maxPayment = Math.max(...sortedMonths.map(([, v]) => v), 1);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tableau de bord Financier</h1>
                    <p className="page-subtitle">Vue d'ensemble des flux financiers de l'établissement</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                {kpis.map((kpi, idx) => (
                    <div 
                        className="stat-card animate-up" 
                        key={kpi.label}
                        style={{ animationDelay: `${idx * 0.1}s`, border: `1px solid ${kpi.bg}` }}
                    >
                        <div className="stat-info">
                            <span className="stat-label">{kpi.label}</span>
                            <span className="stat-value" style={{ color: kpi.color, fontSize: '20px' }}>{kpi.value}</span>
                        </div>
                        <div className="stat-icon" style={{ background: kpi.bg, color: kpi.color }}>
                            <kpi.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Bar chart: Payments by month */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '20px' }}>📊 Encaissements par mois</h3>
                    {sortedMonths.length === 0 ? (
                        <p className="text-muted text-center">Aucune donnée de paiement.</p>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '180px', padding: '0 8px' }}>
                            {sortedMonths.map(([month, total]) => {
                                const height = Math.round((total / maxPayment) * 160);
                                return (
                                    <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', writingMode: 'horizontal-tb' }}>
                                            {formatCurrency(total).replace('FCFA', '')}
                                        </span>
                                        <div
                                            title={`${month}: ${formatCurrency(total)}`}
                                            style={{
                                                width: '100%',
                                                height: `${height}px`,
                                                background: 'linear-gradient(180deg, var(--primary), var(--primary-dark, var(--primary)))',
                                                borderRadius: '6px 6px 0 0',
                                                transition: 'height 0.4s',
                                                minHeight: '4px',
                                                cursor: 'default'
                                            }}
                                        />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Doughnut-style: Expenses by category */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '20px' }}>🗂️ Dépenses par catégorie</h3>
                    {Object.keys(expenseByCategory).length === 0 ? (
                        <p className="text-muted text-center">Aucune dépense enregistrée.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.entries(expenseByCategory)
                                .sort(([, a]: any, [, b]: any) => b - a)
                                .map(([cat, amount]: any) => {
                                    const pct = Math.round((amount / totalExpenses) * 100);
                                    const COLORS: Record<string, string> = {
                                        Maintenance: '#f59e0b', Utilities: '#3b82f6', OfficeSupplies: '#8b5cf6',
                                        Equipment: '#10b981', Events: '#ec4899', Miscellaneous: '#6b7280'
                                    };
                                    const color = COLORS[cat] || '#6b7280';
                                    return (
                                        <div key={cat}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                                                <span style={{ fontWeight: 600, color }}>{cat}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(amount)} ({pct}%)</span>
                                            </div>
                                            <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${pct}%`,
                                                    background: color,
                                                    borderRadius: '4px',
                                                    transition: 'width 0.5s'
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {/* Collection rate progress */}
            <div className="card" style={{ marginTop: '20px' }}>
                <h3 className="card-title" style={{ marginBottom: '16px' }}>📈 Taux de recouvrement des frais scolaires</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ flex: 1, height: '24px', background: 'var(--border)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                            height: '100%',
                            width: `${collectionRate}%`,
                            background: collectionRate >= 80
                                ? 'linear-gradient(90deg, var(--success), #059669)'
                                : collectionRate >= 50
                                    ? 'linear-gradient(90deg, var(--warning), #d97706)'
                                    : 'linear-gradient(90deg, var(--danger), #dc2626)',
                            borderRadius: '12px',
                            transition: 'width 0.8s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingRight: '8px'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{collectionRate}%</span>
                        </div>
                    </div>
                    <span style={{
                        fontWeight: 700,
                        fontSize: '20px',
                        color: collectionRate >= 80 ? 'var(--success)' : collectionRate >= 50 ? 'var(--warning)' : 'var(--danger)'
                    }}>{collectionRate}%</span>
                </div>
                <p style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {formatCurrency(totalCollected)} encaissés sur {formatCurrency(totalInvoiced)} facturés.{' '}
                    {totalOutstanding > 0 && <span style={{ color: 'var(--warning)' }}>Reste à percevoir : {formatCurrency(totalOutstanding)}.</span>}
                </p>
            </div>
        </div>
    );
}
