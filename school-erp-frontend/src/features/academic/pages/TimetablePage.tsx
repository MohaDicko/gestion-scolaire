import { useState, useEffect } from 'react';
import { Clock, Plus, Save, Trash2, CalendarDays, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useClassrooms } from '../hooks/useClassrooms';
import { useClassSchedule, useSetClassSchedule } from '../hooks/useTimetable';
import { useSubjects } from '../hooks/useGrades';
import { useEmployees } from '../../hr/hooks/useEmployees';
import { useAuthStore } from '../../../store/authStore';

const DAYS_OF_WEEK = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
];

interface ScheduleInput {
    tempId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherId: string;
}

export function TimetablePage() {
    const { user } = useAuthStore();
    const isTeacher = user?.role === 'Teacher';
    const isStudent = user?.role === 'Student';
    const canEdit = !isTeacher && !isStudent; // SuperAdmin, SchoolAdmin

    const { classrooms } = useClassrooms();
    const { data: subjectsData } = useSubjects();
    const subjects = subjectsData || [];

    // Fetch all employees, then filter teachers locally (or ideally via query param)
    const { data: employeesData } = useEmployees({ pageSize: 100 });
    const teachers = employeesData?.items.filter(e => e.employeeType === 'Teacher' || e.employeeType === 'Vacataire') || [];

    const [selectedClassId, setSelectedClassId] = useState('');
    const { data: scheduleData, isLoading } = useClassSchedule(selectedClassId);
    const saveSchedule = useSetClassSchedule(selectedClassId);

    const [isEditMode, setIsEditMode] = useState(false);
    const [localBlocks, setLocalBlocks] = useState<ScheduleInput[]>([]);

    useEffect(() => {
        if (scheduleData) {
            setLocalBlocks(
                scheduleData.map(s => ({
                    tempId: s.id,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    subjectId: s.subjectId,
                    teacherId: s.teacherId
                }))
            );
        }
    }, [scheduleData, isEditMode]);

    const handleAddBlock = (dayValue: number) => {
        setLocalBlocks([...localBlocks, {
            tempId: Math.random().toString(36).substring(7),
            dayOfWeek: dayValue,
            startTime: '08:00',
            endTime: '10:00',
            subjectId: '',
            teacherId: ''
        }]);
    };

    const handleRemoveBlock = (tempId: string) => {
        setLocalBlocks(localBlocks.filter(b => b.tempId !== tempId));
    };

    const handleUpdateBlock = (tempId: string, field: keyof ScheduleInput, value: string | number) => {
        setLocalBlocks(prev => prev.map(b => b.tempId === tempId ? { ...b, [field]: value } : b));
    };

    const handleSave = async () => {
        if (!selectedClassId) return;

        // validate
        if (localBlocks.some(b => !b.subjectId || !b.teacherId)) {
            alert('Veuillez renseigner toutes les matières et les professeurs.');
            return;
        }

        try {
            await saveSchedule.mutateAsync({
                classroomId: selectedClassId,
                schedules: localBlocks
            });
            setIsEditMode(false);
            alert("Emploi du temps enregistré avec succès.");
        } catch (error: any) {
            alert("Erreur lors de l'enregistrement : " + (error.response?.data?.message || error.message));
        }
    };

    const getBlocksForDay = (dayValue: number) => {
        const blocks = [...(isEditMode ? localBlocks : (scheduleData || []))].filter(b => b.dayOfWeek === dayValue);
        // sort by start time
        return blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    const getSubjectName = (id: string) => subjects.find((s: any) => s.id === id)?.name || id;
    const getTeacherName = (id: string) => {
        const t = teachers.find((t: any) => t.id === id);
        return t ? `${t.firstName} ${t.lastName}` : id;
    };

    const handlePrintPDF = () => {
        if (!selectedClassId) return;
        const currentClass = classrooms?.find((c: any) => c.id === selectedClassId);

        const doc = new jsPDF('landscape');
        doc.setFontSize(22);
        doc.setTextColor(41, 128, 185);
        doc.text(`Emploi du temps - ${currentClass?.name || 'Classe'}`, 140, 20, { align: 'center' });

        const tableBody: string[][] = [];

        // Prepare rows (Days) and columns (Slots)
        // For simplicity, let's just create a list format or a wide table
        // Because of the variable time slots, a simple list-by-day table is easier
        DAYS_OF_WEEK.forEach(day => {
            const blocks = getBlocksForDay(day.value);
            if (blocks.length > 0) {
                blocks.forEach((b: any, index: number) => {
                    const subjectName = isEditMode ? getSubjectName(b.subjectId) : (b.subjectName || getSubjectName(b.subjectId));
                    const teacherName = isEditMode ? getTeacherName(b.teacherId) : (b.teacherName || getTeacherName(b.teacherId));
                    tableBody.push([
                        index === 0 ? day.label : '',
                        `${b.startTime} - ${b.endTime}`,
                        subjectName,
                        teacherName
                    ]);
                });
            } else {
                tableBody.push([day.label, '-', '-', '-']);
            }
        });

        autoTable(doc, {
            startY: 30,
            head: [['Jour', 'Horaire', 'Matière', 'Professeur']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 11, cellPadding: 5 }
        });

        doc.save(`Emploi_du_temps_${currentClass?.name?.replace(/\s+/g, '_') || 'Planning'}.pdf`);
    };

    return (
        <div className="page" style={{ maxWidth: '1200px' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Emplois du Temps</h1>
                    <p className="page-subtitle">Gestion des plannings de cours hebdomadaires</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px', padding: '15px 25px' }}>
                <div className="form-group" style={{ marginBottom: 0, maxWidth: '300px' }}>
                    <label>Sélectionner la classe</label>
                    <select value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setIsEditMode(false); }}>
                        <option value="">-- Choisir une classe --</option>
                        {classrooms?.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedClassId ? (
                <div className="card bg-surface">
                    <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                        <h2 className="text-xl font-bold flex" style={{ alignItems: 'center', gap: '8px' }}>
                            <Clock className="text-primary" /> Planning de la semaine
                        </h2>
                        <div className="flex" style={{ gap: '10px' }}>
                            <button className="btn-secondary" onClick={handlePrintPDF}>
                                <Download size={16} /> Imprimer PDF
                            </button>
                            {canEdit && (
                                <>
                                    {isEditMode ? (
                                        <>
                                            <button className="btn-ghost" onClick={() => setIsEditMode(false)}>Annuler</button>
                                            <button className="btn-primary" onClick={handleSave} disabled={saveSchedule.isPending}>
                                                <Save size={16} /> {saveSchedule.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                                            </button>
                                        </>
                                    ) : (
                                        <button className="btn-primary" onClick={() => setIsEditMode(true)}>
                                            Modifier le planning
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-state">Chargement du planning...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                            {DAYS_OF_WEEK.map(day => {
                                const dayBlocks = getBlocksForDay(day.value);

                                return (
                                    <div key={day.value} style={{ background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                        <div style={{ background: 'var(--primary-dim)', color: 'var(--primary)', padding: '10px 15px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {day.label}
                                            {isEditMode && (
                                                <button onClick={() => handleAddBlock(day.value)} className="btn-ghost" style={{ padding: '4px', height: 'auto', minHeight: 'auto' }}>
                                                    <Plus size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '100px' }}>
                                            {dayBlocks.length > 0 ? dayBlocks.map((block: any) => (
                                                <div key={block.id || block.tempId} style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', borderLeft: '4px solid var(--primary)', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                    {isEditMode ? (
                                                        <div className="flex" style={{ flexDirection: 'column', gap: '8px' }}>
                                                            <div className="flex" style={{ gap: '10px', justifyContent: 'space-between' }}>
                                                                <div className="flex" style={{ gap: '5px', alignItems: 'center' }}>
                                                                    <input type="time" value={block.startTime} onChange={e => handleUpdateBlock(block.tempId, 'startTime', e.target.value)} style={{ padding: '4px', fontSize: '12px' }} />
                                                                    <span>-</span>
                                                                    <input type="time" value={block.endTime} onChange={e => handleUpdateBlock(block.tempId, 'endTime', e.target.value)} style={{ padding: '4px', fontSize: '12px' }} />
                                                                </div>
                                                                <button onClick={() => handleRemoveBlock(block.tempId)} className="btn-ghost" style={{ color: 'var(--danger)', padding: 0 }}><Trash2 size={16} /></button>
                                                            </div>
                                                            <select value={block.subjectId} onChange={e => handleUpdateBlock(block.tempId, 'subjectId', e.target.value)} style={{ padding: '6px', fontSize: '13px' }} required>
                                                                <option value="">-- Matière --</option>
                                                                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                            </select>
                                                            <select value={block.teacherId} onChange={e => handleUpdateBlock(block.tempId, 'teacherId', e.target.value)} style={{ padding: '6px', fontSize: '13px' }} required>
                                                                <option value="">-- Professeur --</option>
                                                                {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="font-bold text-sm" style={{ color: 'var(--primary)', marginBottom: '4px' }}>
                                                                {block.startTime} - {block.endTime}
                                                            </div>
                                                            <div className="font-bold">{block.subjectName || getSubjectName(block.subjectId)}</div>
                                                            <div className="text-xs text-muted" style={{ marginTop: '4px' }}>
                                                                Prof. {block.teacherName || getTeacherName(block.teacherId)}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )) : (
                                                <div className="text-muted text-center text-sm flex" style={{ flexDirection: 'column', alignItems: 'center', opacity: 0.6, padding: '20px 0' }}>
                                                    <CalendarDays size={24} style={{ marginBottom: '5px' }} />
                                                    Aucun cours
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="empty-state" style={{ background: 'var(--surface)', borderRadius: '12px', padding: '60px' }}>
                    <CalendarDays size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
                    <h2>Emplois du Temps</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Veuillez sélectionner une classe pour afficher ou modifier l'emploi du temps.</p>
                </div>
            )}
        </div>
    );
}
