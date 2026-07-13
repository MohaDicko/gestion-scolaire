'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { FileText, Search, Printer, Loader2, Award, BookOpen, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
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
  const styles: Record<string, string> = {
    'Très Bien': 'bg-emerald-100 text-emerald-800',
    'Bien': 'bg-blue-100 text-blue-800',
    'Assez Bien': 'bg-yellow-100 text-yellow-800',
    'Passable': 'bg-orange-100 text-orange-800',
    'Insuffisant': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${styles[mention] || 'bg-slate-100 text-slate-600'}`}>
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
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

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
    if (!search.trim()) { 
      setStudents([]); 
      setShowDropdown(false);
      return; 
    }
    const t = setTimeout(() => {
      fetch(`/api/students?search=${encodeURIComponent(search)}&pageSize=10`)
        .then(r => r.json())
        .then(d => {
          setStudents(d.items || []);
          setShowDropdown(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadBulletin = useCallback(async () => {
    if (!selectedStudentId || !selectedYearId) return;
    setLoading(true); setBulletin(null);
    try {
      const r = await fetch(`/api/reports/bulletins?studentId=${selectedStudentId}&academicYearId=${selectedYearId}&trimestre=${trimestre}`);
      if (r.ok) setBulletin(await r.json());
    } finally { setLoading(false); }
  }, [selectedStudentId, selectedYearId, trimestre]);

  useEffect(() => { if (selectedStudentId) loadBulletin(); }, [selectedStudentId, loadBulletin]);

  // ─── Export PDF Optimisé ───────────────────────────────────────────────────
  const generatePDF = async () => {
    if (!bulletin) return;
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const { student, school, enrollment, subjectResults, summary, trimestre: t } = bulletin;
      const pageW = 210; 
      const margin = 15;

      // ── En-tête (Design Blanc A4) ───────────────────────────────────
      // Bandeau Mali tout en haut
      doc.setFillColor(0, 154, 68); doc.rect(0, 0, pageW / 3, 3, 'F');
      doc.setFillColor(252, 209, 22); doc.rect(pageW / 3, 0, pageW / 3, 3, 'F');
      doc.setFillColor(206, 17, 38); doc.rect(2 * pageW / 3, 0, pageW / 3, 3, 'F');

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(8); doc.setFont('helvetica', 'bold');
      doc.text('RÉPUBLIQUE DU MALI', pageW / 2, 12, { align: 'center' });
      doc.setFontSize(6); doc.setFont('helvetica', 'normal');
      doc.text('Un Peuple - Un But - Une Foi', pageW / 2, 16, { align: 'center' });
      
      // Séparateur
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(margin, 20, pageW - margin, 20);

      // Nom de l'école
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text(school.name.toUpperCase(), pageW / 2, 28, { align: 'center' });
      
      if (school.motto) { 
        doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 116, 139);
        doc.text(`"${school.motto}"`, pageW / 2, 33, { align: 'center' }); 
      }

      // Titre du Bulletin
      doc.setFillColor(241, 245, 249); // slate-100
      doc.roundedRect(pageW / 2 - 35, 38, 70, 8, 2, 2, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text(`BULLETIN DU ${t}${t === 1 ? 'ER' : 'ÈME'} TRIMESTRE`, pageW / 2, 43.5, { align: 'center' });

      let y = 54;

      // ── Infos élève (Design épuré) ──────────────────────────────────
      doc.setDrawColor(15, 23, 42); // slate-900
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, pageW - 2 * margin, 26, 2, 2, 'S'); // Seulement une bordure (Stroke)

      doc.setTextColor(15, 23, 42); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS DE L\'ÉLÈVE', margin + 4, y + 6);

      const infos = [
        ['Nom & Prénom', `${student.lastName.toUpperCase()} ${student.firstName}`],
        ['Matricule', student.studentNumber],
        ['Classe', enrollment.classroom],
        ['Année Scolaire', enrollment.academicYear],
        ['Né(e) le', new Date(student.dateOfBirth).toLocaleDateString('fr-FR')],
        ['Campus', student.campus],
      ];
      
      const col1 = infos.slice(0, 3);
      const col2 = infos.slice(3);
      
      col1.forEach(([label, value], i) => {
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(label + ' :', margin + 4, y + 13 + i * 5);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(value, margin + 35, y + 13 + i * 5);
      });
      
      col2.forEach(([label, value], i) => {
        doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 116, 139);
        doc.text(label + ' :', pageW / 2 + 4, y + 13 + i * 5);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(value, pageW / 2 + 35, y + 13 + i * 5);
      });

      y += 32;

      // ── Tableau des notes ───────────────────────────────────────────
      const headers = ['MATIÈRE', 'COEFF', 'NOTE', 'SUR', 'MOY/20', 'MENTION', 'POINTS'];
      const colX = [margin, margin + 65, margin + 83, margin + 101, margin + 119, margin + 139, margin + 165];

      // Header tableau
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, y, pageW - 2 * margin, 8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, pageW - 2 * margin, 8, 'S'); // Contour du header
      
      doc.setTextColor(15, 23, 42); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => doc.text(h, colX[i] + 2, y + 5.5));

      y += 8;
      
      doc.setDrawColor(226, 232, 240); // slate-200
      subjectResults.forEach((r, idx) => {
        const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
        doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
        doc.rect(margin, y, pageW - 2 * margin, 7, 'F'); // Ligne fond alternatif
        
        // Lignes verticales du tableau (optionnel, pour faire plus officiel)
        doc.line(margin, y, margin, y + 7);
        doc.line(pageW - margin, y, pageW - margin, y + 7);

        // Couleur de la note
        const isPass = r.average >= 10;
        doc.setTextColor(15, 23, 42); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
        doc.text(r.subjectName, colX[0] + 2, y + 4.8);
        
        doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
        doc.text(r.coefficient.toString(), colX[1] + 2, y + 4.8);
        
        doc.setFont('helvetica', 'bold'); doc.setTextColor(isPass ? 15 : 185, isPass ? 23 : 28, isPass ? 42 : 28); // Noir si ok, rouge si échec
        doc.text(r.score.toString(), colX[2] + 2, y + 4.8);
        
        doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
        doc.text(r.maxScore.toString(), colX[3] + 2, y + 4.8);
        
        doc.setFont('helvetica', 'bold'); doc.setTextColor(isPass ? 15 : 185, isPass ? 23 : 28, isPass ? 42 : 28);
        doc.text(r.average.toFixed(2), colX[4] + 2, y + 4.8);
        
        doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
        doc.text(r.mention, colX[5] + 2, y + 4.8);
        doc.text(r.weighted.toFixed(2), colX[6] + 2, y + 4.8);

        // Ligne de séparation horizontale
        doc.line(margin, y + 7, margin + (pageW - 2 * margin), y + 7);
        y += 7;
      });

      // ── Résumé ───────────────────────────────────────────────────────
      y += 6;
      
      doc.setDrawColor(15, 23, 42); // slate-900 contour
      doc.setLineWidth(0.5); // Contour plus épais
      doc.roundedRect(margin, y, pageW - 2 * margin, 20, 2, 2, 'S');

      const isGenPass = summary.generalAverage >= 10;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('MOYENNE GÉNÉRALE :', margin + 6, y + 8);
      
      doc.setFontSize(14); doc.setTextColor(isGenPass ? 15 : 185, isGenPass ? 23 : 28, isGenPass ? 42 : 28);
      doc.text(`${summary.generalAverage.toFixed(2)} / 20`, margin + 55, y + 8);
      
      doc.setTextColor(15, 23, 42); doc.setFontSize(9);
      doc.text(`MENTION : ${summary.generalMention.toUpperCase()}`, margin + 6, y + 15);
      
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text(`Total points : ${(summary.totalCoeff > 0 ? (summary.generalAverage * summary.totalCoeff).toFixed(2) : '0')} / ${(summary.totalCoeff * 20).toFixed(0)}`, pageW - margin - 6, y + 8, { align: 'right' });
      doc.text(`Total coefficients : ${summary.totalCoeff}`, pageW - margin - 6, y + 14, { align: 'right' });

      // ── Signatures ───────────────────────────────────────────────────
      y += 35;
      const sigCols = [margin, pageW / 2 - 20, pageW - margin - 48];
      const sigLabels = ['Le Titulaire', 'Le Directeur', 'Les Parents'];
      
      sigLabels.forEach((label, i) => {
        doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.3); // slate-300
        doc.line(sigCols[i], y + 15, sigCols[i] + 48, y + 15); // Ligne pour signer
        doc.setTextColor(15, 23, 42); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(label, sigCols[i] + 24, y + 20, { align: 'center' });
      });

      // ── Pied de page ─────────────────────────────────────────────────
      doc.setFontSize(6.5); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'normal');
      doc.text(`Document officiel généré numériquement le ${new Date().toLocaleDateString('fr-FR')} — ${school.name}`, pageW / 2, 285, { align: 'center' });
      doc.text(`ID Unique : BULT-${student.id.substring(0, 8).toUpperCase()}-${t}-${new Date().getFullYear()}`, pageW / 2, 289, { align: 'center' });

      doc.save(`Bulletin_${student.lastName}_${student.firstName}_T${t}_${enrollment.academicYear.replace('/', '-')}.pdf`);
    } finally { 
      setGenerating(false); 
    }
  };

  const isPassing = bulletin ? bulletin.summary.generalAverage >= 10 : true;

  return (
    <AppLayout
      title="Bulletins de Notes"
      subtitle="Génération et impression des bulletins trimestriels officiels"
      breadcrumbs={[{ label: 'Scolarité', href: '/dashboard' }, { label: 'Bulletins' }]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Filtres ── */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* Recherche élève */}
            <div className="md:col-span-2 relative" ref={searchContainerRef}>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Rechercher un élève
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nom, prénom ou matricule..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
                
                {/* Dropdown Suggestions */}
                {showDropdown && students.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-50 max-h-64 overflow-y-auto py-1">
                    {students.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => { 
                          setSelectedStudentId(s.id); 
                          setSearch(`${s.firstName} ${s.lastName}`); 
                          setShowDropdown(false); 
                        }}
                        className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center justify-between group transition-colors"
                      >
                        <span className="font-semibold text-sm text-slate-700 group-hover:text-indigo-600">
                          {s.firstName} {s.lastName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {s.studentNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Année */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Année Scolaire
              </label>
              <select 
                value={selectedYearId} 
                onChange={e => setSelectedYearId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              >
                <option value="">-- Choisir --</option>
                {years.map((y: any) => (
                  <option key={y.id} value={y.id}>{y.name} {y.isActive ? ' (En cours)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Trimestre & Bouton */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Trimestre
                </label>
                <select 
                  value={trimestre} 
                  onChange={e => setTrimestre(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="1">1er Trimestre</option>
                  <option value="2">2ème Trimestre</option>
                  <option value="3">3ème Trimestre</option>
                </select>
              </div>
              <button 
                onClick={loadBulletin} 
                disabled={!selectedStudentId || !selectedYearId || loading}
                className="mt-6 flex-shrink-0 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center shadow-sm"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
              </button>
            </div>

          </div>
        </div>

        {/* ── Loader ── */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
            <p className="text-sm font-medium">Création du bulletin officiel en cours...</p>
          </div>
        )}

        {/* ── Preview Bulletin ── */}
        {!loading && bulletin && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* En-tête Web du Bulletin */}
            <div className="bg-slate-900 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full flex h-1.5 opacity-90">
                <div className="flex-1 bg-[#009a44]" /><div className="flex-1 bg-[#fcd116]" /><div className="flex-1 bg-[#ce1126]" />
              </div>
              
              <div className="px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                <div>
                  <div className="text-[10px] text-indigo-300 font-bold tracking-[0.2em] mb-1.5 uppercase">Bulletin Officiel</div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
                    {bulletin.student.firstName} {bulletin.student.lastName.toUpperCase()}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase">Matricule:</span>
                      <span className="font-bold text-sm bg-slate-800 px-2.5 py-1 rounded-md">{bulletin.student.studentNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-semibold uppercase">Classe:</span>
                      <span className="font-bold text-sm bg-slate-800 px-2.5 py-1 rounded-md">{bulletin.enrollment.classroom}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center min-w-[160px] shadow-2xl">
                  <div className={`text-4xl font-black ${isPassing ? 'text-emerald-400' : 'text-red-400'} tracking-tighter leading-none mb-1`}>
                    {bulletin.summary.generalAverage.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3">Moyenne / 20</div>
                  <MentionBadge mention={bulletin.summary.generalMention} />
                </div>
              </div>

              {/* Bouton Print Flottant */}
              <div className="absolute bottom-6 right-8 hidden sm:block">
                <button 
                  onClick={generatePDF} 
                  disabled={generating}
                  className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-50 disabled:opacity-50 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg"
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                  Imprimer (PDF Blanc)
                </button>
              </div>
            </div>

            {/* Bouton Print Mobile */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 sm:hidden">
              <button 
                onClick={generatePDF} 
                disabled={generating}
                className="w-full px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                Imprimer le Bulletin (PDF)
              </button>
            </div>

            {/* Tableau des notes */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-200">Matière</th>
                    <th className="px-4 py-4 border-b border-slate-200 text-center">Coeff</th>
                    <th className="px-4 py-4 border-b border-slate-200 text-right">Note</th>
                    <th className="px-4 py-4 border-b border-slate-200 text-center">Moy/20</th>
                    <th className="px-4 py-4 border-b border-slate-200">Mention</th>
                    <th className="px-6 py-4 border-b border-slate-200">Appréciation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulletin.subjectResults.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{r.subjectName}</td>
                      <td className="px-4 py-4 text-center font-semibold text-slate-400">{r.coefficient}</td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-slate-900">{r.score}</span>
                        <span className="text-xs text-slate-400 ml-1">/{r.maxScore}</span>
                      </td>
                      <td className={`px-4 py-4 text-center font-black ${r.average >= 10 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {r.average.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <MentionBadge mention={r.mention} />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                        {r.comment || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-5 text-right font-bold text-slate-500 uppercase text-[11px] tracking-widest">
                      Moyenne Trimestrielle
                    </td>
                    <td className={`px-4 py-5 text-center text-lg font-black ${isPassing ? 'text-emerald-600' : 'text-red-600'}`}>
                      {bulletin.summary.generalAverage.toFixed(2)}
                    </td>
                    <td colSpan={2} className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        {isPassing ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-red-500" />}
                        <span className="font-bold text-slate-700 text-sm">
                          {isPassing ? 'Trimestre Validé' : 'Non Validé'}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !bulletin && (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Sélectionnez un élève</h3>
            <p className="text-sm text-slate-500 max-w-md">
              Recherchez un profil dans la barre de recherche et sélectionnez l'année et le trimestre pour générer un bulletin officiel.
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
