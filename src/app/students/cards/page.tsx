'use client';

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, AlertCircle, Loader2, ShieldCheck, Printer, QrCode, CheckSquare, Square, DownloadCloud } from 'lucide-react';
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

// ─── Fonction pour générer le SVG d'une carte ───────────────────────────────
const generateSVGCard = (student: Student, qrDataUrl: string) => {
  const year = new Date(student.dateOfBirth).getFullYear();
  const age = new Date().getFullYear() - year;
  const fullName = `${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`;
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 540" width="340" height="540">
      <!-- Background -->
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" /> <!-- indigo-950 -->
          <stop offset="100%" stop-color="#0f172a" /> <!-- slate-900 -->
        </linearGradient>
        <clipPath id="photo-clip">
          <circle cx="170" cy="180" r="75" />
        </clipPath>
      </defs>
      
      <rect width="100%" height="100%" rx="24" fill="url(#bg-grad)" />
      
      <!-- Bandeau Supérieur Mali -->
      <rect x="0" y="0" width="113.3" height="8" fill="#009a44" />
      <rect x="113.3" y="0" width="113.3" height="8" fill="#fcd116" />
      <rect x="226.6" y="0" width="113.4" height="8" fill="#ce1126" />

      <!-- Institution Header -->
      <text x="170" y="50" fill="#a5b4fc" font-family="sans-serif" font-size="14" font-weight="bold" letter-spacing="4" text-anchor="middle">SCHOOLERP PRO</text>
      <text x="170" y="70" fill="#94a3b8" font-family="sans-serif" font-size="11" font-weight="normal" letter-spacing="2" text-anchor="middle">CARTE D'IDENTITÉ SCOLAIRE</text>

      <!-- Photo Border -->
      <circle cx="170" cy="180" r="78" fill="none" stroke="#6366f1" stroke-width="4" opacity="0.5" />
      
      <!-- Photo Placeholder / Icon -->
      <circle cx="170" cy="180" r="75" fill="#1e293b" />
      <text x="170" y="195" fill="#475569" font-family="sans-serif" font-size="40" text-anchor="middle">👤</text>

      <!-- Nom complet avec retour à la ligne automatique simulé (SVG ne le fait pas nativement, on utilise <tspan> mais on gère en CSS/HTML sur la preview) -->
      <!-- Pour le SVG simple, on centre le texte entier -->
      <text x="170" y="300" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle" width="300">${fullName}</text>
      <text x="170" y="325" fill="#818cf8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">${student.classroom?.name || '—'}</text>

      <!-- Infos : Matricule & Naissance -->
      <rect x="30" y="360" width="280" height="1" fill="#334155" />
      
      <text x="40" y="390" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">MATRICULE</text>
      <text x="40" y="410" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${student.studentNumber}</text>

      <text x="40" y="440" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">NÉ(E) LE</text>
      <text x="40" y="460" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">${new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</text>

      <!-- QR Code -->
      <rect x="230" y="380" width="70" height="70" rx="8" fill="#ffffff" />
      <image href="${qrDataUrl}" x="235" y="385" width="60" height="60" />

      <!-- Footer -->
      <rect x="0" y="500" width="340" height="40" fill="#0f172a" />
      <text x="170" y="525" fill="#475569" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1" text-anchor="middle">VALIDE POUR L'ANNÉE 2024-2025</text>
    </svg>
  `;
};

// ─── Composant carte visuelle (preview) ────────────────────────────────────────
function StudentCardPreview({ student, qrDataUrl, isSelected, onToggle }: {
  student: Student;
  qrDataUrl: string;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const downloadAsSVG = (e: React.MouseEvent) => {
    e.stopPropagation();
    const svgContent = generateSVGCard(student, qrDataUrl);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Carte_Scolaire_${student.firstName}_${student.lastName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative group">
      {/* Bouton de téléchargement SVG visible au survol */}
      <button 
        onClick={downloadAsSVG}
        className="absolute -top-3 -right-3 z-10 p-3 bg-white hover:bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hover:scale-110"
        title="Télécharger en format SVG"
      >
        <DownloadCloud size={18} />
      </button>

      <div 
        onClick={onToggle} 
        className={`cursor-pointer select-none group/card relative transition-all duration-300 w-full max-w-[280px] mx-auto aspect-[54/85.6] rounded-[1.5rem] p-1 flex flex-col ${
          isSelected 
            ? 'shadow-[0_20px_50px_rgba(79,70,229,0.3)] scale-[1.02] bg-gradient-to-br from-indigo-500 to-purple-500' 
            : 'shadow-lg hover:shadow-2xl bg-zinc-200 dark:bg-zinc-800'
        }`}
      >
        {/* Intérieur de la carte */}
        <div className="w-full h-full bg-gradient-to-b from-indigo-950 to-slate-900 rounded-[1.25rem] overflow-hidden flex flex-col relative">
          
          {/* Bandeau tricolore Mali */}
          <div className="flex h-1.5 shrink-0 w-full">
            <div className="flex-1 bg-[#009a44]" />
            <div className="flex-1 bg-[#fcd116]" />
            <div className="flex-1 bg-[#ce1126]" />
          </div>

          {/* Header */}
          <div className="text-center pt-5 pb-3 relative z-10">
            <div className="text-[11px] uppercase font-black text-indigo-300 tracking-[0.2em] mb-1">SchoolERP Pro</div>
            <div className="text-[9px] text-slate-400 font-medium tracking-widest">CARTE SCOLAIRE</div>
          </div>

          {/* Photo */}
          <div className="mx-auto w-28 h-28 rounded-full border-[3px] border-indigo-500/30 overflow-hidden bg-slate-800 flex items-center justify-center mt-2 relative z-10 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            {student.photoUrl ? (
              <Image src={student.photoUrl} alt="" fill className="object-cover" />
            ) : (
              <Users size={40} className="text-slate-600" />
            )}
          </div>

          {/* Nom (Affiché entièrement avec wrap) */}
          <div className="text-center px-4 mt-4 relative z-10">
            {/* L'utilisation de break-words et de flex permet d'afficher les noms longs sur plusieurs lignes */}
            <div className="font-extrabold text-[1.1rem] leading-tight text-white break-words uppercase">
              {student.firstName} <br />
              <span className="text-indigo-100">{student.lastName}</span>
            </div>
            <div className="text-xs text-indigo-400 font-bold mt-1.5 px-3 py-0.5 bg-indigo-500/10 rounded-full inline-block border border-indigo-500/20">
              {student.classroom?.name || '—'}
            </div>
          </div>

          <div className="mt-auto px-5 pb-5 w-full">
            <div className="w-full h-[1px] bg-slate-800 mb-4" />
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-2.5">
                <div>
                  <div className="text-[8px] text-slate-500 font-bold tracking-widest mb-0.5">MATRICULE</div>
                  <div className="text-sm font-bold text-white">{student.studentNumber}</div>
                </div>
                <div>
                  <div className="text-[8px] text-slate-500 font-bold tracking-widest mb-0.5">NÉ(E) LE</div>
                  <div className="text-sm font-bold text-white">{new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              {/* QR Code */}
              <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg shrink-0 flex items-center justify-center">
                {qrDataUrl ? (
                  <Image src={qrDataUrl} alt="QR" width={60} height={60} className="rounded-lg" />
                ) : (
                  <QrCode size={32} className="text-slate-300" />
                )}
              </div>
            </div>
          </div>

          {/* Fond design abstrait */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl" />
        </div>
      </div>
      
      {/* Checkbox status en dessous de la carte */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm font-bold transition-colors">
        {isSelected ? (
          <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <CheckSquare size={16} /> Sélectionné
          </span>
        ) : (
          <span className="flex items-center gap-2 text-zinc-400">
            <Square size={16} /> Cliquer pour sélectionner
          </span>
        )}
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

  const downloadSelectedSVGs = () => {
    const toDownload = students.filter(s => selectedStudents.size === 0 || selectedStudents.has(s.id));
    toDownload.forEach((student, index) => {
      // Un léger délai pour ne pas bloquer le navigateur si on télécharge 50 fichiers d'un coup
      setTimeout(() => {
        const svgContent = generateSVGCard(student, qrCache[student.id]);
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Carte_Scolaire_${student.firstName}_${student.lastName}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, index * 200);
    });
  };

  const allSelected = students.length > 0 && selectedStudents.size === students.length;

  return (
    <AppLayout
      title="Cartes Scolaires Premium"
      subtitle="Génération des badges d'identité avec QR Code et export SVG"
      breadcrumbs={[{ label: 'Élèves', href: '/students' }, { label: 'Cartes Scolaires' }]}
    >
      <div className="max-w-7xl mx-auto py-8">
        
        {/* ── Toolbar ── */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
          {/* Search */}
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 flex-1 max-w-md focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all shadow-inner">
            <Search size={18} className="text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
            />
          </div>

          {/* Actions & Stats */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl px-4 py-2.5 border border-indigo-100 dark:border-indigo-500/20">
              <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
                {students.length} élèves <span className="opacity-40 mx-1">•</span> {selectedStudents.size} sél.
              </span>
            </div>

            <button
              onClick={toggleAll}
              className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
            >
              {allSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-zinc-400" />}
              {allSelected ? 'Désélectionner' : 'Tout sélectionner'}
            </button>

            <button
              onClick={downloadSelectedSVGs}
              disabled={students.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-indigo-500/30"
            >
              <DownloadCloud size={18} /> Télécharger SVG {selectedStudents.size > 0 ? `(${selectedStudents.size})` : '(Tout)'}
            </button>
          </div>
        </div>

        {/* ── Info Banner ── */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5 mb-8 flex items-start sm:items-center gap-4 shadow-sm">
          <div className="bg-indigo-100 dark:bg-indigo-500/30 p-2.5 rounded-xl shrink-0 shadow-inner">
            <QrCode size={24} className="text-indigo-700 dark:text-indigo-400" />
          </div>
          <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed font-medium">
            <strong className="text-indigo-900 dark:text-indigo-100 font-extrabold mr-1">Design Vertical Premium :</strong> 
            Les cartes sont désormais adaptées au format standard des badges verticaux. Le nom et le prénom s'affichent entièrement sans être coupés. Survolez une carte pour la télécharger individuellement en SVG ou utilisez le bouton ci-dessus pour un export groupé.
          </p>
        </div>

        {/* ── Grille ── */}
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-900/20 min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
                <p className="text-sm font-bold">Chargement des élèves...</p>
              </div>
            ) : students.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
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
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 text-center">
                <AlertCircle size={48} className="mb-4 text-zinc-300 dark:text-zinc-700" />
                <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">Aucun résultat</h3>
                <p className="text-sm font-medium">Vérifiez vos filtres de recherche.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
