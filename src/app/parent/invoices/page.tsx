'use client';

import React, { useEffect, useState, Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Receipt, AlertTriangle, CheckCircle2, CreditCard, X, Smartphone } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

function InvoicesContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');
  const toast = useToast();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ORANGE_MONEY' | 'MOOV' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      // Pour faire simple, on rappelle l'API dashboard parent et on filtre sur l'enfant ciblé
      const res = await fetch('/api/parent/dashboard');
      if (res.ok) {
        const data = await res.json();
        let targetChild = data.children.find((c: any) => c.id === studentId);
        
        // Si aucun studentId n'est fourni, on prend le premier enfant
        if (!targetChild && data.children.length > 0) {
          targetChild = data.children[0];
        }

        if (targetChild && targetChild.Invoice) {
          // L'API dashboard parent ne renvoie que les factures UNPAID par défaut
          // Si on voulait toutes les factures, il faudrait une API dédiée, mais pour la démo, ça ira !
          setInvoices(targetChild.Invoice);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [studentId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentMethod || !phoneNumber) return;

    setIsProcessing(true);
    setPaymentSuccess(null);

    try {
      const res = await fetch('/api/finance/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          phoneNumber,
          method: paymentMethod
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.paymentUrl) {
          // Mode Production : Redirection vers le portail Orange Money
          window.location.href = data.paymentUrl;
        } else {
          // Mode Simulation : Succès immédiat
          setPaymentSuccess(data.reference);
          toast.success('Paiement validé avec succès !');
          setTimeout(() => {
            setSelectedInvoice(null);
            fetchInvoices();
          }, 3000);
        }
      } else {
        toast.error(data.error || 'Erreur lors du paiement');
      }
    } catch (e) {
      toast.error('Erreur réseau');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 relative">
      
      {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-400">Tout est à jour !</h3>
            <p className="text-emerald-600 dark:text-emerald-300 mt-2 max-w-sm mx-auto">
              Vous n'avez aucune facture en attente de paiement pour cet enfant.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">Factures en attente ({invoices.length})</h3>
            
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400 shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Scolarité - {new Date(invoice.dueDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h4>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      Échéance: {new Date(invoice.dueDate).toLocaleDateString()}
                      {new Date(invoice.dueDate) < new Date() && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">En retard</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between w-full md:w-auto gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-800 dark:text-white">
                      {invoice.amount.toLocaleString()} <span className="text-sm font-bold text-slate-400">FCFA</span>
                    </div>
                  </div>
                  <Button onClick={() => {
                    setSelectedInvoice(invoice);
                    setPaymentSuccess(null);
                    setPhoneNumber('');
                    setPaymentMethod(null);
                  }} className="bg-primary hover:bg-primary/90 text-white shrink-0 shadow-lg shadow-primary/20">
                    <CreditCard className="w-4 h-4 mr-2" /> Payer
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* MODALE DE PAIEMENT (OVERLAY) */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
              
              <button 
                onClick={() => !isProcessing && setSelectedInvoice(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full p-1"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 text-center">
                <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-primary">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white">Paiement Sécurisé</h3>
                <p className="text-sm text-slate-500 mt-1">Scolarité - Montant: <strong className="text-slate-800 dark:text-white">{selectedInvoice.amount.toLocaleString()} FCFA</strong></p>
              </div>

              {paymentSuccess ? (
                <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-900/10">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Paiement Réussi !</h4>
                  <p className="text-sm text-emerald-600 mt-2 mb-4">Réf: {paymentSuccess}</p>
                  <p className="text-xs text-emerald-500">Fermeture automatique...</p>
                </div>
              ) : (
                <form onSubmit={handlePay} className="p-6 space-y-6">
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Choisissez votre opérateur</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('ORANGE_MONEY')}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'ORANGE_MONEY' ? 'border-[#FF7900] bg-[#FF7900]/10 text-[#FF7900]' : 'border-slate-200 dark:border-slate-700 hover:border-[#FF7900]/50 grayscale hover:grayscale-0'}`}
                      >
                        <div className="font-black">ORANGE</div>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('MOOV')}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'MOOV' ? 'border-[#005B9F] bg-[#005B9F]/10 text-[#005B9F]' : 'border-slate-200 dark:border-slate-700 hover:border-[#005B9F]/50 grayscale hover:grayscale-0'}`}
                      >
                        <div className="font-black">MOOV</div>
                      </button>
                    </div>
                  </div>

                  {paymentMethod && (
                    <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-300">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm mb-4 border border-blue-100 dark:border-blue-800 text-center">
                        Paiement à destination du compte de l'école : <br/>
                        <strong className="text-lg">Orange Money : +223 74 13 20 32</strong>
                      </div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Votre Numéro de téléphone ({paymentMethod === 'ORANGE_MONEY' ? 'Orange' : 'Moov'})</label>
                      <Input 
                        type="tel"
                        placeholder="Ex: 70 00 00 00"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="text-lg py-6 text-center font-bold tracking-widest bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-primary/50"
                        required
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        Un code PIN vous sera demandé sur votre téléphone pour valider.
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full py-6 text-lg rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg disabled:opacity-50"
                    disabled={!paymentMethod || phoneNumber.length < 8 || isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Connexion bancaire...</>
                    ) : (
                      <>Payer {selectedInvoice.amount.toLocaleString()} FCFA</>
                    )}
                  </Button>

                </form>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default function ParentInvoicesPage() {
  return (
    <AppLayout title="Factures & Paiements" subtitle="Réglez la scolarité de vos enfants en toute simplicité.">
      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
        <InvoicesContent />
      </Suspense>
    </AppLayout>
  );
}
