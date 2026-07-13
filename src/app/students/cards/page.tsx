'use client';

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, AlertCircle, Loader2, ShieldCheck, Printer, QrCode, CheckSquare, Square } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import AppLayout from '@/components/AppLayout';

interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  photoUrl?: string;
  classroom?: { name: string };
  campus?: { name: string };
  parentName?: string;
}

// ─── Composant carte visuelle (preview) ────────────────────────────────────────
function StudentCardPreview({ student, qrDataUrl, isSelected, onToggle }: {
  student: Student;
  qrDataUrl: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const year = new Date(student.dateOfBirth).getFullYear();
  const age = new Date().getFullYear() - year;

  return (
    <div 
      onClick={onToggle} 
      className="cursor-pointer select-none group relative"
    >
      {/* Sélection indicator */}
      <div className={`flex justify-end mb-2 text-xs font-bold gap-1 items-center transition-colors ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`}>
        {isSelected ? <><CheckSquare size={14} /> SÉLECTIONNÉ</> : <><Square size={14} /> Cliquer pour sélectionner</>}
      </div>

      {/* Carte recto */}
      <div className={`w-full aspect-[85.6/54] bg-white rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col ${isSelected ? 'border-emerald-500 shadow-[0_8px_30px_rgba(16,185,129,0.2)] -translate-y-1 scale-[1.01]' : 'border-slate-200 shadow-sm group-hover:shadow-md'}`}>
        
        {/* Bandeau tricolore Mali */}
        <div className="flex h-1.5 shrink-0">
          <div className="flex-1 bg-[#009a44]" />
          <div className="flex-1 bg-[#fcd116]" />
          <div className="flex-1 bg-[#ce1126]" />
        </div>

        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-black text-xs shadow-inner">
            E
          </div>
          <div className="flex-1">
            <div className="text-[7px] text-slate-400 tracking-[0.15em] font-bold">RÉPUBLIQUE DU MALI</div>
            <div className="text-[10px] font-black tracking-wide">CARTE D'IDENTITÉ SCOLAIRE</div>
          </div>
        </div>

        {/* Corps */}
        <div className="flex-1 flex gap-4 px-4 py-3 items-center">
          {/* Photo placeholder */}
          <div className="w-14 h-[4.5rem] rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 relative overflow-hidden shrink-0 shadow-sm">
            {student.photoUrl ? (
              <Image src={student.photoUrl} alt="" fill className="object-cover" />
            ) : (
              <Users size={24} />
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-slate-900 mb-1.5 truncate">
              {student.firstName.toUpperCase()} {student.lastName.toUpperCase()}
            </div>
            
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 items-baseline">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Matricule</span>
              <span className="text-[10px] font-bold text-slate-800">{student.studentNumber}</span>
              
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Classe</span>
              <span className="text-[10px] font-bold text-indigo-600">{student.classroom?.name || '—'}</span>
              
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Âge</span>
              <span className="text-[10px] font-bold text-slate-800">{age} ans</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="w-14 h-14 bg-white border border-slate-100 p-1 rounded-lg shadow-sm flex items-center justify-center shrink-0">
            {qrDataUrl ? (
              <Image src={qrDataUrl} alt="QR" width={48} height={48} />
            ) : (
              <QrCode size={32} className="text-slate-300" />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 flex justify-between items-center mt-auto">
          <div className="text-[7px] text-slate-500 font-semibold tracking-wider">
            SCANNEZ LE QR CODE POUR VÉRIFIER
          </div>
          <div className="text-[8px] text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
            VALIDE 2024-2025
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function StudentCardsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [qrCache, setQrCache] = useState<Record<string, string>>({});

  const generateQRCodes = useCallback(async (studs: Student[]) => {
    const cache: Record<string, string> = {};
    await Promise.all(studs.map(async (s) => {
      const payload = JSON.stringify({
        id: s.id,
        num: s.studentNumber,
        nom: `${s.firstName} ${s.lastName}`,
        classe: s.classroom?.name || '',
        url: `https://saheledu.com/portal/${s.id}`,
      });
      cache[s.id] = await QRCode.toDataURL(payload, {
        width: 200, margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });
    }));
    setQrCache(cache);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/students?search=${encodeURIComponent(searchTerm)}&pageSize=50`)
      .then(res => res.json())
      .then(data => {
        const items: Student[] = data.items || [];
        setStudents(items);
        setIsLoading(false);
        generateQRCodes(items);
      })
      .catch(() => setIsLoading(false));
  }, [searchTerm, generateQRCodes]);

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudents(next);
  };

  const toggleAll = () => {
    if (selectedStudents.size === students.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(students.map(s => s.id)));
  };

  // ─── Export PDF Optimisé ───────────────────────────────────────────────────
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

      const cardW = 85.6, cardH = 54;
      const marginX = 15, marginY = 15, gapX = 10, gapY = 8;
      const cols = 2;

      const toPrint = students.filter(s => selectedStudents.size === 0 || selectedStudents.has(s.id));

      for (let i = 0; i < toPrint.length; i++) {
        const student = toPrint[i];
        const col = i % cols;
        const row = Math.floor(i / cols) % 5;

        if (i > 0 && col === 0 && row === 0) doc.addPage();

        const x = marginX + col * (cardW + gapX);
        const y = marginY + row * (cardH + gapY);

        // Fond blanc avec bordure subtile
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');

        // Bandeau Mali (3 couleurs)
        doc.setFillColor(0, 154, 68); doc.rect(x, y, cardW / 3, 1.5, 'F');
        doc.setFillColor(252, 209, 22); doc.rect(x + cardW / 3, y, cardW / 3, 1.5, 'F');
        doc.setFillColor(206, 17, 38); doc.rect(x + 2 * cardW / 3, y, cardW / 3, 1.5, 'F');

        // Header sombre (slate-900)
        doc.setFillColor(15, 23, 42);
        doc.rect(x, y + 1.5, cardW, 11, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5); doc.setFont('helvetica', 'bold');
        doc.text('RÉPUBLIQUE DU MALI', x + 18, y + 6);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text("CARTE D'IDENTITÉ SCOLAIRE", x + 18, y + 10);
        
        // Logo institution (placeholder "E" style)
        doc.setFillColor(99, 102, 241); // indigo-500
        doc.roundedRect(x + 5, y + 4, 10, 6, 1, 1, 'F');
        doc.setFontSize(7); doc.setTextColor(255, 255, 255);
        doc.text('ERP', x + 10, y + 8, { align: 'center' });

        // Nom (Texte sombre)
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFontSize(10); doc.setFont('helvetica', 'bold');
        doc.text(`${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`, x + 6, y + 21);

        // Champs de données (Texte sombre)
        const fields = [
          ['MATRICULE', student.studentNumber],
          ['CLASSE', student.classroom?.name || '—'],
          ['NÉ(E) LE', new Date(student.dateOfBirth).toLocaleDateString('fr-FR')],
        ];
        let fieldY = y + 27;
        fields.forEach(([label, value]) => {
          doc.setFontSize(5.5); doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(label, x + 6, fieldY);
          
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(value, x + 24, fieldY);
          fieldY += 5;
        });

        // QR Code
        const qrDataUrl = qrCache[student.id];
        if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', x + cardW - 24, y + 18, 18, 18);
        }

        // Photo placeholder
        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.roundedRect(x + 6, y + 40, 12, 12, 1, 1, 'FD');
        doc.setFontSize(4); doc.setTextColor(148, 163, 184); // slate-400
        doc.text('PHOTO', x + 12, y + 47, { align: 'center' });

        // Footer (slate-50)
        doc.setFillColor(248, 250, 252);
        doc.rect(x, y + cardH - 6, cardW, 6, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(x, y + cardH - 6, x + cardW, y + cardH - 6);
        
        doc.setFontSize(4.5); doc.setTextColor(100, 116, 139);
        doc.text('Scannez le QR Code pour vérifier ce document en ligne', x + 6, y + cardH - 2);
        doc.setFontSize(5.5); doc.setFont('helvetica', 'bold');
        doc.setTextColor(217, 119, 6); // amber-600
        doc.text('VALIDE 2024-2025', x + cardW - 4, y + cardH - 2, { align: 'right' });
      }

      doc.save(`Cartes_Scolaires_QR_${new Date().getFullYear()}.pdf`);
    } catch (err) {
      console.error('PDF Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const allSelected = students.length > 0 && selectedStudents.size === students.length;

  return (
    <AppLayout
      title="Cartes Scolaires"
      subtitle="Génération des cartes d'identité avec QR Code de vérification"
      breadcrumbs={[{ label: 'Élèves', href: '/students' }, { label: 'Cartes Scolaires' }]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ── Toolbar ── */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          {/* Search */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex-1 max-w-md focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
            />
          </div>

          {/* Actions & Stats */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-4 py-2 border border-slate-200">
              <Users size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">
                {students.length} élèves <span className="text-slate-400 font-normal mx-1">•</span> <span className="text-indigo-600">{selectedStudents.size} sél.</span>
              </span>
            </div>

            <button
              onClick={toggleAll}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors active:scale-95"
            >
              {allSelected ? <CheckSquare size={16} className="text-indigo-500" /> : <Square size={16} className="text-slate-400" />}
              {allSelected ? 'Désélectionner' : 'Tout sélectionner'}
            </button>

            <button
              onClick={generatePDF}
              disabled={students.length === 0 || isGenerating}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-sm"
            >
              {isGenerating ? (
                <><Loader2 size={16} className="animate-spin" /> Création PDF...</>
              ) : (
                <><Printer size={16} /> Imprimer {selectedStudents.size > 0 ? `(${selectedStudents.size})` : 'Tout'}</>
              )}
            </button>
          </div>
        </div>

        {/* ── Info Banner ── */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-8 flex items-start sm:items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg shrink-0">
            <QrCode size={20} className="text-indigo-600" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong className="text-indigo-900">Nouveau Design Optimisé :</strong> Le fond des cartes a été éclairci pour économiser jusqu'à <span className="font-bold">75% d'encre</span> lors de l'impression sur badges PVC, tout en conservant l'élégance de l'en-tête officiel.
          </p>
        </div>

        {/* ── Grille ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="flex items-center gap-3 font-bold text-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <ShieldCheck size={18} className="text-indigo-600" />
              </div>
              Registre des Cartes
            </h3>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50 min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                <p className="text-sm font-medium">Chargement des données...</p>
              </div>
            ) : students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.map(student => (
                  <StudentCardPreview
                    key={student.id}
                    student={student}
                    qrDataUrl={qrCache[student.id] || ''}
                    isSelected={selectedStudents.has(student.id)}
                    onToggle={() => toggleStudent(student.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
                <AlertCircle size={48} className="mb-4 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-700 mb-1">Aucun résultat</h3>
                <p className="text-sm">Vérifiez vos filtres de recherche.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
