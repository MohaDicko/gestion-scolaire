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
            format: 'a5' // A5 is standard for receipts
        });

        const width = doc.internal.pageSize.getWidth();
        
        // --- Header ---
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, width, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('REÇU DE PAIEMENT', width / 2, 12, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`N° REÇU: RCP-${payment.id.substring(0, 8).toUpperCase()}`, width / 2, 18, { align: 'center' });
        doc.text(`DATE: ${new Date(payment.paymentDate).toLocaleDateString('fr-FR')}`, width / 2, 23, { align: 'center' });

        // --- School Info ---
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('SCHOOLERP PRO ACADEMY', 10, 40);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Bamako, Mali | Tel: +223 00 00 00 00', 10, 44);

        // --- Client Info ---
        doc.setDrawColor(230, 230, 230);
        doc.line(10, 50, width - 10, 50);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('ÉLÈVE:', 10, 58);
        doc.setFont('helvetica', 'normal');
        doc.text(`${student.firstName} ${student.lastName} (${student.studentNumber})`, 40, 58);
        
        doc.setFont('helvetica', 'bold');
        doc.text('CLASSE:', 10, 63);
        doc.setFont('helvetica', 'normal');
        doc.text(`${student.classroom?.name || 'N/A'}`, 40, 63);

        // --- Payment Details ---
        doc.setFillColor(248, 250, 252);
        doc.rect(10, 70, width - 20, 30, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.text('OBJET DU PAIEMENT:', 15, 78);
        doc.setFont('helvetica', 'normal');
        doc.text(`${invoice.title} (${invoice.invoiceNumber})`, 50, 78);
        
        doc.setFont('helvetica', 'bold');
        doc.text('MODE DE PAIEMENT:', 15, 83);
        doc.setFont('helvetica', 'normal');
        doc.text(`${payment.method}`, 50, 83);

        doc.setFontSize(12);
        doc.text('MONTANT VERSÉ:', 15, 93);
        doc.setFont('helvetica', 'bold');
        doc.text(`${payment.amount.toLocaleString()} XOF`, width - 15, 93, { align: 'right' });

        // --- Footer ---
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.text('Merci pour votre confiance.', width / 2, 115, { align: 'center' });
        
        doc.setDrawColor(30, 41, 59);
        doc.line(width - 50, 130, width - 10, 130);
        doc.setFont('helvetica', 'bold');
        doc.text('LA COMPTABILITÉ', width - 30, 134, { align: 'center' });

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
