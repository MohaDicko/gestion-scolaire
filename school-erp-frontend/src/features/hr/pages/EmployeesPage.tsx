import React, { useState } from 'react';
import { Briefcase, Plus, Search, Mail, Phone, UserCheck, UserMinus, X, Check } from 'lucide-react';
import { useEmployees, useCreateEmployee, useActivateEmployee, useDeactivateEmployee } from '../hooks/useEmployees';
import { exportToExcel } from '../../../lib/excelExport';
import { Download } from 'lucide-react';

export function EmployeesPage() {
    const [search, setSearch] = useState('');
    const { data: result, isLoading, error } = useEmployees({ search });

    const createEmployee = useCreateEmployee();
    const activateEmployee = useActivateEmployee();
    const deactivateEmployee = useDeactivateEmployee();

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phoneNumber: '', employeeType: 'Teacher'
    });

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        if (!window.confirm(`Voulez-vous vraiment ${currentStatus ? 'désactiver' : 'activer'} cet employé ?`)) return;
        try {
            if (currentStatus) await deactivateEmployee.mutateAsync(id);
            else await activateEmployee.mutateAsync(id);
        } catch (err) {
            alert("Erreur lors de la modification du statut.");
        }
    };

    const handleExportExcel = () => {
        if (!result?.items) return;
        const data = result.items.map(emp => ({
            'Matricule': emp.employeeNumber,
            'Prénom': emp.firstName,
            'Nom': emp.lastName,
            'Email': emp.email,
            'Téléphone': emp.phoneNumber,
            'Poste': emp.employeeType,
            'Statut': emp.isActive ? 'Actif' : 'Inactif'
        }));
        exportToExcel(data, 'Liste_Personnel_Scolaire', 'Employees');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createEmployee.mutateAsync(formData);
            setShowModal(false);
            setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', employeeType: 'Teacher' });
        } catch (err: any) {
            alert("Erreur: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employés</h1>
                    <p className="page-subtitle">Gestion des ressources humaines et du personnel</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-ghost" onClick={handleExportExcel} style={{ border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                        <Download size={16} /> Exporter Excel
                    </button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Nouvel employé
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="card" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)' }}>
                    <div className="card-header">
                        <h2 className="card-title">Ajouter un Employé</h2>
                        <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: '0 20px 20px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label>Prénom</label>
                                <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Nom</label>
                                <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Adresse Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Téléphone</label>
                                <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Type / Poste</label>
                                <select value={formData.employeeType} onChange={e => setFormData({ ...formData, employeeType: e.target.value })} required>
                                    <option value="Teacher">Enseignant</option>
                                    <option value="Administrative">Administration</option>
                                    <option value="Accountant">Comptable / Finance</option>
                                    <option value="HR_Manager">RH</option>
                                    <option value="Support">Support technique / Entretien</option>
                                    <option value="Director">Directeur</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={createEmployee.isPending}>
                                <Check size={16} /> {createEmployee.isPending ? 'Enregistrement...' : 'Enregistrer cet employé'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="table-toolbar">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou matricule..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="loading-state" style={{ padding: '60px' }}>Chargement des employés...</div>
                ) : error ? (
                    <div className="error-state" style={{ padding: '60px' }}>Une erreur est survenue lors du chargement des données.</div>
                ) : result?.items.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px', textAlign: 'center', opacity: 0.6 }}>
                        <Briefcase size={48} style={{ margin: '0 auto 15px' }} />
                        <h3>Aucun employé trouvé</h3>
                        <p>Essayez de modifier vos critères de recherche.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table data-table">
                            <thead>
                                <tr>
                                    <th>Employé</th>
                                    <th>Contact</th>
                                    <th>Département</th>
                                    <th>Poste / Type</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result?.items.map((emp) => (
                                    <tr key={emp.id} style={{ opacity: emp.isActive ? 1 : 0.6 }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', background: 'var(--primary-dim)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {emp.firstName[0]}{emp.lastName[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600' }}>{emp.firstName} {emp.lastName}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{emp.employeeNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {emp.email}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}><Phone size={12} /> {emp.phoneNumber}</div>
                                            </div>
                                        </td>
                                        <td><span style={{ fontSize: '12px', padding: '4px 10px', border: '1px solid var(--border)', borderRadius: '12px' }}>{emp.departmentName || 'Général'}</span></td>
                                        <td>
                                            <div style={{ fontSize: '13px' }}>{emp.employeeType}</div>
                                        </td>
                                        <td>
                                            {emp.isActive ? (
                                                <span style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <UserCheck size={12} /> Actif
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <UserMinus size={12} /> Inactif
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button
                                                    className="btn-ghost"
                                                    title={emp.isActive ? "Désactiver" : "Activer"}
                                                    onClick={() => handleToggleStatus(emp.id, emp.isActive)}
                                                    style={{ padding: '6px', color: emp.isActive ? 'var(--danger)' : 'var(--success)' }}
                                                    disabled={activateEmployee.isPending || deactivateEmployee.isPending}
                                                >
                                                    {emp.isActive ? <UserMinus size={16} /> : <UserCheck size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
