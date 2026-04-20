'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, FileDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { exportToExcel } from '@/lib/excelExport';

export default function StudentsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    
    const [result, setResult] = useState<{items: any[], totalCount: number, totalPages: number}>({ items: [], totalCount: 0, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'Male',
        nationalId: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        parentRelationship: 'Father',
        campusId: 'dummy-campus-id'
    });

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/students?search=${searchTerm}&pageNumber=${page}&pageSize=10`);
            if (!res.ok) throw new Error('Erreur de chargement');
            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, page]);

    useEffect(() => {
        const debounce = setTimeout(() => fetchStudents(), 300);
        return () => clearTimeout(debounce);
    }, [fetchStudents]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Erreur lors de la création');
            
            setShowForm(false);
            fetchStudents();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleExport = () => {
        const dataToExport = result.items.map(s => ({
            'Matricule': s.studentNumber,
            'Nom': s.lastName,
            'Prénom': s.firstName,
            'Date Naissance': new Date(s.dateOfBirth).toLocaleDateString(),
            'Genre': s.gender,
            'Nom Parent': s.parentName,
            'Téléphone Parent': s.parentPhone
        }));

        exportToExcel(dataToExport, `Liste_Eleves_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Pro</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item active">Élèves (Next.js)</div>
              <div className="nav-item" onClick={() => router.push('/classrooms')}>Classes</div>
              <div className="nav-item" onClick={() => router.push('/grades')}>Saisie des Notes</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Gestion des Élèves</h1>
                        <p className="page-subtitle">Visualisez et exportez les effectifs de votre école.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-ghost" onClick={handleExport} disabled={result.items.length === 0}>
                            <FileDown size={16} style={{ marginRight: '6px' }} /> Exporter Excel
                        </button>
                        <button className="btn-primary" onClick={() => setShowForm(true)}>
                            <Plus size={16} /> Ajouter un Élève
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="card shadow-lg animate-up" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)' }}>
                        <div className="card-header" style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                            <h2 className="card-title">Enregistrement d'un Nouvel Élève</h2>
                            <button className="btn-ghost" onClick={() => setShowForm(false)}>Fermer</button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Prénom</label>
                                    <input className="form-input" type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Nom</label>
                                    <input className="form-input" type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Date de Naissance</label>
                                    <input className="form-input" type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>ID National / Matricule</label>
                                    <input className="form-input" type="text" value={formData.nationalId} onChange={e => setFormData({ ...formData, nationalId: e.target.value })} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '35px' }}>
                                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                                <button type="submit" className="btn-primary">Confirmer l'Inscription</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card shadow-sm" style={{ padding: '0' }}>
                    <div className="table-toolbar" style={{ padding: '20px' }}>
                        <div className="search-box" style={{ maxWidth: '400px' }}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou matricule..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>

                    <div className="table-container" style={{ padding: '0 20px 20px 20px' }}>
                        {isLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>Recherche...</div>
                        ) : error ? (
                            <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
                        ) : result.items.length > 0 ? (
                            <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th>Matricule</th>
                                        <th>Élève</th>
                                        <th>Genre</th>
                                        <th>Parent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.items.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px 0' }} className="text-primary">{s.studentNumber}</td>
                                            <td><strong>{s.firstName} {s.lastName}</strong><br/>{s.nationalId}</td>
                                            <td>{s.gender}</td>
                                            <td>{s.parentName}<br/>{s.parentPhone}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Users size={48} style={{ opacity: 0.2, margin: '0 auto 20px' }} />
                                <h3>Aucun élève trouvé</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
