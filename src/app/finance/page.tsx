'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    TrendingUp, TrendingDown, Landmark, 
    ArrowUpRight, ArrowDownRight, Loader2, 
    DollarSign, Download, RefreshCcw, FileText
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';

export default function FinanceOverviewPage() {
    const router = useRouter();
    const toast = useToast();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFinancialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [invRes, expRes] = await Promise.all([
                fetch('/api/invoices'),
                fetch('/api/expenses')
            ]);
            
            const invoices = await invRes.json();
            const expenses = await expRes.json();

            // Calculate totals
            const totalRevenue = invoices.filter((i: any) => i.status === 'PAID').reduce((sum: number, i: any) => sum + i.amount, 0);
            const totalPending = invoices.filter((i: any) => i.status !== 'PAID').reduce((sum: number, i: any) => sum + i.amount, 0);
            const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
            const netBalance = totalRevenue - totalExpenses;

            // Chart data preparation (Sample for demo)
            const chartData = [
                { name: 'Lun', Recettes: 45000, Dépenses: 20000 },
                { name: 'Mar', Recettes: 52000, Dépenses: 15000 },
                { name: 'Mer', Recettes: 48000, Dépenses: 60000 },
                { name: 'Jeu', Recettes: 61000, Dépenses: 22000 },
                { name: 'Ven', Recettes: 55000, Dépenses: 31000 },
                { name: 'Sam', Recettes: 67000, Dépenses: 12000 },
                { name: 'Dim', Recettes: 40000, Dépenses: 5000 },
            ];

            setStats({ totalRevenue, totalPending, totalExpenses, netBalance, chartData });
        } catch {
            toast.error('Erreur lors du chargement des données financières');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const generatePDF = () => {
        if (!stats) return;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageW = 210;
        const margin = 20;

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18); doc.setFont('helvetica', 'bold');
        doc.text('RAPPORT FINANCIER PÉRIODIQUE', pageW / 2, 20, { align: 'center' });
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text(new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }), pageW / 2, 28, { align: 'center' });

        let y = 55;
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('RÉSUMÉ ANALYTIQUE', margin, y);
        y += 10;

        const rows = [
            ['Recettes Totales Encaissées', `${stats.totalRevenue.toLocaleString()} FCFA`],
            ['Dépenses Totales', `${stats.totalExpenses.toLocaleString()} FCFA`],
            ['Reste à Recouvrer (Factures en attente)', `${stats.totalPending.toLocaleString()} FCFA`],
            ['RÉSULTAT NET', `${stats.netBalance.toLocaleString()} FCFA`],
        ];

        rows.forEach(([label, value], i) => {
            doc.setFontSize(10); doc.setFont('helvetica', i === 3 ? 'bold' : 'normal');
            doc.text(label, margin, y);
            doc.text(value, pageW - margin, y, { align: 'right' });
            doc.setDrawColor(240); doc.line(margin, y + 2, pageW - margin, y + 2);
            y += 10;
        });

        y += 15;
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('CERTIFICATION', margin, y);
        y += 8;
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text('Je certifie par la présente que les données ci-dessus reflètent l\'état réel de la trésorerie', margin, y);
        doc.text('de l\'établissement à la date d\'édition du présent rapport.', margin, y + 5);

        y += 30;
        doc.line(pageW - margin - 50, y, pageW - margin, y);
        doc.text('Le Responsable Financier', pageW - margin - 25, y + 5, { align: 'center' });

        doc.save(`Rapport_Financier_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('Rapport PDF généré');
    };

    if (isLoading || !stats) return (
        <AppLayout title="Chargement..." subtitle="Préparation du bilan financier">
            <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
                <Loader2 size={48} className="spin" color="var(--primary)" />
            </div>
        </AppLayout>
    );

    return (
        <AppLayout
            title="Bilan Financier"
            subtitle="Vue consolidée des flux de trésorerie et rentabilité"
            breadcrumbs={[{ label: 'Finance', href: '/invoices' }, { label: 'Bilan' }]}
            actions={
                <button className="btn-outline" onClick={fetchFinancialData}>
                    <RefreshCcw size={15} /> Actualiser
                </button>
            }
        >
            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="card shadow-md" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--primary-dim)' }}>
                            <TrendingUp size={20} className="text-primary" />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center' }}>
                            <ArrowUpRight size={14} /> +12%
                        </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Recettes Encaissées</div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats.totalRevenue.toLocaleString()} XOF</div>
                </div>

                <div className="card shadow-md" style={{ padding: '24px', borderLeft: '4px solid var(--danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--danger-dim)' }}>
                            <TrendingDown size={20} className="text-danger" />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center' }}>
                            <ArrowDownRight size={14} /> +5%
                        </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Dépenses Totales</div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats.totalExpenses.toLocaleString()} XOF</div>
                </div>

                <div className="card shadow-md" style={{ padding: '24px', borderLeft: '4px solid var(--warning)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--warning-dim)' }}>
                            <DollarSign size={20} className="text-warning" />
                        </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Reste à Recouvrer</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--warning)' }}>{stats.totalPending.toLocaleString()} XOF</div>
                </div>

                <div className="card shadow-md" style={{ padding: '24px', borderLeft: '4px solid var(--success)', background: 'var(--bg-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--success-dim)' }}>
                            <Landmark size={20} className="text-success" />
                        </div>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Résultat Net</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>{stats.netBalance.toLocaleString()} XOF</div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div className="card shadow-sm" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>Flux de Trésorerie (7 derniers jours)</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="Recettes" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRecettes)" />
                                <Area type="monotone" dataKey="Dépenses" stroke="var(--danger)" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>Répartition des Revenus</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Scolarité T1', value: 850000 },
                                { name: 'Inscriptions', value: 320000 },
                                { name: 'Examen', value: 120000 },
                                { name: 'Cantine', value: 450000 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                                <Tooltip cursor={{fill: 'var(--bg-3)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={18} className="text-primary" />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Registre Complet (Grand Livre)</span>
                    </div>
                    <button className="btn-primary" onClick={() => router.push('/finance/ledger')}>
                        Consulter le Journal
                    </button>
                </div>
                <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Download size={18} className="text-primary" />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Rapport financier annuel</span>
                    </div>
                    <button className="btn-outline" onClick={generatePDF}>
                        Générer PDF
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
