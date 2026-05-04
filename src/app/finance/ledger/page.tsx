'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Landmark, ArrowUpRight, ArrowDownRight, Search, Download, Filter, Loader2, Calendar, FileText, ChevronRight } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { motion } from 'framer-motion';

export default function GeneralLedgerPage() {
  const toast = useToast();
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/ledger');
      if (res.ok) setLedger(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  const filteredLedger = ledger.filter(l => 
    l.description.toLowerCase().includes(search.toLowerCase()) || 
    l.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = ledger.filter(l => l.type === 'REVENUE').reduce((s, l) => s + l.amount, 0);
  const totalExpense = Math.abs(ledger.filter(l => l.type === 'EXPENSE').reduce((s, l) => s + l.amount, 0));

  return (
    <AppLayout
      title="Grand Livre Comptable"
      subtitle="Historique universel des flux de trésorerie (Recettes & Dépenses)"
      breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Grand Livre' }]}
      actions={
        <button className="btn-primary" onClick={() => toast.info('Export PDF bientôt disponible')}>
          <Download size={16} /> Exporter Journal
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        
        {/* Résumé Rapide */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="card shadow-sm" style={{ padding: '20px', borderLeft: '4px solid var(--success)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Recettes Totales</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--success)', marginTop: '4px' }}>+{totalRevenue.toLocaleString()} FCFA</div>
          </div>
          <div className="card shadow-sm" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Dépenses Totales</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--danger)', marginTop: '4px' }}>-{totalExpense.toLocaleString()} FCFA</div>
          </div>
          <div className="card shadow-sm" style={{ padding: '20px', borderLeft: '4px solid var(--primary)', background: 'var(--bg-3)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Solde Net</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', marginTop: '4px' }}>{(totalRevenue - totalExpense).toLocaleString()} FCFA</div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div className="search-box" style={{ width: '400px' }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Rechercher par libellé, élève ou catégorie..." 
                  className="form-input" 
                  style={{ border: 'none', background: 'transparent' }} 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-ghost" style={{ fontSize: '12px' }}><Filter size={14} /> Période</button>
             </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ padding: '80px', textAlign: 'center' }}><Loader2 size={32} className="spin text-primary" /></div>
            ) : filteredLedger.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Date</th>
                    <th>Libellé / Description</th>
                    <th>Catégorie</th>
                    <th>Méthode</th>
                    <th style={{ textAlign: 'right' }}>Débit (-)</th>
                    <th style={{ textAlign: 'right' }}>Crédit (+)</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((log, idx) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '32px', height: '32px', borderRadius: '8px', 
                            background: log.type === 'REVENUE' ? 'var(--success-dim)' : 'var(--danger-dim)',
                            display: 'grid', placeItems: 'center'
                          }}>
                            {log.type === 'REVENUE' ? <ArrowUpRight size={14} className="text-success" /> : <ArrowDownRight size={14} className="text-danger" />}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>
                            {new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ display: 'block', fontSize: '14px' }}>{log.description}</strong>
                        {log.reference && <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Réf: {log.reference}</span>}
                      </td>
                      <td><span className="badge badge-primary" style={{ opacity: 0.8 }}>{log.category}</span></td>
                      <td style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>{log.method}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger)' }}>
                        {log.amount < 0 ? Math.abs(log.amount).toLocaleString() : ''}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>
                        {log.amount > 0 ? log.amount.toLocaleString() : ''}
                      </td>
                      <td>
                        <button className="btn-icon"><ChevronRight size={16} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Landmark size={64} style={{ opacity: 0.1, margin: '0 auto 20px' }} />
                <h3>Aucune transaction trouvée</h3>
                <p>Vos flux financiers apparaîtront ici après saisie des paiements ou dépenses.</p>
              </div>
            )}
          </div>
        </div>

        {/* Export Footer */}
        <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={18} className="text-primary" />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Ce grand livre certifie l'intégralité des flux financiers pour l'exercice en cours.
            </span>
          </div>
          <button className="btn-outline" style={{ fontSize: '12px' }}>Télécharger le Registre</button>
        </div>

      </div>
    </AppLayout>
  );
}
