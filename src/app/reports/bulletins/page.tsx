'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { FileText, Search, Printer, Loader2, AlertCircle, ChevronDown, Award, BookOpen, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';

interface BulletinData {
  school: { name: string; motto: string; logoUrl?: string };
  student: { id: string; studentNumber: string; firstName: string; lastName: string; dateOfBirth: string; gender: string; campus: string };
  enrollment: { classroom: string; level: string; academicYear: string };
  trimestre: number;
  subjectResults: {
    subjectName: string; subjectCode: string; coefficient: number;
    score: number; maxScore: number; average: number; weighted: number;
    mention: string; comment?: string; examType: string;
  }[];
  summary: { generalAverage: number; generalMention: string; totalCoeff: number; subjectCount: number };
}

function MentionBadge({ mention }: { mention: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    'Très Bien': { bg: '#dcfce7', color: '#15803d' },
    'Bien': { bg: '#dbeafe', color: '#1d4ed8' },
    'Assez Bien': { bg: '#fef9c3', color: '#854d0e' },
    'Passable': { bg: '#fed7aa', color: '#9a3412' },
    'Insuffisant': { bg: '#fee2e2', color: '#b91c1c' },
  };
  const style = colors[mention] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ background: style.bg, color: style.color, padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 700 }}>
      {mention}
    </span>
  );
}

export default function BulletinsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [trimestre, setTrimestre] = useState('1');
  const [bulletin, setBulletin] = useState<BulletinData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch('/api/academic-years')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setYears(d);
          const active = d.find((y: any) => y.isActive);
          if (active) setSelectedYearId(active.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!search.trim()) { setStudents([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/students?search=${encodeURIComponent(search)}&pageSize=10`)
        .then(r => r.json())
        .then(d => setStudents(d.items || []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadBulletin = useCallback(async () => {
    if (!selectedStudentId || !selectedYearId) return;
    setLoading(true); setBulletin(null);
    try {
      const r = await fetch(`/api/reports/bulletins?studentId=${selectedStudentId}&academicYearId=${selectedYearId}&trimestre=${trimestre}`);
      if (r.ok) setBulletin(await r.json());
    } finally { setLoading(false); }
  }, [selectedStudentId, selectedYearId, trimestre]);

  useEffect(() => { if (selectedStudentId) loadBulletin(); }, [loadBulletin]);

  const generatePDF = async () => {
    if (!bulletin) return;
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const { student, school, enrollment, subjectResults, summary, trimestre: t } = bulletin;
      const pageW = 210; const margin = 18;

      // ── En-tête ─────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 36, 'F');
      // Bandeau Mali
      doc.setFillColor(0, 154, 68); doc.rect(0, 0, pageW / 3, 3, 'F');
      doc.setFillColor(252, 209, 22); doc.rect(pageW / 3, 0, pageW / 3, 3, 'F');
      doc.setFillColor(206, 17, 38); doc.rect(2 * pageW / 3, 0, pageW / 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text('RÉPUBLIQUE DU MALI — MINISTÈRE DE L\'ÉDUCATION NATIONALE', pageW / 2, 10, { align: 'center' });
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text(school.name.toUpperCase(), pageW / 2, 18, { align: 'center' });
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('BULLETIN DE NOTES TRIMESTRIEL', pageW / 2, 25, { align: 'center' });
      if (school.motto) { doc.setFontSize(7); doc.text(`"${school.motto}"`, pageW / 2, 30, { align: 'center' }); }

      let y = 44;

      // ── Infos élève ──────────────────────────────────────────────────
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, pageW - 2 * margin, 28, 3, 3, 'FD');

      doc.setTextColor(15, 23, 42); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS DE L\'ÉLÈVE', margin + 6, y + 7);

      const infos = [
        ['Nom & Prénom', `${student.lastName} ${student.firstName}`],
        ['Matricule', student.studentNumber],
        ['Classe', enrollment.classroom],
        ['Année Académique', enrollment.academicYear],
        ['Trimestre', `${t}er Trimestre`],
        ['Campus', student.campus],
      ];
      const col1 = infos.slice(0, 3);
      const col2 = infos.slice(3);
      col1.forEach(([label, value], i) => {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(label + ' :', margin + 6, y + 14 + i * 5);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(value, margin + 35, y + 14 + i * 5);
      });
      col2.forEach(([label, value], i) => {
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(label + ' :', pageW / 2 + 4, y + 14 + i * 5);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(value, pageW / 2 + 33, y + 14 + i * 5);
      });

      y += 34;

      // ── Tableau des notes ────────────────────────────────────────────
      const colWidths = [60, 18, 18, 18, 20, 24, 16];
      const headers = ['MATIÈRE', 'COEFF', 'NOTE', 'SUR', 'MOY/20', 'MENTION', 'POINTS'];
      const colX = [margin, margin + 60, margin + 78, margin + 96, margin + 114, margin + 134, margin + 158];

      // Header tableau
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, pageW - 2 * margin, 8, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => doc.text(h, colX[i] + 1, y + 5.5));

      y += 8;
      subjectResults.forEach((r, idx) => {
        const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
        doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
        doc.rect(margin, y, pageW - 2 * margin, 7, 'F');

        // Couleur de la note
        const noteColor: [number, number, number] = r.average >= 14 ? [21, 128, 61] : r.average >= 10 ? [15, 23, 42] : [185, 28, 28];
        doc.setTextColor(15, 23, 42); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        doc.text(r.subjectName, colX[0] + 1, y + 4.8);
        doc.text(r.coefficient.toString(), colX[1] + 1, y + 4.8);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(noteColor[0], noteColor[1], noteColor[2]);
        doc.text(r.score.toString(), colX[2] + 1, y + 4.8);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(r.maxScore.toString(), colX[3] + 1, y + 4.8);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(noteColor[0], noteColor[1], noteColor[2]);
        doc.text(r.average.toFixed(2), colX[4] + 1, y + 4.8);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(r.mention, colX[5] + 1, y + 4.8);
        doc.text(r.weighted.toFixed(2), colX[6] + 1, y + 4.8);

        // Ligne de séparation
        doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.1);
        doc.line(margin, y + 7, margin + (pageW - 2 * margin), y + 7);
        y += 7;
      });

      // ── Résumé ───────────────────────────────────────────────────────
      y += 8;
      const avgColor: [number, number, number] = summary.generalAverage >= 14 ? [21, 128, 61] : summary.generalAverage >= 10 ? [30, 41, 59] : [185, 28, 28];
      doc.setFillColor(avgColor[0], avgColor[1], avgColor[2]);
      doc.roundedRect(margin, y, pageW - 2 * margin, 18, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(`MOYENNE GÉNÉRALE : ${summary.generalAverage.toFixed(2)} / 20`, margin + 8, y + 7);
      doc.setFontSize(8);
      doc.text(`MENTION : ${summary.generalMention}`, margin + 8, y + 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
      doc.text(`Total points pondérés : ${(summary.totalCoeff > 0 ? (summary.generalAverage * summary.totalCoeff).toFixed(2) : '0')} / ${(summary.totalCoeff * 20).toFixed(0)}`, pageW - margin - 8, y + 7, { align: 'right' });
      doc.text(`Nombre de matières : ${summary.subjectCount}`, pageW - margin - 8, y + 14, { align: 'right' });

      // ── Signatures ───────────────────────────────────────────────────
      y += 32;
      const sigCols = [margin, pageW / 2 - 20, pageW - margin - 50];
      const sigLabels = ['Directeur/Directrice', 'Censeur(e)', 'Parent/Tuteur'];
      sigLabels.forEach((label, i) => {
        doc.setDrawColor(200, 210, 220); doc.setLineWidth(0.3);
        doc.line(sigCols[i], y + 20, sigCols[i] + 48, y + 20);
        doc.setTextColor(100, 116, 139); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(label, sigCols[i] + 24, y + 25, { align: 'center' });
      });

      // ── Pied de page ─────────────────────────────────────────────────
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 282, pageW, 15, 'F');
      doc.setFontSize(6.5); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
      doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} — ${school.name} — Confidentiel`, pageW / 2, 289, { align: 'center' });

      doc.save(`Bulletin_${student.lastName}_${student.firstName}_T${t}_${enrollment.academicYear}.pdf`);
    } finally { setGenerating(false); }
  };

  const avgColor = bulletin
    ? bulletin.summary.generalAverage >= 14 ? '#10b981' : bulletin.summary.generalAverage >= 10 ? '#f59e0b' : '#ef4444'
    : '#64748b';

  return (
    <AppLayout
      title="Bulletins de Notes"
      subtitle="Génération et impression des bulletins trimestriels officiels"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Bulletins' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Filtres */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px 24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          {/* Recherche élève */}
          <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Rechercher un élève</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nom ou matricule..."
                style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
              {students.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                  {students.map(s => (
                    <div key={s.id} onClick={() => { setSelectedStudentId(s.id); setSearch(`${s.firstName} ${s.lastName}`); setStudents([]); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      <strong>{s.firstName} {s.lastName}</strong>
                      <span style={{ color: '#94a3b8', marginLeft: '8px', fontSize: '11px' }}>{s.studentNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Année */}
          <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Année Académique</label>
            <select value={selectedYearId} onChange={e => setSelectedYearId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'white' }}>
              <option value="">-- Choisir --</option>
              {years.map((y: any) => <option key={y.id} value={y.id}>{y.name} {y.isActive ? '★' : ''}</option>)}
            </select>
          </div>

          {/* Trimestre */}
          <div style={{ flex: '0 0 160px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Trimestre</label>
            <select value={trimestre} onChange={e => setTrimestre(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: 'white' }}>
              <option value="1">1er Trimestre</option>
              <option value="2">2ème Trimestre</option>
              <option value="3">3ème Trimestre</option>
            </select>
          </div>

          {/* Bouton */}
          <button onClick={loadBulletin} disabled={!selectedStudentId || !selectedYearId || loading}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #4f8ef7, #3b6fd4)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!selectedStudentId || !selectedYearId) ? 0.5 : 1 }}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <BookOpen size={15} />}
            Générer
          </button>
        </div>

        {/* Bulletin Preview */}
        {loading && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '80px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
            <Loader2 size={40} color="#4f8ef7" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p style={{ color: '#94a3b8', margin: 0 }}>Chargement du bulletin...</p>
          </div>
        )}

        {!loading && bulletin && (
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* En-tête bulletin */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', padding: '28px 32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', height: '4px', marginBottom: '20px', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ flex: 1, background: '#009a44' }} /><div style={{ flex: 1, background: '#fcd116' }} /><div style={{ flex: 1, background: '#ce1126' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', marginBottom: '4px' }}>BULLETIN DE NOTES OFFICIEL</div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{bulletin.student.firstName} {bulletin.student.lastName}</h2>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[['Matricule', bulletin.student.studentNumber], ['Classe', bulletin.enrollment.classroom], ['Trimestre', `T${bulletin.trimestre}`], ['Année', bulletin.enrollment.academicYear]].map(([l, v]) => (
                      <div key={l}><span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{l} : </span><span style={{ fontSize: '12px', fontWeight: 700 }}>{v}</span></div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px 24px', backdropFilter: 'blur(4px)' }}>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: avgColor }}>{bulletin.summary.generalAverage.toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Moyenne / 20</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: avgColor, marginTop: '4px' }}>{bulletin.summary.generalMention}</div>
                </div>
              </div>
              <button onClick={generatePDF} disabled={generating}
                style={{ marginTop: '16px', padding: '10px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(4px)' }}>
                {generating ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Printer size={15} />}
                Imprimer en PDF
              </button>
            </div>

            {/* Tableau des notes */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Matière', 'Coeff', 'Note', 'Sur', 'Moy/20', 'Mention', 'Points Pondérés', 'Appréciation'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: '10px', fontWeight: 700, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulletin.subjectResults.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b' }}>{r.subjectName}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>{r.coefficient}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 900, color: r.average >= 10 ? '#1e293b' : '#ef4444', fontSize: '15px' }}>{r.score}</td>
                      <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px' }}>/{r.maxScore}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 900, color: r.average >= 14 ? '#10b981' : r.average >= 10 ? '#f59e0b' : '#ef4444', fontSize: '15px' }}>{r.average.toFixed(2)}</td>
                      <td style={{ padding: '14px 16px' }}><MentionBadge mention={r.mention} /></td>
                      <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>{r.weighted.toFixed(2)}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: bulletin.summary.generalAverage >= 10 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', borderTop: '2px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', fontWeight: 900, color: '#1e293b', fontSize: '14px' }} colSpan={4}>MOYENNE GÉNÉRALE</td>
                    <td style={{ padding: '16px', fontWeight: 900, fontSize: '20px', color: avgColor }}>{bulletin.summary.generalAverage.toFixed(2)}</td>
                    <td style={{ padding: '16px' }}><MentionBadge mention={bulletin.summary.generalMention} /></td>
                    <td style={{ padding: '16px', fontWeight: 700, color: '#475569' }}>{(bulletin.summary.generalAverage * bulletin.summary.totalCoeff).toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {!loading && !bulletin && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '80px', textAlign: 'center', border: '1px dashed #e2e8f0' }}>
            <FileText size={56} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#475569', fontWeight: 700 }}>Sélectionnez un élève</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Recherchez un élève et choisissez le trimestre pour générer son bulletin.</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
