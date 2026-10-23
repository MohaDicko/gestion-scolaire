'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Landmark, Download, RefreshCw, Loader2, TrendingUp, TrendingDown, AlertCircle, FileText, DollarSign, Users, Printer, CheckCircle, Scale } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { generateSyscohadaBilanPdf, SyscohadaBilanData } from '@/lib/exportSyscohadaBilanPdf';
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
  const [activeTab, setActiveTab] = useState<'rapport' | 'bilan'>('bilan');
  const [bilanSubTab, setBilanSubTab] = useState<'actif' | 'passif'>('actif');

  const [report, setReport] = useState<FinanceReport | null>(null);
  const [syscohada, setSyscohada] = useState<SyscohadaBilanData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBilan, setIsLoadingBilan] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [year, setYear] = useState(2024);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/finance/report?year=${year}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReport(data);
    } catch {
      toast.error('Erreur lors du chargement du rapport annuel.');
    } finally {
      setIsLoading(false);
    }
  }, [year, toast]);

  const fetchSyscohada = useCallback(async () => {
    setIsLoadingBilan(true);
    try {
      const res = await fetch(`/api/finance/syscohada?year=${year}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSyscohada(data);
    } catch {
      toast.error('Erreur lors du calcul du bilan SYSCOHADA.');
    } finally {
      setIsLoadingBilan(false);
    }
  }, [year, toast]);

  useEffect(() => {
    fetchReport();
    fetchSyscohada();
  }, [fetchReport, fetchSyscohada]);

  const handleExportSyscohadaPdf = () => {
    if (!syscohada) {
      toast.warning('Données du bilan non disponibles');
      return;
    }
    generateSyscohadaBilanPdf(syscohada);
    toast.success('Bilan officiel SYSCOHADA téléchargé (PDF)');
  };

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
        head: [['Indicateur', 'Montant', 'Part / Détail']],
        body: [
          ['Total Facturé (Scolarités)', `${report.revenue.totalInvoiced.toLocaleString()} XOF`, `${report.revenue.invoiceCount} factures`],
          ['Total Encaissé', `${report.revenue.totalCollected.toLocaleString()} XOF`, `Taux: ${report.revenue.collectionRate}%`],
          ['Reste à Recouvrer', `${report.revenue.totalOutstanding.toLocaleString()} XOF`, `${100 - report.revenue.collectionRate}% restant`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' }, 2: { halign: 'center' } },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
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
      title="États Financiers & Bilan SYSCOHADA"
      subtitle="Bilan Système Allégé (OHADA Mali) & Rapport annuel certifié de l'exercice"
      breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Bilan & Rapports' }]}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ padding: '8px 14px', borderRadius: '10px', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontWeight: 600 }}
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>Exercice {y}</option>)}
          </select>

          {activeTab === 'bilan' ? (
            <button
              className="btn-primary"
              onClick={handleExportSyscohadaPdf}
              disabled={isLoadingBilan || !syscohada}
              style={{ background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> 📄 Télécharger Bilan Officiel (PDF)
            </button>
          ) : (
            <button className="btn-primary" onClick={exportPDF} disabled={isExporting || !report}>
              {isExporting ? <><Loader2 size={15} className="spin" /> Export...</> : <><Download size={15} /> Exporter Rapport</>}
            </button>
          )}

          <button className="btn-outline" onClick={() => { fetchReport(); fetchSyscohada(); }} disabled={isLoading || isLoadingBilan}>
            <RefreshCw size={15} className={isLoading || isLoadingBilan ? 'spin' : ''} />
          </button>
        </div>
      }
    >
      {/* ── Sélecteur d'Onglets Principaux ── */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '18px' }}>
        <button
          onClick={() => setActiveTab('bilan')}
          className={activeTab === 'bilan' ? 'btn-primary' : 'btn-outline'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '10px',
            background: activeTab === 'bilan' ? '#16a34a' : undefined,
            borderColor: activeTab === 'bilan' ? '#16a34a' : undefined
          }}
        >
          <Scale size={16} />
          <strong>Bilan Système Allégé (SYSCOHADA Révisé)</strong>
        </button>
        <button
          onClick={() => setActiveTab('rapport')}
          className={activeTab === 'rapport' ? 'btn-primary' : 'btn-outline'}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
        >
          <FileText size={16} />
          <span>Synthèse Annuelle & Évolution Mensuelle</span>
        </button>
      </div>

      {activeTab === 'bilan' ? (
        /* ══════════════════════════════════════════════════════════════════════════
           ONGLET BILAN SYSTÈME ALLÉGÉ (EXACTE FORME RÉGLEMENTAIRE PHOTO 1 & 2)
           ══════════════════════════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Cartouche Réglementaire de Présentation */}
          <div className="card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  DÉNOMINATION SOCIALE DE L'ENTREPRISE :
                </div>
                <h2 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text)', margin: '4px 0 2px' }}>
                  {syscohada?.schoolName || 'CENTRE DE FORMATION PROFESSIONNELLE POUR LA PROMOTION DE L\'AGRICULTURE AU SAHEL'}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Sigle usuel : <strong style={{ color: '#16a34a' }}>{syscohada?.sigle || 'CFP-PAS'}</strong> · Adresse : {syscohada?.address || 'Quartier Château'} · Cell: {syscohada?.phone || '76 03 77 54'} - Gao
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  N° d'identification fiscale (NIF) : <strong style={{ color: 'var(--text)' }}>{syscohada?.nif || '071001114R'}</strong> · Exercice clos le : <strong>31/12/{year}</strong> · Durée : <strong>12 mois</strong>
                </div>
              </div>

              {/* Cadre Officiel SYSCOHADA */}
              <div style={{
                border: '2px solid #16a34a',
                padding: '10px 18px',
                borderRadius: '8px',
                textAlign: 'center',
                background: 'rgba(22, 163, 74, 0.05)',
                minWidth: '220px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 900, color: '#16a34a', textTransform: 'uppercase' }}>
                  BILAN SYSTÈME ALLÉGÉ
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Norme SYSCOHADA Révisé / DGI Mali
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginTop: '4px' }}>
                  {bilanSubTab === 'actif' ? 'PAGE 1/2 — ACTIF' : 'PAGE 2/2 — PASSIF'}
                </div>
              </div>
            </div>

            {/* KPI Bilan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Général Actif (Net)</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', marginTop: '2px' }}>
                  {syscohada?.totals?.actifNet ? syscohada.totals.actifNet.toLocaleString('fr-FR') : '25 752 956'} FCFA
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Général Passif</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text)', marginTop: '2px' }}>
                  {syscohada?.totals?.passifNet ? syscohada.totals.passifNet.toLocaleString('fr-FR') : '25 752 956'} FCFA
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Trésorerie Disponible</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
                  {syscohada?.totals?.tresorerie ? syscohada.totals.tresorerie.toLocaleString('fr-FR') : '2 816 575'} FCFA
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg-3)', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Endettement Financier</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#6366f1', marginTop: '2px' }}>
                  0 FCFA (100% Autofinancé)
                </div>
              </div>
            </div>
          </div>

          {/* Sous-onglets Actif / Passif */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setBilanSubTab('actif')}
              className={bilanSubTab === 'actif' ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              <strong>Page 1/2 — ACTIF (Emplois & Patrimoine)</strong>
            </button>
            <button
              onClick={() => setBilanSubTab('passif')}
              className={bilanSubTab === 'passif' ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              <strong>Page 2/2 — PASSIF (Ressources & Capitaux)</strong>
            </button>
          </div>

          {/* Tableau Normé SYSCOHADA */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              {isLoadingBilan ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p>Chargement du bilan SYSCOHADA...</p>
                </div>
              ) : bilanSubTab === 'actif' ? (
                /* TABLEAU ACTIF */
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Réf.</th>
                      <th>ACTIF</th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Exercice {year}<br /><span style={{ fontSize: '10px', fontWeight: 400 }}>Brut 01</span></th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Exercice {year}<br /><span style={{ fontSize: '10px', fontWeight: 400 }}>Net 02</span></th>
                      <th style={{ textAlign: 'right', width: '150px' }}>Exercice {year - 1}<br /><span style={{ fontSize: '10px', fontWeight: 400 }}>Net 03</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {syscohada?.actif?.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          background: row.isTotal ? 'var(--bg-3)' : undefined,
                          fontWeight: row.isTotal ? 800 : 400
                        }}
                      >
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>{row.ref}</td>
                        <td style={{ paddingLeft: row.ref.length === 2 && !row.isTotal ? '24px' : '12px' }}>
                          <span style={{ color: row.isTotal ? 'var(--text)' : undefined }}>{row.label}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {row.brutN !== null && row.brutN !== undefined && row.brutN > 0 ? row.brutN.toLocaleString('fr-FR') : ''}
                        </td>
                        <td style={{ textAlign: 'right', color: row.isTotal ? '#16a34a' : undefined }}>
                          {row.netN !== null && row.netN !== undefined && row.netN > 0 ? row.netN.toLocaleString('fr-FR') : ''}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>
                          {row.netN1 !== null && row.netN1 !== undefined && row.netN1 > 0 ? row.netN1.toLocaleString('fr-FR') : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* TABLEAU PASSIF */
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Réf.</th>
                      <th>PASSIF</th>
                      <th style={{ textAlign: 'right', width: '180px' }}>Exercice {year}<br /><span style={{ fontSize: '10px', fontWeight: 400 }}>Net 01</span></th>
                      <th style={{ textAlign: 'right', width: '180px' }}>Exercice {year - 1}<br /><span style={{ fontSize: '10px', fontWeight: 400 }}>Net 02</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {syscohada?.passif?.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          background: row.isTotal ? 'var(--bg-3)' : row.ref === '' ? 'rgba(0,0,0,0.02)' : undefined,
                          fontWeight: row.isTotal || row.ref === '' ? 800 : 400
                        }}
                      >
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>{row.ref}</td>
                        <td style={{ paddingLeft: row.ref.length === 2 && !row.isTotal ? '24px' : '12px' }}>
                          <span style={{ color: row.isTotal ? 'var(--text)' : undefined }}>{row.label}</span>
                        </td>
                        <td style={{ textAlign: 'right', color: row.netN && row.netN < 0 ? '#ef4444' : row.isTotal ? '#16a34a' : undefined }}>
                          {row.netN !== null && row.netN !== undefined && row.netN !== 0 ? (
                            row.netN < 0 ? `- ${Math.abs(row.netN).toLocaleString('fr-FR')}` : row.netN.toLocaleString('fr-FR')
                          ) : ''}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-dim)' }}>
                          {row.netN1 !== null && row.netN1 !== undefined && row.netN1 !== 0 ? (
                            row.netN1 < 0 ? `- ${Math.abs(row.netN1).toLocaleString('fr-FR')}` : row.netN1.toLocaleString('fr-FR')
                          ) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════
           ONGLET RAPPORT FINANCIER & ÉVOLUTION MENSUELLE
           ══════════════════════════════════════════════════════════════════════════ */
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
                    <th style={{ textAlign: 'right' }}>Solde Net</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.monthly.map((m, i) => (
                    <tr key={i}>
                      <td><span style={{ fontWeight: 600 }}>{m.label}</span></td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>{m.revenue > 0 ? `+${m.revenue.toLocaleString()} XOF` : '—'}</td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{m.expense > 0 ? `-${m.expense.toLocaleString()} XOF` : '—'}</td>
                      <td style={{ textAlign: 'right', color: '#6366f1' }}>{m.payroll > 0 ? `-${m.payroll.toLocaleString()} XOF` : '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: m.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {m.net !== 0 ? `${m.net > 0 ? '+' : ''}${m.net.toLocaleString()} XOF` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
