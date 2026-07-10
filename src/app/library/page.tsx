'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Book as BookIcon, Users, Loader2, Plus, Search, CheckCircle2, AlertTriangle, BookOpen, Clock, X, Bookmark } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'loans'>('inventory');
  
  const [books, setBooks] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Book Form
  const [bookForm, setBookForm] = useState({ title: '', author: '', isbn: '', category: 'Sciences', totalCopies: 1, shelfLocation: '' });
  
  // New Loan Form
  const [loanForm, setLoanForm] = useState({ targetType: 'STUDENT', studentId: '', employeeId: '', dueDate: '' });
  
  // Lists for dropdowns
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resBooks, resLoans, resStudents, resEmp] = await Promise.all([
        fetch('/api/library'),
        fetch('/api/library/loans'),
        fetch('/api/students?pageSize=50'),
        fetch('/api/employees')
      ]);
      
      if (resBooks.ok) setBooks(await resBooks.json());
      if (resLoans.ok) setLoans(await resLoans.json());
      if (resStudents.ok) {
        const d = await resStudents.json();
        setStudents(d.items || []);
      }
      if (resEmp.ok) setEmployees(await resEmp.json());
      
    } catch (e) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
    // Default due date to 14 days from now
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setLoanForm(prev => ({ ...prev, dueDate: d.toISOString().split('T')[0] }));
  }, [fetchData]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookForm)
      });
      if (res.ok) {
        toast.success('Livre ajouté à l\'inventaire');
        setIsAddBookModalOpen(false);
        setBookForm({ title: '', author: '', isbn: '', category: 'Sciences', totalCopies: 1, shelfLocation: '' });
        fetchData();
      } else {
        toast.error('Erreur d\'ajout');
      }
    } catch (e) {
      toast.error('Erreur réseau');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
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
      if (res.ok) {
        toast.success('Prêt enregistré');
        setIsNewLoanModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors du prêt');
      }
    } catch (e) {
      toast.error('Erreur réseau');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnBook = async (loanId: string) => {
    try {
      const res = await fetch('/api/library/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, status: 'RETURNED' })
      });
      if (res.ok) {
        toast.success('Livre retourné avec succès !');
        fetchData();
      } else {
        toast.error('Erreur de retour');
      }
    } catch (e) {
      toast.error('Erreur réseau');
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Bibliothèque Numérique" subtitle="Gestion des ouvrages, prêts et retours">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TABS */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'}`}
          >
            <BookIcon className="w-4 h-4" /> Inventaire
          </button>
          <button 
            onClick={() => setActiveTab('loans')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'loans' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'}`}
          >
            <Users className="w-4 h-4" /> Prêts en cours
            {loans.filter(l => l.status === 'BORROWED').length > 0 && (
              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{loans.filter(l => l.status === 'BORROWED').length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Chercher un livre (Titre, Auteur)..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <Button onClick={() => setIsAddBookModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Ajouter un livre
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBooks.map(book => (
                    <motion.div 
                      key={book.id} 
                      className="card hover-glow" 
                      style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{ padding: '20px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                          <span className={`badge ${book.availableCopies > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {book.availableCopies > 0 ? `${book.availableCopies} Dispo.` : 'Rupture'}
                          </span>
                        </div>
                        <BookIcon size={32} className="text-primary" style={{ marginBottom: '12px' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }} className="line-clamp-2">{book.title}</h3>
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
                            onClick={() => { setSelectedBook(book); setIsNewLoanModalOpen(true); }}
                          >
                            <Bookmark size={14} className="mr-1" style={{ display: 'inline' }} /> Prêter
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredBooks.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-500">Aucun livre trouvé.</div>
                  )}
                </div>
              </div>
            )}

            {/* LOANS TAB */}
            {activeTab === 'loans' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Livre</th>
                          <th className="px-6 py-4">Emprunteur</th>
                          <th className="px-6 py-4">Date Prêt</th>
                          <th className="px-6 py-4">Date Limite</th>
                          <th className="px-6 py-4">Statut</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loans.map(loan => {
                          const isOverdue = loan.status === 'BORROWED' && new Date(loan.dueDate) < new Date();
                          return (
                            <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{loan.book?.title}</td>
                              <td className="px-6 py-4">
                                {loan.student ? `${loan.student.firstName} ${loan.student.lastName}` : 'Personnel'}
                                {loan.student && <div className="text-xs text-slate-400">{loan.student.studentNumber}</div>}
                              </td>
                              <td className="px-6 py-4 text-slate-500">{new Date(loan.loanDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                  {isOverdue && <AlertTriangle className="w-3 h-3" />}
                                  {new Date(loan.dueDate).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {loan.status === 'RETURNED' ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-none">Retourné</Badge>
                                ) : isOverdue ? (
                                  <Badge className="bg-red-100 text-red-700 border-none">En Retard</Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-700 border-none">En cours</Badge>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {loan.status === 'BORROWED' && (
                                  <Button onClick={() => handleReturnBook(loan.id)} size="sm" variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Rendu
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {loans.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Aucun prêt enregistré.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL ADD BOOK */}
      <AnimatePresence>
        {isAddBookModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ width: '100%', maxWidth: '500px', padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800 }}>Nouvel Ouvrage</h3>
                <button className="btn-icon" onClick={() => setIsAddBookModalOpen(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleAddBook} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  <div className="form-group"><label>Nb. Exemplaires</label><input type="number" min="1" value={bookForm.totalCopies} onChange={e => setBookForm({...bookForm, totalCopies: parseInt(e.target.value)})} className="form-input" /></div>
                  <div className="form-group"><label>Rayonnage</label><input value={bookForm.shelfLocation} onChange={e => setBookForm({...bookForm, shelfLocation: e.target.value})} className="form-input" placeholder="Ex: A12" /></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                   <button type="button" className="btn-ghost" onClick={() => setIsAddBookModalOpen(false)}>Annuler</button>
                   <button type="submit" className="btn-primary" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Ajouter au catalogue'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL NEW LOAN */}
      <AnimatePresence>
        {isNewLoanModalOpen && selectedBook && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ width: '100%', maxWidth: '450px', padding: 0 }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800 }}>Prêt : {selectedBook.title}</h3>
                <button className="btn-icon" onClick={() => setIsNewLoanModalOpen(false)}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateLoan} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  <label>Date limite de retour</label>
                  <input type="date" required value={loanForm.dueDate} onChange={e => setLoanForm({...loanForm, dueDate: e.target.value})} className="form-input" />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                   <button type="button" className="btn-ghost" onClick={() => setIsNewLoanModalOpen(false)}>Annuler</button>
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
