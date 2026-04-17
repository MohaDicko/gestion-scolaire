import React, { useState } from 'react';
import { Plus, Layout, X, Info, Trash2, Home, Layers } from 'lucide-react';
import { useClassrooms, useAcademicYears, useSections, useCampuses } from '../hooks/useClassrooms';
import { toast } from '../../../store/toastStore';
import { dialog } from '../../../store/confirmStore';

export function ClassroomsPage() {
    const { classrooms, isLoading, createClassroom, deleteClassroom } = useClassrooms();
    const { data: years } = useAcademicYears();
    const { data: sections } = useSections();
    const { data: campuses } = useCampuses();

    const [showForm, setShowForm] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    
    const [name, setName] = useState('');
    const [level, setLevel] = useState('');
    const [capacity, setCapacity] = useState(30);
    const [yearId, setYearId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [campusId, setCampusId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !level || !yearId || !sectionId || !campusId) {
            toast.warning('Tous les champs sont obligatoires.');
            return;
        }

        try {
            await createClassroom.mutateAsync({
                name,
                level,
                maxCapacity: capacity,
                academicYearId: yearId,
                schoolSectionId: sectionId,
                campusId: campusId
            });
            setShowForm(false);
            resetForm();
            toast.success('Classe créée avec succès !');
        } catch (err: any) {
            toast.error('Erreur lors de la création de la classe : ' + (err.response?.data?.message || err.message));
        }
    };

    const resetForm = () => {
        setName('');
        setLevel('');
        setYearId('');
        setSectionId('');
        setCampusId('');
    };

    const handleDelete = async (id: string, name: string) => {
        const ok = await dialog.confirm({
            title: 'Supprimer la classe',
            message: 'Êtes-vous sûr de vouloir supprimer la classe "' + name + '" ? Cette action est irréversible.',
            variant: 'danger',
            confirmLabel: 'Supprimer',
        });
        if (!ok) return;

        try {
            await deleteClassroom.mutateAsync(id);
            toast.success(`Classe "${name}" supprimée.`);
        } catch (err: any) {
            toast.error(err.response?.data?.Message || 'Erreur lors de la suppression.');
        }
    };

    const selectedClassroom = classrooms.find(c => c.id === selectedId);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Structure Scolaire</h1>
                    <p className="page-subtitle">Gestion multi-cycle, sites et salles de classe</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setShowForm(true);
                        if (years?.length && !yearId) setYearId(years.find(y => y.isCurrent)?.id || years[0].id);
                        if (sections?.length && !sectionId) setSectionId(sections[0].id);
                        if (campuses?.length && !campusId) setCampusId(campuses[0].id);
                    }}
                >
                    <Plus size={16} /> Nouvelle Salle
                </button>
            </div>

            {showForm && (
                <div className="card animate-up" style={{ marginBottom: '24px', border: '1px solid var(--primary-light)', padding: '20px' }}>
                    <div className="card-header" style={{ marginBottom: '20px' }}>
                        <h2 className="card-title">Configuration d'une Nouvelle Salle</h2>
                        <button className="btn-ghost" onClick={() => setShowForm(false)} title="Fermer"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                            <div className="form-group">
                                <label>Nom de la classe</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: 6ème A" />
                            </div>
                            <div className="form-group">
                                <label>Niveau</label>
                                <input type="text" value={level} onChange={e => setLevel(e.target.value)} required placeholder="Ex: Primaire" />
                            </div>
                            <div className="form-group">
                                <label>Année Académique</label>
                                <select value={yearId} onChange={e => setYearId(e.target.value)} required>
                                    <option value="">-- Choisir --</option>
                                    {years?.map(y => (
                                        <option key={y.id} value={y.id}>{y.name} {y.isCurrent ? '(Actuelle)' : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cycle / Section</label>
                                <select value={sectionId} onChange={e => setSectionId(e.target.value)} required>
                                    <option value="">-- Choisir le Cycle --</option>
                                    {sections?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} (Barème: /{s.maxGradeValue})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Campus / Site</label>
                                <select value={campusId} onChange={e => setCampusId(e.target.value)} required>
                                    <option value="">-- Choisir le Site --</option>
                                    {campuses?.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Capacité</label>
                                <input type="number" value={capacity} onChange={e => setCapacity(parseInt(e.target.value))} required min="1" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={createClassroom.isPending}>
                                {createClassroom.isPending ? 'Enregistrement...' : 'Enregistrer la Salle'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state" style={{ padding: '40px' }}>Initialisation de la structure...</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Salle de classe</th>
                                    <th>Cycle</th>
                                    <th>Site</th>
                                    <th>Effectif</th>
                                    <th>Année</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classrooms.map(cls => (
                                    <tr key={cls.id}>
                                        <td className="font-bold">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ background: 'var(--primary-dim)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                                                    <Layout size={18} />
                                                </div>
                                                <div>
                                                    <p>{cls.name}</p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Niveau: {cls.level}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                <Layers size={14} className="text-primary" />
                                                {cls.sectionName}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                <Home size={14} className="text-muted" />
                                                {cls.campusName}
                                            </div>
                                        </td>
                                        <td>{cls.studentCount} / {cls.maxCapacity}</td>
                                        <td><span className="badge-outline">{cls.academicYearName}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn-ghost" onClick={() => setSelectedId(cls.id)} title="Détails"><Info size={16} /></button>
                                            <button className="btn-ghost text-danger" onClick={() => handleDelete(cls.id, cls.name)} title="Supprimer"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {selectedId && selectedClassroom && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card animate-up" style={{ maxWidth: '450px', width: '90%', padding: '0', overflow: 'hidden' }}>
                        <div className="card-header" style={{ background: 'var(--primary)', color: 'white', padding: '20px' }}>
                            <h2 className="card-title" style={{ color: 'white' }}>Détails de la Structure</h2>
                            <button className="btn-ghost" style={{ color: 'white' }} onClick={() => setSelectedId(null)}><X size={18} /></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Nom de la Salle:</span>
                                    <span style={{ fontWeight: 700 }}>{selectedClassroom.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Cycle d'étude:</span>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedClassroom.sectionName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Campus / Site:</span>
                                    <span>{selectedClassroom.campusName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Niveau académique:</span>
                                    <span>{selectedClassroom.level}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Capacité d'accueil:</span>
                                    <span>{selectedClassroom.maxCapacity} places</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Année Scolaire:</span>
                                    <span className="badge-outline">{selectedClassroom.academicYearName}</span>
                                </div>
                            </div>
                            <button className="btn-primary" style={{ width: '100%', marginTop: '30px' }} onClick={() => setSelectedId(null)}>Fermer l'aperçu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
