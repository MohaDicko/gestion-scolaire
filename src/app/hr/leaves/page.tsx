'use client';

import React, { useState, useEffect } from 'react';
import { Plane, Plus, Check, X, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeavesPage() {
    const router = useRouter();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const fetchLeaves = () => {
        setIsLoading(true);
        fetch('/api/hr/leaves')
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) setLeaves(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    };

    useEffect(fetchLeaves, []);

    const updateStatus = async (id: string, status: string) => {
        await fetch('/api/hr/leaves', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        fetchLeaves();
    };

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Vercel</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/employees')}>Employés</div>
              <div className="nav-item" onClick={() => router.push('/hr/attendance')}>Présence Staff</div>
              <div className="nav-item active">Congés</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Gestion des Congés</h1>
                        <p className="page-subtitle">Suivi et validation des demandes d'absence</p>
                    </div>
                </div>

                <div className="card shadow-sm" style={{ padding: 0 }}>
                    <div className="card-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
                        <h3 className="card-title"><Plane size={18} style={{ display: 'inline', marginRight: 10 }} /> Demandes en cours</h3>
                    </div>
                    
                    <div className="table-container">
                        {isLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>
                        ) : leaves.length > 0 ? (
                            <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '15px 20px' }}>Employé</th>
                                        <th>Type</th>
                                        <th>Période</th>
                                        <th>Statut</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map(l => (
                                        <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '15px 20px' }}>
                                                <strong>{l.employee?.firstName} {l.employee?.lastName}</strong><br/>
                                                <small>{l.employee?.employeeNumber}</small>
                                            </td>
                                            <td><span className="badge-role">{l.type}</span></td>
                                            <td>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</td>
                                            <td>
                                                {l.status === 'PENDING' ? <span style={{ color: 'var(--warning)' }}><Clock size={14} /> En attente</span> :
                                                 l.status === 'APPROVED' ? <span style={{ color: 'var(--success)' }}><Check size={14} /> Approuvé</span> :
                                                 <span style={{ color: 'var(--danger)' }}><X size={14} /> Refusé</span>}
                                            </td>
                                            <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                                {l.status === 'PENDING' && (
                                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => updateStatus(l.id, 'APPROVED')} className="btn-ghost" style={{ color: 'var(--success)' }}><Check size={16} /></button>
                                                        <button onClick={() => updateStatus(l.id, 'REJECTED')} className="btn-ghost" style={{ color: 'var(--danger)' }}><X size={16} /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>Aucune demande de congé enregistrée.</div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
