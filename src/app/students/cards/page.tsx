'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Users, AlertCircle, Loader2, ShieldCheck, Printer, QrCode, Download, CheckSquare, Square } from 'lucide-react';
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
    <div onClick={onToggle} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {/* Sélection indicator */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', marginBottom: '6px',
        color: isSelected ? '#10b981' : '#94a3b8', fontSize: '12px',
        fontWeight: 700, gap: '4px', alignItems: 'center'
      }}>
        {isSelected
          ? <><CheckSquare size={14} /> SÉLECTIONNÉ</>
          : <><Square size={14} /> Cliquer pour sélectionner</>}
      </div>

      {/* Carte recto */}
      <div style={{
        width: '100%', aspectRatio: '85.6/54',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
        borderRadius: '16px',
        boxShadow: isSelected
          ? '0 0 0 3px #10b981, 0 20px 40px rgba(16,185,129,0.2)'
          : '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative', overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: isSelected ? 'translateY(-4px) scale(1.01)' : 'none',
        fontFamily: "'Inter', sans-serif",
        display: 'flex', flexDirection: 'column',
        padding: '0',
      }}>
        {/* Bandeau tricolore Mali */}
        <div style={{ display: 'flex', height: '4px', flexShrink: 0 }}>
          <div style={{ flex: 1, background: '#009a44' }} />
          <div style={{ flex: 1, background: '#fcd116' }} />
          <div style={{ flex: 1, background: '#ce1126' }} />
        </div>

        {/* Motif diagonal décoratif */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 12px)',
          pointerEvents: 'none'
        }} />

        {/* Cercle décoratif */}
        <div style={{
          position: 'absolute', right: '-30px', top: '-30px',
          width: '140px', height: '140px',
          background: 'radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #4f8ef7, #3b6fd4)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
            fontSize: '12px', fontWeight: 900, color: 'white'
          }}>E</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', fontWeight: 700 }}>RÉPUBLIQUE DU MALI</div>
            <div style={{ fontSize: '9px', color: 'white', fontWeight: 800, letterSpacing: '0.5px' }}>CARTE D'IDENTITÉ SCOLAIRE</div>
          </div>
          <div style={{
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #fcd116, #f59e0b)',
            boxShadow: '0 0 8px rgba(252,209,22,0.4)',
            flexShrink: 0
          }} />
        </div>

        {/* Corps */}
        <div style={{ flex: 1, display: 'flex', gap: '0', padding: '8px 12px', alignItems: 'center' }}>
          {/* Photo placeholder */}
          <div style={{
            width: '56px', height: '68px', borderRadius: '8px', flexShrink: 0,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'grid', placeItems: 'center',
            color: 'rgba(255,255,255,0.2)', marginRight: '12px'
          }}>
            {student.photoUrl
              ? <img src={student.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '7px' }} />
              : <Users size={20} />
            }
          </div>

          {/* Infos */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'white', marginBottom: '6px', lineHeight: 1.2 }}>
              {student.firstName.toUpperCase()} {student.lastName.toUpperCase()}
            </div>
            {[
              ['MATRICULE', student.studentNumber],
              ['CLASSE', student.classroom?.name || '—'],
              ['ÂGE', `${age} ans`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: '6px', marginBottom: '2px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, minWidth: '50px' }}>{label}</span>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* QR Code */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '8px', flexShrink: 0,
            background: 'white', padding: '4px',
            display: 'grid', placeItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%' }} />
              : <QrCode size={40} color="#1e293b" />
            }
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '4px 12px 6px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px' }}>
            SCANNEZ LE QR CODE POUR VÉRIFIER
          </div>
          <div style={{
            fontSize: '7px', color: '#fcd116', fontWeight: 700,
            background: 'rgba(252,209,22,0.1)', padding: '2px 6px', borderRadius: '4px'
          }}>
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

  // Génère les QR codes pour tous les élèves affichés
  const generateQRCodes = useCallback(async (studs: Student[]) => {
    const cache: Record<string, string> = {};
    await Promise.all(studs.map(async (s) => {
      const payload = JSON.stringify({
        id: s.id,
        num: s.studentNumber,
        nom: `${s.firstName} ${s.lastName}`,
        classe: s.classroom?.name || '',
        url: `https://gestion-scolaire-livid.vercel.app/portal/${s.id}`,
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

  // ─── Export PDF ─────────────────────────────────────────────────────────────
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

        // Fond sombre
        doc.setFillColor(15, 23, 42);
        doc.roundedRect(x, y, cardW, cardH, 4, 4, 'F');

        // Bandeau Mali (3 couleurs)
        doc.setFillColor(0, 154, 68); doc.rect(x, y, cardW / 3, 1.5, 'F');
        doc.setFillColor(252, 209, 22); doc.rect(x + cardW / 3, y, cardW / 3, 1.5, 'F');
        doc.setFillColor(206, 17, 38); doc.rect(x + 2 * cardW / 3, y, cardW / 3, 1.5, 'F');

        // Header bar
        doc.setFillColor(20, 40, 80);
        doc.rect(x, y + 1.5, cardW, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
        doc.text('RÉPUBLIQUE DU MALI', x + cardW / 2, y + 5.5, { align: 'center' });
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
        doc.text("CARTE D'IDENTITÉ SCOLAIRE", x + cardW / 2, y + 9.5, { align: 'center' });

        // Nom
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
        doc.text(`${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`, x + 6, y + 18);

        // Champs
        const fields = [
          ['MATRICULE', student.studentNumber],
          ['CLASSE', student.classroom?.name || '—'],
          ['NÉ(E) LE', new Date(student.dateOfBirth).toLocaleDateString('fr-FR')],
        ];
        let fieldY = y + 23;
        fields.forEach(([label, value]) => {
          doc.setFontSize(5.5); doc.setFont('helvetica', 'normal');
          doc.setTextColor(150, 180, 220);
          doc.text(label, x + 6, fieldY);
          doc.setTextColor(220, 235, 255);
          doc.text(value, x + 26, fieldY);
          fieldY += 5;
        });

        // QR Code
        const qrDataUrl = qrCache[student.id];
        if (qrDataUrl) {
          doc.addImage(qrDataUrl, 'PNG', x + cardW - 24, y + 13, 18, 18);
        }

        // Photo placeholder
        doc.setFillColor(30, 50, 90);
        doc.setDrawColor(60, 90, 140);
        doc.setLineWidth(0.3);
        doc.roundedRect(x + 6, y + 34, 14, 16, 1, 1, 'FD');
        doc.setFontSize(4); doc.setTextColor(100, 140, 200);
        doc.text('PHOTO', x + 13, y + 43, { align: 'center' });

        // Footer
        doc.setFillColor(10, 20, 45);
        doc.rect(x, y + 47, cardW, 7, 'F');
        doc.setFontSize(5); doc.setTextColor(100, 150, 200);
        doc.text('Scannez le QR Code pour vérifier ce document', x + 6, y + 50.5);
        doc.setFontSize(5.5); doc.setFont('helvetica', 'bold');
        doc.setTextColor(252, 209, 22);
        doc.text('VALIDE 2024-2025', x + cardW - 4, y + 50.5, { align: 'right' });
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
      subtitle="Cartes d'identité scolaires sécurisées avec QR Code (Format ISO/IEC 7810 ID-1)"
      breadcrumbs={[{ label: 'Élèves', href: '/students' }, { label: 'Cartes Scolaires' }]}
    >
      {/* ── Toolbar ── */}
      <div style={{
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: '16px', padding: '20px 24px', marginBottom: '24px',
        display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#f8fafc', border: '1.5px solid #e2e8f0',
          borderRadius: '12px', padding: '0 16px', flex: 1, maxWidth: '400px',
          transition: 'all 0.2s'
        }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Rechercher par nom ou matricule..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%', outline: 'none', fontSize: '14px' }}
          />
        </div>

        {/* Stats badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#f1f5f9', borderRadius: '10px', padding: '8px 16px'
        }}>
          <Users size={14} color="#64748b" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
            {students.length} élèves • {selectedStudents.size} sélectionnés
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={toggleAll}
            style={{
              background: 'white', border: '1.5px solid #e2e8f0',
              padding: '10px 18px', borderRadius: '10px', fontWeight: 600,
              fontSize: '13px', color: '#475569', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
            }}
          >
            {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
            {allSelected ? 'Désélectionner' : 'Tout sélectionner'}
          </button>

          <button
            onClick={generatePDF}
            disabled={students.length === 0 || isGenerating}
            style={{
              background: 'linear-gradient(135deg, #4f8ef7, #3b6fd4)',
              border: 'none', padding: '10px 22px', borderRadius: '10px',
              color: 'white', fontWeight: 700, fontSize: '13px',
              cursor: students.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              opacity: students.length === 0 ? 0.6 : 1,
              boxShadow: '0 4px 16px rgba(79,142,247,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {isGenerating
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Génération...</>
              : <><Printer size={15} /> Imprimer PDF {selectedStudents.size > 0 ? `(${selectedStudents.size})` : 'Tout'}</>
            }
          </button>
        </div>
      </div>

      {/* ── Info QR ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(59,111,212,0.04))',
        border: '1px solid rgba(79,142,247,0.2)',
        borderRadius: '12px', padding: '12px 20px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <QrCode size={20} color="#4f8ef7" />
        <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
          <strong>QR Code intelligent :</strong> Chaque QR code encode les données de l'élève et un lien de vérification vers le portail scolaire. Scannez pour accéder au profil en temps réel.
        </p>
      </div>

      {/* ── Grille des cartes ── */}
      <div style={{
        background: 'white', borderRadius: '20px',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 700 }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(79,142,247,0.1)', display: 'grid', placeItems: 'center' }}>
              <ShieldCheck size={18} color="#4f8ef7" />
            </div>
            Registre des Cartes d'Identité
          </h3>
          <span style={{ background: '#f1f5f9', color: '#475569', padding: '6px 14px', borderRadius: '99px', fontSize: '13px', fontWeight: 600 }}>
            {students.length} profils
          </span>
        </div>

        <div style={{ padding: '32px', background: '#f8fafc', minHeight: '300px' }}>
          {isLoading ? (
            <div style={{ padding: '80px', textAlign: 'center' }}>
              <Loader2 size={48} color="#4f8ef7" style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
              <p style={{ color: '#94a3b8', margin: 0 }}>Chargement des profils...</p>
            </div>
          ) : students.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
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
            <div style={{ padding: '80px', textAlign: 'center', opacity: 0.5 }}>
              <AlertCircle size={56} color="#94a3b8" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: '#475569' }}>Aucun élève trouvé</h3>
              <p style={{ margin: 0, color: '#94a3b8' }}>Modifiez vos critères de recherche.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}
