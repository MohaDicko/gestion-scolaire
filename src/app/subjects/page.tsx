'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Search, Loader2, X, Trash2, Edit } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

const emptyForm = { name: '', code: '', coefficient: '1.0' };

export default function SubjectsPage() {
    const toast = useToast();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [search, setSearch] = useState('');
    
    // Détection du type d'école
    const [schoolType, setSchoolType] = useState<string | null>(null);
    const isAgroOrTech = schoolType === 'AGRO' || schoolType === 'TECHNIQUE';

    useEffect(() => {
        fetch('/api/school/config')
            .then(r => r.json())
            .then(d => { if (d?.type) setSchoolType(d.type); })
            .catch(() => {});
    }, []);

    const fetchSubjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/subjects');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setSubjects(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Erreur lors du chargement des matières');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            
            toast.success(`Matière "${formData.name}" ajoutée`);
            setShowModal(false);
            setFormData({ ...emptyForm });
            fetchSubjects();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filtered = subjects.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) || 
        s.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout
            title={isAgroOrTech ? "Gestion des Modules" : "Gestion des Matières"}
            subtitle={isAgroOrTech ? "Catalogue des modules, durées et seuils de réussite" : "Définition du catalogue des enseignements et coefficients"}
            breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: isAgroOrTech ? 'Modules' : 'Matières' }]}
            actions={
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={15} /> {isAgroOrTech ? 'Nouveau Module' : 'Nouvelle Matière'}
                </button>
            }
        >
            <div className="card shadow-sm" style={{ padding: 0 }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }} className="table-toolbar">
                    <div className="search-box">
                        <Search size={15} />
                        <input 
                            type="text" 
                            placeholder="Rechercher par nom ou code..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p>Chargement du catalogue...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>{isAgroOrTech ? 'Code / Durée' : 'Code'}</th>
                                    <th>{isAgroOrTech ? 'Nom du Module' : 'Nom de la Matière'}</th>
                                    <th>{isAgroOrTech ? 'Seuil (%)' : 'Coefficient'}</th>
                                    <th>Date de Création</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id}>
                                        <td>
                                            <span className="badge badge-info">{s.code}</span>
                                            {isAgroOrTech && s.code.match(/(\d+)/) && (
                                                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                                                    {s.code.match(/(\d+)/)?.[1]} H
                                                </span>
                                            )}
                                        </td>
                                        <td><strong style={{ color: 'var(--text)' }}>{s.name}</strong></td>
                                        <td>
                                            <strong>{s.coefficient}</strong>
                                            {isAgroOrTech && <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '4px' }}>%</span>}
                                        </td>
                                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button className="btn-icon" title="Modifier"><Edit size={14}/></button>
                                                <button className="btn-icon text-danger" title="Supprimer"><Trash2 size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <BookOpen size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
                            <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Aucune matière trouvée</h3>
                            <p style={{ fontSize: '13px' }}>Commencez par ajouter des matières à votre cycle d'études.</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s var(--ease) both' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px' }}>
                                {isAgroOrTech ? 'Nouveau Module' : 'Nouvelle Matière'}
                            </h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>{isAgroOrTech ? 'Nom du Module *' : 'Nom de la Matière *'}</label>
                                <input 
                                    required 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    placeholder={isAgroOrTech ? "Ex: Production Animale" : "Ex: Mathématiques, Anatomie..."}
                                />
                            </div>
                            <div className="form-group">
                                <label>{isAgroOrTech ? 'Code & Durée (Ex: M1-135 pour 135 H) *' : 'Code Matière *'}</label>
                                <input 
                                    required 
                                    value={formData.code} 
                                    onChange={e => setFormData({...formData, code: e.target.value})} 
                                    placeholder={isAgroOrTech ? "Ex: MOD-135" : "Ex: MATH01, BIO-101..."}
                                />
                            </div>
                            <div className="form-group">
                                <label>{isAgroOrTech ? 'Seuil de Réussite (%) *' : 'Coefficient *'}</label>
                                <input 
                                    type="number" 
                                    step={isAgroOrTech ? "1" : "0.5"} 
                                    min={isAgroOrTech ? "1" : "0.5"} 
                                    max={isAgroOrTech ? "100" : undefined}
                                    required 
                                    value={formData.coefficient} 
                                    onChange={e => setFormData({...formData, coefficient: e.target.value})} 
                                />
                                {isAgroOrTech && <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>Note: Ce seuil sera utilisé pour valider le module sur 100.</span>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 size={16} className="spin" /> Enregistrement...</> : 'Ajouter au Catalogue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
