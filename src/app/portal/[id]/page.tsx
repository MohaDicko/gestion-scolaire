'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, Book, Calendar, Award, ShieldCheck } from 'lucide-react';

export default function PortalPage() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/portal/${id}`)
            .then(res => res.json())
            .then(d => {
                setData(d);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [id]);

    if (isLoading) return <div style={{ padding: 50, textAlign: 'center' }}>Chargement du portail parent...</div>;
    if (!data || data.error) return <div style={{ padding: 50, textAlign: 'center' }}>Erreur: {data?.error || 'Portail inaccessible'}</div>;

    const { student, attendance } = data;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Header */}
                <div className="card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid var(--success)' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-dim)', display: 'grid', placeItems: 'center' }}>
                         <User size={40} color="var(--primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px' }}>Portail Parent - {student.firstName} {student.lastName}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Matricule: {student.studentNumber} | Statut: <span className="badge-success">Scolarisé</span></p>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                         <ShieldCheck color="var(--success)" size={32} />
                         <div style={{ fontSize: '10px', color: 'var(--success)' }}>Accès Sécurisé</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Colonne Gauche: Notes */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title"><Award size={18} style={{ display: 'inline', marginRight: 10 }} /> Résultats Académiques</h3>
                        </div>
                        {student.grades?.length > 0 ? (
                            <table style={{ width: '100%', textAlign: 'left', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '10px 0' }}>Matière</th>
                                        <th>Note</th>
                                        <th>Commentaire</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {student.grades.map((g: any) => (
                                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px 0' }}>{g.subject.name}</td>
                                            <td className="font-bold">{g.score} / {g.maxScore}</td>
                                            <td style={{ fontSize: '12px', opacity: 0.7 }}>{g.comment}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>Aucune note enregistrée pour le moment.</p>
                        )}
                    </div>

                    {/* Colonne Droite: Présences & Infos */}
                    <div>
                        <div className="card" style={{ marginBottom: '20px' }}>
                             <div className="card-header">
                                <h3 className="card-title"><Calendar size={18} style={{ display: 'inline', marginRight: 10 }} /> Présences Récentes</h3>
                            </div>
                            {attendance?.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {attendance.map((a: any) => (
                                        <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                            <span>{new Date(a.date).toLocaleDateString()}</span>
                                            <span className={a.status === 'PRESENT' ? 'text-success' : 'text-danger'} style={{ fontWeight: 'bold' }}>{a.status}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ textAlign: 'center', opacity: 0.5 }}>Pas de données de présences.</p>
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title"><Book size={18} style={{ display: 'inline', marginRight: 10 }} /> Informations Scolaires</h3>
                            </div>
                            <div style={{ fontSize: '14px' }}>
                                <p><strong>Classe actuelle:</strong> {student.enrollments?.[0]?.classroom?.name || 'Non assigné'}</p>
                                <p><strong>Niveau:</strong> {student.enrollments?.[0]?.classroom?.level || '-'}</p>
                                <p style={{ marginTop: 10 }}><strong>Actions Parentales:</strong></p>
                                <button className="btn-primary" style={{ marginTop: 5, width: '100%' }}>Contacter l'administration</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
