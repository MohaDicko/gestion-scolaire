import { useState } from 'react';
import { FileText, Download, TrendingUp, Users, DollarSign, GraduationCap, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel } from '../../../lib/excelExport';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

export function AnnualReportPage() {
    const [academicYear] = useState('2024-2025');
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch real financial data
    const { data: invoices = [] } = useQuery<any[]>({
        queryKey: ['invoices'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/invoices'); return data; }
    });
    const { data: expenses = [] } = useQuery<any[]>({
        queryKey: ['expenses'],
        queryFn: async () => { const { data } = await apiClient.get('/finance/expenses'); return data; }
    });
    const { data: students = [] } = useQuery<any>({
        queryKey: ['students-all'],
        queryFn: async () => { const { data } = await apiClient.get('/academic/students?pageSize=1000'); return data; }
    });

    const totalStudents = students?.totalCount ?? 0;
    const studentItems = students?.items ?? [];
    const totalInvoiced = invoices.reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
    const totalCollected = invoices.reduce((s: number, i: any) => s + (i.amountPaid ?? i.amount ?? 0), 0); // Corrected property name if amountPaid exists, otherwise amount
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
    const netBalance = totalCollected - totalExpenses;
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    // Aggregations
    const genderDist = studentItems.reduce((acc: any, s: any) => {
        acc[s.gender] = (acc[s.gender] || 0) + 1;
        return acc;
    }, {});

    const feeTypes = ['Scolarité', 'Inscription', 'Cantine', 'Transport', 'Matériel', 'Autre'];
    const revenueByType = invoices.reduce((acc: any, i: any) => {
        const type = feeTypes[i.feeType] || 'Autre';
        acc[type] = (acc[type] || 0) + i.amount;
        return acc;
    }, {});

    const stats = [
        { label: 'Élèves inscrits', value: totalStudents.toString(), icon: Users, color: '#8b5cf6' },
        { label: 'Total facturé', value: formatCurrency(totalInvoiced), icon: DollarSign, color: '#3b82f6' },
        { label: 'Total encaissé', value: formatCurrency(totalCollected), icon: TrendingUp, color: '#10b981' },
        { label: 'Total dépenses', value: formatCurrency(totalExpenses), icon: FileText, color: '#f59e0b' },
        { label: 'Solde net', value: formatCurrency(netBalance), icon: DollarSign, color: netBalance >= 0 ? '#10b981' : '#ef4444' },
        { label: 'Taux recouvrement', value: `${collectionRate}%`, icon: TrendingUp, color: '#06b6d4' },
    ];

    const generatePDF = async () => {
        setIsGenerating(true);
        const doc = new jsPDF('portrait', 'mm', 'a4');
        const pageW = doc.internal.pageSize.getWidth();

        // ─── Cover Page ─────────────────────────────────────────────────
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 0, pageW, 60, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28); doc.setFont('helvetica', 'bold');
        doc.text('RAPPORT ANNUEL', pageW / 2, 25, { align: 'center' });
        doc.setFontSize(16); doc.setFont('helvetica', 'normal');
        doc.text(`Année Scolaire ${academicYear}`, pageW / 2, 36, { align: 'center' });
        doc.setFontSize(12);
        doc.text('SchoolERP — Système de Gestion Scolaire', pageW / 2, 48, { align: 'center' });

        // Date generated
        doc.setTextColor(100, 100, 100); doc.setFontSize(10);
        doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 70);
        doc.line(14, 73, pageW - 14, 73);

        // ─── Section 1 : Indicateurs clés ────────────────────────────────
        doc.setTextColor(30, 30, 30); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('1. Indicateurs Clés de Performance', 14, 85);

        autoTable(doc, {
            startY: 90,
            head: [['Indicateur', 'Valeur']],
            body: [
                ['Nombre total d\'élèves inscrits', totalStudents.toString()],
                ['Total des frais facturés', formatCurrency(totalInvoiced)],
                ['Total des paiements encaissés', formatCurrency(totalCollected)],
                ['Total des dépenses opérationnelles', formatCurrency(totalExpenses)],
                ['Solde net (Recettes - Dépenses)', formatCurrency(netBalance)],
                ['Taux de recouvrement des frais', `${collectionRate}%`],
            ],
            headStyles: { fillColor: [124, 58, 237] },
            alternateRowStyles: { fillColor: [248, 245, 255] },
            styles: { fontSize: 11 }
        });

        // ─── Section 2 : Détail Financier ────────────────────────────────
        const y1 = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('2. Détail des Factures', 14, y1);

        if (invoices.length > 0) {
            autoTable(doc, {
                startY: y1 + 5,
                head: [['N° Facture', 'Élève', 'Montant', 'Statut']],
                body: invoices.slice(0, 20).map((i: any) => [
                    i.invoiceNumber || '—',
                    i.studentName || '—',
                    formatCurrency(i.amount),
                    i.status
                ]),
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 9 }
            });
        } else {
            doc.setFontSize(10); doc.setTextColor(100, 100, 100);
            doc.text('Aucune facture enregistrée pour cette période.', 14, y1 + 12);
        }

        // New page for expenses
        doc.addPage();

        // ─── Section 3 : Dépenses ────────────────────────────────────────
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 0, pageW, 18, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('RAPPORT ANNUEL — Suite', pageW / 2, 12, { align: 'center' });

        doc.setTextColor(30, 30, 30); doc.setFontSize(14);
        doc.text('3. Détail des Dépenses', 14, 30);

        if (expenses.length > 0) {
            autoTable(doc, {
                startY: 35,
                head: [['Date', 'Description', 'Catégorie', 'Montant']],
                body: expenses.map((e: any) => [
                    new Date(e.date).toLocaleDateString('fr-FR'),
                    e.description,
                    e.categoryName || e.category || '—',
                    formatCurrency(e.amount)
                ]),
                headStyles: { fillColor: [245, 158, 11] },
                styles: { fontSize: 9 }
            });
        } else {
            doc.setFontSize(10); doc.setTextColor(100, 100, 100);
            doc.text('Aucune dépense enregistrée pour cette période.', 14, 45);
        }

        // ─── Conclusion ───────────────────────────────────────────────────
        const y2 = Math.min((doc as any).lastAutoTable?.finalY ?? 80, 230) + 20;
        doc.setFontSize(13); doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold');
        doc.text('4. Conclusion & Observations', 14, y2);

        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(70, 70, 70);
        const conclusion = [
            `L'année scolaire ${academicYear} s'est déroulée avec ${totalStudents} élèves inscrits.`,
            `Le taux de recouvrement des frais scolaires est de ${collectionRate}%, ce qui ${collectionRate >= 80 ? 'est satisfaisant' : 'nécessite une amélioration'}.`,
            `Le solde net après déduction des dépenses est de ${formatCurrency(netBalance)}.`,
            '',
            netBalance >= 0
                ? '✅ L\'établissement présente un bilan financier positif pour cette année scolaire.'
                : '⚠️ L\'établissement présente un déficit — une révision budgétaire est recommandée.',
        ];
        conclusion.forEach((line, i) => doc.text(line, 14, y2 + 10 + i * 7));

        // ─── Footer on all pages ──────────────────────────────────────────
        const pages = (doc.internal as any).pages?.length - 1 || 1;
        for (let p = 1; p <= pages; p++) {
            doc.setPage(p);
            doc.setFontSize(8); doc.setTextColor(150, 150, 150);
            doc.text(`SchoolERP — Rapport Annuel ${academicYear}`, 14, doc.internal.pageSize.getHeight() - 8);
            doc.text(`Page ${p} / ${pages}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
        }

        doc.save(`Rapport_Annuel_${academicYear.replace('/', '-')}.pdf`);
        setIsGenerating(false);
    };

    const handleExportExcel = () => {
        const financialData = [
            { Categorie: 'REVENUS', Poste: 'Frais de scolarité facturés', Montant: totalInvoiced },
            { Categorie: 'REVENUS', Poste: 'Frais de scolarité encaissés', Montant: totalCollected },
            { Categorie: 'DEPENSES', Poste: 'Dépenses opérationnelles', Montant: totalExpenses },
            { Categorie: 'BILAN', Poste: 'Solde Net', Montant: netBalance },
            { Categorie: 'PERFORMANCE', Poste: 'Taux de Recouvrement', Montant: `${collectionRate}%` },
            { Categorie: 'DEMOGRAPHIE', Poste: 'Nombre d\'élèves', Montant: totalStudents }
        ];

        exportToExcel(financialData, `Bilan_Annuel_${academicYear.replace('/', '-')}`, 'Résumé_Financier');
    };

    return (
        <div className="page" style={{ maxWidth: '900px' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={28} className="text-primary" /> Rapport Annuel
                    </h1>
                    <p className="page-subtitle">Bilan complet de l'année scolaire {academicYear}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-ghost" onClick={handleExportExcel} style={{ border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                        <Download size={18} /> Exporter Excel
                    </button>
                    <button className="btn-primary" onClick={generatePDF} disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} /> {isGenerating ? 'Génération...' : 'Télécharger PDF'}
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {stats.map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-info">
                            <span className="stat-label">{s.label}</span>
                            <span className="stat-value" style={{ color: s.color, fontSize: '18px' }}>{s.value}</span>
                        </div>
                        <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                            <s.icon size={22} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                {/* Gender Chart */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>👫 Répartition par Genre</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {['Male', 'Female', 'Other'].map(g => {
                            const count = genderDist[g] || 0;
                            const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                            const labels: any = { Male: 'Garçons', Female: 'Filles', Other: 'Autres' };
                            const colors: any = { Male: '#3b82f6', Female: '#ec4899', Other: '#6b7280' };
                            return (
                                <div key={g}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                                        <span>{labels[g]}</span>
                                        <span className="font-bold">{count} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: colors[g], transition: 'width 1s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>📊 Revenus par Type</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {Object.entries(revenueByType).sort((a: any, b: any) => b[1] - a[1]).slice(0, 4).map(([type, amount]: any) => {
                            const pct = totalInvoiced > 0 ? Math.round((amount / totalInvoiced) * 100) : 0;
                            return (
                                <div key={type}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                                        <span>{type}</span>
                                        <span className="font-bold">{formatCurrency(amount)} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'var(--bg-3)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Preview card */}
            <div className="card">
                <h3 className="card-title" style={{ marginBottom: '20px' }}>📋 Contenu du Rapport PDF</h3>
                {[
                    { icon: TrendingUp, title: 'Indicateurs Clés de Performance', desc: 'Vue synthétique : élèves, recettes, dépenses, taux de recouvrement' },
                    { icon: DollarSign, title: 'Détail des Factures', desc: 'Liste de toutes les factures avec statuts et montants' },
                    { icon: FileText, title: 'Détail des Dépenses', desc: 'Toutes les dépenses opérationnelles avec catégories et dates' },
                    { icon: GraduationCap, title: 'Conclusion & Observations', desc: 'Analyse du bilan financier et recommandations' },
                ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '14px', padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <item.icon size={20} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{item.title}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</p>
                        </div>
                    </div>
                ))}

                <div style={{ marginTop: '20px', padding: '16px', background: 'var(--primary-dim)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>
                        Ce rapport est généré en temps réel depuis les données actuelles de la base de données.
                        Cliquez sur <strong>"Télécharger PDF"</strong> pour générer le rapport officiel.
                    </p>
                </div>
            </div>
        </div>
    );
}
