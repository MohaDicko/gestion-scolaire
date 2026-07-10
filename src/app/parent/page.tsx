'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, BookOpen, Receipt, AlertTriangle, CheckCircle2, ChevronRight, BellRing } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ParentDashboard() {
  const router = useRouter();
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/parent/dashboard');
        if (res.ok) {
          const data = await res.json();
          setChildrenData(data.children || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <AppLayout
      title="Espace Famille"
      subtitle="Bienvenue sur votre portail sécurisé. Retrouvez ici toutes les informations de vos enfants."
    >
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Banner de bienvenue */}
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
              Ravi de vous revoir ! 👋
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Suivez la scolarité de vos enfants en temps réel. S'il y a une urgence, l'école vous contactera directement via la messagerie.
            </p>
          </div>
          <Button onClick={() => router.push('/chat')} className="rounded-xl shrink-0">
            <BellRing className="w-4 h-4 mr-2" /> Contacter l'école
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Chargement des dossiers scolaires...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && childrenData.length === 0 && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="bg-slate-200 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold">Aucun enfant trouvé</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Nous n'avons trouvé aucun élève lié à votre adresse email. Veuillez contacter l'administration de l'école pour mettre à jour le dossier de votre enfant.
            </p>
          </div>
        )}

        {/* Liste des enfants */}
        {!loading && childrenData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childrenData.map((child) => (
              <Card key={child.id} className="overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 hover:shadow-xl transition-shadow flex flex-col">
                
                {/* Header Enfant */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0">
                    {child.firstName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-sm font-medium text-primary mt-1">
                      {child.enrollments?.[0]?.classroom?.name || 'Classe non assignée'}
                    </p>
                  </div>
                </div>

                {/* Corps de la carte */}
                <div className="p-6 space-y-6 flex-1">
                  
                  {/* Alertes Factures */}
                  {child.Invoice && child.Invoice.length > 0 ? (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Facture en attente</h4>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                          {child.Invoice.length} facture(s) impayée(s) pour un total de {child.Invoice.reduce((acc: number, inv: any) => acc + inv.amount, 0).toLocaleString()} FCFA.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Scolarité à jour</span>
                    </div>
                  )}

                  {/* Dernières Notes */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Dernières Notes
                    </h4>
                    {child.Grade && child.Grade.length > 0 ? (
                      <div className="space-y-2">
                        {child.Grade.map((grade: any) => (
                          <div key={grade.id} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <span className="text-slate-600 dark:text-slate-300 truncate pr-4">{grade.subject?.name}</span>
                            <Badge variant={grade.score >= 10 ? 'default' : 'destructive'} className={grade.score >= 10 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                              {grade.score} / {grade.maxScore}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Aucune note enregistrée récemment.</p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <Button variant="outline" className="flex-1 bg-white dark:bg-slate-900" onClick={() => router.push(`/parent/grades?studentId=${child.id}`)}>
                    Détails
                  </Button>
                  <Button className="flex-1" onClick={() => router.push(`/parent/invoices?studentId=${child.id}`)}>
                    Payer <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
