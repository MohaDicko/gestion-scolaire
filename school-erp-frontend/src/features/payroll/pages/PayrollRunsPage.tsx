import React, { useState } from 'react';
import { DollarSign, Calendar, Settings, Play, Check } from 'lucide-react';
import { usePayrollRuns, useGeneratePayroll } from '../hooks/usePayroll';
import { Link } from 'react-router-dom';

export function PayrollRunsPage() {
    const { data: runs, isLoading } = usePayrollRuns();
    const generateRuns = useGeneratePayroll();

    const [showModal, setShowModal] = useState(false);

    // Default to current month/year
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const [formData, setFormData] = useState({
        month: currentMonth,
        year: currentYear
    });

    const getMonthName = (monthNumber: number) => {
        const date = new Date(2000, monthNumber - 1, 1);
        return date.toLocaleString('fr-FR', { month: 'long' });
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await generateRuns.mutateAsync({ month: formData.month, year: formData.year });
            setShowModal(false);
            alert("Traitement de la paie lancé avec succès !");
        } catch (err: any) {
            alert("Erreur: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Runs de Paie</h1>
                    <p className="page-subtitle">Historique et génération des traitements de salaire mensuels.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Play size={16} /> Lancer un nouveau calcul
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}><Settings size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Traitements (Runs)</p>
                        <p className="stat-value">{runs?.length || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}><DollarSign size={24} /></div>
                    <div className="stat-body">
                        <p className="stat-label">Total Distribué</p>
                        <p className="stat-value text-success">
                            {runs?.reduce((acc, r) => acc + r.totalAmount, 0).toLocaleString()} F
                        </p>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="card" style={{ marginBottom: '25px', border: '1px solid var(--primary-light)' }}>
                    <div className="card-header">
                        <h2 className="card-title">Générer la Paie du Mois</h2>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '15px' }}>
                        Cette opération va compiler <b>automatiquement</b> les fiches de paie pour tous les employés ayant un contrat "Actif" ce mois, incluant leur salaire de base, et les éventuelles déductions/primes.
                    </p>

                    <form onSubmit={handleGenerate}>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div className="form-group">
                                <label>Mois</label>
                                <select value={formData.month} onChange={e => setFormData({ ...formData, month: Number(e.target.value) })} required>
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{getMonthName(i + 1).toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Année</label>
                                <input type="number" min="2020" max="2100" value={formData.year} onChange={e => setFormData({ ...formData, year: Number(e.target.value) })} required />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                            <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                            <button type="submit" className="btn-primary" disabled={generateRuns.isPending}>
                                <Check size={16} /> {generateRuns.isPending ? 'Traitement en cours...' : 'Lancer le calcul définitif'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: '0' }}>
                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">Chargement des runs...</div>
                    ) : runs?.length ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Période</th>
                                    <th>Date de Génération</th>
                                    <th>Fiches émises</th>
                                    <th>Montant Total</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'right' }}>Détails</th>
                                </tr>
                            </thead>
                            <tbody>
                                {runs.map(run => (
                                    <tr key={run.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Calendar size={16} className="text-muted" />
                                                <span className="font-bold">{getMonthName(run.month).toUpperCase()} {run.year}</span>
                                            </div>
                                        </td>
                                        <td>{new Date(run.processedAt).toLocaleString()}</td>
                                        <td>{run.payslipCount} fiches</td>
                                        <td className="font-mono text-primary font-bold">{run.totalAmount.toLocaleString()} FCFA</td>
                                        <td><span className="badge-success">Clôturé</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Link to={`/payroll/runs/${run.id}/payslips`} className="btn-ghost text-sm">
                                                Voir les fiches
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="coming-soon">
                            <Settings size={48} />
                            <h3>Aucun calcul de paie effectué.</h3>
                            <p>Lancez le traitement du premier mois ci-dessus.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
