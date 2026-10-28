'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Save, AlertCircle, Loader2, FileDown, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { exportToExcel } from '@/lib/excelExport';
import * as XLSX from 'xlsx';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

export default function GradesPage() {
  const router = useRouter();
  const toast  = useToast();

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects]     = useState<any[]>([]);
  const [years, setYears]           = useState<any[]>([]);

  const [form, setForm] = useState({
    classroomId: '', subjectId: '', academicYearId: '', examType: 'MIDTERM', trimestre: '1', maxScore: '20'
  });

  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades]     = useState<Record<string, { score: string; comment: string }>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);

  // Détection du type d'école
  const [schoolType, setSchoolType] = useState<string | null>(null);
  const isAgro = schoolType === 'AGRO';

  useEffect(() => {
    Promise.all([
      fetch('/api/classrooms').then(r => r.json()),
      fetch('/api/academic-years').then(r => r.json()),
      fetch('/api/school/settings').then(r => r.json()),
      fetch('/api/school/config').then(r => r.json()),
    ]).then(([cData, yData, settings, config]) => {
      if (Array.isArray(cData)) setClassrooms(cData);
      if (Array.isArray(yData)) {
        setYears(yData);
        const active = yData.find((y: any) => y.isActive);
        if (active) setForm(f => ({ ...f, academicYearId: active.id }));
      }
      // Adapter le barème de notation selon l'école (multi-tenant)
      if (settings?.gradingScale) {
        setForm(f => ({ ...f, maxScore: String(settings.gradingScale) }));
      }
      if (config?.type) {
        setSchoolType(config.type);
      }
    }).catch(() => toast.error('Erreur lors du chargement des paramètres.'));
  }, [toast]);

  // Chargement dynamique des matières selon la classe
  useEffect(() => {
    if (form.classroomId) {
      fetch(`/api/subjects?classroomId=${form.classroomId}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSubjects(data);
            // Optionnel : Reset de la matière sélectionnée si elle n'est plus dans la liste
            setForm(f => ({ ...f, subjectId: '' }));
          }
        })
        .catch(() => {});
    } else {
      setSubjects([]);
    }
  }, [form.classroomId]);

  const loadStudents = useCallback(async () => {
    if (!form.classroomId || !form.academicYearId) {
      setStudents([]); setGrades({}); return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/enrollments?classroomId=${form.classroomId}&academicYearId=${form.academicYearId}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
        // init grades
        const initG: any = {};
        data.forEach(e => {
          initG[e.studentId] = { score: '', comment: '' };
        });
        setGrades(initG);
      }
    } catch {
      toast.error('Erreur lors du chargement des élèves.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [form.classroomId, form.academicYearId, router, toast]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleGradeChange = (studentId: string, field: 'score' | 'comment', value: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }));
  };

  const handleSave = async () => {
    if (!form.classroomId) { toast.warning('Veuillez sélectionner une classe.'); return; }
    if (!form.subjectId) { toast.warning(`Veuillez sélectionner un ${isAgro ? 'module' : 'matière'}.`); return; }
    if (!form.academicYearId) { toast.warning('Veuillez sélectionner une année académique.'); return; }
    
    const payloadGrades = Object.entries(grades)
      .filter(([_, g]) => g.score !== '')
      .map(([studentId, g]) => ({
        studentId,
        score: parseFloat(g.score),
        comment: g.comment
      }));
      
    if (payloadGrades.length === 0) {
      toast.warning('Veuillez saisir au moins une note.'); return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grades: payloadGrades,
          subjectId: form.subjectId,
          academicYearId: form.academicYearId,
          examType: form.examType,
          trimestre: parseInt(form.trimestre, 10),
          maxScore: parseFloat(form.maxScore)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur d\'enregistrement');
      toast.success(`${data.count} notes enregistrées avec succès.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportTemplate = () => {
    if (students.length === 0) { toast.warning('Chargez d\'abord une liste d\'élèves.'); return; }
    const template = students.map(e => ({
      'Matricule': e.student.studentNumber,
      'Nom': e.student.lastName,
      'Prénom': e.student.firstName,
      'Note': '',
      'Commentaire': ''
    }));
    exportToExcel(template, `Grille_Notes_${form.classroomId}`, 'Notes');
    toast.success('Modèle d\'importation généré.');
  };

  const handleImportExcel = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        const newGrades = { ...grades };
        let count = 0;

        json.forEach(row => {
          const student = students.find(s => s.student.studentNumber === String(row.Matricule || row.matricule));
          if (student) {
            newGrades[student.studentId] = { 
              score: row.Note?.toString() || row.note?.toString() || '', 
              comment: row.Commentaire || row.commentaire || '' 
            };
            count++;
          }
        });

        setGrades(newGrades);
        toast.success(`${count} notes pré-remplies depuis Excel.`);
      } catch (err) {
        toast.error('Erreur lors de la lecture du fichier Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const selectedSubject = subjects.find(subject => subject.id === form.subjectId);
  const enteredGrades = students.filter(student => grades[student.student.id]?.score !== '').length;
  const missingGrades = Math.max(students.length - enteredGrades, 0);
  const gradeLabel = isAgro ? 'module' : 'matière';

  return (
    <AppLayout
      title="Saisie des Notes"
      subtitle={isAgro
        ? 'Évaluez les compétences acquises dans chaque module de formation'
        : 'Enregistrez les évaluations et devoirs surveillés'}
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Saisie des Notes' }]}
    >
      <div className="card shadow-sm" style={{ padding: '24px', marginBottom: '8px' }}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          <div className="form-group">
            <label htmlFor="grade-academic-year">Année académique</label>
            <select id="grade-academic-year" value={form.academicYearId} onChange={e => setForm({...form, academicYearId: e.target.value})} className="form-input">
              <option value="">-- Année --</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name} {y.isActive ? '(Active)' : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="grade-classroom">Classe / promotion</label>
            <select id="grade-classroom" value={form.classroomId} onChange={e => setForm({...form, classroomId: e.target.value})} className="form-input">
              <option value="">-- Classe --</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="grade-subject">{isAgro ? 'Module de formation' : 'Matière'}</label>
            <select id="grade-subject" value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="form-input">
              <option value="">{isAgro ? '-- Sélectionnez un module --' : '-- Matière --'}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="grade-term">Période / trimestre</label>
            <select id="grade-term" value={form.trimestre} onChange={e => setForm({...form, trimestre: e.target.value})} className="form-input">
              <option value="1">1er Trimestre</option>
              <option value="2">2ème Trimestre</option>
              <option value="3">3ème Trimestre</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="grade-assessment-type">Type d&apos;évaluation</label>
            <select id="grade-assessment-type" value={form.examType} onChange={e => setForm({...form, examType: e.target.value})} className="form-input">
              <option value="CONTINUOUS">Note de Classe / Interro</option>
              <option value="MIDTERM">Devoir Surveillé / Compo</option>
              <option value="FINAL">Examen de Trimestre</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="grade-max-score">Barème</label>
            <input id="grade-max-score" type="number" min="1" value={form.maxScore} onChange={e => setForm({...form, maxScore: e.target.value})} className="form-input" />
          </div>
        </div>
        {form.subjectId && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border/40 pt-4 text-xs text-text-muted">
            <StatusBadge tone="info" dot>{isAgro ? 'Système modulaire agro-pastoral' : 'Évaluation académique'}</StatusBadge>
            <span className="font-semibold text-text">{selectedSubject?.name}</span>
            {selectedSubject?.code && <span>• {selectedSubject.code}</span>}
            {selectedSubject?.coefficient !== undefined && <span>• Coefficient {selectedSubject.coefficient}</span>}
            <span>• Noté sur {form.maxScore}</span>
          </div>
        )}
      </div>

      {students.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} className="text-primary" />
              Grille de saisie ({students.length} apprenants)
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge tone="success" dot>{enteredGrades} saisie{enteredGrades > 1 ? 's' : ''}</StatusBadge>
                <StatusBadge tone={missingGrades > 0 ? 'warning' : 'success'} dot>{missingGrades} restante{missingGrades > 1 ? 's' : ''}</StatusBadge>
                <span className="text-[11px] text-slate-500 font-medium ml-1 hidden sm:inline-flex items-center gap-1">
                  ⌨️ Touche Entrée ou ↑/↓ pour passer rapidement d'un apprenant à l'autre
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" onClick={handleExportTemplate}>
                <FileDown size={14} /> Modèle Excel
              </button>
              <label className="btn-ghost" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> Importer Excel
                <input type="file" accept=".xlsx,.xls" hidden onChange={handleImportExcel} />
              </label>
              <button className="btn-primary" onClick={handleSave} disabled={isSaving || !form.subjectId}>
                {isSaving ? <><Loader2 size={16} className="spin" /> Validation...</> : <><Save size={16} /> Valider les notes</>}
              </button>
            </div>
          </div>
          
          <div className="table-container">
            {isLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="spin" style={{ margin: '0 auto', display: 'block' }} />
              </div>
            ) : (
              <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px 24px' }}>Matricule</th>
                    <th>Élève</th>
                    <th style={{ width: '150px' }}>Note (/{form.maxScore})</th>
                    <th>Appréciation / Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((e, idx) => (
                    <tr key={e.student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px' }}><span className="badge badge-primary">{e.student.studentNumber}</span></td>
                      <td><strong style={{ color: 'var(--text)' }}>{e.student.firstName} {e.student.lastName}</strong></td>
                      <td>
                        <input
                          type="number" 
                          step="0.25"
                          min="0"
                          max={form.maxScore}
                          className="form-input" 
                          style={{ width: '100px', fontWeight: 600, background: 'var(--bg-3)' }}
                          placeholder="—"
                          aria-label={`Note de ${e.student.firstName} ${e.student.lastName} sur ${form.maxScore}`}
                          value={grades[e.student.id]?.score || ''}
                          data-grade-row={idx}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === 'ArrowDown') {
                              ev.preventDefault();
                              const next = document.querySelector(`input[data-grade-row="${idx + 1}"]`) as HTMLInputElement;
                              if (next) next.focus();
                            } else if (ev.key === 'ArrowUp') {
                              ev.preventDefault();
                              const prev = document.querySelector(`input[data-grade-row="${idx - 1}"]`) as HTMLInputElement;
                              if (prev) prev.focus();
                            }
                          }}
                          onChange={(ev) => handleGradeChange(e.student.id, 'score', ev.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text" 
                          className="form-input" 
                          style={{ width: '100%', background: 'var(--bg-3)' }} 
                          placeholder="Appréciation libre..." 
                          aria-label={`Commentaire pour ${e.student.firstName} ${e.student.lastName}`}
                          value={grades[e.student.id]?.comment || ''}
                          data-comment-row={idx}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter') {
                              ev.preventDefault();
                              const next = document.querySelector(`input[data-comment-row="${idx + 1}"]`) as HTMLInputElement;
                              if (next) next.focus();
                            }
                          }}
                          onChange={(ev) => handleGradeChange(e.student.id, 'comment', ev.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : form.classroomId ? (
        <EmptyState
          icon={<AlertCircle size={48} />}
          title="Aucun apprenant inscrit"
          description="Aucun apprenant n'est inscrit dans cette classe pour l'année académique sélectionnée."
        />
      ) : (
        <EmptyState
          icon={<BookOpen size={48} />}
          title={`Prêt à saisir les ${gradeLabel}s ?`}
          description={`Sélectionnez une année académique et une classe pour afficher les apprenants et saisir les évaluations.`}
        />
      )}
    </AppLayout>
  );
}
