'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Landmark, Download, RefreshCw, Loader2, TrendingUp, TrendingDown, AlertCircle, FileText, DollarSign, Users } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FinanceReport {
  school: { name: string; code: string; city: string } | null;
  year: number;
  generatedAt: string;
  revenue: { totalInvoiced: number; totalCollected: number; totalOutstanding: number; collectionRate: number; invoiceCount: number };
  expenses: { totalExpenses: number; byCategory: Record<string, number>; count: number };
  payroll: { totalPayroll: number; totalNetPaid: number; totalSocialCharges: number; count: number };
  summary: { totalCharges: number; netBalance: number; profitMargin: number };
  monthly: Array<{ month: number; label: string; revenue: number; expense: number; payroll: number; net: number }>;
}

export default function FinanceReportPage() {
  const toast = useToast();
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/finance/report?year=${year}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReport(data);
    } catch {
      toast.error('Erreur lors du chargement du rapport.');
    } finally {
      setIsLoading(false);
    }
  }, [year, toast]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportPDF = async () => {
    if (!report) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 0;

      // Header band
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RAPPORT FINANCIER ANNUEL', pageW / 2, 18, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${report.school?.name || 'Établissement'} — ${report.year}`, pageW / 2, 28, { align: 'center' });
      doc.setFontSize(9);
      doc.setTextColor(150, 170, 200);
      doc.text(`Généré le ${new Date(report.generatedAt).toLocaleString('fr-FR')}`, pageW / 2, 38, { align: 'center' });

      y = 55;
      doc.setTextColor(15, 23, 42);

      // Summary boxes
      const boxes = [
        { label: 'Recettes Encaissées', value: `${report.revenue.totalCollected.toLocaleString()} XOF`, color: [16, 185, 129] as [number,number,number] },
        { label: 'Total Charges', value: `${report.summary.totalCharges.toLocaleString()} XOF`, color: [244, 63, 94] as [number,number,number] },
        { label: 'Résultat Net', value: `${report.summary.netBalance.toLocaleString()} XOF`, color: report.summary.netBalance >= 0 ? [79, 142, 247] as [number,number,number] : [244, 63, 94] as [number,number,number] },
        { label: 'Taux Recouvrement', value: `${report.revenue.collectionRate}%`, color: [251, 146, 60] as [number,number,number] },
      ];

      const boxW = (pageW - 30) / 4;
      boxes.forEach((box, i) => {
        const bx = 15 + i * (boxW + 2);
        doc.setFillColor(box.color[0], box.color[1], box.color[2]);
        doc.roundedRect(bx, y, boxW, 22, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(box.label, bx + boxW / 2, y + 8, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(box.value, bx + boxW / 2, y + 17, { align: 'center' });
      });

      y += 32;
      doc.setTextColor(15, 23, 42);

      // Revenue table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('1. RECETTES — Frais de Scolarité', 15, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Montant']],
        body: [
          ['Total Facturé', `${report.revenue.totalInvoiced.toLocaleString()} XOF`],
          ['Total Encaissé', `${report.revenue.totalCollected.toLocaleString()} XOF`],
          ['Impayés en attente', `${report.revenue.totalOutstanding.toLocaleString()} XOF`],
          ['Nombre de Factures', `${report.revenue.invoiceCount}`],
          ['Taux de Recouvrement', `${report.revenue.collectionRate}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 15, right: 15 }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Expenses table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('2. DÉPENSES OPÉRATIONNELLES', 15, y);
      y += 5;

      const expenseRows = Object.entries(report.expenses.byCategory).map(([cat, amt]) => [
        cat.charAt(0) + cat.slice(1).toLowerCase(),
        `${(amt as number).toLocaleString()} XOF`
      ]);
      expenseRows.push(['TOTAL DÉPENSES', `${report.expenses.totalExpenses.toLocaleString()} XOF`]);

      autoTable(doc, {
        startY: y,
        head: [['Catégorie', 'Montant']],
        body: expenseRows,
        theme: 'striped',
        headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 15, right: 15 }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Payroll table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('3. MASSE SALARIALE', 15, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['Indicateur', 'Montant']],
        body: [
          ['Brut Total Versé', `${report.payroll.totalPayroll.toLocaleString()} XOF`],
          ['Net Total Versé', `${report.payroll.totalNetPaid.toLocaleString()} XOF`],
          ['Cotisations Sociales (INPS+AMO+ITS)', `${report.payroll.totalSocialCharges.toLocaleString()} XOF`],
          ['Nombre de Bulletins de Paie', `${report.payroll.count}`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 15, right: 15 }
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Monthly table
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('4. ÉVOLUTION MENSUELLE', 15, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['Mois', 'Recettes', 'Dépenses', 'Masse Salariale', 'Résultat']],
        body: report.monthly.map(m => [
          m.label.toUpperCase(),
          `${m.revenue.toLocaleString()} XOF`,
          `${m.expense.toLocaleString()} XOF`,
          `${m.payroll.toLocaleString()} XOF`,
          `${m.net.toLocaleString()} XOF`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 15, right: 15 }
      });

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${p}/${totalPages} — SchoolERP Pro © ${report.year} — Document Confidentiel`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
      }

      doc.save(`Rapport_Financier_${report.year}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport PDF exporté avec succès');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = report ? [
    {
      label: 'Recettes Encaissées',
      value: `${report.revenue.totalCollected.toLocaleString()} XOF`,
      sub: `${report.revenue.collectionRate}% de recouvrement`,
      icon: DollarSign,
      color: 'var(--success)',
      bg: 'var(--success-dim)'
    },
    {
      label: 'Total Dépenses',
      value: `${report.expenses.totalExpenses.toLocaleString()} XOF`,
      sub: `${report.expenses.count} opérations`,
      icon: TrendingDown,
      color: 'var(--danger)',
      bg: 'var(--danger-dim)'
    },
    {
      label: 'Masse Salariale',
      value: `${report.payroll.totalPayroll.toLocaleString()} XOF`,
      sub: `${report.payroll.count} bulletins`,
      icon: Users,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)'
    },
    {
      label: 'Résultat Net',
      value: `${report.summary.netBalance.toLocaleString()} XOF`,
      sub: `Marge : ${report.summary.profitMargin}%`,
      icon: TrendingUp,
      color: report.summary.netBalance >= 0 ? 'var(--primary)' : 'var(--danger)',
      bg: report.summary.netBalance >= 0 ? 'rgba(79,142,247,0.12)' : 'var(--danger-dim)'
    }
  ] : [];

  return (
    <AppLayout
      title="Rapport Financier Annuel"
      subtitle="Bilan complet : recettes, dépenses, masse salariale et résultat net"
      breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Rapport Annuel' }]}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '8px 14px', borderRadius: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px' }}
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-outline" onClick={fetchReport} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'spin' : ''} /> Actualiser
          </button>
          <button className="btn-primary" onClick={exportPDF} disabled={isExporting || !report}>
            {isExporting ? <><Loader2 size={15} className="spin" /> Export...</> : <><Download size={15} /> Exporter PDF</>}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : !report ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3>Impossible de charger le rapport</h3>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {kpis.map((k, i) => (
              <div key={i} className="card shadow-sm" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '14px', background: k.bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <k.icon size={24} style={{ color: k.color }} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{k.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: k.color }}>{k.value}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{k.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly breakdown table */}
          <div className="card shadow-sm" style={{ padding: 0 }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={16} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px' }}>Évolution Mensuelle {year}</h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th style={{ textAlign: 'right' }}>Recettes</th>
                    <th style={{ textAlign: 'right' }}>Dépenses</th>
                    <th style={{ textAlign: 'right' }}>Masse Salariale</th>
                    <th style={{ textAlign: 'right' }}>Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {report.monthly.map(m => (
                    <tr key={m.month}>
                      <td style={{ fontWeight: 600 }}>{m.label.charAt(0).toUpperCase() + m.label.slice(1)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                        {m.revenue > 0 ? `+${m.revenue.toLocaleString()}` : '—'} XOF
                      </td>
                      <td style={{ textAlign: 'right', color: m.expense > 0 ? 'var(--danger)' : 'var(--text-dim)' }}>
                        {m.expense > 0 ? `−${m.expense.toLocaleString()}` : '—'} XOF
                      </td>
                      <td style={{ textAlign: 'right', color: m.payroll > 0 ? '#6366f1' : 'var(--text-dim)' }}>
                        {m.payroll > 0 ? `−${m.payroll.toLocaleString()}` : '—'} XOF
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: m.net >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                        {m.net >= 0 ? '+' : ''}{m.net.toLocaleString()} XOF
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-3)', fontWeight: 800 }}>
                    <td>TOTAL {year}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>{report.revenue.totalCollected.toLocaleString()} XOF</td>
                    <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{report.expenses.totalExpenses.toLocaleString()} XOF</td>
                    <td style={{ textAlign: 'right', color: '#6366f1' }}>{report.payroll.totalNetPaid.toLocaleString()} XOF</td>
                    <td style={{ textAlign: 'right', color: report.summary.netBalance >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                      {report.summary.netBalance >= 0 ? '+' : ''}{report.summary.netBalance.toLocaleString()} XOF
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
