'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, AlertTriangle, ArrowUpRight, ArrowDownLeft, History, Loader2, Save, X, Filter, BarChart3, Tag } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function InventoryPage() {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  
  const filteredItems = items.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (i.sku && i.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout
      title="Gestion des Stocks"
      subtitle="Uniformes, fournitures, manuels et équipements scolaires"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Inventaire' }]}
      actions={
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm" onClick={() => setShowItemModal(true)}>
          <Plus size={18} className="mr-2" /> Nouvel Article
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl p-6 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-100 mb-2">Articles en Stock</p>
                <h2 className="text-4xl font-black mb-1">{items.length}</h2>
                <p className="text-xs text-blue-100 font-medium">Catégories actives : {Array.from(new Set(items.map(i => i.category))).length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Package size={24} className="text-white" />
              </div>
            </div>
            <Package size={120} className="absolute -bottom-10 -right-10 text-white/10" />
          </div>

          <div className={`rounded-3xl p-6 shadow-lg relative overflow-hidden transition-colors ${lowStockCount > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'}`}>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${lowStockCount > 0 ? 'text-red-100' : 'text-slate-500'}`}>Alertes Stock Bas</p>
                <h2 className={`text-4xl font-black mb-1 ${lowStockCount > 0 ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{lowStockCount}</h2>
                <p className={`text-xs font-medium ${lowStockCount > 0 ? 'text-red-100' : 'text-slate-500'}`}>Articles à réapprovisionner</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-white/20 backdrop-blur-sm' : 'bg-red-50 text-red-500'}`}>
                <AlertTriangle size={24} className={lowStockCount > 0 ? 'text-white' : 'text-red-500'} />
              </div>
            </div>
            <AlertTriangle size={120} className={`absolute -bottom-10 -right-10 ${lowStockCount > 0 ? 'text-white/10' : 'text-slate-100 dark:text-slate-800/50'}`} />
          </div>

          <div className="rounded-3xl p-6 shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Valeur du Stock</p>
                <h2 className="text-3xl font-black mb-1 text-slate-800 dark:text-slate-100">
                  {items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0).toLocaleString()} <span className="text-lg font-bold text-slate-400">FCFA</span>
                </h2>
                <p className="text-xs font-medium text-slate-500">Basé sur le prix unitaire déclaré</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <BarChart3 size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
             <div className="relative w-full sm:w-80">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                    type="text" 
                    placeholder="Rechercher un article ou SKU..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500 w-full" 
                />
             </div>
             <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Filter size={16} className="mr-2" /> Filtrer
                </Button>
             </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                <p className="font-semibold text-sm">Chargement de l'inventaire...</p>
              </div>
            ) : filteredItems.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Article</th>
                    <th className="px-6 py-5">Catégorie</th>
                    <th className="px-6 py-5">SKU / Code</th>
                    <th className="px-6 py-5">Quantité</th>
                    <th className="px-6 py-5">Prix Unitaire</th>
                    <th className="px-6 py-5">Statut</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                            <Package size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <strong className="block text-base font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1">{item.name}</strong>
                            <span className="text-xs text-slate-500 font-medium">{item.description || 'Pas de description'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                          <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-slate-600 dark:text-slate-400 font-semibold">{item.sku || 'N/A'}</code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-slate-800 dark:text-slate-100">{item.quantity}</span>
                          {item.quantity <= item.minThreshold && <AlertTriangle size={16} className="text-red-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                          {item.unitPrice.toLocaleString()} <span className="text-[10px] uppercase text-slate-400 ml-1">FCFA</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.quantity > item.minThreshold 
                          ? <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">En Stock</span>
                          : item.quantity > 0 
                            ? <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">Stock Faible</span>
                            : <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">Rupture</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-colors" 
                            title="Entrée/Sortie"
                            onClick={() => { setSelectedItem(item); setShowMoveModal(true); }}
                          >
                            <ArrowUpRight size={16} strokeWidth={2.5} />
                          </button>
                          <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors" title="Historique">
                            <History size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 m-6 rounded-3xl">
                <Package size={64} className="opacity-20 mb-4" />
                <h3 className="text-lg font-bold text-slate-600 mb-1">Aucun article trouvé</h3>
                <p className="text-sm">Votre inventaire est vide ou ne correspond pas à la recherche.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal: New Item */}
      <AnimatePresence>
        {showItemModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Tag className="text-blue-600" size={20} /> Nouvel Article
                </h3>
                <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500" onClick={() => setShowItemModal(false)}>
                    <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateItem} className="p-6 flex flex-col gap-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom de l'article *</label>
                    <Input required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500 h-11" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</label>
                    <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Fourniture">Fourniture</option>
                      <option value="Uniforme">Uniforme</option>
                      <option value="Manuel">Manuel Scolaire</option>
                      <option value="Équipement">Équipement</option>
                      <option value="Cantine">Cantine / Alimentation</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Code interne</label>
                      <Input value={itemForm.sku} onChange={e => setItemForm({...itemForm, sku: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500 h-11 font-mono text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prix Unitaire (FCFA)</label>
                      <Input type="number" required value={itemForm.unitPrice} onChange={e => setItemForm({...itemForm, unitPrice: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500 h-11" />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Seuil d'alerte</label>
                      <Input type="number" required value={itemForm.minThreshold} onChange={e => setItemForm({...itemForm, minThreshold: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500 h-11" />
                  </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantité Initiale</label>
                    <Input type="number" required value={itemForm.initialQuantity} onChange={e => setItemForm({...itemForm, initialQuantity: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500 h-11" />
                </div>
                
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <Button type="button" variant="ghost" onClick={() => setShowItemModal(false)} className="rounded-xl hover:bg-slate-100">Annuler</Button>
                   <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-md shadow-blue-500/20" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                     Créer l'article
                   </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Movement (IN/OUT) */}
      <AnimatePresence>
        {showMoveModal && selectedItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <ArrowUpRight className="text-blue-600" size={20} /> Mouvement
                </h3>
                <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500" onClick={() => setShowMoveModal(false)}>
                    <X size={18} />
                </button>
              </div>
              
              <div className="px-6 pt-6 pb-2">
                 <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{selectedItem.name}</div>
                        <div className="text-xs text-slate-500">Stock Actuel : <span className="font-bold text-slate-700">{selectedItem.quantity}</span></div>
                    </div>
                    <Package size={24} className="text-slate-300" />
                 </div>
              </div>

              <form onSubmit={handleMovement} className="p-6 flex flex-col gap-5 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type de Mouvement</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                      type="button" 
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${moveForm.type === 'IN' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setMoveForm({...moveForm, type: 'IN'})}
                    >
                      <ArrowDownLeft size={16} /> Entrée (+ ajout)
                    </button>
                    <button 
                      type="button" 
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${moveForm.type === 'OUT' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      onClick={() => setMoveForm({...moveForm, type: 'OUT'})}
                    >
                      <ArrowUpRight size={16} /> Sortie (- retrait)
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantité</label>
                  <Input type="number" required min="1" value={moveForm.quantity} onChange={e => setMoveForm({...moveForm, quantity: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500 h-11 text-lg font-bold" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Note / Justification</label>
                  <Input placeholder="Ex: Livraison fournisseur..." value={moveForm.notes} onChange={e => setMoveForm({...moveForm, notes: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500 h-11" />
                </div>
                
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <Button type="button" variant="ghost" onClick={() => setShowMoveModal(false)} className="rounded-xl hover:bg-slate-100">Annuler</Button>
                   <Button type="submit" className={`text-white rounded-xl px-8 font-bold ${moveForm.type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'} shadow-md`} disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                     Valider le {moveForm.type === 'IN' ? 'Dépôt' : 'Retrait'}
                   </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppLayout>
  );
}
