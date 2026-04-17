'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PayslipsPage() {
    const router = useRouter();
    const [payslips, setPayslips] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        fetch('/api/payslips')
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) setPayslips(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Vercel</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/employees')}>Employés (RH)</div>
              <div className="nav-item active">Paie (Bulletins)</div>
              <div className="nav-item" onClick={() => router.push('/grades')}>Notes & Académie</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Gestion de la Paie</h1>
                        <p className="page-subtitle">Génération des bulletins de salaire</p>
                    </div>
                    <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                        <Plus size={16} /> Générer un bulletin
                    </button>
                </div>

                <div className="card shadow-sm" style={{ padding: '0' }}>
                    <div className="table-container" style={{ padding: '20px' }}>
                        {isLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>Chargement des bulletins...</div>
                        ) : payslips.length > 0 ? (
                            <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th>Employé</th>
                                        <th>Période</th>
                                        <th>Salaire Net</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payslips.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px 0' }}><strong>{p.employee?.firstName} {p.employee?.lastName}</strong></td>
                                            <td>{new Date(p.periodStart).toLocaleDateString()} - {new Date(p.periodEnd).toLocaleDateString()}</td>
                                            <td className="text-success font-bold">{p.netSalary} XOF</td>
                                            <td><span className="badge-blue">{p.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 20px' }} />
                                <h3>Aucun bulletin de paie récent</h3>
                                <p>Cliquez sur "Générer un bulletin" pour lancer un cycle de paie.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
