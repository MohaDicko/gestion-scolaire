'use client';

import React, { useState } from 'react';
import { BookOpen, Save, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GradesPage() {
    const router = useRouter();
    const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
    
    // Dans une version complète, on ferait des fetch() sur /api/classrooms, /api/subjects
    const dummyStudents = [
        { id: '1', name: 'Mamadou Diarra', matricule: 'MAT1234' },
        { id: '2', name: 'Fatoumata Traoré', matricule: 'MAT1235' }
    ];

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulation d'écriture dans l'API
        setTimeout(() => {
            alert('Notes enregistrées avec succès dans Supabase !');
            setIsSaving(false);
        }, 1000);
    };

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Vercel</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/students')}>Élèves</div>
              <div className="nav-item" onClick={() => router.push('/classrooms')}>Classes</div>
              <div className="nav-item active">Saisie des Notes</div>
              <div className="nav-item" onClick={() => router.push('/payslips')}>Paie (Bulletins)</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Saisie des Notes</h1>
                        <p className="page-subtitle">Module Académique Next.js</p>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ marginBottom: '20px' }}>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="form-group">
                            <label>Classe (Mock)</label>
                            <select onChange={() => setSelectedStudents(dummyStudents)} className="form-input">
                                <option value="">Sélectionner...</option>
                                <option value="1">6ème A</option>
                                <option value="2">Terminale S</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Matière</label>
                            <select className="form-input">
                                <option>Mathématiques</option>
                                <option>Physique</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Type d'Évaluation</label>
                            <select className="form-input">
                                <option>Devoir Surveillé 1</option>
                                <option>Examen Final</option>
                            </select>
                        </div>
                    </div>
                </div>

                {selectedStudents.length > 0 ? (
                    <div className="card" style={{ padding: 0 }}>
                        <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                            <h3 className="card-title"><BookOpen size={18} style={{ display: 'inline', marginRight: 10 }} /> Grille de saisie</h3>
                            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Enregistrement...' : <><Save size={16} /> Enregistrer</>}
                            </button>
                        </div>
                        <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '15px 20px' }}>Élève</th>
                                    <th>Note (/20)</th>
                                    <th>Commentaire</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedStudents.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '15px 20px' }}><strong>{s.name}</strong><br/><small className="text-primary">{s.matricule}</small></td>
                                        <td><input type="number" className="form-input" style={{ width: '80px' }} max={20} /></td>
                                        <td><input type="text" className="form-input" style={{ width: '90%' }} placeholder="Appréciation..." /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="card text-center" style={{ padding: '40px', color: 'var(--text-muted)' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 15px', opacity: 0.3 }} />
                        <p>Sélectionnez une classe pour afficher la grille de saisie.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
    );
}
