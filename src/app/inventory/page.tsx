'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownLeft, History, Loader2, Save, X, Filter, BarChart3, Tag } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [itemForm, setItemForm] = useState({
    name: '', category: 'Fourniture', sku: '', description: '', unitPrice: '', minThreshold: '5', initialQuantity: '0'
  });

  const [moveForm, setMoveForm] = useState({
    type: 'IN', quantity: '', notes: ''
  });

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemForm)
      });
      if (!res.ok) throw new Error();
      toast.success('Article ajouté au stock.');
      setShowItemModal(false);
      setItemForm({ name: '', category: 'Fourniture', sku: '', description: '', unitPrice: '', minThreshold: '5', initialQuantity: '0' });
      fetchInventory();
    } catch {
      toast.error("Erreur lors de l'ajout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...moveForm, itemId: selectedItem.id })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast.success('Mouvement de stock enregistré.');
      setShowMoveModal(false);
      setMoveForm({ type: 'IN', quantity: '', notes: '' });
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du mouvement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lowStockCount = items.filter(i => i.quantity <= i.minThreshold).length;

  return (
    <AppLayout
      title="Gestion des Stocks"
      subtitle="Uniformes, fournitures, manuels et équipements scolaires"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Inventaire' }]}
      actions={
        <button className="btn-primary" onClick={() => setShowItemModal(true)}>
          <Plus size={16} /> Nouvel Article
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div className="card shadow-sm" style={{ padding: '24px', background: 'linear-gradient(135deg, #4f8ef7, #3b6fd4)', color: 'white', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Articles en Stock</p>
                <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '8px 0' }}>{items.length}</h2>
                <p style={{ fontSize: '11px', opacity: 0.7 }}>Catégories actives : {Array.from(new Set(items.map(i => i.category))).length}</p>
              </div>
              <Package size={32} style={{ opacity: 0.2 }} />
            </div>
          </div>
          <div className="card shadow-sm" style={{ padding: '24px', background: lowStockCount > 0 ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'var(--bg-2)', color: lowStockCount > 0 ? 'white' : 'var(--text)', border: lowStockCount > 0 ? 'none' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Alertes Stock Bas</p>
                <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '8px 0' }}>{lowStockCount}</h2>
                <p style={{ fontSize: '11px', opacity: 0.7 }}>Articles à réapprovisionner</p>
              </div>
              <AlertTriangle size={32} style={{ opacity: 0.2 }} />
            </div>
          </div>
          <div className="card shadow-sm" style={{ padding: '24px', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valeur du Stock</p>
                <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '8px 0' }}>
                  {items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>FCFA</span>
                </h2>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Basé sur le prix unitaire déclaré</p>
              </div>
              <BarChart3 size={32} className="text-primary" style={{ opacity: 0.2 }} />
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div className="search-box" style={{ width: '300px' }}>
                <Search size={16} />
                <input type="text" placeholder="Rechercher un article..." className="form-input" style={{ border: 'none', background: 'transparent' }} />
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ghost" style={{ fontSize: '12px' }}><Filter size={14} /> Filtrer</button>
             </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}><Loader2 size={32} className="spin text-primary" /></div>
            ) : items.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Catégorie</th>
                    <th>SKU / Code</th>
                    <th>Quantité</th>
                    <th>Prix Unitaire</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', background: 'var(--bg-3)', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
                            <Package size={16} className="text-primary" />
                          </div>
                          <div>
                            <strong style={{ display: 'block' }}>{item.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{item.description || 'Pas de description'}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-info">{item.category}</span></td>
                      <td><code style={{ fontSize: '11px' }}>{item.sku || 'N/A'}</code></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 800 }}>{item.quantity}</span>
                          {item.quantity <= item.minThreshold && <AlertTriangle size={14} className="text-danger" />}
                        </div>
                      </td>
                      <td>{item.unitPrice.toLocaleString()} FCFA</td>
                      <td>
                        {item.quantity > item.minThreshold 
                          ? <span className="badge badge-success">En Stock</span>
                          : item.quantity > 0 
                            ? <span className="badge badge-warning">Stock Faible</span>
                            : <span className="badge badge-danger">Rupture</span>
                        }
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-icon" 
                            title="Entrée/Sortie"
                            onClick={() => { setSelectedItem(item); setShowMoveModal(true); }}
                          >
                            <ArrowUpRight size={16} className="text-success" />
                          </button>
                          <button className="btn-icon" title="Historique"><History size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Package size={48} style={{ opacity: 0.1, margin: '0 auto 16px' }} />
                <p>Aucun article enregistré.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal: New Item */}
      <AnimatePresence>
        {showItemModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ width: '100%', maxWidth: '500px', padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800 }}>Nouvel Article</h3>
                <button className="btn-icon" onClick={() => setShowItemModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateItem} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group"><label>Nom de l'article *</label><input required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="form-input" /></div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Catégorie</label>
                    <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} className="form-input">
                      <option value="Fourniture">Fourniture</option>
                      <option value="Uniforme">Uniforme</option>
                      <option value="Manuel">Manuel Scolaire</option>
                      <option value="Équipement">Équipement</option>
                      <option value="Cantine">Cantine / Alimentation</option>
                    </select>
                  </div>
                  <div className="form-group"><label>SKU / Code interne</label><input value={itemForm.sku} onChange={e => setItemForm({...itemForm, sku: e.target.value})} className="form-input" /></div>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group"><label>Prix Unitaire (FCFA)</label><input type="number" value={itemForm.unitPrice} onChange={e => setItemForm({...itemForm, unitPrice: e.target.value})} className="form-input" /></div>
                  <div className="form-group"><label>Seuil d'alerte</label><input type="number" value={itemForm.minThreshold} onChange={e => setItemForm({...itemForm, minThreshold: e.target.value})} className="form-input" /></div>
                </div>
                <div className="form-group"><label>Quantité Initiale</label><input type="number" value={itemForm.initialQuantity} onChange={e => setItemForm({...itemForm, initialQuantity: e.target.value})} className="form-input" /></div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                   <button type="button" className="btn-ghost" onClick={() => setShowItemModal(false)}>Annuler</button>
                   <button type="submit" className="btn-primary" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Créer l\'article'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Movement (IN/OUT) */}
      <AnimatePresence>
        {showMoveModal && selectedItem && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ width: '100%', maxWidth: '400px', padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800 }}>Mouvement : {selectedItem.name}</h3>
                <button className="btn-icon" onClick={() => setShowMoveModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleMovement} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button" 
                    className={moveForm.type === 'IN' ? 'btn-primary' : 'btn-outline'} 
                    style={{ flex: 1 }}
                    onClick={() => setMoveForm({...moveForm, type: 'IN'})}
                  >
                    <ArrowDownLeft size={14} /> Entrée
                  </button>
                  <button 
                    type="button" 
                    className={moveForm.type === 'OUT' ? 'btn-danger' : 'btn-outline'} 
                    style={{ flex: 1 }}
                    onClick={() => setMoveForm({...moveForm, type: 'OUT'})}
                  >
                    <ArrowUpRight size={14} /> Sortie
                  </button>
                </div>
                <div className="form-group">
                  <label>Quantité ({selectedItem.quantity} en stock)</label>
                  <input type="number" required min="1" value={moveForm.quantity} onChange={e => setMoveForm({...moveForm, quantity: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label>Note / Justification</label>
                  <input placeholder="Ex: Livraison fournisseur, Distribution aux élèves..." value={moveForm.notes} onChange={e => setMoveForm({...moveForm, notes: e.target.value})} className="form-input" />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                   <button type="button" className="btn-ghost" onClick={() => setShowMoveModal(false)}>Annuler</button>
                   <button type="submit" className={moveForm.type === 'IN' ? 'btn-primary' : 'btn-danger'} disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Valider'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppLayout>
  );
}
