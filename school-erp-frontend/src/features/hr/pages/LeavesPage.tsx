import React, { useState } from 'react';
import { Calendar, Plus, Check, X, FileText, AlertCircle } from 'lucide-react';
import { useLeaves, useCreateLeaveRequest, useUpdateLeaveStatus } from '../hooks/useLeaves';
import { useEmployees } from '../hooks/useEmployees';

export function LeavesPage() {
    const { data: leaves, isLoading } = useLeaves();
    const { data: employeesData } = useEmployees({ pageSize: 100 });
    const employees = employeesData?.items || [];

    const createLeave = useCreateLeaveRequest();
    const updateStatus = useUpdateLeaveStatus();

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        leaveType: 0, // 0: Annual, 1: Sick, 2: Maternity, 3: Unpaid
        startDate: '',
        endDate: '',
        reason: ''
    });

    const pendingLeaves = leaves?.filter(l => l.status === 'Pending').length || 0;
    const approvedLeaves = leaves?.filter(l => l.status === 'Approved').length || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, leaveType: Number(formData.leaveType) };
            await createLeave.mutateAsync(payload);
            setShowModal(false);
            setFormData({ employeeId: '', leaveType: 0, startDate: '', endDate: '', reason: '' });
            alert("Demande de congé envoyée.");
        } catch (err: any) {
            alert("Erreur: " + (err.response?.data?.message || err.message));
        }
    };

    const handleAction = async (id: string, isApproved: boolean) => {
        let rejectionReason = undefined;
        if (!isApproved) {
            const reason = window.prompt("Motif du refus :");
            if (reason === null) return; // User cancelled
            rejectionReason = reason;
        } else {
            if (!window.confirm("Approuver cette demande de congé ?")) return;
        }

        try {
            await updateStatus.mutateAsync({ id, isApproved, rejectionReason });
        } catch (err) {
            alert("Erreur lors du traitement de la demande.");
        }
    };

    const getLeaveTypeName = (type: string | number) => {
        const str = type.toString();
        if (str === '0' || str === 'Annual') return 'Congé Annuel';
        if (str === '1' || str === 'Sick') return 'Maladie';
        if (str === '2' || str === 'Maternity') return 'Maternité / Paternité';
        if (str === '3' || str === 'Unpaid') return 'Sans Solde';
        return str;
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Congés & Absences</h1>
                    <p className="page-subtitle">Demandes et approbations de congés du personnel</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Nouvelle demande
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}><Calendar size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Total Demandes</p>
                        <p className="stat-value">{leaves?.length || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}><AlertCircle size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">En attente (Pending)</p>
                        <p className="stat-value text-warning">{pendingLeaves}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}><Check size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Approuvées</p>
                        <p className="stat-value text-success">{approvedLeaves}</p>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="card" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)' }}>
                    <div className="card-header">
                        <h2 className="card-title">Demander un congé</h2>
                        <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: '0 20px 20px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Employé concerné</label>
                                <select value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} required>
                                    <option value="">Sélectionner un employé...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeType})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Type de Congé</label>
                                <select value={formData.leaveType} onChange={e => setFormData({ ...formData, leaveType: Number(e.target.value) })} required>
                                    <option value={0}>Congé Annuel</option>
                                    <option value={1}>Maladie</option>
                                    <option value={2}>Maternité / Paternité</option>
                                    <option value={3}>Sans Solde</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Motif (Optionnel)</label>
                                <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Ex: Voyage familial..." />
                            </div>
                            <div className="form-group">
                                <label>Date de Début</label>
                                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Date de Fin</label>
                                <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={createLeave.isPending}>
                                <Check size={16} /> {createLeave.isPending ? 'Envoi...' : 'Soumettre à approbation'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">Chargement des congés...</div>
                    ) : leaves && leaves.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employé</th>
                                    <th>Type</th>
                                    <th>Période</th>
                                    <th style={{ textAlign: 'center' }}>Jours</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(leave => (
                                    <tr key={leave.id}>
                                        <td>
                                            <div className="font-bold">{leave.employeeName}</div>
                                            <div className="text-xs text-muted">{leave.department}</div>
                                        </td>
                                        <td>
                                            <div className="font-semibold">{getLeaveTypeName(leave.leaveType)}</div>
                                            {leave.reason && <div className="text-xs text-muted">"{leave.reason}"</div>}
                                        </td>
                                        <td>
                                            <div className="text-sm">Du {new Date(leave.startDate).toLocaleDateString()}</div>
                                            <div className="text-sm">Au {new Date(leave.endDate).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="badge-outline">{leave.totalDays}j</span>
                                        </td>
                                        <td>
                                            {leave.status === 'Pending' && <span className="badge-warning">En attente</span>}
                                            {leave.status === 'Approved' && <span className="badge-success">Approuvé</span>}
                                            {leave.status === 'Rejected' && <span className="badge-danger">Refusé</span>}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {leave.status === 'Pending' && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        className="btn-ghost text-success"
                                                        title="Approuver"
                                                        onClick={() => handleAction(leave.id, true)}
                                                        disabled={updateStatus.isPending}
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        className="btn-ghost text-danger"
                                                        title="Refuser"
                                                        onClick={() => handleAction(leave.id, false)}
                                                        disabled={updateStatus.isPending}
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <FileText size={48} style={{ opacity: 0.2 }} />
                            <h3>Aucune demande de congé</h3>
                            <p>Les employés n'ont soumis aucune absence.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
