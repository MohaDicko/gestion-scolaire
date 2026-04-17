'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Clock, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function TimetablePage() {
    const router = useRouter();
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        dayOfWeek: '1',
        startTime: '08:00',
        endTime: '10:00',
        subjectId: '', // To be filled from API
        employeeId: '' // To be filled from API
    });

    const fetchSchedule = async () => {
        if (!selectedClassroom) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/timetable?classroomId=${selectedClassroom}`);
            const data = await res.json();
            setSchedule(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [selectedClassroom]);

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, classroomId: selectedClassroom })
            });
            setShowForm(false);
            fetchSchedule();
        } catch (e) {
            alert('Erreur');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce créneau ?')) return;
        await fetch(`/api/timetable?id=${id}`, { method: 'DELETE' });
        fetchSchedule();
    }

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Vercel</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/classrooms')}>Classes</div>
              <div className="nav-item active">Emploi du temps</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Emploi du Temps</h1>
                        <p className="page-subtitle">Plannings visuels par classe</p>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ marginBottom: '20px' }}>
                    <div className="form-group" style={{ maxWidth: '300px' }}>
                        <label>Classe (Mock pour tester)</label>
                        <select value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)} className="form-input">
                            <option value="">Sélectionner une classe</option>
                            <option value="class-fake-id">6ème Année B</option>
                        </select>
                    </div>
                </div>

                {selectedClassroom ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                            <button className="btn-primary" onClick={() => setShowForm(true)}>
                                <Plus size={16} /> Ajouter un Créneau
                            </button>
                        </div>

                        {showForm && (
                            <div className="card" style={{ marginBottom: '25px', border: '1px solid var(--primary)' }}>
                                <h3>Nouveau Créneau</h3>
                                <form onSubmit={handleAddSlot} style={{ display: 'flex', gap: '15px', marginTop: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                    <div>
                                        <label>Jour</label>
                                        <select className="form-input" value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}>
                                            {DAYS.map((d, i) => <option key={i} value={i+1}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Heure Début</label>
                                        <input type="time" className="form-input" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} required/>
                                    </div>
                                    <div>
                                        <label>Heure Fin</label>
                                        <input type="time" className="form-input" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} required/>
                                    </div>
                                    <div>
                                        <label>ID Matière</label>
                                        <input type="text" className="form-input" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} required/>
                                    </div>
                                    <div>
                                        <label>ID Professeur</label>
                                        <input type="text" className="form-input" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} required/>
                                    </div>
                                    <button className="btn-primary" type="submit">Valider</button>
                                    <button className="btn-ghost" type="button" onClick={() => setShowForm(false)}>Annuler</button>
                                </form>
                            </div>
                        )}

                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {isLoading ? (
                                <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>
                            ) : (
                                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                                    {DAYS.map((dayName, i) => {
                                        const daySlots = schedule.filter(s => s.dayOfWeek === i + 1);
                                        return (
                                            <div key={dayName} style={{ flex: 1, borderRight: '1px solid var(--border)', minHeight: '400px' }}>
                                                <div style={{ padding: '12px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 'bold' }}>
                                                    {dayName}
                                                </div>
                                                <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {daySlots.map(slot => (
                                                        <div key={slot.id} style={{ background: 'var(--primary-dim)', borderLeft: '3px solid var(--primary)', padding: '10px', borderRadius: '4px', fontSize: '12px', position: 'relative' }}>
                                                            <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '4px' }}><Clock size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> {slot.startTime} - {slot.endTime}</div>
                                                            <div><strong>Matière ID: {slot.subjectId}</strong></div>
                                                            <div>Prof ID: {slot.employeeId}</div>
                                                            <button onClick={() => handleDelete(slot.id)} style={{ position: 'absolute', top: 5, right: 5, color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                                        </div>
                                                    ))}
                                                    {daySlots.length === 0 && <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '12px', marginTop: '20px' }}>Libre</div>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="card text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                        <CalendarDays size={48} style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                        <p>Sélectionnez une classe pour afficher son emploi du temps visuel.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
    );
}
