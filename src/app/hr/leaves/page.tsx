'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plane, Plus, Check, X, Clock, 
  Search, Filter, Loader2, Calendar, 
  FileText, AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

const leaveTypes = [
  { value: 'ANNUAL', label: 'Congé Annuel' },
  { value: 'SICK', label: 'Maladie' },
  { value: 'PERSONAL', label: 'Motif Personnel' },
  { value: 'MATERNITY', label: 'Maternité' },
];

export default function LeavesPage() {
    const router = useRouter();
    const toast = useToast();
    
    const [leaves, setLeaves] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        employeeId: '',
        type: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const fetchLeaves = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/hr/leaves');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setLeaves(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Erreur lors du chargement des congés');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            if (Array.isArray(data)) setEmployees(data);
        } catch {}
    }, []);

    useEffect(() => {
        fetchLeaves();
        fetchEmployees();
    }, [fetchLeaves, fetchEmployees]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/hr/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error();
            toast.success('Demande de congé enregistrée');
            setShowModal(false);
            setFormData({ employeeId: '', type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
            fetchLeaves();
        } catch {
            toast.error('Erreur lors de la création');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch('/api/hr/leaves', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (!res.ok) throw new Error();
            toast.success(status === 'APPROVED' ? 'Congé approuvé' : 'Congé refusé');
            fetchLeaves();
        } catch {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const stats = {
        pending: leaves.filter(l => l.status === 'PENDING').length,
        approved: leaves.filter(l => l.status === 'APPROVED').length,
    };

    return (
        <AppLayout
            title="Gestion des Congés"
            subtitle="Planification et dashboard des absences du personnel"
            breadcrumbs={[{ label: 'RH', href: '/employees' }, { label: 'Congés' }]}
            actions={
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Nouvelle Demande
                </button>
            }
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--warning-dim)', display: 'grid', placeItems: 'center' }}>
                        <Clock size={24} color="var(--warning)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>En attente</div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats.pending}</div>
                    </div>
                </div>
                <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--success-dim)', display: 'grid', placeItems: 'center' }}>
                        <Check size={24} color="var(--success)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Approuvés ce mois</div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{stats.approved}</div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm" style={{ padding: 0 }}>
                <div className="table-container">
                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
                            <p>Chargement des demandes...</p>
                        </div>
                    ) : leaves.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employé</th>
                                    <th>Type</th>
                                    <th>Période</th>
                                    <th>Raison / Note</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map(l => (
                                    <tr key={l.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-3)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 600 }}>
                                                    {l.employee?.firstName[0]}{l.employee?.lastName[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{l.employee?.firstName} {l.employee?.lastName}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.employee?.employeeNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-info">{l.type}</span></td>
                                        <td>
                                            <div style={{ fontSize: '13px' }}>
                                                <div>Du {new Date(l.startDate).toLocaleDateString()}</div>
                                                <div style={{ color: 'var(--text-muted)' }}>Au {new Date(l.endDate).toLocaleDateString()}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.reason}>
                                                {l.reason || '-'}
                                            </div>
                                        </td>
                                        <td>
                                            {l.status === 'PENDING' && <span className="badge badge-warning">En attente</span>}
                                            {l.status === 'APPROVED' && <span className="badge badge-success">Approuvé</span>}
                                            {l.status === 'REJECTED' && <span className="badge badge-danger">Refusé</span>}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {l.status === 'PENDING' && (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button className="btn-icon text-success" title="Approuver" onClick={() => updateStatus(l.id, 'APPROVED')}>
                                                        <Check size={18} />
                                                    </button>
                                                    <button className="btn-icon text-danger" title="Refuser" onClick={() => updateStatus(l.id, 'REJECTED')}>
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
                        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Plane size={48} style={{ opacity: 0.1, margin: '0 auto 20px' }} />
                            <h3>Aucune demande de congé</h3>
                            <p>Toutes les demandes de congés apparaîtront ici.</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontWeight: 700 }}>Nouvelle Demande</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Employé *</label>
                                <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="form-input">
                                    <option value="">-- Sélectionner l'employé --</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Type de Congé *</label>
                                <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="form-input">
                                    {leaveTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Date de début *</label>
                                    <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label>Date de fin *</label>
                                    <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="form-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Motif / Raison</label>
                                <textarea rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="form-input" placeholder="Détails optionnels..." />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 size={16} className="spin" /> Envoi...</> : 'Soumettre la demande'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
