'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Save, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

export default function AttendancePage() {
  const router = useRouter();
  const toast  = useToast();

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);

  // Load classrooms on mount
  useEffect(() => {
    fetch('/api/classrooms')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setClassrooms(d); })
      .catch(() => toast.error('Impossible de charger les classes.'));
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!selectedClassroom || !selectedDate) {
      setStudents([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance?classroomId=${selectedClassroom}&date=${selectedDate}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erreur lors du chargement de l\'appel.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassroom, selectedDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleStatusChange = (studentId: string, status: string) => {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s));
  };

  const handleSave = async () => {
    if (!selectedClassroom || !selectedDate || students.length === 0) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroomId: selectedClassroom,
          date: selectedDate,
          records: students
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      toast.success('Appel enregistré avec succès !');
      // Reload to reflect saved state if needed, though state is already updated
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout
      title="Registre d'Appel"
      subtitle="Effectuez le suivi journalier des présences par classe"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Présences' }]}
    >
      <div className="card shadow-sm" style={{ padding: '24px', marginBottom: '8px' }}>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="form-group">
            <label>Sélectionner une Classe</label>
            <select value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)} className="form-input">
              <option value="">-- Choisir une classe --</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.stream ? `(${c.stream})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date de l'Appel</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="form-input" 
            />
          </div>
        </div>
      </div>

      {selectedClassroom && selectedDate ? (
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarCheck size={18} className="text-primary" /> 
              Grille d'appel
            </h3>
            <button className="btn-primary" onClick={handleSave} disabled={isSaving || students.length === 0}>
              {isSaving ? <><Loader2 size={16} className="spin" /> Enregistrement...</> : <><Save size={16} /> Valider l'appel</>}
            </button>
          </div>
          
          <div className="table-container">
            {isLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p>Chargement de l'effectif...</p>
              </div>
            ) : students.length > 0 ? (
              <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px 24px' }}>Matricule</th>
                    <th>Élève</th>
                    <th>Statut d'Absence</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.studentId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px' }}><span className="badge badge-primary">{s.matricule}</span></td>
                      <td><strong style={{ color: 'var(--text)' }}>{s.studentName}</strong></td>
                      <td>
                        <select 
                          value={s.status} 
                          onChange={(e) => handleStatusChange(s.studentId, e.target.value)}
                          className="form-input" 
                          style={{ 
                            width: '160px', 
                            color: s.status === 'PRESENT' ? 'var(--success)' : s.status === 'ABSENT' ? 'var(--danger)' : 'var(--warning)',
                            fontWeight: 600,
                            background: 'var(--bg-3)'
                          }}
                        >
                          <option value="PRESENT" style={{ color: 'var(--text)' }}>Présent</option>
                          <option value="ABSENT" style={{ color: 'var(--text)' }}>Absent</option>
                          <option value="LATE" style={{ color: 'var(--text)' }}>En Retard</option>
                          <option value="EXCUSED" style={{ color: 'var(--text)' }}>Excusé</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
                <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Aucun élève inscrit</h3>
                <p style={{ fontSize: '13px' }}>Il n'y a pas d'élèves inscrits dans cette classe pour l'instant.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-md)' }}>
          <CalendarCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h3 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>Prêt à faire l'appel ?</h3>
          <p>Sélectionnez une classe et une date pour afficher la grille de pointage.</p>
        </div>
      )}
    </AppLayout>
  );
}
