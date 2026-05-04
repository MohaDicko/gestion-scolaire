'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { FileText, Download, Search, Loader2, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/components/Toast';

interface TranscriptData {
  school: { name: string; city: string; motto: string };
  student: { studentNumber: string; firstName: string; lastName: string; dateOfBirth: string; gender: string; campus: string };
  enrollment: { classroom: string; level: string; series: string; academicYear: string };
  subjectResults: {
    subjectName: string; subjectCode: string; coefficient: number;
    t1?: number; t2?: number; t3?: number; annualAvg: number | null; weighted: number | null; mention: string;
  }[];
  summary: { generalAverage: number | null; generalMention: string; totalCoeff: number; subjectCount: number };
}

export default function TranscriptsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetch('/api/academic-years').then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setYears(d);
        const active = d.find((y: any) => y.isActive);
        if (active) setSelectedYearId(active.id);
      }
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/students?search=${encodeURIComponent(searchTerm)}&pageSize=30`)
        .then(r => r.json())
        .then(d => { setStudents(d.items || []); setIsLoading(false); })
        .catch(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleGenerate = async (student: any) => {
    if (!selectedYearId) { toast.warning('Veuillez sélectionner une année académique.'); return; }
    setIsGenerating(student.id);
    try {
      const r = await fetch(`/api/reports/transcripts?studentId=${student.id}&academicYearId=${selectedYearId}`);
      if (!r.ok) throw new Error('Données insuffisantes pour ce relevé.');
      const data: TranscriptData = await r.json();

      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageW = 210; const margin = 14;
      const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

      // ── En-tête ──────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 32, 'F');
      doc.setFillColor(0, 154, 68); doc.rect(0, 0, pageW / 3, 2.5, 'F');
      doc.setFillColor(252, 209, 22); doc.rect(pageW / 3, 0, pageW / 3, 2.5, 'F');
      doc.setFillColor(206, 17, 38); doc.rect(2 * pageW / 3, 0, pageW / 3, 2.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
      doc.text('RÉPUBLIQUE DU MALI — MINISTÈRE DE L\'ÉDUCATION NATIONALE', pageW / 2, 9, { align: 'center' });
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text(data.school.name.toUpperCase(), pageW / 2, 17, { align: 'center' });
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('RELEVÉ DE NOTES ANNUEL OFFICIEL', pageW / 2, 24, { align: 'center' });

      let y = 40;

      // ── Bloc identité ─────────────────────────────────────────────────
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, pageW - 2 * margin, 30, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
      doc.text('IDENTIFICATION DE L\'ÉLÈVE', margin + 5, y + 7);

      const idFields = [
        ['Nom', data.student.lastName.toUpperCase()],
        ['Prénom(s)', data.student.firstName],
        ['Matricule', data.student.studentNumber],
        ['Classe', data.enrollment.classroom],
        ['Filière/Série', data.enrollment.series || data.enrollment.level || '—'],
        ['Année Scolaire', data.enrollment.academicYear],
        ['Campus', data.student.campus],
        ['Date de naissance', new Date(data.student.dateOfBirth).toLocaleDateString('fr-FR')],
      ];

      const half = Math.ceil(idFields.length / 2);
      idFields.slice(0, half).forEach(([label, value], i) => {
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(`${label} :`, margin + 5, y + 14 + i * 5);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(value, margin + 30, y + 14 + i * 5);
      });
      idFields.slice(half).forEach(([label, value], i) => {
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(`${label} :`, pageW / 2 + 5, y + 14 + i * 5);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(value, pageW / 2 + 32, y + 14 + i * 5);
      });

      y += 38;

      // ── Tableau des notes ─────────────────────────────────────────────
      const tableRows = data.subjectResults.map(r => [
        r.subjectName,
        r.coefficient.toString(),
        r.t1 !== undefined ? r.t1.toFixed(2) : '—',
        r.t2 !== undefined ? r.t2.toFixed(2) : '—',
        r.t3 !== undefined ? r.t3.toFixed(2) : '—',
        r.annualAvg !== null ? r.annualAvg.toFixed(2) : '—',
        r.mention,
      ]);

      autoTable(doc, {
        startY: y,
        head: [['MATIÈRE', 'COEFF', 'T1/20', 'T2/20', 'T3/20', 'MOY. ANNUELLE', 'MENTION']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', fontSize: 7.5, halign: 'center', cellPadding: 4 },
        bodyStyles: { fontSize: 7, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'left', cellWidth: 60 },
          1: { halign: 'center', cellWidth: 14 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'center', cellWidth: 20 },
          5: { halign: 'center', fontStyle: 'bold', cellWidth: 24, textColor: [15, 100, 60] },
          6: { halign: 'center', cellWidth: 28 },
        },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        didParseCell: (data) => {
          if (data.column.index === 5 && data.section === 'body') {
            const val = parseFloat(data.cell.text[0]);
            if (!isNaN(val)) {
              data.cell.styles.textColor = val >= 14 ? [21, 128, 61] : val >= 10 ? [30, 41, 59] : [185, 28, 28];
            }
          }
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      // ── Récapitulatif ─────────────────────────────────────────────────
      const avg = data.summary.generalAverage;
      const avgColor: [number, number, number] = avg !== null && avg >= 14 ? [21, 128, 61] : avg !== null && avg >= 10 ? [30, 41, 59] : [185, 28, 28];
      doc.setFillColor(avgColor[0], avgColor[1], avgColor[2]);
      doc.roundedRect(margin, finalY, pageW - 2 * margin, 14, 2, 2, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(`MOYENNE GÉNÉRALE ANNUELLE : ${avg !== null ? avg.toFixed(2) : '—'} / 20`, margin + 6, finalY + 6);
      doc.text(`MENTION : ${data.summary.generalMention || '—'}`, margin + 6, finalY + 11);
      doc.setFontSize(8);
      doc.text(`${data.summary.subjectCount} matière(s) — Total coeff. : ${data.summary.totalCoeff}`, pageW - margin - 4, finalY + 8.5, { align: 'right' });

      // ── Décision + Signatures ─────────────────────────────────────────
      const sigY = finalY + 26;
      doc.setTextColor(15, 23, 42); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text('Décision du Conseil :', margin, sigY);
      doc.setFont('helvetica', 'bold');
      doc.text(avg !== null && avg >= 10 ? 'Admis(e) en classe supérieure.' : 'Passage en conseil de classe.', margin + 35, sigY);

      [['Le Directeur', margin + 10], ['Le Censeur', pageW / 2 - 15], ['Signature Parent', pageW - margin - 50]].forEach(([label, x]) => {
        doc.setDrawColor(200, 210, 220); doc.setLineWidth(0.3);
        doc.line(+x, sigY + 20, +x + 42, sigY + 20);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
        doc.text(label as string, +x + 21, sigY + 25, { align: 'center' });
      });

      // ── Filigrane ─────────────────────────────────────────────────────
      doc.setTextColor(230, 235, 245); doc.setFontSize(44);
      doc.text('ORIGINAL', pageW / 2, 160, { align: 'center', angle: 45 });

      // ── Pied de page ──────────────────────────────────────────────────
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 282, pageW, 15, 'F');
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
      doc.text(`Édité le ${today} — ${data.school.name} — Confidentiel — Document officiel`, pageW / 2, 289, { align: 'center' });

      doc.save(`Releve_Annuel_${data.student.lastName}_${data.student.firstName}_${data.enrollment.academicYear}.pdf`);
      toast.success('Relevé de notes généré avec succès !');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la génération.');
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <AppLayout
      title="Relevés de Notes Annuels"
      subtitle="Documents officiels agrégés sur les 3 trimestres — Format DREN/DEF Mali"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Relevés de Notes' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Toolbar */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '0 16px', flex: 1, maxWidth: '380px' }}>
            <Search size={15} color="#94a3b8" />
            <input type="text" placeholder="Rechercher un élève..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '11px 0', fontSize: '13px', outline: 'none', width: '100%' }} />
          </div>
          <div>
            <select value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)}
              style={{ padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', outline: 'none', background: 'white', fontWeight: 600 }}>
              <option value="">-- Année --</option>
              {years.map((y: any) => <option key={y.id} value={y.id}>{y.name} {y.isActive ? '★' : ''}</option>)}
            </select>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139,92,246,0.08)', borderRadius: '10px', padding: '8px 14px' }}>
            <Award size={15} color="#8b5cf6" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6' }}>Format Officiel DREN • Notes Réelles DB</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(79,142,247,0.1)', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
              <FileText size={16} color="#4f8ef7" />
            </div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Impression des Relevés</h3>
            <span style={{ marginLeft: 'auto', background: '#f1f5f9', padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
              {students.length} dossiers
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Matricule', 'Nom', 'Prénom', 'Genre', 'Statut', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 700, color: '#64748b', textAlign: h === 'Action' ? 'right' : 'left', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                    <Loader2 size={28} color="#4f8ef7" style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                    <br />Chargement...
                  </td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Aucun dossier trouvé.</td></tr>
                ) : students.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid #f8fafc' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                    <td style={{ padding: '14px 16px' }}><span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: '#475569' }}>{student.studentNumber}</span></td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#1e293b' }}>{student.lastName.toUpperCase()}</td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{student.firstName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: student.gender === 'MALE' ? 'rgba(59,130,246,0.1)' : 'rgba(236,72,153,0.1)', color: student.gender === 'MALE' ? '#3b82f6' : '#ec4899', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700 }}>
                        {student.gender === 'MALE' ? 'M' : 'F'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700 }}>Actif</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button onClick={() => handleGenerate(student)} disabled={isGenerating === student.id || !selectedYearId}
                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #4f8ef7, #3b6fd4)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: !selectedYearId ? 0.5 : 1 }}>
                        {isGenerating === student.id
                          ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Export...</>
                          : <><Download size={13} /> Relevé PDF</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
