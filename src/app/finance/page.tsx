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
import { StatCard } from '@/components/ui/stat-card';
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ marginBottom: '24px' }}>
                <StatCard
                    label="Recettes encaissées"
                    value={`${stats.totalRevenue.toLocaleString()} XOF`}
                    icon={<TrendingUp size={20} />}
                    trend={<><ArrowUpRight size={14} /> +12%</>}
                    tone="default"
                />
                <StatCard
                    label="Dépenses totales"
                    value={`${stats.totalExpenses.toLocaleString()} XOF`}
                    icon={<TrendingDown size={20} />}
                    trend={<><ArrowDownRight size={14} /> +5%</>}
                    tone="danger"
                />
                <StatCard
                    label="Reste à recouvrer"
                    value={`${stats.totalPending.toLocaleString()} XOF`}
                    icon={<DollarSign size={20} />}
                    description="Factures non réglées"
                    tone="warning"
                />
                <StatCard
                    label="Résultat net"
                    value={`${stats.netBalance.toLocaleString()} XOF`}
                    icon={<Landmark size={20} />}
                    description="Recettes moins dépenses"
                    tone="success"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]" style={{ marginBottom: '24px' }}>
                <section className="card shadow-sm" style={{ padding: '24px' }} aria-labelledby="cashflow-title">
                    <div className="flex flex-wrap items-start justify-between gap-3" style={{ marginBottom: '24px' }}>
                        <div>
                            <h2 id="cashflow-title" style={{ fontSize: '16px', fontWeight: 700 }}>Flux de trésorerie</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Recettes et dépenses des 7 derniers jours</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-semibold text-text-muted" aria-label="Légende du graphique">
                            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />Recettes</span>
                            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-danger" />Dépenses</span>
                        </div>
                    </div>
                    <div style={{ height: '300px' }} role="img" aria-label="Graphique des recettes et dépenses des sept derniers jours">
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
                </section>

                <section className="card shadow-sm" style={{ padding: '24px' }} aria-labelledby="revenue-title">
                    <div style={{ marginBottom: '24px' }}>
                        <h2 id="revenue-title" style={{ fontSize: '16px', fontWeight: 700 }}>Répartition des revenus</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Principales sources d&apos;encaissement</p>
                    </div>
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
                </section>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section className="card shadow-sm" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }} aria-label="Accès au grand livre">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={18} className="text-primary" />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Registre Complet (Grand Livre)</span>
                    </div>
                    <button className="btn-primary" onClick={() => router.push('/finance/ledger')}>
                        Consulter le Journal
                    </button>
                </section>
                <section className="card shadow-sm" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }} aria-label="Export du rapport financier">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Download size={18} className="text-primary" />
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Rapport financier annuel</span>
                    </div>
                    <button className="btn-outline" onClick={generatePDF}>
                        Générer PDF
                    </button>
                </section>
            </div>
        </AppLayout>
    );
}
