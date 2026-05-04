'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Book as BookIcon, Plus, Search, BookOpen, Clock, User, Bookmark, Loader2, Save, X, Filter, BarChart3, Hash } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function LibraryPage() {
  const toast = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lists for search
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [bookForm, setBookForm] = useState({
    title: '', author: '', isbn: '', category: 'Sciences', totalCopies: '1', shelfLocation: ''
  });

  const [loanForm, setLoanForm] = useState({
    targetType: 'STUDENT', studentId: '', employeeId: '', dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  });

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/library');
      if (res.ok) setBooks(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchLibrary();
    // Pre-fetch for search
    fetch('/api/students?pageSize=50').then(r => r.json()).then(d => setStudents(d.items || []));
    fetch('/api/employees').then(r => r.json()).then(d => setEmployees(d || []));
  }, [fetchLibrary]);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm)
      });
      if (!res.ok) throw new Error();
      toast.success('Livre ajouté au catalogue.');
      setShowBookModal(false);
      setBookForm({ title: '', author: '', isbn: '', category: 'Sciences', totalCopies: '1', shelfLocation: '' });
      fetchLibrary();
    } catch {
      toast.error("Erreur lors de l'ajout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/library/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook.id,
          studentId: loanForm.targetType === 'STUDENT' ? loanForm.studentId : null,
          employeeId: loanForm.targetType === 'STAFF' ? loanForm.employeeId : null,
          dueDate: loanForm.dueDate
        })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      toast.success('Prêt enregistré avec succès.');
      setShowLoanModal(false);
      fetchLibrary();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du prêt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Bibliothèque Numérique"
      subtitle="Gestion des ouvrages, prêts et retours de manuels"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Bibliothèque' }]}
      actions={
        <button className="btn-primary" onClick={() => setShowBookModal(true)}>
          <Plus size={16} /> Ajouter un Livre
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        
        {/* Books Grid */}
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}><Loader2 size={40} className="spin text-primary" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {books.map(book => (
              <motion.div 
                key={book.id} 
                className="card hover-glow" 
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ padding: '20px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {book.availableCopies > 0 ? `${book.availableCopies} Dispo.` : 'Rupture'}
                    </span>
                  </div>
                  <BookIcon size={32} className="text-primary" style={{ marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>{book.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600 }}>{book.author}</p>
                </div>
                
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Catégorie:</span>
                    <span style={{ fontWeight: 700 }}>{book.category}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Emplacement:</span>
                    <span style={{ fontWeight: 700 }}>{book.shelfLocation || 'Non spécifié'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ISBN:</span>
                    <code>{book.isbn || '—'}</code>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, fontSize: '12px', padding: '8px' }}
                      disabled={book.availableCopies <= 0}
                      onClick={() => { setSelectedBook(book); setShowLoanModal(true); }}
                    >
                      <Bookmark size={14} /> Prêter
                    </button>
                    <button className="btn-outline" style={{ fontSize: '12px', padding: '8px' }}>
                      Détails
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Modal: Add Book */}
      <AnimatePresence>
        {showBookModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ width: '100%', maxWidth: '500px', padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800 }}>Nouvel Ouvrage</h3>
                <button className="btn-icon" onClick={() => setShowBookModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateBook} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group"><label>Titre de l'ouvrage *</label><input required value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} className="form-input" /></div>
                <div className="form-group"><label>Auteur *</label><input required value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} className="form-input" /></div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Catégorie</label>
                    <select value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})} className="form-input">
                      <option value="Sciences">Sciences</option>
                      <option value="Littérature">Littérature</option>
                      <option value="Histoire">Histoire / Géo</option>
                      <option value="Langues">Langues</option>
                      <option value="Manuels">Manuels Scolaires</option>
                    </select>
                  </div>
                  <div className="form-group"><label>ISBN</label><input value={bookForm.isbn} onChange={e => setBookForm({...bookForm, isbn: e.target.value})} className="form-input" /></div>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group"><label>Nb. Exemplaires</label><input type="number" value={bookForm.totalCopies} onChange={e => setBookForm({...bookForm, totalCopies: e.target.value})} className="form-input" /></div>
                  <div className="form-group"><label>Rayonnage</label><input value={bookForm.shelfLocation} onChange={e => setBookForm({...bookForm, shelfLocation: e.target.value})} className="form-input" placeholder="Ex: A12" /></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                   <button type="button" className="btn-ghost" onClick={() => setShowBookModal(false)}>Annuler</button>
                   <button type="submit" className="btn-primary" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Ajouter au catalogue'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Loan Book */}
      <AnimatePresence>
        {showLoanModal && selectedBook && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ width: '100%', maxWidth: '450px', padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800 }}>Prêt : {selectedBook.title}</h3>
                <button className="btn-icon" onClick={() => setShowLoanModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleLoan} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Type d'emprunteur</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setLoanForm({...loanForm, targetType: 'STUDENT'})} className={loanForm.targetType === 'STUDENT' ? 'btn-primary' : 'btn-outline'} style={{ flex: 1, fontSize: '11px' }}>Élève</button>
                    <button type="button" onClick={() => setLoanForm({...loanForm, targetType: 'STAFF'})} className={loanForm.targetType === 'STAFF' ? 'btn-primary' : 'btn-outline'} style={{ flex: 1, fontSize: '11px' }}>Personnel</button>
                  </div>
                </div>

                {loanForm.targetType === 'STUDENT' ? (
                  <div className="form-group">
                    <label>Sélectionner l'élève</label>
                    <select required value={loanForm.studentId} onChange={e => setLoanForm({...loanForm, studentId: e.target.value})} className="form-input">
                      <option value="">-- Choisir --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentNumber})</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Sélectionner l'employé</label>
                    <select required value={loanForm.employeeId} onChange={e => setLoanForm({...loanForm, employeeId: e.target.value})} className="form-input">
                      <option value="">-- Choisir --</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Date de retour prévue</label>
                  <input type="date" required value={loanForm.dueDate} onChange={e => setLoanForm({...loanForm, dueDate: e.target.value})} className="form-input" />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                   <button type="button" className="btn-ghost" onClick={() => setShowLoanModal(false)}>Annuler</button>
                   <button type="submit" className="btn-primary" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Confirmer le Prêt'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .hover-glow:hover {
          box-shadow: 0 10px 30px rgba(79, 142, 247, 0.15);
          transform: translateY(-4px);
        }
        .hover-glow { transition: all 0.3s ease; }
      `}</style>
    </AppLayout>
  );
}
