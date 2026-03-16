import React, { useState } from 'react';
import { Plus, Users, Layout, X, Info, Trash2 } from 'lucide-react';
import { useClassrooms, useAcademicYears } from '../hooks/useClassrooms';

export function ClassroomsPage() {
    const { classrooms, isLoading, error, createClassroom, deleteClassroom } = useClassrooms();
    const { data: years } = useAcademicYears();

    const [showForm, setShowForm] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [level, setLevel] = useState('');
    const [capacity, setCapacity] = useState(30);
    const [yearId, setYearId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !level || !yearId) return;

        try {
            await createClassroom.mutateAsync({
                name,
                level,
                maxCapacity: capacity,
                academicYearId: yearId
            });
            setShowForm(false);
            setName('');
            setLevel('');
            setYearId('');
        } catch (err) {
            alert("Erreur lors de la création de la classe.");
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la classe "${name}" ?`)) return;

        try {
            await deleteClassroom.mutateAsync(id);
        } catch (err: any) {
            alert(err.response?.data?.Message || "Erreur lors de la suppression. Vérifiez si la classe est liée à des élèves.");
        }
    };

    const selectedClassroom = classrooms.find(c => c.id === selectedId);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Classes</h1>
                    <p className="page-subtitle">Gestion des salles de classe et des effectifs</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setShowForm(true);
                        if (years?.length && !yearId) setYearId(years.find(y => y.isCurrent)?.id || years[0].id);
                    }}
                >
                    <Plus size={16} /> Nouvelle classe
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '24px', border: '1px solid var(--primary-light)' }}>
                    <div className="card-header">
                        <h2 className="card-title">Ajouter une nouvelle classe</h2>
                        <button className="btn-ghost" onClick={() => setShowForm(false)} title="Fermer"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '20px' }}>
                        <div className="form-group">
                            <label>Nom de la classe (ex: 6ème A)</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: 6ème A" />
                        </div>
                        <div className="form-group">
                            <label>Niveau (ex: 6ème)</label>
                            <input type="text" value={level} onChange={e => setLevel(e.target.value)} required placeholder="Ex: 6ème" />
                        </div>
                        <div className="form-group">
                            <label>Capacité Max</label>
                            <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} required min="1" />
                        </div>
                        <div className="form-group">
                            <label>Année Académique</label>
                            <select value={yearId} onChange={e => setYearId(e.target.value)} required>
                                <option value="">Choisir...</option>
                                {years?.map(y => (
                                    <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(Actuelle)' : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={createClassroom.isPending}>
                                {createClassroom.isPending ? 'Création...' : 'Confirmer la création'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Details Modal Placeholder/Simpler view */}
            {selectedId && selectedClassroom && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
                        <div className="card-header">
                            <h2 className="card-title">Détails de la Classe</h2>
                            <button className="btn-ghost" onClick={() => setSelectedId(null)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                <div className="flex justify-between"><strong>Nom:</strong> <span>{selectedClassroom.name}</span></div>
                                <div className="flex justify-between"><strong>Niveau:</strong> <span>{selectedClassroom.level}</span></div>
                                <div className="flex justify-between"><strong>Année:</strong> <span>{selectedClassroom.academicYearName}</span></div>
                                <div className="flex justify-between"><strong>Capacité:</strong> <span>{selectedClassroom.maxCapacity} places</span></div>
                                <div className="flex justify-between"><strong>Inscrits:</strong> <span>{selectedClassroom.studentCount} élèves</span></div>
                            </div>
                            <button className="btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setSelectedId(null)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                {isLoading ? (
                    <div className="loading-state" style={{ padding: '40px' }}>Chargement des classes...</div>
                ) : error ? (
                    <div className="error-state" style={{ padding: '40px' }}>Une erreur est survenue lors du chargement des classes.</div>
                ) : classrooms.length > 0 ? (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Classe</th>
                                    <th>Niveau</th>
                                    <th>Année</th>
                                    <th>Effectif</th>
                                    <th>Capacité</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classrooms.map(cls => (
                                    <tr key={cls.id}>
                                        <td className="font-bold">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                                                    <Layout size={18} />
                                                </div>
                                                {cls.name}
                                            </div>
                                        </td>
                                        <td>{cls.level}</td>
                                        <td><span className="badge-outline">{cls.academicYearName}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Users size={14} /> {cls.studentCount}
                                            </div>
                                        </td>
                                        <td>{cls.maxCapacity}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn-ghost" onClick={() => setSelectedId(cls.id)} title="Détails" style={{ display: 'inline-flex', padding: '6px' }}><Info size={16} /></button>
                                            <button className="btn-ghost" onClick={() => handleDelete(cls.id, cls.name)} title="Supprimer" style={{ color: 'var(--danger)', display: 'inline-flex', padding: '6px' }}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: '60px', textAlign: 'center' }}>
                        <Layout size={48} style={{ opacity: 0.2, margin: '0 auto 15px' }} />
                        <h3>Aucune classe configurée</h3>
                        <p>Commencez par ajouter votre première salle de classe pour l'année en cours.</p>
                        {!showForm && <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowForm(true)}>Ajouter une classe</button>}
                    </div>
                )}
            </div>
        </div>
    );
}
