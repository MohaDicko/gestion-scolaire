import { useState } from 'react';
import { Plus, TrendingDown, Search, Filter, Download } from 'lucide-react';
import { useExpenses, useRecordExpense, RecordExpensePayload } from '../hooks/useExpenses';
import { exportToExcel } from '../../../lib/excelExport';

const CATEGORIES = [
    { id: 1, label: 'Maintenance', color: '#f59e0b' },
    { id: 2, label: 'Services publics', color: '#3b82f6' },
    { id: 3, label: 'Fournitures de bureau', color: '#8b5cf6' },
    { id: 4, label: 'Équipement', color: '#10b981' },
    { id: 5, label: 'Événements', color: '#ec4899' },
    { id: 99, label: 'Divers', color: '#6b7280' },
];

const getCategoryStyle = (id: number) => {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ?? { color: '#6b7280', label: 'Divers' };
};

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

export function ExpensesPage() {
    const { data: expenses = [], isLoading } = useExpenses();
    const recordExpense = useRecordExpense();

    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<RecordExpensePayload>({
        description: '',
        amount: 0,
        dateIncurred: new Date().toISOString().split('T')[0],
        categoryId: 1,
        referenceNumber: ''
    });

    const filtered = expenses.filter(e => {
        const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
            (e.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchCat = !filterCat || e.categoryId === Number(filterCat);
        return matchSearch && matchCat;
    });

    const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0);

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        try {
            await recordExpense.mutateAsync(form);
            setShowForm(false);
            setForm({ description: '', amount: 0, dateIncurred: new Date().toISOString().split('T')[0], categoryId: 1, referenceNumber: '' });
            alert('Dépense enregistrée avec succès.');
        } catch (err: any) {
            alert('Erreur : ' + (err.response?.data?.message || err.message));
        }
    };

    const handleExportExcel = () => {
        if (!expenses) return;
        const data = filtered.map(e => ({
            'Date': new Date(e.dateIncurred).toLocaleDateString('fr-FR'),
            'Description': e.description,
            'Catégorie': getCategoryStyle(e.categoryId).label,
            'Référence': e.referenceNumber || '—',
            'Montant': e.amount
        }));
        exportToExcel(data, 'Depenses_Ecole', 'Expenses');
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gestion des Dépenses</h1>
                    <p className="page-subtitle">Enregistrement et suivi des charges de l'établissement</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Nouvelle Dépense
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Total des Dépenses</span>
                        <span className="stat-value">{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                        <TrendingDown size={24} />
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Nombre d'opérations</span>
                        <span className="stat-value">{filtered.length}</span>
                    </div>
                    <div className="stat-icon">
                        <Filter size={24} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            placeholder="Rechercher une dépense..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: '38px', width: '100%' }}
                        />
                    </div>
                        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ minWidth: '200px' }}>
                        <option value="">Toutes les catégories</option>
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <button className="btn-ghost" onClick={handleExportExcel} style={{ border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                        <Download size={16} /> Exporter Excel
                    </button>
                </div>
            </div>

            {/* Add Expense Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Enregistrer une Dépense</h2>
                            <button className="btn-ghost" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label>Description *</label>
                                <input
                                    required
                                    placeholder="Ex: Réparation climatiseur salle 3..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Montant (FCFA) *</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={form.amount}
                                        onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.dateIncurred}
                                        onChange={e => setForm({ ...form, dateIncurred: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Catégorie *</label>
                                    <select
                                        value={form.categoryId}
                                        onChange={e => setForm({ ...form, categoryId: Number(e.target.value) })}
                                    >
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>N° Référence / Bon</label>
                                    <input
                                        placeholder="Facultatif..."
                                        value={form.referenceNumber}
                                        onChange={e => setForm({ ...form, referenceNumber: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={recordExpense.isPending}>
                                    {recordExpense.isPending ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card" style={{ padding: 0 }}>
                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-state">Chargement des dépenses...</div>
                    ) : filtered.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px' }}>
                            <TrendingDown size={48} style={{ opacity: 0.2 }} />
                            <h3>Aucune dépense enregistrée</h3>
                            <p>Cliquez sur "Nouvelle Dépense" pour commencer.</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Catégorie</th>
                                    <th>Référence</th>
                                    <th style={{ textAlign: 'right' }}>Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(e => {
                                    const cat = getCategoryStyle(e.categoryId);
                                    return (
                                        <tr key={e.id}>
                                            <td className="text-muted" style={{ fontSize: '13px' }}>
                                                {new Date(e.dateIncurred).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="font-bold">{e.description}</td>
                                            <td>
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    background: cat.color + '22',
                                                    color: cat.color
                                                }}>
                                                    {cat.label}
                                                </span>
                                            </td>
                                            <td className="text-muted">{e.referenceNumber || '—'}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                                                -{formatCurrency(e.amount)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, padding: '12px 16px', borderTop: '2px solid var(--border)' }}>
                                        Total :
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)', padding: '12px 16px', borderTop: '2px solid var(--border)', fontSize: '16px' }}>
                                        -{formatCurrency(totalExpenses)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
