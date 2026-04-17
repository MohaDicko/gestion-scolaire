import React, { useState } from 'react';
import { Plus, Search, UserCheck, UserMinus, X, Check, Home, Download } from 'lucide-react';
import { useEmployees, useCreateEmployee, useActivateEmployee, useDeactivateEmployee } from '../hooks/useEmployees';
import { useCampuses } from '../../academic/hooks/useClassrooms';
import { exportToExcel } from '../../../lib/excelExport';
import { toast } from '../../../store/toastStore';
import { dialog } from '../../../store/confirmStore';

export function EmployeesPage() {
    const [search, setSearch] = useState('');
    const { data: result, isLoading, error } = useEmployees({ search });
    const { data: campuses } = useCampuses();

    const createEmployee = useCreateEmployee();
    const activateEmployee = useActivateEmployee();
    const deactivateEmployee = useDeactivateEmployee();

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        email: '', 
        phoneNumber: '', 
        employeeType: 'Teacher',
        campusId: '',
        dateOfBirth: '1990-01-01',
        hireDate: new Date().toISOString().split('T')[0]
    });

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const ok = await dialog.confirm({
            title: currentStatus ? 'Désactiver cet employé' : 'Activer cet employé',
            message: currentStatus
                ? 'Cet employé ne pourra plus se connecter ni recevoir de paie. Continuer ?'
                : 'L’employé retrouvera l’accès complet au système. Continuer ?',
            variant: currentStatus ? 'danger' : 'info',
            confirmLabel: currentStatus ? 'Désactiver' : 'Activer',
        });
        if (!ok) return;
        try {
            if (currentStatus) await deactivateEmployee.mutateAsync(id);
            else await activateEmployee.mutateAsync(id);
            toast.success(`Employé ${currentStatus ? 'désactivé' : 'activé'} avec succès.`);
        } catch (err) {
            toast.error('Erreur lors de la modification du statut.');
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
            'Site/Campus': emp.campusName,
            'Poste': emp.employeeType,
            'Statut': emp.isActive ? 'Actif' : 'Inactif'
        }));
        exportToExcel(data, 'Liste_Personnel_Scolaire', 'Employees');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.campusId) {
            toast.warning("L'affectation à un Campus/Site est obligatoire.");
            return;
        }
        try {
            await createEmployee.mutateAsync({
                ...formData,
                gender: 'Male' // Default or add to UI
            });
            setShowModal(false);
            setFormData({ 
                firstName: '', 
                lastName: '', 
                email: '', 
                phoneNumber: '', 
                employeeType: 'Teacher', 
                campusId: '',
                dateOfBirth: '1990-01-01',
                hireDate: new Date().toISOString().split('T')[0]
            });
            toast.success('Employé ajouté avec succès !');
        } catch (err: any) {
            toast.error('Erreur: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestion du Personnel</h1>
                    <p className="page-subtitle">Ressources Humaines & Affectations multi-site</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-ghost" onClick={handleExportExcel} style={{ border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                        <Download size={16} /> Exporter la liste
                    </button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> Ajouter un membre
                    </button>
                </div>
            </div>

            {showModal && (
                <div className="card shadow-lg animate-up" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)' }}>
                    <div className="card-header" style={{ padding: '20px' }}>
                        <h2 className="card-title">Enregistrement d'un nouvel employé</h2>
                        <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label>Prénom</label>
                                <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Nom</label>
                                <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Adresse Email Professionnelle</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Téléphone</label>
                                <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Campus / Site d'affectation</label>
                                <select 
                                    value={formData.campusId} 
                                    onChange={e => setFormData({ ...formData, campusId: e.target.value })} 
                                    required
                                    style={{ border: '2px solid var(--primary-dim)' }}
                                >
                                    <option value="">-- Sélectionner un site --</option>
                                    {campuses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Type / Poste</label>
                                <select value={formData.employeeType} onChange={e => setFormData({ ...formData, employeeType: e.target.value })} required>
                                    <option value="Teacher">Enseignant</option>
                                    <option value="Administrative">Administration</option>
                                    <option value="Accountant">Comptable / Finance</option>
                                    <option value="HR_Manager">RH</option>
                                    <option value="Director">Direction</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '35px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={createEmployee.isPending}>
                                <Check size={16} /> {createEmployee.isPending ? 'Enregistrement...' : 'Enregistrer et affecter'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card shadow-sm" style={{ padding: '0' }}>
                <div className="table-toolbar" style={{ padding: '20px' }}>
                    <div className="search-box" style={{ maxWidth: '450px' }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, email ou matricule..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state" style={{ padding: '80px' }}>Synchronisation du personnel...</div>
                    ) : error ? (
                        <div className="error-state" style={{ padding: '80px' }}>Une erreur est survenue. Veuillez rafraîchir.</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employé</th>
                                    <th>Contact</th>
                                    <th>Campus / Site</th>
                                    <th>Poste</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result?.items.map((emp) => (
                                    <tr key={emp.id} style={{ opacity: emp.isActive ? 1 : 0.65 }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ 
                                                    width: '40px', height: '40px', 
                                                    background: 'var(--primary-light)', 
                                                    color: 'var(--primary)', 
                                                    borderRadius: '12px', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                    fontWeight: '800', fontSize: '14px'
                                                }}>
                                                    {emp.firstName[0]}{emp.lastName[0]}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{emp.firstName} {emp.lastName}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{emp.employeeNumber}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13px' }}>{emp.email}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.phoneNumber}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                <Home size={14} className="text-primary" />
                                                <span style={{ fontWeight: 600 }}>{emp.campusName || 'Non affecté'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge-blue" style={{ fontSize: '11px', fontWeight: 600 }}>{emp.employeeType}</span>
                                        </td>
                                        <td>
                                            {emp.isActive ? (
                                                <span className="badge-success" style={{ fontSize: '10px' }}>ACTIF</span>
                                            ) : (
                                                <span className="badge-danger" style={{ fontSize: '10px' }}>INACTIF</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    className="btn-ghost"
                                                    onClick={() => handleToggleStatus(emp.id, emp.isActive)}
                                                    style={{ color: emp.isActive ? 'var(--danger)' : 'var(--success)' }}
                                                    disabled={activateEmployee.isPending || deactivateEmployee.isPending}
                                                >
                                                    {emp.isActive ? <UserMinus size={18} /> : <UserCheck size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) }
                </div>
            </div>
        </div>
    );
}
