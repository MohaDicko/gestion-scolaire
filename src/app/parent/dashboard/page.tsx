'use client';

import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Clock, FileText, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';

export default function ParentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; email?: string } | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        fetchChildren(parsed.email);
      }
    } catch {}
  }, []);

  const fetchChildren = async (email: string) => {
    setIsLoading(true);
    try {
      // Pour l'instant on fait un mock rapide, 
      // il faudra créer une vraie route API GET /api/parent/children
      const res = await fetch(`/api/students`);
      if (res.ok) {
        const data = await res.json();
        // On filtre les élèves dont le parentEmail correspond
        const myChildren = data.filter((s: any) => s.parentEmail === email);
        setChildren(myChildren);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  } as const;

  return (
    <AppLayout
      title="Espace Famille"
      subtitle={`Bienvenue, ${user?.firstName || 'Parent'} ${user?.lastName || ''}`}
      breadcrumbs={[{ label: 'Mes Enfants' }]}
    >
      <motion.div 
        className="flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users size={20} className="text-blue-400" /> Mes Enfants
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : children.length === 0 ? (
          <Card variant="glass" className="text-center py-12">
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Aucun enfant trouvé</h3>
            <p className="text-slate-400">Aucun élève n'est actuellement lié à votre adresse email.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child, i) => (
              <motion.div key={child.id || i} variants={itemVariants}>
                <Card
                  variant="glass"
                  className="group relative overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6))',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                  noPadding
                >
                  {/* Glowing header */}
                  <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-white">{child.firstName} {child.lastName}</h3>
                        <p className="text-slate-400 font-medium mt-1">Matricule: {child.studentNumber}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                        {child.firstName?.charAt(0)}{child.lastName?.charAt(0)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => router.push(`/student/${child.id}/grades`)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50 group/btn">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover/btn:bg-emerald-500 group-hover/btn:text-white transition-colors">
                          <BookOpen size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-300">Notes & Bulletins</span>
                      </button>
                      
                      <button onClick={() => router.push(`/student/${child.id}/attendance`)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50 group/btn">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg group-hover/btn:bg-amber-500 group-hover/btn:text-white transition-colors">
                          <Clock size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-300">Présences</span>
                      </button>

                      <button onClick={() => router.push(`/student/${child.id}/invoices`)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50 group/btn col-span-2">
                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover/btn:bg-purple-500 group-hover/btn:text-white transition-colors">
                          <FileText size={16} />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-sm font-semibold text-slate-300">Factures & Frais de scolarité</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-500 group-hover/btn:text-white transition-colors" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
