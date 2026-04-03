import { useParams } from 'react-router-dom';
import { BookOpen, Calendar, MessageCircle, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from '../../../store/toastStore';

interface SubjectResult {
  subjectName: string;
  classAverage: number;
  examScore: number;
  coefficient: number;
  finalAverage: number;
  points: number;
  appreciation: string;
}

interface Bulletin {
  studentName: string;
  className: string;
  academicYear: string;
  period: number;
  totalPoints: number;
  totalCoefficients: number;
  periodAverage: number;
  rank: string;
  subjects: SubjectResult[];
  parentPhone?: string; // Re-added for WhatsApp
  attendance?: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
}

export function StudentDetailPage() {
  const { id } = useParams();

  const { data: bulletin, isLoading } = useQuery<Bulletin>({
    queryKey: ['bulletin', id],
    queryFn: async () => {
      const response = await apiClient.get(`/academic/students/${id}/bulletin`);
      return response.data;
    }
  });

  if (isLoading) return <div className="page" style={{ padding: '40px', textAlign: 'center' }}>Chargement du bulletin...</div>;
  if (!bulletin) return <div className="page">Bulletin introuvable.</div>;

  const handleSendWhatsApp = () => {
    let phone = bulletin.parentPhone?.replace(/[\s\-\+\(\)]/g, '') || '';
    if (!phone) {
      toast.warning("Aucun numéro enregistré pour ce parent.");
      return;
    }

    const textLines = [
      `*BULLETIN SCOLAIRE - ${bulletin.studentName}*`,
      `Classe : ${bulletin.className} | Période : ${bulletin.period}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Moyenne : ${bulletin.periodAverage.toFixed(2)} / 20*`,
      `*Rang : ${bulletin.rank}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Détails par matière :`,
      ...bulletin.subjects.map(sub =>
        `▫️ ${sub.subjectName} : Moy ${sub.finalAverage.toFixed(2)}/20 (${sub.appreciation})`
      ),
      ``,
      `Consultez l'école pour plus d'informations.`,
      `L'Administration de l'Établissement.`
    ];

    const message = textLines.join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const logoColor = [41, 128, 185];

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPUBLIQUE DU MALI', 105, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Un Peuple - Un But - Une Foi', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(logoColor[0], logoColor[1], logoColor[2]);
    doc.text('GROUPE SCOLAIRE TALIBI', 14, 32);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Enseignement Général & Technique', 14, 37);

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`BULLETIN DE NOTES - ${bulletin.period}e TRIMESTRE`, 105, 52, { align: 'center' });

    // Info Box
    doc.setDrawColor(200);
    doc.rect(14, 58, 182, 28);
    doc.setFontSize(11);
    doc.text(`Élève: ${bulletin.studentName.toUpperCase()}`, 20, 67);
    doc.setFont('helvetica', 'normal');
    doc.text(`Classe: ${bulletin.className}`, 20, 74);
    doc.text(`Matricule: ${id?.substring(0, 8)}`, 20, 81);
    doc.text(`Année Scolaire: ${bulletin.academicYear}`, 130, 67);
    doc.text(`Sexe: M`, 130, 74);

    // Table
    const tableData = bulletin.subjects.map(sub => [
      sub.subjectName,
      sub.classAverage.toFixed(2),
      sub.examScore.toFixed(2),
      sub.coefficient.toString(),
      sub.finalAverage.toFixed(2),
      sub.points.toFixed(2),
      sub.appreciation
    ]);

    autoTable(doc, {
      startY: 92,
      head: [['Matières', 'Moy Classe', 'Moy Comp', 'Coef', 'Moyenne', 'Produit', 'Appréciation']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], halign: 'center' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' },
        5: { halign: 'center', fontStyle: 'bold' },
        6: { fontSize: 8 }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL COEFF : ${bulletin.totalCoefficients}`, 14, finalY);
    doc.text(`TOTAL POINTS : ${bulletin.totalPoints.toFixed(2)}`, 60, finalY);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(130, finalY - 6, 66, 16, 'F');
    doc.text(`MOYENNE : ${bulletin.periodAverage.toFixed(2)} / 20`, 135, finalY + 4);

    doc.text(`RANG : ${bulletin.rank}`, 14, finalY + 18);

    doc.setFontSize(10);
    doc.text('LE SURVEILLANT GÉNÉRAL', 40, finalY + 45, { align: 'center' });
    doc.text('LE PROVISEUR', 160, finalY + 45, { align: 'center' });

    doc.save(`Bulletin_${bulletin.studentName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">{bulletin.studentName}</h1>
          <p className="page-subtitle">ID: {id?.substring(0, 8)} • {bulletin.className}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" style={{ color: '#25D366' }} onClick={handleSendWhatsApp}>
            <MessageCircle size={18} /> WhatsApp
          </button>
          <button className="btn btn-primary" onClick={handleGeneratePDF}>
            <Download size={18} /> PDF Officiel
          </button>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div className="card" style={{ padding: '0' }}>
          <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Détails du Bulletin — {bulletin.period}e Trimestre</h3>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-dim)', padding: '6px 16px', borderRadius: '8px' }}>
              {bulletin.periodAverage.toFixed(2)} / 20
            </div>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Matière</th>
                  <th style={{ textAlign: 'center' }}>Classe</th>
                  <th style={{ textAlign: 'center' }}>Comp</th>
                  <th style={{ textAlign: 'center' }}>Coef</th>
                  <th style={{ textAlign: 'center' }}>Moyenne</th>
                  <th style={{ textAlign: 'center' }}>Points</th>
                  <th>Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {bulletin.subjects.map((sub, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{sub.subjectName}</td>
                    <td style={{ textAlign: 'center' }}>{sub.classAverage.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{sub.examScore.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{sub.coefficient}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: sub.finalAverage >= 10 ? 'var(--success)' : 'var(--danger)' }}>
                      {sub.finalAverage.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{sub.points.toFixed(2)}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub.appreciation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ padding: '20px', background: 'var(--bg-card-dim, #f9fafb)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>Rang dans la classe : <span style={{ fontWeight: 700, color: 'var(--text)' }}>{bulletin.rank}</span></div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>Total Points : {bulletin.totalPoints.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 className="card-title" style={{ marginBottom: '20px' }}>Informations Scolaires</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Année Académique</div>
                  <div style={{ fontWeight: 600 }}>{bulletin.academicYear}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Taux d'Assiduité</div>
                  <div style={{ fontWeight: 600 }}>98.5% (Excellente)</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ padding: '24px', background: 'var(--primary)', color: 'white' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Décision du Conseil</h3>
            <p style={{ fontSize: '14px', opacity: 0.9 }}>
              {bulletin.periodAverage >= 12 ? 'Encouragements du conseil de classe.' : bulletin.periodAverage >= 10 ? 'Résultat passable, doit redoubler d\'efforts.' : 'Travail insuffisant.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
