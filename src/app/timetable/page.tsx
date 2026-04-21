'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, Clock, Trash2, Loader2, X, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

const DAYS = [
  { id: 1, label: 'Lundi' },
  { id: 2, label: 'Mardi' },
  { id: 3, label: 'Mercredi' },
  { id: 4, label: 'Jeudi' },
  { id: 5, label: 'Vendredi' },
  { id: 6, label: 'Samedi' },
];

export default function TimetablePage() {
    const router = useRouter();
    const toast = useToast();
    
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        dayOfWeek: '1',
        startTime: '08:00',
        endTime: '10:00',
        subjectId: '',
        employeeId: ''
    });

    const fetchDropdownData = useCallback(async () => {
        try {
            const [classRes, subRes, empRes] = await Promise.all([
                fetch('/api/classrooms'),
                fetch('/api/subjects'),
                fetch('/api/employees')
            ]);
            
            const classes = await classRes.json();
            const subs = await subRes.json();
            const emps = await empRes.json();
            
            if (Array.isArray(classes)) setClassrooms(classes);
            if (Array.isArray(subs)) setSubjects(subs);
            if (Array.isArray(emps)) setEmployees(emps);
        } catch (error) {
            toast.error('Erreur lors du chargement des paramètres');
        }
    }, [toast]);

    const fetchSchedule = useCallback(async () => {
        if (!selectedClassroom) {
            setSchedule([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/timetable?classroomId=${selectedClassroom}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSchedule(Array.isArray(data) ? data : []);
        } catch (e) {
            toast.error('Erreur lors du chargement du planning');
        } finally {
            setIsLoading(false);
        }
    }, [selectedClassroom, toast]);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClassroom) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, classroomId: selectedClassroom })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erreur lors de l’enregistrement');
            }
            toast.success('Créneau ajouté avec succès');
            setShowModal(false);
            fetchSchedule();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Souhaitez-vous vraiment supprimer ce créneau ?')) return;
        try {
            const res = await fetch(`/api/timetable?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Créneau supprimé');
            fetchSchedule();
        } catch (e) {
            toast.error('Erreur lors de la suppression');
        }
    }

    return (
        <AppLayout
            title="Emploi du Temps"
            subtitle="Planification hebdomadaire des cours par classe"
            breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Emploi du Temps' }]}
            actions={
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="btn-outline" 
                        onClick={() => window.print()}
                        disabled={!selectedClassroom || schedule.length === 0}
                    >
                        Imprimer
                    </button>
                    <button 
                        className="btn-primary" 
                        onClick={() => setShowModal(true)}
                        disabled={!selectedClassroom}
                    >
                        <Plus size={15} /> Nouveau Créneau
                    </button>
                </div>
            }
        >
            <div className="card shadow-sm" style={{ padding: '24px', marginBottom: '8px' }}>
                <div className="form-group" style={{ maxWidth: '400px' }}>
                    <label>Sélectionner une Classe</label>
                    <select value={selectedClassroom} onChange={(e) => setSelectedClassroom(e.target.value)} className="form-input">
                        <option value="">-- Choisissez une classe --</option>
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.stream ? `(${c.stream})` : ''}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedClassroom ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
                            <p>Chargement du planning...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border)' }}>
                            {DAYS.map((day) => {
                                const daySlots = schedule.filter(s => s.dayOfWeek === day.id);
                                return (
                                    <div key={day.id} style={{ flex: 1, minWidth: '220px', borderRight: '1px solid var(--border)', minHeight: '500px', background: 'var(--bg-1)' }}>
                                        <div style={{ 
                                            padding: '14px', 
                                            background: 'var(--bg-2)', 
                                            borderBottom: '1px solid var(--border)', 
                                            textAlign: 'center', 
                                            fontWeight: 700,
                                            fontFamily: 'Plus Jakarta Sans',
                                            fontSize: '14px',
                                            color: 'var(--primary)'
                                        }}>
                                            {day.label}
                                        </div>
                                        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {daySlots.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                                                <div key={slot.id} className="animate-up" style={{ 
                                                    background: 'var(--bg-3)', 
                                                    borderLeft: '4px solid var(--primary)', 
                                                    padding: '14px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '13px', 
                                                    position: 'relative', 
                                                    boxShadow: 'var(--shadow-sm)',
                                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                                    cursor: 'default'
                                                }}>
                                                    <div style={{ color: 'var(--primary)', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <Clock size={13} /> {slot.startTime} — {slot.endTime}
                                                    </div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{slot.subject?.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{slot.teacher?.firstName} {slot.teacher?.lastName}</div>
                                                    
                                                    <button 
                                                      onClick={() => handleDelete(slot.id)} 
                                                      style={{ 
                                                          position: 'absolute', 
                                                          top: 10, 
                                                          right: 10, 
                                                          color: 'var(--danger)', 
                                                          background: 'none', 
                                                          border: 'none', 
                                                          cursor: 'pointer', 
                                                          opacity: 0.4,
                                                          padding: '4px'
                                                      }}
                                                      className="hover-opacity-1"
                                                    >
                                                        <Trash2 size={13}/>
                                                    </button>
                                                </div>
                                            ))}
                                            {daySlots.length === 0 && (
                                                <div style={{ textAlign: 'center', opacity: 0.2, fontSize: '12px', marginTop: '40px' }}>
                                                    Aucun cours
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="card text-center" style={{ padding: '80px', color: 'var(--text-muted)', border: '1px dashed var(--border-md)' }}>
                    <CalendarDays size={56} style={{ margin: '0 auto 20px', opacity: 0.15 }} />
                    <h3 style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--text)' }}>Planifiez votre semaine</h3>
                    <p>Veuillez sélectionner une classe pour visualiser ou modifier son emploi du temps.</p>
                </div>
            )}

            {/* Modal de création */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ 
                        background: 'var(--bg-2)', 
                        border: '1px solid var(--border-md)', 
                        borderRadius: 'var(--radius-xl)', 
                        width: '100%', 
                        maxWidth: '550px', 
                        boxShadow: 'var(--shadow-lg)', 
                        animation: 'fadeUp 0.3s var(--ease) both' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px' }}>Nouveau Créneau</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleAddSlot} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Jour de la semaine *</label>
                                <select className="form-input" value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} required>
                                    {DAYS.map(day => <option key={day.id} value={day.id}>{day.label}</option>)}
                                </select>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Heure de Début *</label>
                                    <input type="time" className="form-input" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} required/>
                                </div>
                                <div className="form-group">
                                    <label>Heure de Fin *</label>
                                    <input type="time" className="form-input" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} required/>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Matière *</label>
                                <select className="form-input" value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} required>
                                    <option value="">-- Sélectionnez une matière --</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Enseignant *</label>
                                <select className="form-input" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                                    <option value="">-- Sélectionnez un enseignant --</option>
                                    {employees.filter(e => e.employeeType === 'TEACHER').map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 size={16} className="spin" /> Enregistrement...</> : 'Ajouter au Planning'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                .hover-opacity-1:hover { opacity: 1 !important; }
                
                @media print {
                    .sidebar, .top-bar, .btn-primary, .btn-outline, .btn-icon, .form-group, .breadcrumbs {
                        display: none !important;
                    }
                    .main-content {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .card {
                        box-shadow: none !important;
                        border: 1px solid #eee !important;
                        padding: 0 !important;
                    }
                    .layout-root {
                        display: block !important;
                    }
                    title, .page-header {
                        margin-bottom: 20px !important;
                    }
                }
            `}</style>
        </AppLayout>
    );
}
