'use client';

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Save, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AttendancePage() {
    const router = useRouter();
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!selectedClassroom || !selectedDate) return;
        setIsLoading(true);
        fetch(`/api/attendance?classroomId=${selectedClassroom}&date=${selectedDate}`)
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) setStudents(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [selectedClassroom, selectedDate]);

    const handleStatusChange = (studentId: string, status: string) => {
        setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classroomId: selectedClassroom,
                    date: selectedDate,
                    records: students
                })
            });
            alert('Appel enregistré avec succès !');
        } catch (e) {
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Pro</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/students')}>Élèves</div>
              <div className="nav-item" onClick={() => router.push('/classrooms')}>Classes</div>
              <div className="nav-item active">Registre d'Appel</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Gestion des Présences</h1>
                        <p className="page-subtitle">Suivi journalier par classe</p>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ marginBottom: '20px' }}>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="form-group">
                            <label>Classe</label>
                            {/* Pour tester on met une vraie ID ou on s'attend à ce que l'utilisateur choisisse */}
                            <select value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)} className="form-input">
                                <option value="">Sélectionner une classe</option>
                                <option value="class-fake-id">6ème Année B</option>
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
                        <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 className="card-title"><CalendarCheck size={18} style={{ display: 'inline', marginRight: 10 }} /> Grille d'appel</h3>
                            <button className="btn-primary" onClick={handleSave} disabled={isSaving || students.length === 0}>
                                {isSaving ? 'Enregistrement...' : <><Save size={16} /> Valider l'appel</>}
                            </button>
                        </div>
                        
                        <div className="table-container">
                            {isLoading ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>Chargement de l'effectif...</div>
                            ) : students.length > 0 ? (
                                <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '15px 20px' }}>Élève</th>
                                            <th>Statut d'Absence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(s => (
                                            <tr key={s.studentId} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '15px 20px' }}><strong>{s.studentName}</strong><br/><small className="text-primary">{s.matricule}</small></td>
                                                <td>
                                                    <select 
                                                        value={s.status} 
                                                        onChange={(e) => handleStatusChange(s.studentId, e.target.value)}
                                                        className="form-input" 
                                                        style={{ 
                                                            width: '150px', 
                                                            color: s.status === 'PRESENT' ? 'var(--success)' : s.status === 'ABSENT' ? 'var(--danger)' : 'var(--warning)'
                                                        }}
                                                    >
                                                        <option value="PRESENT" style={{ color: 'black' }}>Présent</option>
                                                        <option value="ABSENT" style={{ color: 'black' }}>Absent</option>
                                                        <option value="LATE" style={{ color: 'black' }}>En Retard</option>
                                                        <option value="EXCUSED" style={{ color: 'black' }}>Excusé</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <p>Cette classe ne contient aucun élève (ou ID factice).</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="card text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                        <p>Sélectionnez une classe et une date pour afficher la grille de pointage.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
    );
}
