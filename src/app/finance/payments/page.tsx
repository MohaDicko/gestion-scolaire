'use client';

import React, { useState, useEffect } from 'react';
import { 
    Search, Wallet, CreditCard, DollarSign, 
    CheckCircle2, AlertCircle, Loader2, ArrowRight,
    Printer, History, User, Landmark, FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

export default function FinancePaymentsPage() {
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form for new payment
    const [paymentForm, setPaymentForm] = useState({
        invoiceId: '',
        amount: 0,
        method: 'ESPECES',
        notes: ''
    });

    useEffect(() => {
        if (searchTerm.length < 2) {
            setStudents([]);
            return;
        }
        const delay = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/students?search=${searchTerm}`);
                const data = await res.json();
                if (data.items) setStudents(data.items);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }, 500);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    const generateReceipt = (payment: any, invoice: any, student: any) => {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a5' // Format A5 (moitié d'une A4)
        });

        const width = doc.internal.pageSize.getWidth();
        const margin = 10;
        
        // --- Header (Design Épuré et Blanc) ---
        // Liseré Mali en haut
        doc.setFillColor(0, 154, 68); doc.rect(0, 0, width / 3, 2, 'F');
        doc.setFillColor(252, 209, 22); doc.rect(width / 3, 0, width / 3, 2, 'F');
        doc.setFillColor(206, 17, 38); doc.rect(2 * width / 3, 0, width / 3, 2, 'F');

        // Titre Officiel
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('REÇU DE PAIEMENT', width / 2, 16, { align: 'center' });
        
        // Bordure autour du numéro de reçu
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(width / 2 - 25, 20, 50, 6, 1, 1, 'FD');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`N°: RCP-${payment.id.substring(0, 8).toUpperCase()}`, width / 2, 24, { align: 'center' });

        // Date alignée à droite
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Le ${new Date(payment.paymentDate).toLocaleDateString('fr-FR')}`, width - margin, 24, { align: 'right' });

        // Ligne de séparation
        doc.line(margin, 32, width - margin, 32);

        // --- Infos de l'École ---
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SCHOOLERP PRO ACADEMY', margin, 40);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Bamako, Mali | Tel: +223 00 00 00 00 | NIF: 000000', margin, 45);

        // --- Infos de l'Élève (Encadré discret) ---
        let y = 55;
        doc.setDrawColor(15, 23, 42); // slate-900
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, width - 2 * margin, 20, 1, 1, 'S');

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('REÇU DE :', margin + 5, y + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(`${student.firstName} ${student.lastName.toUpperCase()}`, margin + 25, y + 6);
        
        doc.setFont('helvetica', 'bold');
        doc.text('MATRICULE :', margin + 5, y + 12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${student.studentNumber}`, margin + 25, y + 12);

        doc.setFont('helvetica', 'bold');
        doc.text('CLASSE :', margin + 5, y + 18);
        doc.setFont('helvetica', 'normal');
        doc.text(`${student.classroom?.name || 'N/A'}`, margin + 25, y + 18);

        // --- Détails du Paiement ---
        y += 28;
        
        // Header Tableau
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(margin, y, width - 2 * margin, 8, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, width - 2 * margin, 8, 'S');
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('DÉSIGNATION / OBJET', margin + 3, y + 5.5);
        doc.text('MONTANT (FCFA)', width - margin - 3, y + 5.5, { align: 'right' });

        y += 8;
        // Ligne Objet
        doc.rect(margin, y, width - 2 * margin, 12, 'S');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`${invoice.title}`, margin + 3, y + 7);
        doc.setFont('helvetica', 'bold');
        doc.text(`${payment.amount.toLocaleString('fr-FR')}`, width - margin - 3, y + 7, { align: 'right' });

        // --- Mode de paiement & Total ---
        y += 18;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Mode de règlement:', margin, y);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`${payment.method}`, margin + 30, y);

        // Bloc Total
        doc.setFillColor(15, 23, 42); // Fond sombre pour le total uniquement
        doc.roundedRect(width - 65, y - 6, 55, 12, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('MONTANT VERSÉ :', width - 60, y + 2.5);
        doc.setFontSize(11);
        doc.text(`${payment.amount.toLocaleString('fr-FR')}`, width - 15, y + 2.5, { align: 'right' });

        // --- Signatures ---
        y += 25;
        doc.setDrawColor(203, 213, 225);
        doc.line(margin, y + 10, margin + 40, y + 10);
        doc.line(width - margin - 40, y + 10, width - margin, y + 10);
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.text('Le Payeur', margin + 20, y + 15, { align: 'center' });
        doc.text('Le Caissier', width - margin - 20, y + 15, { align: 'center' });

        // --- Footer ---
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('Ce reçu est une preuve de paiement. Conservez-le précieusement.', width / 2, 190, { align: 'center' });
        doc.text(`Document généré électroniquement — ${new Date().toLocaleString('fr-FR')} — SchoolERP`, width / 2, 195, { align: 'center' });

        doc.save(`Recu_${student.lastName}_${payment.id.substring(0,4)}.pdf`);
    };

    const selectStudent = async (student: any) => {
        setSelectedStudent(student);
        setIsLoading(true);
        try {
            const res = await fetch(`/api/invoices?studentId=${student.id}`);
            const data = await res.json();
            setInvoices(data);
            setStudents([]);
            setSearchTerm('');
        } catch (e) {
            toast.error('Erreur lors de la récupération des factures');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentForm.invoiceId || paymentForm.amount <= 0) {
            toast.warning('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/finance/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...paymentForm,
                    studentId: selectedStudent.id,
                    tenantId: selectedStudent.tenantId
                })
            });

            if (res.ok) {
                const result = await res.json();
                toast.success('Paiement enregistré avec succès');
                
                // Trigger Receipt Download
                const targetInvoice = invoices.find(i => i.id === paymentForm.invoiceId);
                generateReceipt(result.payment, targetInvoice, selectedStudent);

                // Refresh invoices
                selectStudent(selectedStudent);
                setPaymentForm({ invoiceId: '', amount: 0, method: 'ESPECES', notes: '' });
            } else {
                toast.error('Erreur lors de l\'enregistrement du paiement');
            }
        } catch (e) {
            toast.error('Erreur réseau');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppLayout
            title="Encaissement des Frais"
            subtitle="Gestion des paiements de scolarité et génération de reçus"
            breadcrumbs={[{ label: 'Finance', href: '/finance' }, { label: 'Encaissements' }]}
        >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* LEFT: Search & Student Info */}
                <div className="xl:col-span-1 flex flex-col gap-6">
                    <div className="card shadow-sm p-6 bg-white rounded-2xl border border-slate-100">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Rechercher un Élève</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="Nom, matricule..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Search Results */}
                        {students.length > 0 && (
                            <div className="mt-4 border border-slate-100 rounded-xl overflow-hidden shadow-xl">
                                {students.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => selectStudent(s)}
                                        className="p-4 hover:bg-blue-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {s.firstName[0]}{s.lastName[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{s.firstName} {s.lastName}</div>
                                            <div className="text-[10px] text-slate-500">{s.studentNumber} — {s.classroom?.name}</div>
                                        </div>
                                        <ArrowRight className="ml-auto text-slate-300" size={14} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedStudent && (
                        <div className="card shadow-sm p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl border-none">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <User size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                                    <p className="text-blue-100 text-sm">{selectedStudent.studentNumber}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                                    <span className="opacity-70">Classe actuelle</span>
                                    <span className="font-bold">{selectedStudent.classroom?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
                                    <span className="opacity-70">Reste à payer</span>
                                    <span className="text-lg font-black text-amber-300">
                                        {invoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + i.amount, 0).toLocaleString()} XOF
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Invoices & Payment Form */}
                <div className="xl:col-span-2 flex flex-col gap-6">
                    {selectedStudent ? (
                        <>
                            {/* Invoices List */}
                            <div className="card shadow-sm bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <History size={16} /> Historique des Factures
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                            <tr>
                                                <th className="p-4">Facture</th>
                                                <th className="p-4">Désignation</th>
                                                <th className="p-4 text-right">Montant</th>
                                                <th className="p-4">Statut</th>
                                                <th className="p-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {invoices.length === 0 ? (
                                                <tr><td colSpan={5} className="p-12 text-center text-slate-400">Aucune facture émise</td></tr>
                                            ) : (
                                                invoices.map(invoice => (
                                                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 text-xs font-mono font-bold text-blue-600">{invoice.invoiceNumber}</td>
                                                        <td className="p-4 text-sm font-semibold text-slate-700">{invoice.title}</td>
                                                        <td className="p-4 text-right font-black text-slate-900">{invoice.amount.toLocaleString()} XOF</td>
                                                        <td className="p-4">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                                invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 
                                                                invoice.status === 'PARTIAL' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                                            }`}>
                                                                {invoice.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex gap-3">
                                                                 {invoice.status !== 'PAID' && (
                                                                     <button 
                                                                         onClick={() => setPaymentForm({ ...paymentForm, invoiceId: invoice.id, amount: invoice.amount })}
                                                                         className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1"
                                                                     >
                                                                         Régler <ArrowRight size={14} />
                                                                     </button>
                                                                 )}
                                                                 {invoice.status !== 'UNPAID' && (
                                                                     <button 
                                                                         onClick={async () => {
                                                                             const res = await fetch(`/api/finance/payments?invoiceId=${invoice.id}`);
                                                                             const payments = await res.json();
                                                                             if (payments.length > 0) {
                                                                                 generateReceipt(payments[0], invoice, selectedStudent);
                                                                             }
                                                                         }}
                                                                         className="text-slate-500 hover:text-slate-800 font-bold text-xs flex items-center gap-1"
                                                                     >
                                                                         <Printer size={14} /> Reçu
                                                                     </button>
                                                                 )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* New Payment Form */}
                            <div className="card shadow-sm p-8 bg-white rounded-2xl border border-slate-100">
                                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Wallet size={18} className="text-blue-600" /> Enregistrer un Versement
                                </h3>
                                <form onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Facture à régler</label>
                                        <select 
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            value={paymentForm.invoiceId}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}
                                        >
                                            <option value="">Sélectionner une facture</option>
                                            {invoices.filter(i => i.status !== 'PAID').map(i => (
                                                <option key={i.id} value={i.id}>{i.invoiceNumber} — {i.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Montant versé (XOF)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="number"
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                                placeholder="0.00"
                                                value={paymentForm.amount || ''}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mode de Paiement</label>
                                        <select 
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            value={paymentForm.method}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                        >
                                            <option value="ESPECES">Espèces</option>
                                            <option value="ORANGE_MONEY">Orange Money</option>
                                            <option value="MOOV_MONEY">Moov Money</option>
                                            <option value="VIREMENT">Virement Bancaire</option>
                                            <option value="CHEQUE">Chèque</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Notes / Référence</label>
                                        <input 
                                            type="text"
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                            placeholder="Ex: Reçu #1234, Transfert ID..."
                                            value={paymentForm.notes}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 pt-4">
                                        <button 
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                            Valider le Règlement et Imprimer le Reçu
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-center opacity-50">
                            <Landmark size={64} className="text-slate-300 mb-6" />
                            <h3 className="text-xl font-bold text-slate-400">Aucun élève sélectionné</h3>
                            <p className="text-slate-500 max-w-sm mt-2">Veuillez rechercher et sélectionner un élève pour consulter ses factures et enregistrer un règlement.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
