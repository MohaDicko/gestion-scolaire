import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Calendar, X, Check } from 'lucide-react';
import { useContracts, useCreateContract, Contract } from '../hooks/useContracts';
import { useEmployees } from '../hooks/useEmployees';

export function ContractsPage() {
    const { data: contracts, isLoading } = useContracts();
    const createContract = useCreateContract();

    // Fetch employees for dropdown - assume small enough for no pagination or using first page
    const { data: employeesData } = useEmployees({ pageSize: 100 });
    const employees = employeesData?.items || [];

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: '',
        contractType: 0, // 0: CDI, 1: CDD, 2: Temporary, 3: Intern
        startDate: '',
        endDate: '',
        baseSalary: 0
    });

    const activeContracts = contracts?.filter(c => c.status === 'Active') || [];
    const expiringSoon = activeContracts.filter(c => {
        if (!c.endDate) return false;
        const end = new Date(c.endDate);
        const today = new Date();
        const diffTime = Math.abs(end.getTime() - today.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && end > today;
    }).length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                contractType: Number(formData.contractType),
                baseSalary: Number(formData.baseSalary),
                endDate: formData.contractType == 0 ? null : formData.endDate || null
            };
            await createContract.mutateAsync(payload);
            setShowModal(false);
            setFormData({ employeeId: '', contractType: 0, startDate: '', endDate: '', baseSalary: 0 });
            alert("Contrat ajouté avec succès.");
        } catch (err: any) {
            alert("Erreur: " + (err.response?.data?.message || err.message));
        }
    };

    const getContractTypeName = (type: string | number) => {
        const strType = type.toString();
        if (strType === '0' || strType === 'CDI') return 'CDI';
        if (strType === '1' || strType === 'CDD') return 'CDD';
        if (strType === '2' || strType === 'Temporary') return 'Intérim';
        if (strType === '3' || strType === 'Intern') return 'Stage';
        return strType;
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestion des Contrats</h1>
                    <p className="page-subtitle">Suivi des statuts contractuels des employés</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Éditer un contrat
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}><FileText size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Total Contrats</p>
                        <p className="stat-value">{contracts?.length || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}><FileText size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Actifs (CDI/CDD)</p>
                        <p className="stat-value text-success">{activeContracts.length}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}><Calendar size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Expirant bientôt (&le; 30j)</p>
                        <p className="stat-value text-warning">{expiringSoon}</p>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="card" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)' }}>
                    <div className="card-header">
                        <h2 className="card-title">Établir un Contrat</h2>
                        <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: '0 20px 20px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label>Employé</label>
                                <select value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} required>
                                    <option value="">Sélectionner un employé...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeType})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Type de Contrat</label>
                                <select value={formData.contractType} onChange={e => setFormData({ ...formData, contractType: Number(e.target.value) })} required>
                                    <option value={0}>CDI (Indéterminé)</option>
                                    <option value={1}>CDD (Déterminé)</option>
                                    <option value={2}>Intérim (Temporaire)</option>
                                    <option value={3}>Stage (Interné)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Salaire de base brut</label>
                                <input type="number" min="0" value={formData.baseSalary} onChange={e => setFormData({ ...formData, baseSalary: Number(e.target.value) })} required />
                            </div>
                            <div className="form-group">
                                <label>Date de Début</label>
                                <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Date de Fin (Requis sauf CDI)</label>
                                <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} required={formData.contractType !== 0} disabled={formData.contractType === 0} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={createContract.isPending}>
                                <Check size={16} /> {createContract.isPending ? 'Enregistrement...' : 'Enregistrer le contrat'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                <div className="table-toolbar" style={{ padding: '20px' }}>
                    <div className="search-box">
                        <Search size={16} />
                        <input type="text" placeholder="Rechercher par employé..." />
                    </div>
                    <button className="btn-ghost"><Filter size={16} /> Type de contrat</button>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">Chargement des contrats...</div>
                    ) : contracts && contracts.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employé</th>
                                    <th>Type de Contrat</th>
                                    <th>Poste</th>
                                    <th>Date de Début</th>
                                    <th>Date de Fin</th>
                                    <th>Salaire Brut</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contracts.map(contract => (
                                    <tr key={contract.id}>
                                        <td className="font-bold">{contract.employeeName}</td>
                                        <td>{getContractTypeName(contract.contractType)}</td>
                                        <td>{contract.position}</td>
                                        <td>{new Date(contract.startDate).toLocaleDateString()}</td>
                                        <td>{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : <span className="text-muted">—</span>}</td>
                                        <td className="font-mono">{contract.baseSalary.toLocaleString()} F</td>
                                        <td>
                                            <span className={`badge-${contract.status === 'Active' ? 'success' : 'danger'}`}>
                                                {contract.status === 'Active' ? 'Actif' : 'Terminé'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="coming-soon">
                            <FileText size={48} />
                            <h3>Aucun contrat actif</h3>
                            <p>Ajoutez un employé puis établissez son contrat de travail.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
