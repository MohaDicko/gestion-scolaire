'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Save, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

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

  useEffect(() => {
    Promise.all([
      fetch('/api/classrooms').then(r => r.json()),
      fetch('/api/subjects').then(r => r.json()),
      fetch('/api/academic-years').then(r => r.json())
    ]).then(([cData, sData, yData]) => {
      if (Array.isArray(cData)) setClassrooms(cData);
      if (Array.isArray(sData)) setSubjects(sData);
      if (Array.isArray(yData)) {
        setYears(yData);
        const active = yData.find(y => y.isActive);
        if (active) setForm(f => ({ ...f, academicYearId: active.id }));
      }
    }).catch(() => toast.error('Erreur lors du chargement des modules.'));
  }, [toast]);

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
    if (!form.subjectId) { toast.warning('Veuillez sélectionner une matière.'); return; }
    
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

  return (
    <AppLayout
      title="Saisie des Notes"
      subtitle="Enregistrez les évaluations et Devoirs Surveillés"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Saisie des Notes' }]}
    >
      <div className="card shadow-sm" style={{ padding: '24px', marginBottom: '8px' }}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          <div className="form-group">
            <label>Année Académique</label>
            <select value={form.academicYearId} onChange={e => setForm({...form, academicYearId: e.target.value})} className="form-input">
              <option value="">-- Année --</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name} {y.isActive ? '(Active)' : ''}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Classe</label>
            <select value={form.classroomId} onChange={e => setForm({...form, classroomId: e.target.value})} className="form-input">
              <option value="">-- Classe --</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Matière</label>
            <select value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})} className="form-input">
              <option value="">-- Matière --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Période (Trimestre)</label>
            <select value={form.trimestre} onChange={e => setForm({...form, trimestre: e.target.value})} className="form-input">
              <option value="1">1er Trimestre</option>
              <option value="2">2ème Trimestre</option>
              <option value="3">3ème Trimestre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Type d'Évaluation</label>
            <select value={form.examType} onChange={e => setForm({...form, examType: e.target.value})} className="form-input">
              <option value="CONTINUOUS">Note de Classe / Interro</option>
              <option value="MIDTERM">Devoir Surveillé / Compo</option>
              <option value="FINAL">Examen de Trimestre</option>
            </select>
          </div>
          <div className="form-group">
            <label>Noté sur</label>
            <input type="number" min="1" value={form.maxScore} onChange={e => setForm({...form, maxScore: e.target.value})} className="form-input" />
          </div>
        </div>
      </div>

      {students.length > 0 ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={18} className="text-primary" />
              Grille de Saisie ({students.length} élèves)
            </h3>
            <button className="btn-primary" onClick={handleSave} disabled={isSaving || !form.subjectId}>
              {isSaving ? <><Loader2 size={16} className="spin" /> Validation...</> : <><Save size={16} /> Valider les notes</>}
            </button>
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
                  {students.map(e => (
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
                          value={grades[e.student.id]?.score || ''}
                          onChange={(ev) => handleGradeChange(e.student.id, 'score', ev.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ width: '100%', background: 'var(--bg-3)' }} 
                          placeholder="Appréciation libre..." 
                          value={grades[e.student.id]?.comment || ''}
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
        <div className="card text-center" style={{ padding: '60px', color: 'var(--text-muted)' }}>
           <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
           <p>Aucun élève inscrit dans cette classe pour l'année sélectionnée.</p>
        </div>
      ) : (
        <div className="card text-center" style={{ padding: '60px', color: 'var(--text-muted)', border: '1px dashed var(--border-md)' }}>
            <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <h3 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>Prêt à saisir les notes ?</h3>
            <p>Sélectionnez une année académique et une classe pour afficher la liste des élèves.</p>
        </div>
      )}
    </AppLayout>
  );
}
