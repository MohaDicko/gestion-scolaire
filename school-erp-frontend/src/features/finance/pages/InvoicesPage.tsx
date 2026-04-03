import React, { useState } from 'react';
import { Receipt, Search, Plus, Filter, CreditCard, Clock, X, Check, Calculator, FileText } from 'lucide-react';
import { useInvoices, useGenerateClassInvoices, useGeneratePaymentPlan, usePayInvoice, Invoice } from '../hooks/useInvoices';
import { useAcademicYears, useClassrooms } from '../../academic/hooks/useClassrooms';
import { exportToExcel } from '../../../lib/excelExport';
import { toast } from '../../../store/toastStore';

export function InvoicesPage() {
    const { data: invoices, isLoading } = useInvoices();
    const generateInvoices = useGenerateClassInvoices();
    const generatePaymentPlan = useGeneratePaymentPlan();
    const payInvoice = usePayInvoice();

    const { data: academicYears } = useAcademicYears();
    const { classrooms } = useClassrooms();

    const [showGenModal, setShowGenModal] = useState(false);
    const [useInstallments, setUseInstallments] = useState(false);
    const [genData, setGenData] = useState({
        classroomId: '',
        academicYearId: '',
        description: 'Frais de scolarité',
        amount: 0,
        feeType: 0, // 0: Tuition
        dueDate: '',
        installments: 3,
        intervalDays: 30
    });

    const [payModal, setPayModal] = useState<{ isOpen: boolean; invoice: Invoice | null }>({ isOpen: false, invoice: null });
    const [payData, setPayData] = useState({ amount: 0, paymentMethod: 'Cash', referenceNumber: '' });

    // Compute Summaries
    const totalInvoiced = invoices?.reduce((acc, inv) => acc + inv.amount, 0) || 0;
    const totalRemaining = invoices?.reduce((acc, inv) => acc + inv.remainingAmount, 0) || 0;
    const totalPaid = totalInvoiced - totalRemaining;

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (useInstallments) {
                const res = await generatePaymentPlan.mutateAsync({
                    classroomId: genData.classroomId,
                    academicYearId: genData.academicYearId,
                    baseDescription: genData.description,
                    totalAmount: genData.amount,
                    feeType: genData.feeType,
                    installments: genData.installments,
                    intervalDays: genData.intervalDays
                });
                toast.success(`${res.invoicesGenerated} factures (échéanciers) générées !`);
            } else {
                const res = await generateInvoices.mutateAsync(genData);
                toast.success(`${res.invoicesGenerated} facture(s) générée(s) avec succès !`);
            }
            setShowGenModal(false);
        } catch (err: any) {
            toast.error('Erreur lors de la génération: ' + (err.response?.data?.message || err.message));
        }
    };

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payModal.invoice) return;
        try {
            await payInvoice.mutateAsync({
                invoiceId: payModal.invoice.id,
                ...payData
            });
            toast.success('Paiement enregistré avec succès !');
            setPayModal({ isOpen: false, invoice: null });
        } catch (err: any) {
            toast.error('Erreur lors du paiement: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleExportExcel = () => {
        if (!invoices) return;
        const data = invoices.map(inv => ({
            'N° Facture': inv.invoiceNumber,
            'Description': inv.description,
            'Élève': inv.studentName,
            'Montant Total': inv.amount,
            'Reste à Payer': inv.remainingAmount,
            'Statut': inv.status,
            'Échéance': new Date(inv.dueDate).toLocaleDateString()
        }));
        exportToExcel(data, 'Factures_Scolaires', 'Invoices');
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'var(--success)';
            case 'partiallypaid': return 'var(--warning)';
            case 'unpaid': return 'var(--danger)';
            default: return 'var(--text-dim)';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'PAYÉ';
            case 'partiallypaid': return 'PARTIEL';
            case 'unpaid': return 'IMPAYÉ';
            default: return status.toUpperCase();
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Facturation & Échéanciers</h1>
                    <p className="page-subtitle">Suivi des frais de scolarité avec support multi-échéances</p>
                </div>
                <button className="btn-primary" onClick={() => setShowGenModal(true)}>
                    <Plus size={16} /> Créer Factures / Échéancier
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}><Receipt size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Total Facturé</p>
                        <p className="stat-value">{totalInvoiced.toLocaleString()} F</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}><CreditCard size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Total Encaissé</p>
                        <p className="stat-value text-success">{totalPaid.toLocaleString()} F</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}><Clock size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Reste à Percevoir</p>
                        <p className="stat-value text-warning">{totalRemaining.toLocaleString()} F</p>
                    </div>
                </div>
            </div>

            {/* GENERATE MODAL */}
            {showGenModal && (
                <div className="card animate-up" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <div className="card-header" style={{ padding: '20px' }}>
                        <h2 className="card-title">Génération Multiple de Factures</h2>
                        <button className="btn-ghost" onClick={() => setShowGenModal(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleGenerate} style={{ padding: '0 25px 25px' }}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                            <div className="form-group">
                                <label>Année Académique</label>
                                <select value={genData.academicYearId} onChange={e => setGenData({ ...genData, academicYearId: e.target.value })} required>
                                    <option value="">Sélectionner...</option>
                                    {academicYears?.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Classe</label>
                                <select value={genData.classroomId} onChange={e => setGenData({ ...genData, classroomId: e.target.value })} required>
                                    <option value="">Sélectionner...</option>
                                    {classrooms?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Libellé de la facture</label>
                                <input type="text" value={genData.description} onChange={e => setGenData({ ...genData, description: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Type de Frais</label>
                                <select value={genData.feeType} onChange={e => setGenData({ ...genData, feeType: Number(e.target.value) })} required>
                                    <option value={0}>Scolarité (Tuition)</option>
                                    <option value={1}>Inscription</option>
                                    <option value={2}>Cantine</option>
                                    <option value={5}>Autre</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ background: 'var(--surface-alt)', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Calculator size={20} className="text-primary" />
                                    <span style={{ fontWeight: 700 }}>Options de Paiement</span>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={useInstallments} onChange={e => setUseInstallments(e.target.checked)} />
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Échelonner le paiement (Installments)</span>
                                </label>
                            </div>

                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                <div className="form-group">
                                    <label>{useInstallments ? 'Montant Total' : 'Montant Fixe'}</label>
                                    <input type="number" min="0" value={genData.amount} onChange={e => setGenData({ ...genData, amount: Number(e.target.value) })} required />
                                </div>
                                {!useInstallments ? (
                                    <div className="form-group">
                                        <label>Date d'échéance</label>
                                        <input type="date" value={genData.dueDate} onChange={e => setGenData({ ...genData, dueDate: e.target.value })} required />
                                    </div>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>Nombre d'échéances</label>
                                            <select value={genData.installments} onChange={e => setGenData({ ...genData, installments: Number(e.target.value) })}>
                                                <option value={2}>2 fois</option>
                                                <option value={3}>3 fois (Trimestriel)</option>
                                                <option value={9}>9 fois (Mensuel)</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Intervalle (jours)</label>
                                            <input type="number" min="1" value={genData.intervalDays} onChange={e => setGenData({ ...genData, intervalDays: Number(e.target.value) })} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowGenModal(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={generateInvoices.isPending || generatePaymentPlan.isPending}>
                                <Check size={16} /> 
                                {generateInvoices.isPending || generatePaymentPlan.isPending ? 'Traitement...' : 'Valider et Générer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* PAY MODAL remains same but using better styling */}
            {payModal.isOpen && payModal.invoice && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="card animate-scale" style={{ width: '400px', maxWidth: '90vw', padding: '0' }}>
                        <div className="card-header" style={{ padding: '20px' }}>
                            <h2 className="card-title">Encaisser Paiement</h2>
                            <button className="btn-ghost" onClick={() => setPayModal({ isOpen: false, invoice: null })}><X size={18} /></button>
                        </div>
                        <form onSubmit={handlePay} style={{ padding: '0 25px 25px' }}>
                            <div style={{ marginBottom: '20px', textAlign: 'center', background: 'var(--primary-dim)', padding: '15px', borderRadius: '12px' }}>
                                <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>Reste à percevoir</p>
                                <p style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary)' }}>{payModal.invoice.remainingAmount.toLocaleString()} F</p>
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Montant du versement (F)</label>
                                <input type="number" min="1" max={payModal.invoice.remainingAmount} value={payData.amount} onChange={e => setPayData({ ...payData, amount: Number(e.target.value) })} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label>Moyen de paiement</label>
                                <select value={payData.paymentMethod} onChange={e => setPayData({ ...payData, paymentMethod: e.target.value })}>
                                    <option value="Cash">Espèces (Mali Cash)</option>
                                    <option value="Orange Money">Orange Money</option>
                                    <option value="Moov Money">Moov Money</option>
                                    <option value="Virement">Virement / Chèque</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: '25px' }}>
                                <label>Référence / N° de pièce</label>
                                <input type="text" value={payData.referenceNumber} onChange={e => setPayData({ ...payData, referenceNumber: e.target.value })} placeholder="Ex: ID Transaction" />
                            </div>
                            <button type="submit" className="btn-primary btn-full" disabled={payInvoice.isPending}>
                                {payInvoice.isPending ? 'Enregistrement...' : 'Confirmer l\'Encaissement'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                <div className="table-toolbar" style={{ padding: '20px' }}>
                    <div className="search-box">
                        <Search size={16} />
                        <input type="text" placeholder="Rechercher une facture..." />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-ghost" onClick={handleExportExcel}><FileText size={16} /> Excel</button>
                        <button className="btn-ghost"><Filter size={16} /> Filtrer</button>
                    </div>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">Synchronisation des finances...</div>
                    ) : invoices?.length ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>N° Facture</th>
                                    <th>Description</th>
                                    <th>Élève</th>
                                    <th>Montant Total</th>
                                    <th>Reste</th>
                                    <th>Statut</th>
                                    <th>Échéance</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td className="font-mono text-primary text-xs">{inv.invoiceNumber}</td>
                                        <td className="font-bold">{inv.description}</td>
                                        <td>{inv.studentName}</td>
                                        <td>{inv.amount.toLocaleString()} F</td>
                                        <td className="font-bold">{inv.remainingAmount.toLocaleString()} F</td>
                                        <td>
                                            <span style={{
                                                color: getStatusColor(inv.status),
                                                background: `${getStatusColor(inv.status)}15`,
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '10px',
                                                fontWeight: '800'
                                            }}>{getStatusText(inv.status)}</span>
                                        </td>
                                        <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            {inv.remainingAmount > 0 ? (
                                                <button
                                                    className="btn-primary"
                                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                                    onClick={() => {
                                                        setPayData({ ...payData, amount: inv.remainingAmount });
                                                        setPayModal({ isOpen: true, invoice: inv });
                                                    }}
                                                >Payer</button>
                                            ) : <span className="text-success text-xs font-bold">SOLDÉ</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state" style={{ padding: '60px' }}>
                            <Receipt size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                            <h3>Aucune transaction</h3>
                            <p>Les factures et paiements apparaîtront ici.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
