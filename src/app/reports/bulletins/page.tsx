'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Loader2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

export default function BatchBulletinsPage() {
  const toast = useToast();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [form, setForm] = useState({ classroomId: '', academicYearId: '', trimestre: '1' });
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/classrooms').then(r => r.json()),
      fetch('/api/academic-years').then(r => r.json())
    ]).then(([cData, yData]) => {
      if (Array.isArray(cData)) setClassrooms(cData);
      if (Array.isArray(yData)) {
        setYears(yData);
        const active = yData.find(y => y.isActive);
        if (active) setForm(f => ({ ...f, academicYearId: active.id }));
      }
    }).catch(() => toast.error('Erreur de chargement des filtres.'));
  }, [toast]);

  const generateBatch = async () => {
    if (!form.classroomId || !form.academicYearId) {
      toast.warning('Veuillez sélectionner une classe et une année.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Dans un vrai cas, on ferait un endpoint dédié qui renvoie les notes agrégées par élève.
      // Ici, on va d'abord chercher les élèves de la classe
      const res = await fetch(`/api/enrollments?classroomId=${form.classroomId}&academicYearId=${form.academicYearId}`);
      if (!res.ok) throw new Error();
      const students = await res.json();
      
      // On mock les données de bulletins pour la démonstration du batch print
      // (Dans la vraie vie on ferait un /api/reports/bulletins?classId=...)
      const generatedReports = students.map((e: any) => ({
        student: e.student,
        classroom: classrooms.find(c => c.id === form.classroomId)?.name,
        trimestre: form.trimestre,
        year: years.find(y => y.id === form.academicYearId)?.name,
        grades: [
          { subject: 'Mathématiques', score: (Math.random() * 10 + 10).toFixed(2), coeff: 4 },
          { subject: 'Français', score: (Math.random() * 10 + 10).toFixed(2), coeff: 3 },
          { subject: 'Physique-Chimie', score: (Math.random() * 10 + 10).toFixed(2), coeff: 3 },
          { subject: 'SVT', score: (Math.random() * 10 + 10).toFixed(2), coeff: 2 },
          { subject: 'Anglais', score: (Math.random() * 10 + 10).toFixed(2), coeff: 2 },
          { subject: 'Histoire-Géo', score: (Math.random() * 10 + 10).toFixed(2), coeff: 2 },
        ],
        generalAverage: (Math.random() * 5 + 12).toFixed(2),
        rank: Math.floor(Math.random() * 30) + 1,
        totalStudents: students.length
      }));
      
      setReportData(generatedReports);
      toast.success(`${generatedReports.length} bulletins générés.`);
    } catch {
      toast.error('Erreur lors de la génération.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout
      title="Génération des Bulletins (En Lot)"
      subtitle="Imprimez tous les bulletins d'une classe en un seul clic."
      breadcrumbs={[{ label: 'Rapports' }, { label: 'Bulletins en lot' }]}
    >
      <style>{`
        @media print {
          /* Cacher tout l'UI de l'application sauf la zone d'impression */
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          
          /* Forcer un saut de page après chaque bulletin */
          .bulletin-page { page-break-after: always; padding: 20px; }
          .no-print { display: none !important; }
        }
        
        .bulletin-card {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 40px;
          margin-bottom: 24px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .bulletin-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #1e293b;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        
        .bulletin-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .bulletin-table th, .bulletin-table td {
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          text-align: center;
        }
        
        .bulletin-table th {
          background-color: #f8fafc;
          font-weight: 700;
          color: #334155;
        }
        
        .bulletin-table td.text-left { text-align: left; }
      `}</style>

      {/* Barre de contrôle (Cachée à l'impression) */}
      <div className="card shadow-sm p-6 mb-6 no-print bg-white rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Année Académique</label>
            <select value={form.academicYearId} onChange={e => setForm({...form, academicYearId: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500">
              <option value="">-- Sélectionner --</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Classe</label>
            <select value={form.classroomId} onChange={e => setForm({...form, classroomId: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500">
              <option value="">-- Sélectionner --</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Trimestre</label>
            <select value={form.trimestre} onChange={e => setForm({...form, trimestre: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500">
              <option value="1">1er Trimestre</option>
              <option value="2">2ème Trimestre</option>
              <option value="3">3ème Trimestre</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={generateBatch} 
              disabled={isLoading}
              className="flex-1 bg-slate-800 text-white p-2 rounded-lg font-semibold hover:bg-slate-700 transition flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
              Générer
            </button>
            <button 
              onClick={handlePrint} 
              disabled={reportData.length === 0}
              className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer size={18} />
              Imprimer
            </button>
          </div>
        </div>
      </div>

      {/* Zone de prévisualisation et d'impression */}
      {reportData.length > 0 ? (
        <div className="print-area">
          {reportData.map((report, idx) => (
            <div key={idx} className="bulletin-page bulletin-card text-slate-800">
              {/* En-tête officiel Malien */}
              <div className="bulletin-header">
                <div className="text-center">
                  <h4 className="font-bold text-sm">RÉPUBLIQUE DU MALI</h4>
                  <p className="text-xs italic">Un Peuple - Un But - Une Foi</p>
                  <p className="text-xs mt-2 font-bold">MINISTÈRE DE L'ÉDUCATION NATIONALE</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">BULLETIN DE NOTES</h2>
                  <p className="text-sm font-semibold mt-1">Année Scolaire : {report.year}</p>
                  <p className="text-sm font-semibold">Trimestre {report.trimestre}</p>
                </div>
              </div>

              {/* Infos de l'élève */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm"><span className="font-semibold text-slate-500">Nom & Prénoms:</span> <strong className="text-lg">{report.student.firstName} {report.student.lastName}</strong></p>
                  <p className="text-sm"><span className="font-semibold text-slate-500">Matricule:</span> {report.student.studentNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm"><span className="font-semibold text-slate-500">Classe:</span> <strong>{report.classroom}</strong></p>
                  <p className="text-sm"><span className="font-semibold text-slate-500">Effectif:</span> {report.totalStudents} élèves</p>
                </div>
              </div>

              {/* Tableau des notes */}
              <table className="bulletin-table">
                <thead>
                  <tr>
                    <th className="text-left w-1/3">Matière</th>
                    <th>Coeff</th>
                    <th>Moyenne (sur 20)</th>
                    <th>Moy. x Coeff</th>
                    <th className="w-1/3">Appréciation du Professeur</th>
                  </tr>
                </thead>
                <tbody>
                  {report.grades.map((g: any, i: number) => (
                    <tr key={i}>
                      <td className="text-left font-semibold">{g.subject}</td>
                      <td>{g.coeff}</td>
                      <td className="font-bold">{g.score}</td>
                      <td className="font-bold bg-slate-50">{(parseFloat(g.score) * g.coeff).toFixed(2)}</td>
                      <td className="text-xs text-slate-600 italic text-left">Travail satisfaisant dans l'ensemble.</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td className="text-right" colSpan={3}>Moyenne Générale du Trimestre :</td>
                    <td className="text-lg text-blue-600">{report.generalAverage}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

              {/* Bilan & Signatures */}
              <div className="mt-8 flex justify-between">
                <div className="w-1/3 border border-slate-300 rounded p-3">
                  <h5 className="font-bold text-sm border-b border-slate-200 pb-2 mb-2">Bilan Trimestriel</h5>
                  <p className="text-sm flex justify-between">Rang: <strong>{report.rank}e / {report.totalStudents}</strong></p>
                  <p className="text-sm flex justify-between mt-1">Conduite: <strong>Très Bien</strong></p>
                  <p className="text-sm flex justify-between mt-1">Absences: <strong>0h</strong></p>
                </div>
                
                <div className="w-1/3 text-center">
                  <p className="font-bold text-sm underline mb-16">Le Directeur des Études</p>
                  <p className="text-xs text-slate-400">(Signature et Cachet)</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border-2 border-dashed border-slate-700/50 rounded-xl no-print">
          <Printer size={48} className="mx-auto text-slate-600 mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-slate-300">Aucun bulletin généré</h3>
          <p className="text-slate-500">Sélectionnez les filtres ci-dessus et cliquez sur Générer pour prévisualiser les bulletins.</p>
        </div>
      )}
    </AppLayout>
  );
}
