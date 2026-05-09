'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Plus, Search, Loader2, X, Wallet, 
  Trash2, ShoppingCart, Lightbulb, UserCheck, 
  MoreHorizontal, Filter, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

const emptyForm = {
  description: '',
  amount: '',
  category: 'SUPPLIES',
  date: new Date().toISOString().split('T')[0],
  status: 'PAID'
};

const categories = [
  { value: 'SALARIES', label: 'Salaires & Paie', icon: <UserCheck size={14}/> },
  { value: 'UTILITIES', label: 'Eau / Électricité / Loyer', icon: <Lightbulb size={14}/> },
  { value: 'SUPPLIES', label: 'Fournitures & Matériel', icon: <ShoppingCart size={14}/> },
  { value: 'MAINTENANCE', label: 'Entretien & Réparations', icon: <div style={{width: 14}}/> },
  { value: 'OTHER', label: 'Autres charges', icon: <MoreHorizontal size={14}/> },
];

export default function ExpensesPage() {
    const router = useRouter();
    const toast = useToast();

    const [expenses, setExpenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [search, setSearch] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchExpenses = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/expenses');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setExpenses(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Erreur lors du chargement des dépenses.');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });
            if (!res.ok) throw new Error();
            toast.success('Dépense enregistrée');
            setShowModal(false);
            setFormData({ ...emptyForm });
            fetchExpenses();
        } catch {
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, description: string) => {
        if (!window.confirm(`Supprimer la dépense "${description}" ? Cette action est irréversible.`)) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Dépense supprimée');
            setExpenses(prev => prev.filter(e => e.id !== id));
        } catch {
            toast.error('Erreur lors de la suppression');
        } finally {
            setDeletingId(null);
        }
    };

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    const filtered = expenses.filter(e => 
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppLayout
            title="Sorties de Caisse"
            subtitle="Suivi des charges, salaires et factures fournisseurs"
            breadcrumbs={[{ label: 'Finance', href: '/invoices' }, { label: 'Dépenses' }]}
            actions={
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={15} /> Nouvelle Dépense
                </button>
            }
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="card shadow-sm" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--danger-dim)', display: 'grid', placeItems: 'center' }}>
                        <ArrowDownRight size={28} className="text-danger" />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total des charges</div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{totalAmount.toLocaleString()} XOF</div>
                    </div>
                </div>
                <div className="card shadow-sm" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-3)', display: 'grid', placeItems: 'center' }}>
                        <Filter size={24} className="text-primary" />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Nombre d'opérations</div>
                        <div style={{ fontSize: '24px', fontWeight: 800 }}>{expenses.length}</div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm" style={{ padding: 0 }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }} className="table-toolbar">
                    <div className="search-box" style={{ maxWidth: '400px' }}>
                        <Search size={15} />
                        <input 
                            type="text" 
                            placeholder="Rechercher une dépense..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="table-container">
                    {isLoading ? (
                        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p>Chargement du journal des dépenses...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description / Libellé</th>
                                    <th>Catégorie</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(e => (
                                    <tr key={e.id}>
                                        <td style={{ fontSize: '13px' }}>{new Date(e.date).toLocaleDateString()}</td>
                                        <td><strong style={{ color: 'var(--text)' }}>{e.description}</strong></td>
                                        <td>
                                            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                                                {e.category.toLowerCase()}
                                            </span>
                                        </td>
                                        <td><strong className="text-danger">{e.amount.toLocaleString()} XOF</strong></td>
                                        <td>
                                            <span className={`badge ${e.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                                                {e.status === 'PAID' ? 'Décaissé' : 'En attente'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button 
                                                className="btn-icon text-danger" 
                                                title="Supprimer"
                                                onClick={() => handleDelete(e.id, e.description)}
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <BarChart3 size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
                            <h3>Aucune dépense enregistrée</h3>
                            <p style={{ fontSize: '13px' }}>Il n'y a eu aucune sortie de caisse pour cette période.</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s var(--ease) both' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px' }}>Enregistrer une Dépense</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div className="form-group">
                                <label>Libellé de la dépense *</label>
                                <input 
                                    required 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                    placeholder="Ex: Achat craies, Facture EDM, Réparation clim..."
                                />
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Montant (XOF) *</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        required 
                                        value={formData.amount} 
                                        onChange={e => setFormData({...formData, amount: e.target.value})} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date *</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.date} 
                                        onChange={e => setFormData({...formData, date: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Catégorie *</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader2 size={16} className="spin" /> Envoi...</> : 'Valider la Sortie'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
