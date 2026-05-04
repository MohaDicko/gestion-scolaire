'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Receipt, Plus, Search, Loader2, X, Wallet, 
  CreditCard, CheckCircle2, AlertCircle, FileDown, Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

const emptyForm = {
  studentId: '', title: '', amount: '', dueDate: new Date().toISOString().split('T')[0], type: 'TUITION', paymentMethod: 'ESPECES'
};

export default function InvoicesPage() {
  const router = useRouter();
  const toast = useToast();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'ESPECES', reference: '', notes: '' });
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/invoices');
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erreur lors du chargement des factures.');
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    fetchInvoices();
    fetch('/api/students?pageNumber=1&pageSize=1000')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.items)) setStudents(d.items); })
      .catch(() => {});
  }, [fetchInvoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'émission');
      toast.success('Facture émise avec succès.');
      setShowModal(false);
      setFormData({ ...emptyForm });
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setPaymentForm({ ...paymentForm, amount: inv.amount.toString() });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          ...paymentForm,
          amount: parseFloat(paymentForm.amount)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du paiement');
      toast.success('Paiement enregistré avec succès.');
      setShowPaymentModal(false);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = invoices.filter(inv => 
    inv.student?.firstName.toLowerCase().includes(search.toLowerCase()) ||
    inv.student?.lastName.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout
      title="Comptabilité des Élèves"
      subtitle="Gestion de la facturation, des scolarités et suivi des encaissements"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Facturation' }]}
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" onClick={() => router.push('/students/enroll')}>
            <Plus size={15} /> Nouvelle Inscription
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Receipt size={15} /> Émettre Facture
          </button>
        </div>
      }
    >
      <div className="card shadow-sm" style={{ padding: 0 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }} className="table-toolbar">
          <div className="search-box" style={{ maxWidth: '400px' }}>
            <Search size={15} />
            <input 
              type="text" 
              placeholder="Rechercher un élève ou n° facture..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-container">
          {isLoading ? (
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p>Chargement du grand livre...</p>
            </div>
          ) : filtered.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Élève (Débiteur)</th>
                  <th>Libellé / Type</th>
                  <th>Montant</th>
                  <th>Échéance</th>
                  <th>Mode</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.invoiceNumber}</span></td>
                    <td>
                      <strong style={{ color: 'var(--text)' }}>{inv.student?.firstName} {inv.student?.lastName}</strong><br />
                      <span className="text-muted" style={{ fontSize: '11px' }}>{inv.student?.studentNumber}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.title}</div>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{inv.type}</span>
                    </td>
                    <td><strong className={inv.status === 'PAID' ? 'text-primary' : 'text-danger'}>{inv.amount.toLocaleString()} XOF</strong></td>
                    <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td><span style={{fontSize: '11px', fontWeight: 600}}>{inv.paymentMethod || '—'}</span></td>
                    <td>
                      <span className={`badge ${inv.status === 'PAID' ? 'badge-primary' : 'badge-danger'}`}>
                        {inv.status === 'PAID' ? 'Payée' : 'IMPAYÉE'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn-icon" title="Voir détails" onClick={() => router.push(`/students/${inv.studentId}`)}><Eye size={14}/></button>
                        {inv.status !== 'PAID' && (
                          <button className="btn-icon text-success" title="Enregistrer paiement" onClick={() => handleOpenPayment(inv)}><CreditCard size={14}/></button>
                        )}
                        <button className="btn-icon" title="Télécharger PDF"><FileDown size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Receipt size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
              <h3>Aucune facture trouvée</h3>
              <p style={{ fontSize: '13px' }}>Toutes les mensualités sont à jour pour cette sélection.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '580px', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s var(--ease) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px' }}>Émettre une Facture Individuelle</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label>Sélectionner l'Élève *</label>
                <select required value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})}>
                  <option value="">-- Choisir un élève --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.studentNumber})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Objet de la facture *</label>
                <input 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ex: Scolarité Octobre 2025, Frais d'inscription..."
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
                  <label>Mode de paiement par défaut *</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                    <option value="ESPECES">Espèces (Cash)</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="MOOV_MONEY">Moov Money</option>
                    <option value="VIREMENT">Virement / Chèque</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 size={16} className="spin" /> Émission...</> : 'Valider & Envoyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s var(--ease) both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>Enregistrer un Paiement</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Facture {selectedInvoice.invoiceNumber} — {selectedInvoice.student?.firstName}</p>
              </div>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handlePaymentSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: 'var(--bg-fluid)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Reste à payer :</span>
                <strong style={{ fontSize: '18px', color: 'var(--danger)' }}>{selectedInvoice.amount.toLocaleString()} XOF</strong>
              </div>

              <div className="form-group">
                <label>Montant encaissé (XOF) *</label>
                <input 
                  type="number" 
                  required 
                  value={paymentForm.amount} 
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>Mode de règlement *</label>
                <select required value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}>
                  <option value="ESPECES">Espèces (Cash)</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="MOOV_MONEY">Moov Money</option>
                  <option value="VIREMENT">Virement Bancaire</option>
                </select>
              </div>

              <div className="form-group">
                <label>Référence (facultatif)</label>
                <input 
                  placeholder="ID transaction, n° chèque..." 
                  value={paymentForm.reference} 
                  onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowPaymentModal(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: 'var(--success)', border: 'none' }}>
                  {isSubmitting ? <><Loader2 size={16} className="spin" /> Validation...</> : 'Confirmer l\'Encaissement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
