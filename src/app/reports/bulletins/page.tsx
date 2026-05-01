'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Loader2, AlertCircle, FileText, CheckCircle2, Mail } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

export default function BatchBulletinsPage() {
  const toast = useToast();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [form, setForm] = useState({ classroomId: '', academicYearId: '', trimestre: '1' });
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

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
      const res = await fetch(`/api/reports/bulletins?classroomId=${form.classroomId}&academicYearId=${form.academicYearId}&trimestre=${form.trimestre}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (data.length === 0) {
        toast.info('Aucune note trouvée pour cette classe et ce trimestre.');
      }
      
      setReportData(data);
      toast.success(`${data.length} bulletins générés.`);
    } catch {
      toast.error('Erreur lors de la génération.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const sendByEmail = async () => {
    if (reportData.length === 0) return;
    
    setIsSending(true);
    try {
      const trimestreLabel = form.trimestre === '1' ? '1er Trimestre' : form.trimestre === '2' ? '2ème Trimestre' : '3ème Trimestre';
      const res = await fetch('/api/reports/bulletins/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletins: reportData, trimestreLabel })
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success(`${result.sent} emails envoyés sur ${result.total}.`);
      } else {
        toast.error('Échec de l\'envoi des emails.');
      }
    } catch {
      toast.error('Erreur réseau lors de l\'envoi.');
    } finally {
      setIsSending(false);
    }
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
              className="flex-1 bg-white text-slate-800 border border-slate-300 p-2 rounded-lg font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer size={18} />
              Imprimer
            </button>
            <button 
              onClick={sendByEmail} 
              disabled={reportData.length === 0 || isSending}
              className="flex-1 bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
              Envoyer (Email)
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
                <div className="text-center" style={{ width: '30%' }}>
                  <h4 className="font-bold text-[10px]">RÉPUBLIQUE DU MALI</h4>
                  <p className="text-[8px] italic">Un Peuple - Un But - Une Foi</p>
                  <div className="my-2 border-b border-slate-300 w-10 mx-auto"></div>
                  <p className="text-[9px] font-bold">MINISTÈRE DE L'ÉDUCATION NATIONALE</p>
                  <p className="text-[8px] font-semibold mt-1">ACADÉMIE D'ENSEIGNEMENT DE BAMAKO</p>
                </div>
                
                <div className="text-center" style={{ width: '40%' }}>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter">BULLETIN DE NOTES</h2>
                  <div className="bg-slate-900 text-white text-[10px] py-1 px-3 rounded-full inline-block mt-2 font-bold uppercase tracking-widest">
                    {form.trimestre === '1' ? '1er Trimestre' : form.trimestre === '2' ? '2ème Trimestre' : '3ème Trimestre'}
                  </div>
                  <p className="text-xs font-bold mt-2">Année Scolaire : {years.find(y => y.id === form.academicYearId)?.name}</p>
                </div>

                <div className="text-right" style={{ width: '30%' }}>
                   <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-lg ml-auto mb-2 flex items-center justify-center">
                      <span className="text-[8px] text-slate-400">LOGO ÉCOLE</span>
                   </div>
                </div>
              </div>

              {/* Infos de l'élève */}
              <div className="grid grid-cols-2 gap-8 mb-6 mt-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Élève</p>
                  <p className="text-lg font-black text-slate-900">{report.studentName}</p>
                  <div className="flex gap-4 text-xs">
                    <p><span className="text-slate-500">Matricule:</span> <span className="font-bold">{report.studentNumber}</span></p>
                    <p><span className="text-slate-500">Sexe:</span> <span className="font-bold">M</span></p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Classe & Effectif</p>
                  <p className="text-lg font-black text-slate-900">{classrooms.find(c => c.id === form.classroomId)?.name}</p>
                  <p className="text-xs"><span className="text-slate-500">Effectif de la classe:</span> <span className="font-bold">{report.classSize} élèves</span></p>
                </div>
              </div>

              {/* Tableau des notes */}
              <table className="bulletin-table">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="text-left w-1/4">Matières</th>
                    <th>Coeff</th>
                    <th>Moy. Classe (1/3)</th>
                    <th>Moy. Compo (2/3)</th>
                    <th>Moy. Matière</th>
                    <th>Moy. Pondérée</th>
                    <th>Appréciation</th>
                  </tr>
                </thead>
                <tbody>
                  {report.subjects.map((s: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="text-left font-bold text-slate-800">{s.subjectName}</td>
                      <td className="font-bold">{s.coefficient}</td>
                      <td className="text-slate-500">{s.moyenneClasse}</td>
                      <td className="text-slate-500">{s.moyenneComposition}</td>
                      <td className="bg-blue-50/30 font-black text-slate-900">{s.average}</td>
                      <td className="font-black">{(s.average * s.coefficient).toFixed(2)}</td>
                      <td className="text-[10px] italic text-slate-500 text-left">{s.mention}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white font-black">
                    <td className="text-right" colSpan={4}>TOTAL GÉNÉRAL</td>
                    <td>—</td>
                    <td>{report.totalPoints}</td>
                    <td>/ {report.totalCoefficients * 20}</td>
                  </tr>
                </tbody>
              </table>

              {/* Résultats & Bilan */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="col-span-1 border-2 border-slate-900 rounded-xl p-4 bg-slate-50">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Résultats du Trimestre</h4>
                   <div className="space-y-2">
                      <div className="flex justify-between items-end border-b border-slate-200 pb-1">
                         <span className="text-xs font-bold">MOYENNE GÉNÉRALE</span>
                         <span className="text-xl font-black text-blue-600">{report.generalAverage}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-200 pb-1">
                         <span className="text-xs font-bold">RANG</span>
                         <span className="text-lg font-black">{report.rank}<sup>{report.rank === 1 ? 'er' : 'ème'}</sup> / {report.classSize}</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <span className="text-xs font-bold">MENTION</span>
                         <span className="text-sm font-black uppercase">{report.mention}</span>
                      </div>
                   </div>
                </div>

                <div className="col-span-1 flex flex-col items-center justify-start pt-4">
                  <div className="w-24 h-24 border-2 border-slate-200 rounded-full flex items-center justify-center text-[8px] text-slate-300 uppercase font-black text-center p-4">
                    Cachet de l'établissement
                  </div>
                </div>

                <div className="col-span-1 text-center pt-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-16">Le Directeur des Études</p>
                  <div className="w-40 h-0.5 bg-slate-900 mx-auto"></div>
                  <p className="text-[9px] font-bold mt-2">M. Abdoulaye DIARRA</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Généré par SchoolERP Pro — {new Date().toLocaleDateString('fr-FR')}</span>
                <span>Page {idx + 1} / {reportData.length}</span>
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
