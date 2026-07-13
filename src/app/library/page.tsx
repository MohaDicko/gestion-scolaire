'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Book as BookIcon, Users, Loader2, Plus, Search, CheckCircle2, AlertTriangle, X, Bookmark } from 'lucide-react';
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
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'}`}
          >
            <BookIcon className="w-4 h-4" /> Inventaire
          </button>
          <button 
            onClick={() => setActiveTab('loans')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'loans' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'}`}
          >
            <Users className="w-4 h-4" /> Prêts en cours
            {loans.filter(l => l.status === 'BORROWED').length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {loans.filter(l => l.status === 'BORROWED').length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
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
                      className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 rounded-xl"
                    />
                  </div>
                  <Button onClick={() => setIsAddBookModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" /> Ajouter un livre
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBooks.map(book => (
                    <motion.div 
                      key={book.id} 
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 relative">
                        <div className="absolute top-4 right-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${book.availableCopies > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {book.availableCopies > 0 ? `${book.availableCopies} Dispo.` : 'Rupture'}
                          </span>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <BookIcon size={24} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-sm font-semibold text-slate-500">{book.author}</p>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">Catégorie:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{book.category}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">Emplacement:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{book.shelfLocation || 'Non spécifié'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">ISBN:</span>
                          <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-slate-600 dark:text-slate-400">{book.isbn || '—'}</code>
                        </div>

                        <div className="mt-auto pt-4">
                          <Button 
                            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl"
                            disabled={book.availableCopies <= 0}
                            onClick={() => { setSelectedBook(book); setIsNewLoanModalOpen(true); }}
                          >
                            <Bookmark size={16} className="mr-2" /> Prêter ce livre
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredBooks.length === 0 && (
                    <div className="col-span-full text-center py-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <BookIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                      <h3 className="text-lg font-bold text-slate-500">Aucun livre trouvé</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* LOANS TAB */}
            {activeTab === 'loans' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-3xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-5">Livre</th>
                          <th className="px-6 py-5">Emprunteur</th>
                          <th className="px-6 py-5">Date Prêt</th>
                          <th className="px-6 py-5">Date Limite</th>
                          <th className="px-6 py-5">Statut</th>
                          <th className="px-6 py-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loans.map(loan => {
                          const isOverdue = loan.status === 'BORROWED' && new Date(loan.dueDate) < new Date();
                          return (
                            <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">{loan.book?.title}</td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-slate-700 dark:text-slate-300">
                                  {loan.student ? `${loan.student.firstName} ${loan.student.lastName}` : 'Personnel'}
                                </div>
                                {loan.student && <div className="text-xs text-slate-400 font-mono">{loan.student.studentNumber}</div>}
                              </td>
                              <td className="px-6 py-4 text-slate-500 font-medium">{new Date(loan.loanDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className={`flex items-center gap-1.5 font-bold ${isOverdue ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {isOverdue && <AlertTriangle className="w-4 h-4" />}
                                  {new Date(loan.dueDate).toLocaleDateString()}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {loan.status === 'RETURNED' ? (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">Retourné</span>
                                ) : isOverdue ? (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">En Retard</span>
                                ) : (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700">En cours</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {loan.status === 'BORROWED' && (
                                  <Button onClick={() => handleReturnBook(loan.id)} size="sm" variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-xl">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Rendu
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {loans.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">Aucun prêt enregistré actuellement.</td>
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
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <BookIcon className="text-blue-600" size={20} /> Nouvel Ouvrage
                </h3>
                <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500" onClick={() => setIsAddBookModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddBook} className="p-6 flex flex-col gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titre de l'ouvrage *</label>
                  <Input required value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auteur *</label>
                  <Input required value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</label>
                    <select value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Sciences">Sciences</option>
                      <option value="Littérature">Littérature</option>
                      <option value="Histoire">Histoire / Géo</option>
                      <option value="Langues">Langues</option>
                      <option value="Manuels">Manuels Scolaires</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ISBN</label>
                    <Input value={bookForm.isbn} onChange={e => setBookForm({...bookForm, isbn: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500 font-mono text-sm" placeholder="Ex: 978-3-16-148410-0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nb. Exemplaires</label>
                    <Input type="number" min="1" value={bookForm.totalCopies} onChange={e => setBookForm({...bookForm, totalCopies: parseInt(e.target.value)})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rayonnage</label>
                    <Input value={bookForm.shelfLocation} onChange={e => setBookForm({...bookForm, shelfLocation: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500" placeholder="Ex: A12" />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <Button type="button" variant="ghost" onClick={() => setIsAddBookModalOpen(false)} className="rounded-xl hover:bg-slate-100">Annuler</Button>
                   <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-md shadow-blue-500/20" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                     Ajouter au catalogue
                   </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL NEW LOAN */}
      <AnimatePresence>
        {isNewLoanModalOpen && selectedBook && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Bookmark className="text-blue-600" size={20} /> Prêt : {selectedBook.title}
                </h3>
                <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500" onClick={() => setIsNewLoanModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateLoan} className="p-6 flex flex-col gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type d'emprunteur</label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                      type="button" 
                      onClick={() => setLoanForm({...loanForm, targetType: 'STUDENT'})} 
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loanForm.targetType === 'STUDENT' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Élève
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setLoanForm({...loanForm, targetType: 'STAFF'})} 
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loanForm.targetType === 'STAFF' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Personnel
                    </button>
                  </div>
                </div>

                {loanForm.targetType === 'STUDENT' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sélectionner l'élève</label>
                    <select required value={loanForm.studentId} onChange={e => setLoanForm({...loanForm, studentId: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Choisir --</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.studentNumber})</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sélectionner l'employé</label>
                    <select required value={loanForm.employeeId} onChange={e => setLoanForm({...loanForm, employeeId: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Choisir --</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date limite de retour</label>
                  <Input type="date" required value={loanForm.dueDate} onChange={e => setLoanForm({...loanForm, dueDate: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500" />
                </div>
                
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <Button type="button" variant="ghost" onClick={() => setIsNewLoanModalOpen(false)} className="rounded-xl hover:bg-slate-100">Annuler</Button>
                   <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6" disabled={isSubmitting}>
                     {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                     Confirmer le Prêt
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
