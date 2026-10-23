'use client';

import { useState, useEffect, useCallback } from 'react';
import { BadgeDollarSign, Plus, Loader2, X, Download, ChevronDown, ChevronUp, AlertCircle, FileText, Calendar, Clock, CheckCircle2, XCircle, Printer, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { calculateMaliPayroll, formatXOF, MALI_RATES } from '@/lib/maliPayroll';
import { exportToExcel } from '@/lib/exportUtils';
import { generateVacatairesEtatPdf } from '@/lib/exportVacatairesPdf';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DIRECTOR_STAMP_BASE64 } from '@/lib/directorStampData';

const emptyForm = {
  employeeId: '',
  periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
  baseSalary: '',
  taxableBonuses: '0',
  nonTaxableBonuses: '0',
  numberOfChildren: '0',
  notes: ''
};

export default function PayslipsPage() {
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'vacataires' | 'salaries'>('vacataires');

  // État Salariés
  const [payslips, setPayslips] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  // État Vacataires (CFPPAS)
  const [vacatairesPeriod, setVacatairesPeriod] = useState({
    start: '2025-10-01',
    end: '2025-10-31'
  });
  const [vacatairesData, setVacatairesData] = useState<any>({
    vacataires: [],
    totals: { totalHours: 0, totalGross: 0, totalNet: 0 }
  });
  const [isLoadingVacataires, setIsLoadingVacataires] = useState(false);
  const [expandedVacataireId, setExpandedVacataireId] = useState<string | null>(null);

  // Calcul en temps réel salarié (prévisualisation)
  const preview = formData.baseSalary
    ? calculateMaliPayroll({
        baseSalary: parseFloat(formData.baseSalary) || 0,
        taxableBonuses: parseFloat(formData.taxableBonuses) || 0,
        nonTaxableBonuses: parseFloat(formData.nonTaxableBonuses) || 0,
        numberOfChildren: parseInt(formData.numberOfChildren) || 0,
      })
    : null;

  const fetchPayslips = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payslips');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      setPayslips(await res.json());
    } catch {
      toast.error('Erreur lors du chargement des bulletins.');
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  const fetchVacataires = useCallback(async () => {
    setIsLoadingVacataires(true);
    try {
      const res = await fetch(`/api/hr/vacataires?periodStart=${vacatairesPeriod.start}&periodEnd=${vacatairesPeriod.end}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVacatairesData(data);
    } catch {
      toast.error('Erreur lors du calcul des honoraires vacataires.');
    } finally {
      setIsLoadingVacataires(false);
    }
  }, [vacatairesPeriod, router, toast]);

  useEffect(() => {
    fetchPayslips();
    fetchVacataires();
    fetch('/api/employees?search=').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setEmployees(d);
    }).catch(() => {});
  }, [fetchPayslips, fetchVacataires]);

  const handleDownloadVacatairesPdf = () => {
    if (!vacatairesData.vacataires || vacatairesData.vacataires.length === 0) {
      toast.warning('Aucun honoraire vacataire à exporter sur cette période.');
      return;
    }
    generateVacatairesEtatPdf(
      vacatairesData.vacataires,
      vacatairesPeriod.start,
      vacatairesPeriod.end,
      'CFP-PAS de Gao (Agro-Pastorale)'
    );
    toast.success('Bordereau officiel d\'émargement téléchargé (PDF)');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.baseSalary || parseFloat(formData.baseSalary) < 1) {
      toast.warning('Salaire de base invalide.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.alerts?.length > 0) {
        data.alerts.forEach((a: string) => toast.warning(a));
      }
      toast.success('Bulletin de paie généré et enregistré.');
      setShowModal(false);
      setFormData({ ...emptyForm });
      fetchPayslips();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: string, value: string) => setFormData(f => ({ ...f, [field]: value }));

  const handleExportExcel = () => {
    if (payslips.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    const exportData = payslips.map(p => ({
      'Matricule': p.employee?.employeeNumber || 'N/A',
      'Nom': p.employee?.lastName || '',
      'Prénom': p.employee?.firstName || '',
      'Période': new Date(p.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      'Salaire de Base': p.baseSalary,
      'Brut Imposable': p.grossSalary,
      'INPS Salarié': p.inpsEmployee,
      'AMO Salarié': p.amoEmployee,
      'ITS': p.its,
      'Net à Payer': p.netSalary,
      'Coût Employeur': (p.grossSalary || 0) + (p.nonTaxableBonuses || 0) + (p.totalEmployerCharges || 0)
    }));

    exportToExcel(exportData, `Journal_Paie_Mali_${new Date().toISOString().split('T')[0]}`, 'Paie');
    toast.success('Journal de paie exporté (Excel)');
  };

  const downloadDipe = () => {
    if (payslips.length === 0) return;
    
    let content = "DOCUMENT D'INFORMATION SUR LE PERSONNEL - MALI\n";
    content += "================================================\n";
    content += `Date Génération : ${new Date().toLocaleString()}\n`;
    content += `Nombre de salariés : ${payslips.length}\n\n`;
    content += "MATRICULE | NOM & PRÉNOM | BRUT IMPOSABLE | INPS (3.06%) | AMO (1.5%) | ITS | NET À PAYER\n";
    content += "--------------------------------------------------------------------------------------------\n";
    
    payslips.forEach(p => {
      content += `${p.employee?.employeeNumber || 'N/A'} | `;
      content += `${(p.employee?.firstName + ' ' + p.employee?.lastName).padEnd(20)} | `;
      content += `${(p.grossSalary || 0).toLocaleString()} | `;
      content += `${(p.inpsEmployee || 0).toLocaleString()} | `;
      content += `${(p.amoEmployee || 0).toLocaleString()} | `;
      content += `${(p.its || 0).toLocaleString()} | `;
      content += `${(p.netSalary || 0).toLocaleString()}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DIPE_MALI_${new Date().getFullYear()}_${new Date().getMonth() + 1}.txt`;
    a.click();
    toast.success('Fichier DIPE généré pour déclaration.');
  };

  const downloadPDF = (p: any) => {
    const doc = new (jsPDF as any)();
    
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text('BULLETIN DE PAIE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('CFP-PAS de Gao (Agro-Pastorale)', 14, 30);
    doc.text("Code établissement : CFPPAS", 14, 35);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Employé : ${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`, 14, 50);
    doc.text(`Matricule : ${p.employee?.employeeNumber || 'N/A'}`, 14, 56);
    doc.text(`Période : ${new Date(p.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`, 14, 62);
    
    const tableData = [
      ['Salaire de Base', (p.baseSalary || 0).toLocaleString() + ' XOF'],
    ];
    if (p.taxableBonuses > 0) tableData.push(['Primes imposables', p.taxableBonuses.toLocaleString() + ' XOF']);
    if (p.nonTaxableBonuses > 0) tableData.push(['Indemnités non imp.', p.nonTaxableBonuses.toLocaleString() + ' XOF']);
    
    tableData.push(['Salaire Brut Imposable', (p.grossSalary || 0).toLocaleString() + ' XOF']);
    tableData.push(['INPS Salarié (3.6%)', '−' + (p.inpsEmployee || 0).toLocaleString() + ' XOF']);
    tableData.push(['AMO/CANAM Salarié (1.5%)', '−' + (p.amoEmployee || 0).toLocaleString() + ' XOF']);
    tableData.push(['ITS (Impôt sur traitement)', '−' + (p.its || 0).toLocaleString() + ' XOF']);
    tableData.push(['NET À PAYER', (p.netSalary || 0).toLocaleString() + ' XOF']);
    
    (doc as any).autoTable({
      startY: 70,
      head: [['Rubrique', 'Montant']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Coût employeur total : ${((p.grossSalary || 0) + (p.nonTaxableBonuses || 0) + (p.totalEmployerCharges || 0)).toLocaleString()} XOF`, 14, finalY + 25);
    doc.text(`INPS Patronal (7%): ${(p.inpsEmployer || 0).toLocaleString()} XOF | AMO Patronale (4.5%): ${(p.amoEmployer || 0).toLocaleString()} XOF`, 14, finalY + 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('LE DIRECTEUR DU CFP-PAS', 140, finalY + 45);
    if (DIRECTOR_STAMP_BASE64) {
      doc.addImage(DIRECTOR_STAMP_BASE64, 'PNG', 135, finalY + 48, 50, 50);
    }
    
    doc.save(`Bulletin_${p.employee?.lastName || 'Employe'}_${new Date(p.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.pdf`);
    toast.success('Bulletin PDF généré');
  };

  return (
    <AppLayout
      title="Rémunération & Paie — CFP-PAS de Gao"
      subtitle="Bordereau officiel d'émargement vacataires (1 750 FCFA/h) & Bulletins salariés conformes Mali"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Paie' }]}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'vacataires' ? (
            <>
              <button className="btn-outline" onClick={fetchVacataires} disabled={isLoadingVacataires}>
                <Clock size={15} /> Recalculer Émargements
              </button>
              <button 
                className="btn-primary" 
                onClick={handleDownloadVacatairesPdf}
                disabled={!vacatairesData.vacataires || vacatairesData.vacataires.length === 0}
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
              >
                <Printer size={15} /> 📄 Télécharger Bordereau Officiel (PDF)
              </button>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={handleExportExcel} disabled={payslips.length === 0}>
                <Download size={15} /> Exporter Excel
              </button>
              <button className="btn-outline" onClick={downloadDipe} disabled={payslips.length === 0}>
                <Download size={15} /> Télécharger DIPE
              </button>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={15} /> Nouveau Bulletin
              </button>
            </>
          )}
        </div>
      }
    >
      {/* ── Sélecteur d'onglets principaux ── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('vacataires')}
          className={activeTab === 'vacataires' ? 'btn-primary' : 'btn-outline'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '10px',
            background: activeTab === 'vacataires' ? '#16a34a' : undefined,
            borderColor: activeTab === 'vacataires' ? '#16a34a' : undefined
          }}
        >
          <span>🌾</span>
          <strong>État des Vacataires (Bordereau d'Émargement CFPPAS)</strong>
        </button>
        <button
          onClick={() => setActiveTab('salaries')}
          className={activeTab === 'salaries' ? 'btn-primary' : 'btn-outline'}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
        >
          <span>📄</span>
          <span>Bulletins Salariés Mensuels (CDI / CDD)</span>
        </button>
      </div>

      {activeTab === 'vacataires' ? (
        /* ══════════════════════════════════════════════════════════════════════════
           VUE ÉTAT DES HONORAIRES DES PROFESSEURS VACATAIRES (PHOTO 1 & 2)
           ══════════════════════════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Filtres de Période & Indicateurs Clés */}
          <div className="card" style={{ padding: '18px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  🗓️ Période de Liquidation des Honoraires
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0' }}>
                  Total des heures certifiées d'après le registre de présence et le cahier d'émargement de Gao.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Du:</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    value={vacatairesPeriod.start}
                    onChange={e => setVacatairesPeriod({ ...vacatairesPeriod, start: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Au:</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    value={vacatairesPeriod.end}
                    onChange={e => setVacatairesPeriod({ ...vacatairesPeriod, end: e.target.value })}
                  />
                </div>
                <button className="btn-outline" onClick={fetchVacataires} style={{ padding: '6px 14px' }}>
                  Filtrer
                </button>
              </div>
            </div>

            {/* Cartes KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '18px' }}>
              <div style={{ padding: '14px', background: 'var(--bg-3)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Heures Exécutées</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
                  {vacatairesData.totals?.totalHours || 0} h
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Validées par émargement
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--bg-3)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tarif Conventionné</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>
                  1 750 <span style={{ fontSize: '14px' }}>FCFA / h</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Taux horaire officiel CFPPAS
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--bg-3)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Masse Brute Honoraires</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)', marginTop: '4px' }}>
                  {(vacatairesData.totals?.totalGross || 0).toLocaleString('fr-FR')} <span style={{ fontSize: '14px' }}>FCFA</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Montant total à payer
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--bg-3)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Formateurs Émargés</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#6366f1', marginTop: '4px' }}>
                  {vacatairesData.vacataires?.filter((v: any) => v.totalHours > 0).length || 0} / {vacatairesData.vacataires?.length || 0}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Ayant dispensé des cours
                </div>
              </div>
            </div>
          </div>

          {/* Tableau Récapitulatif Conforme Photo 1 */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  📋 État de Paiement des Honoraires des Professeurs Vacataires
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Modèle homologué Ministère de l'Agriculture et de l'Élevage — Gao
                </span>
              </div>
              <button className="btn-outline" onClick={handleDownloadVacatairesPdf} style={{ fontSize: '12px', padding: '6px 12px' }}>
                <Printer size={14} /> Imprimer Bordereau
              </button>
            </div>

            <div className="table-container">
              {isLoadingVacataires ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p>Calcul des émargements et des heures...</p>
                </div>
              ) : vacatairesData.vacataires?.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>N°</th>
                      <th>Prénoms & Nom</th>
                      <th>Matières / Modules Enseignés</th>
                      <th style={{ textAlign: 'center' }}>Classe</th>
                      <th style={{ textAlign: 'center' }}>Total Heures</th>
                      <th style={{ textAlign: 'center' }}>Absences</th>
                      <th style={{ textAlign: 'right' }}>T.H</th>
                      <th style={{ textAlign: 'right' }}>Montant Brut</th>
                      <th style={{ textAlign: 'right' }}>Net à Payer</th>
                      <th style={{ textAlign: 'center' }}>Émargement / Séances</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacatairesData.vacataires.map((v: any, idx: number) => {
                      const isExpanded = expandedVacataireId === v.id;
                      return (
                        <>
                          <tr key={v.id} style={{ background: isExpanded ? 'var(--bg-3)' : undefined }}>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                              {idx + 1}
                            </td>
                            <td>
                              <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{v.name}</strong>
                              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{v.employeeNumber}</div>
                            </td>
                            <td style={{ fontSize: '13px', maxWidth: '240px' }}>
                              <span style={{ color: 'var(--text)' }}>{v.subjects}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', padding: '3px 8px', borderRadius: '6px' }}>
                                {v.classes}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <strong style={{ fontSize: '14px', color: v.totalHours > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                                {v.totalHours} h
                              </strong>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {v.absentHours > 0 ? (
                                <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '3px 8px', borderRadius: '6px' }}>
                                  (P) Absent ({v.absentHours}h)
                                </span>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>0h</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {v.hourlyRate.toLocaleString('fr-FR')} F
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                              {v.grossAmount.toLocaleString('fr-FR')} F
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <strong style={{ color: '#16a34a', fontSize: '14px' }}>
                                {v.netAmount.toLocaleString('fr-FR')} FCFA
                              </strong>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                className="btn-outline"
                                onClick={() => setExpandedVacataireId(isExpanded ? null : v.id)}
                                style={{ fontSize: '11px', padding: '4px 8px' }}
                              >
                                {isExpanded ? 'Masquer' : `${v.lessons?.length || 0} séances`}
                                {isExpanded ? <ChevronUp size={12} style={{ marginLeft: '4px' }} /> : <ChevronDown size={12} style={{ marginLeft: '4px' }} />}
                              </button>
                            </td>
                          </tr>

                          {/* Détail des séances émargées par l'enseignant */}
                          {isExpanded && (
                            <tr key={`${v.id}-detail`}>
                              <td colSpan={10} style={{ padding: '0', background: 'var(--bg-3)' }}>
                                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    📖 Séances du registre d'émargement — {v.name}
                                  </div>
                                  {v.lessons && v.lessons.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                                      {v.lessons.map((les: any, i: number) => (
                                        <div
                                          key={i}
                                          style={{
                                            background: 'var(--bg-card)',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: `1px solid ${les.status === 'COMPLETED' ? 'rgba(22, 163, 74, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                          }}
                                        >
                                          <div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                                              {les.title}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                              📅 {new Date(les.date).toLocaleDateString('fr-FR')} · {les.classroom} · {les.subject}
                                            </div>
                                          </div>
                                          <div style={{ textAlign: 'right' }}>
                                            {les.status === 'COMPLETED' ? (
                                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <CheckCircle2 size={12} /> {les.hoursCount}h Exécuté
                                              </span>
                                            ) : (
                                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <XCircle size={12} /> (P) Absent
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>
                                      Aucune séance enregistrée pour cet enseignant sur cette période.
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}

                    {/* Ligne TOTAL GÉNÉRAL */}
                    <tr style={{ background: 'var(--bg-3)', fontWeight: 800 }}>
                      <td colSpan={4} style={{ textAlign: 'right', fontSize: '13px', textTransform: 'uppercase' }}>
                        TOTAL GÉNÉRAL :
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '15px', color: '#16a34a' }}>
                        {vacatairesData.totals?.totalHours || 0} h
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>—</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>—</td>
                      <td style={{ textAlign: 'right', fontSize: '14px' }}>
                        {(vacatairesData.totals?.totalGross || 0).toLocaleString('fr-FR')} F
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '16px', color: '#16a34a' }}>
                        {(vacatairesData.totals?.totalNet || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Bordereau certifié conforme
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p>Aucun enseignant vacataire trouvé pour la période sélectionnée.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════
           VUE SALARIÉS PERMANENTS (CDI / CDD / MOTEUR MALIEN)
           ══════════════════════════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Légende des taux légaux */}
          <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap',
            padding: '14px 20px', background: 'var(--info-dim)', borderRadius: '12px',
            border: '1px solid var(--info)', fontSize: '12px', color: 'var(--info)', fontWeight: 600
          }}>
            <span>⚖️ Taux légaux en vigueur Mali :</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>INPS salarié : <strong style={{ color: 'var(--info)' }}>{(MALI_RATES.INPS_EMPLOYEE * 100).toFixed(2)}%</strong></span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>AMO/CANAM salarié : <strong style={{ color: 'var(--info)' }}>{(MALI_RATES.AMO_EMPLOYEE * 100).toFixed(1)}%</strong></span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>SMIG : <strong style={{ color: 'var(--info)' }}>{MALI_RATES.SMIG.toLocaleString()} XOF</strong></span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>ITS : barème progressif 0% → 30%</span>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              {isLoading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p>Chargement des bulletins...</p>
                </div>
              ) : payslips.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employé</th>
                      <th>Période</th>
                      <th>Salaire Brut</th>
                      <th>INPS+AMO+ITS</th>
                      <th>Net à payer</th>
                      <th>Statut</th>
                      <th>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(p => (
                      <>
                        <tr key={p.id}>
                          <td>
                            <strong>{p.employee?.firstName} {p.employee?.lastName}</strong><br />
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{p.employee?.employeeNumber}</span>
                          </td>
                          <td style={{ fontSize: '13px' }}>
                            {new Date(p.periodStart).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                          </td>
                          <td>{p.grossSalary?.toLocaleString() ?? p.baseSalary?.toLocaleString()} XOF</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                            −{((p.totalDeductions || 0) + (p.its || 0)).toLocaleString()} XOF
                          </td>
                          <td><strong style={{ color: 'var(--success)', fontSize: '15px' }}>{p.netSalary?.toLocaleString()} XOF</strong></td>
                          <td>
                            <span className={`badge ${p.status === 'FINALIZED' ? 'badge-primary' : 'badge-warning'}`}>
                              {p.status === 'FINALIZED' ? 'Validé' : p.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-icon"
                              title="Télécharger PDF"
                              onClick={() => downloadPDF(p)}
                              style={{ marginRight: '8px', color: 'var(--primary)' }}
                            >
                              <FileText size={16}/>
                            </button>
                            <button
                              className="btn-icon"
                              title="Voir détail cotisations"
                              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                            >
                              {expandedId === p.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </button>
                          </td>
                        </tr>

                        {expandedId === p.id && (
                          <tr key={`${p.id}-detail`}>
                            <td colSpan={7} style={{ background: 'var(--bg-3)', padding: '0' }}>
                              <div style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div>
                                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.06em' }}>Éléments de Rémunération</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <BulletinRow label="Salaire de Base" amount={p.baseSalary} color="var(--text)" />
                                    {p.taxableBonuses > 0 && <BulletinRow label="Primes imposables" amount={p.taxableBonuses} color="var(--text)" />}
                                    {p.nonTaxableBonuses > 0 && <BulletinRow label="Indemnités non imposables" amount={p.nonTaxableBonuses} color="var(--text)" />}
                                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                                      <BulletinRow label="Salaire Brut Imposable" amount={p.grossSalary} color="var(--text)" bold />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.06em' }}>Retenues & Cotisations</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <BulletinRow label="INPS Salarié (3.6%)" amount={p.inpsEmployee} color="var(--danger)" />
                                    <BulletinRow label="AMO/CANAM Salarié (1.5%)" amount={p.amoEmployee} color="var(--danger)" />
                                    <BulletinRow label="ITS (Impôt sur traitement)" amount={p.its} color="var(--danger)" />
                                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                                      <BulletinRow label="Net à Payer" amount={p.netSalary} color="var(--success)" bold large />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <AlertCircle size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p>Aucun bulletin généré pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nouveau Bulletin Salarié ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '17px', margin: 0 }}>Créer un Bulletin de Salaire</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Conforme à la législation malienne</p>
              </div>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderRight: '1px solid var(--border)' }}>
                <div className="form-group">
                  <label>Employé *</label>
                  <select required value={formData.employeeId} onChange={e => update('employeeId', e.target.value)} className="form-input">
                    <option value="">Sélectionner un employé</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Période du *</label>
                    <input type="date" required value={formData.periodStart} onChange={e => update('periodStart', e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Au *</label>
                    <input type="date" required value={formData.periodEnd} onChange={e => update('periodEnd', e.target.value)} className="form-input" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Salaire de Base (XOF) *</label>
                  <input
                    type="number" required min="1" step="100"
                    placeholder="Ex: 150000"
                    value={formData.baseSalary}
                    onChange={e => update('baseSalary', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label>Primes imposables</label>
                    <input type="number" min="0" step="100" value={formData.taxableBonuses} onChange={e => update('taxableBonuses', e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Indemnités non imp.</label>
                    <input type="number" min="0" step="100" value={formData.nonTaxableBonuses} onChange={e => update('nonTaxableBonuses', e.target.value)} className="form-input" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Enregistrer'}
                  </button>
                </div>
              </form>

              {/* Aperçu direct du calcul */}
              <div style={{ padding: '24px', background: 'var(--bg-card)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Aperçu du Calcul
                </h4>
                {preview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <PreviewRow label="Brut Imposable" value={preview.grossSalary} />
                    <PreviewRow label="INPS (3.6%)" value={preview.inpsEmployee} isDeduction />
                    <PreviewRow label="AMO (1.5%)" value={preview.amoEmployee} isDeduction />
                    <PreviewRow label="ITS" value={preview.its} isDeduction />
                    <div style={{ borderTop: '2px solid var(--border)', marginTop: '8px', paddingTop: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Net à payer estimé :</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--success)' }}>{preview.netSalary.toLocaleString()} XOF</div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Entrez un salaire pour visualiser.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function BulletinRow({ label, amount, color, bold, large }: { label: string; amount: number; color: string; bold?: boolean; large?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: large ? '13px' : '12px', fontWeight: bold ? 700 : 400, color: bold ? 'var(--text)' : 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: large ? '15px' : '13px', fontWeight: bold ? 800 : 600, color }}>{amount < 0 ? '-' : ''}{Math.abs(amount).toLocaleString()} XOF</span>
    </div>
  );
}

function PreviewRow({ label, value, isDeduction }: { label: string; value: number; isDeduction?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <strong style={{ color: isDeduction ? 'var(--danger)' : 'var(--text)' }}>
        {isDeduction ? '−' : '+'}{Math.abs(value).toLocaleString()} XOF
      </strong>
    </div>
  );
}
