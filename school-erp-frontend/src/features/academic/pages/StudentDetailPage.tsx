// Unused React import removed
import { useParams } from 'react-router-dom';
import { BookOpen, Calendar, MessageCircle, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SubjectGrade {
  subjectName: string;
  score: number;
  maxScore: number;
  comment: string;
}

interface Bulletin {
  studentName: string;
  className: string;
  academicYear: string;
  semester: number;
  averageGrade: number;
  parentPhone?: string;
  subjects: SubjectGrade[];
}

export function StudentDetailPage() {
  const { id } = useParams();

  const { data: bulletin, isLoading } = useQuery<Bulletin>({
    queryKey: ['bulletin', id],
    queryFn: async () => {
      const token = localStorage.getItem('school_erp_auth_token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/academic/students/${id}/bulletin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  if (isLoading) return <div className="page">Chargement du bulletin...</div>;

  const handleSendWhatsApp = () => {
    if (!bulletin) return;

    // Clean phone number (remove spaces, etc)
    let phone = bulletin.parentPhone?.replace(/[\s\-\+\(\)]/g, '') || '';
    if (!phone) {
      alert("Aucun numéro de téléphone n'est enregistré pour ce parent.");
      return;
    }

    // Construct the message text
    const textLines = [
      `*BULLETIN SCOLAIRE - ${bulletin.studentName}*`,
      `Classe : ${bulletin.className} | Semestre : ${bulletin.semester}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Moyenne Générale : ${bulletin.averageGrade} / 20*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Détails des notes :`,
      ...bulletin.subjects.map(sub =>
        `▫️ ${sub.subjectName} : ${sub.score}/${sub.maxScore} ${sub.comment ? `(${sub.comment})` : ''}`
      ),
      ``,
      `Consultez l'école pour plus d'informations.`,
      `L'Administration.`
    ];

    const message = textLines.join('\n');
    const encodedMessage = encodeURIComponent(message);

    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleGeneratePDF = () => {
    if (!bulletin) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Primary color
    doc.text('BULLETIN SCOLAIRE', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Année Académique: ${bulletin.academicYear}`, 14, 35);
    doc.text(`Semestre: ${bulletin.semester}`, 14, 42);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Élève: ${bulletin.studentName}`, 14, 55);
    doc.text(`Classe: ${bulletin.className}`, 14, 62);
    doc.text(`Matricule: ${id?.substring(0, 8)}`, 14, 69);

    // Moyenne
    doc.setFontSize(16);
    doc.setTextColor(39, 174, 96);
    doc.text(`Moyenne Générale: ${bulletin.averageGrade} / 20`, 105, 80, { align: 'center' });

    // Table
    const tableData = bulletin.subjects.map(sub => [
      sub.subjectName,
      sub.score.toString(),
      `/${sub.maxScore}`,
      sub.comment || 'N/A'
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Matière', 'Note', 'Barème', 'Appréciation']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'center', textColor: [0, 0, 0], fontStyle: 'bold' },
        2: { halign: 'center' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Signature de l'Administration:", 14, finalY + 20);

    doc.save(`Bulletin_${bulletin.studentName.replace(/\s+/g, '_')}_S${bulletin.semester}.pdf`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{bulletin?.studentName || 'Profil Élève'}</h1>
          <p className="page-subtitle">Matricule: {id?.substring(0, 8)} • Classe: {bulletin?.className}</p>
        </div>
        <div className="flex gap-2" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-primary" style={{ background: '#25D366' }} onClick={handleSendWhatsApp}>
            <MessageCircle size={16} /> Envoyer WhatsApp
          </button>
          <button className="btn-primary" onClick={handleGeneratePDF}>
            <Download size={16} /> Imprimer PDF
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="flex flex-col gap-2">
          {/* Bulletin Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Bulletin de Notes - Semestre {bulletin?.semester}</h3>
              <div className="badge-role" style={{ fontSize: '18px', padding: '8px 16px' }}>
                Moyenne: {bulletin?.averageGrade} / 20
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Matière</th>
                    <th>Note</th>
                    <th>Barème</th>
                    <th>Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin?.subjects.map((sub, i) => (
                    <tr key={i}>
                      <td className="font-bold">{sub.subjectName}</td>
                      <td className={sub.score >= sub.maxScore / 2 ? 'text-success' : 'text-danger'}>
                        {sub.score}
                      </td>
                      <td>/ {sub.maxScore}</td>
                      <td style={{ fontSize: '12px' }}>{sub.comment || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="card">
            <h3 className="card-title">Informations Générales</h3>
            <div className="activity-list" style={{ marginTop: '16px' }}>
              <div className="activity-item">
                <div className="logo-icon"><BookOpen size={16} /></div>
                <div className="activity-body">
                  <p className="activity-action">Année Scolaire</p>
                  <p className="activity-detail">{bulletin?.academicYear}</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="logo-icon"><Calendar size={16} /></div>
                <div className="activity-body">
                  <p className="activity-action">Assiduité</p>
                  <p className="activity-detail">98% de présence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
