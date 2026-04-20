'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClassroomsPage() {
    const router = useRouter();
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        level: '',
        stream: '',
        maxCapacity: '30',
        campusId: 'dummy-campus-id', // Would be fetched from /api/campuses in real app
        academicYearId: 'dummy-year-id' // Would be fetched from /api/academic-years
    });

    const fetchClassrooms = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/classrooms');
            if (!res.ok) throw new Error('Erreur de chargement');
            const data = await res.json();
            setClassrooms(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClassrooms();
    }, [fetchClassrooms]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/classrooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Erreur lors de la création');
            
            setShowForm(false);
            fetchClassrooms();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Pro</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/students')}>Élèves</div>
              <div className="nav-item active">Classes (Next.js)</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Gestion des Classes</h1>
                        <p className="page-subtitle">Organisation structurelle des cohortes</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={16} /> Nouvelle Classe
                    </button>
                </div>

                {showForm && (
                    <div className="card shadow-lg animate-up" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)' }}>
                        <div className="card-header" style={{ background: 'var(--bg-2)' }}>
                            <h2 className="card-title">Créer une Classe</h2>
                            <button className="btn-ghost" onClick={() => setShowForm(false)}>Fermer</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Nom de la classe (ex: 6ème A)</label>
                                    <input className="form-input" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Niveau (ex: 6ème)</label>
                                    <input className="form-input" type="text" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Série / Filière (Optionnel)</label>
                                    <input className="form-input" type="text" value={formData.stream} onChange={e => setFormData({ ...formData, stream: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Capacité maximale</label>
                                    <input className="form-input" type="number" value={formData.maxCapacity} onChange={e => setFormData({ ...formData, maxCapacity: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                                <button type="submit" className="btn-primary">Créer</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card shadow-sm" style={{ padding: '0' }}>
                    <div className="table-container" style={{ padding: '20px' }}>
                        {isLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>Chargement des classes...</div>
                        ) : error ? (
                            <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
                        ) : classrooms.length > 0 ? (
                            <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Niveau</th>
                                        <th>Capacité</th>
                                        <th>Inscrits</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classrooms.map(c => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px 0' }}><strong>{c.name}</strong><br/><small>{c.stream}</small></td>
                                            <td>{c.level}</td>
                                            <td>{c.maxCapacity}</td>
                                            <td>{c._count?.enrollments || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Layers size={48} style={{ opacity: 0.2, margin: '0 auto 20px' }} />
                                <h3>Aucune classe trouvée</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
