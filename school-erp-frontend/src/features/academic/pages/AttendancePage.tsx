import { useState, useEffect } from 'react';
import { Calendar, UserCheck, Check, AlertCircle, Save } from 'lucide-react';
import { useClassrooms } from '../hooks/useClassrooms';
import { useClassAttendance, useRecordAttendance, AttendanceDto } from '../hooks/useAttendance';
import { toast } from '../../../store/toastStore';

export function AttendancePage() {
    const { classrooms } = useClassrooms();

    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: attendanceData, isLoading, isFetching } = useClassAttendance(selectedClassId, selectedDate);
    const recordAttendance = useRecordAttendance(selectedClassId);

    // Local state to track modifications before saving
    const [localAttendance, setLocalAttendance] = useState<AttendanceDto[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (attendanceData) {
            setLocalAttendance([...attendanceData]);
            setHasChanges(false);
        }
    }, [attendanceData]);

    const handleStatusChange = (studentId: string, newStatus: number) => {
        setLocalAttendance(prev =>
            prev.map(a => a.studentId === studentId ? { ...a, status: newStatus } : a)
        );
        setHasChanges(true);
    };

    const handleRemarksChange = (studentId: string, newRemarks: string) => {
        setLocalAttendance(prev =>
            prev.map(a => a.studentId === studentId ? { ...a, remarks: newRemarks } : a)
        );
        setHasChanges(true);
    };

    const markAllPresent = () => {
        setLocalAttendance(prev => prev.map(a => ({ ...a, status: 0 })));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!selectedClassId) return;

        try {
            const payload = {
                classroomId: selectedClassId,
                date: selectedDate,
                attendances: localAttendance.map(a => ({
                    studentId: a.studentId,
                    status: a.status,
                    remarks: a.remarks
                }))
            };
            await recordAttendance.mutateAsync(payload);
            setHasChanges(false);
            toast.success('Appel enregistré avec succès !');
        } catch (error: any) {
            toast.error("Erreur lors de l'enregistrement de l'appel : " + (error.response?.data?.message || error.message));
        }
    };

    const getStatusStyle = (status: number) => {
        switch (status) {
            case 0: return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }; // Present
            case 1: return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }; // Absent
            case 2: return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }; // Late
            case 3: return { bg: 'var(--primary-dim)', color: 'var(--primary)' }; // Excused
            default: return { bg: 'transparent', color: 'inherit' };
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestion des Présences</h1>
                    <p className="page-subtitle">Cahier d'appel électronique (Pointage quotidien)</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px', padding: '15px 25px' }}>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Sélectionner la classe</label>
                        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                            <option value="">-- Choisir une classe --</option>
                            {classrooms?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Date de l'appel</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {selectedClassId ? (
                <div className="card" style={{ padding: '0' }}>
                    <div className="table-toolbar" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <button className="btn-ghost" onClick={markAllPresent} disabled={!localAttendance.length}>
                                <Check size={16} className="text-success" /> Marquer tous présents
                            </button>
                        </div>
                        <button
                            className={hasChanges ? "btn-primary" : "btn-secondary"}
                            onClick={handleSave}
                            disabled={!hasChanges || recordAttendance.isPending}
                        >
                            <Save size={16} /> {recordAttendance.isPending ? 'Enregistrement...' : 'Enregistrer l\'appel'}
                        </button>
                    </div>

                    <div className="table-container">
                        {isLoading || isFetching ? (
                            <div className="loading-state">Chargement de la feuille d'appel...</div>
                        ) : localAttendance.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '80px' }}>Matricule</th>
                                        <th>Élève</th>
                                        <th style={{ width: '400px', textAlign: 'center' }}>Statut de présence</th>
                                        <th>Remarques / Motif</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {localAttendance.map(student => (
                                        <tr key={student.studentId}>
                                            <td className="font-mono text-sm text-dim">{student.rollNumber}</td>
                                            <td className="font-bold">{student.studentName}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                    {[
                                                        { val: 0, label: 'Présent' },
                                                        { val: 1, label: 'Absent' },
                                                        { val: 2, label: 'En retard' },
                                                        { val: 3, label: 'Excusé' }
                                                    ].map(opt => (
                                                        <button
                                                            key={opt.val}
                                                            onClick={() => handleStatusChange(student.studentId, opt.val)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: '20px',
                                                                border: '1px solid',
                                                                borderColor: student.status === opt.val ? getStatusStyle(opt.val).color : 'var(--border)',
                                                                background: student.status === opt.val ? getStatusStyle(opt.val).bg : 'transparent',
                                                                color: student.status === opt.val ? getStatusStyle(opt.val).color : 'var(--text-dim)',
                                                                fontSize: '12px',
                                                                fontWeight: student.status === opt.val ? 'bold' : 'normal',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    placeholder="Motif (si absent/retard)..."
                                                    value={student.remarks}
                                                    onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                                                    style={{ width: '100%', padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px' }}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state" style={{ padding: '40px' }}>
                                <UserCheck size={48} style={{ opacity: 0.2 }} />
                                <h3>Aucun élève inscrit</h3>
                                <p>Cette classe ne compte actuellement aucun élève actif.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="empty-state" style={{ background: 'var(--surface)', borderRadius: '12px', padding: '60px' }}>
                    <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
                    <h2>Cahier d'appel</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Veuillez sélectionner une classe pour afficher la liste d'appel.</p>
                </div>
            )}
        </div>
    );
}
