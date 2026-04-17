import { useState, useEffect } from 'react';
import { Save, Calendar, UserCheck, UserX, Clock, AlertCircle } from 'lucide-react';
import { useStaffAttendance, StaffAttendanceStatus, StaffAttendance } from '../hooks/useAttendance';
import { toast } from '../../../store/toastStore';

export function StaffAttendancePage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const { attendance, isLoading, recordAttendance } = useStaffAttendance(selectedDate);
    const [localAttendance, setLocalAttendance] = useState<StaffAttendance[]>([]);

    useEffect(() => {
        if (attendance) {
            setLocalAttendance([...attendance]);
        }
    }, [attendance]);

    const handleStatusChange = (employeeId: string, status: StaffAttendanceStatus) => {
        setLocalAttendance(prev => prev.map(a => a.employeeId === employeeId ? { ...a, status } : a));
    };

    const handleRemarkChange = (employeeId: string, remarks: string) => {
        setLocalAttendance(prev => prev.map(a => a.employeeId === employeeId ? { ...a, remarks } : a));
    };

    const handleSave = async () => {
        try {
            await recordAttendance.mutateAsync({
                date: selectedDate,
                entries: localAttendance
            });
            toast.success('Présences enregistrées avec succès !');
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement des présences.");
        }
    };

    const getStatusLabel = (status: StaffAttendanceStatus) => {
        switch (status) {
            case StaffAttendanceStatus.Present: return 'Présent';
            case StaffAttendanceStatus.Absent: return 'Absent';
            case StaffAttendanceStatus.Late: return 'Retard';
            case StaffAttendanceStatus.OnLeave: return 'En Congé';
            case StaffAttendanceStatus.Excused: return 'Excusé';
            default: return 'Inconnu';
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Présences du Personnel</h1>
                    <p className="page-subtitle">Suivi quotidien de l'assiduité du staff</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="filter-group" style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <Calendar size={16} style={{ color: 'var(--primary)', marginRight: '8px' }} />
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={e => setSelectedDate(e.target.value)} 
                            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', fontWeight: '500' }}
                        />
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={handleSave} 
                        disabled={recordAttendance.isPending || isLoading}
                        style={{ background: 'var(--success)' }}
                    >
                        <Save size={16} /> {recordAttendance.isPending ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                {isLoading ? (
                    <div className="loading-state" style={{ padding: '60px' }}>Chargement de la liste...</div>
                ) : localAttendance.length > 0 ? (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employé</th>
                                    <th>Statut</th>
                                    <th>Heures (Optionnel)</th>
                                    <th>Remarques / Justificatif</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localAttendance.map(item => (
                                    <tr key={item.employeeId}>
                                        <td className="font-bold">{item.employeeName}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button 
                                                    className={`btn-status ${item.status === StaffAttendanceStatus.Present ? 'active-success' : ''}`}
                                                    onClick={() => handleStatusChange(item.employeeId, StaffAttendanceStatus.Present)}
                                                    title="Présent"
                                                >
                                                    <UserCheck size={16} />
                                                </button>
                                                <button 
                                                    className={`btn-status ${item.status === StaffAttendanceStatus.Absent ? 'active-danger' : ''}`}
                                                    onClick={() => handleStatusChange(item.employeeId, StaffAttendanceStatus.Absent)}
                                                    title="Absent"
                                                >
                                                    <UserX size={16} />
                                                </button>
                                                <button 
                                                    className={`btn-status ${item.status === StaffAttendanceStatus.Late ? 'active-warning' : ''}`}
                                                    onClick={() => handleStatusChange(item.employeeId, StaffAttendanceStatus.Late)}
                                                    title="Retard"
                                                >
                                                    <Clock size={16} />
                                                </button>
                                                <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.6, alignSelf: 'center' }}>
                                                    {getStatusLabel(item.status)}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <input type="time" className="input-small" title="Arrivée" />
                                                <input type="time" className="input-small" title="Départ" />
                                            </div>
                                        </td>
                                        <td>
                                            <input 
                                                type="text" 
                                                className="table-input"
                                                placeholder="Ex: Justifié par certificat..." 
                                                value={item.remarks}
                                                onChange={e => handleRemarkChange(item.employeeId, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: '60px' }}>
                        <AlertCircle size={48} style={{ opacity: 0.2 }} />
                        <h3>Aucun employé actif</h3>
                        <p>Veuillez d'abord ajouter des membres du personnel.</p>
                    </div>
                )}
            </div>

            <style>{`
                .btn-status {
                    padding: 6px;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: var(--surface);
                    color: var(--text-dim);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-status:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                }
                .btn-status.active-success {
                    background: var(--success);
                    color: white;
                    border-color: var(--success);
                }
                .active-danger {
                    background: var(--danger) !important;
                    color: white !important;
                    border-color: var(--danger) !important;
                }
                .active-warning {
                    background: var(--warning) !important;
                    color: white !important;
                    border-color: var(--warning) !important;
                }
                .input-small {
                    padding: 4px;
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    font-size: 12px;
                }
                .table-input {
                    width: 100%;
                    padding: 6px;
                    border: 1px solid transparent;
                    background: transparent;
                    border-radius: 4px;
                }
                .table-input:focus {
                    border-color: var(--primary-light);
                    background: var(--surface);
                }
            `}</style>
        </div>
    );
}
