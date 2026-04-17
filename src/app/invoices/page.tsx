'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Plus, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        fetch('/api/invoices')
            .then(res => res.json())
            .then(data => {
                if(Array.isArray(data)) setInvoices(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const markAsPaid = async (id: string) => {
        alert("Action de paiement déclenchée (Fonction à relier à l'API PUT/PATCH).");
    }

    return (
        <div className="layout-root">
          <div className="sidebar">
            <div className="sidebar-logo">
              <div className="logo-title">SchoolERP Vercel</div>
            </div>
            <div className="sidebar-nav">
              <div className="nav-item" onClick={() => router.push('/dashboard')}>Tableau de Bord</div>
              <div className="nav-item" onClick={() => router.push('/employees')}>Employés (RH)</div>
              <div className="nav-item" onClick={() => router.push('/payslips')}>Paie (Bulletins)</div>
              <div className="nav-item active">Facturation</div>
            </div>
          </div>
          
          <div className="main-content">
            <div className="page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Comptabilité des Élèves</h1>
                        <p className="page-subtitle">Suivi des paiements, mensualités et frais scolaires.</p>
                    </div>
                    <button className="btn-primary">
                        <Plus size={16} /> Générer une facture
                    </button>
                </div>

                <div className="card shadow-sm" style={{ padding: '0' }}>
                    <div className="table-container" style={{ padding: '20px' }}>
                        {isLoading ? (
                            <div style={{ padding: 40, textAlign: 'center' }}>Chargement des factures...</div>
                        ) : invoices.length > 0 ? (
                            <table className="data-table" style={{ width: '100%', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th>Élève (Débiteur)</th>
                                        <th>Montant</th>
                                        <th>Date limite</th>
                                        <th>Statut</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px 0' }}>
                                                <strong>{inv.student?.firstName} {inv.student?.lastName}</strong><br/>
                                                <small className="text-primary">{inv.student?.studentNumber}</small>
                                            </td>
                                            <td className="font-bold">{inv.amount} XOF</td>
                                            <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                            <td>
                                                <span className={inv.status === 'PAID' ? 'badge-success' : 'badge-danger'}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {inv.status !== 'PAID' && (
                                                    <button className="btn-ghost" onClick={() => markAsPaid(inv.id)}>
                                                        <CreditCard size={14} /> Payer
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 20px' }} />
                                <h3>Aucune facture émise</h3>
                                <p>Toutes les mensualités et scolarités sont à jour.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
    );
}
