'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plane, Plus, Check, X, Clock, 
  Search, Filter, Loader2, Calendar, 
  FileText, AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const leaveTypes = [
  { value: 'ANNUAL', label: 'Congé Annuel' },
  { value: 'SICK', label: 'Maladie' },
  { value: 'PERSONAL', label: 'Motif Personnel' },
  { value: 'MATERNITY', label: 'Maternité' },
];

export default function LeavesPage() {
    const router = useRouter();
    const toast = useToast();
    
    const [leaves, setLeaves] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        employeeId: '',
        type: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const fetchLeaves = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/hr/leaves');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setLeaves(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Erreur lors du chargement des congés');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch('/api/employees');
            const data = await res.json();
            if (Array.isArray(data)) setEmployees(data);
        } catch {}
    }, []);

    useEffect(() => {
        fetchLeaves();
        fetchEmployees();
    }, [fetchLeaves, fetchEmployees]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/hr/leaves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error();
            toast.success('Demande de congé enregistrée');
            setShowModal(false);
            setFormData({ employeeId: '', type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
            fetchLeaves();
        } catch {
            toast.error('Erreur lors de la création');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            const res = await fetch('/api/hr/leaves', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (!res.ok) throw new Error();
            toast.success(status === 'APPROVED' ? 'Congé approuvé' : 'Congé refusé');
            fetchLeaves();
        } catch {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const stats = {
        pending: leaves.filter(l => l.status === 'PENDING').length,
        approved: leaves.filter(l => l.status === 'APPROVED').length,
    };

    return (
        <AppLayout
            title="Gestion des Congés"
            subtitle="Planification et dashboard des absences du personnel"
            breadcrumbs={[{ label: 'RH', href: '/hr/dashboard' }, { label: 'Congés' }]}
            actions={
                <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
                    <Plus size={18} className="mr-2" /> Nouvelle Demande
                </Button>
            }
        >
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                            <Clock size={28} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">En attente</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.pending}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <Check size={28} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Approuvés ce mois</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.approved}</div>
                        </div>
                    </div>
                </div>

                {/* Leaves Table */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                                <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                                <p className="font-semibold text-sm">Chargement des demandes...</p>
                            </div>
                        ) : leaves.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-5">Employé</th>
                                        <th className="px-6 py-5">Type</th>
                                        <th className="px-6 py-5">Période</th>
                                        <th className="px-6 py-5">Raison / Note</th>
                                        <th className="px-6 py-5">Statut</th>
                                        <th className="px-6 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {leaves.map(l => (
                                        <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-sm shrink-0">
                                                    {l.employee?.firstName?.[0]}{l.employee?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-slate-100">{l.employee?.firstName} {l.employee?.lastName}</div>
                                                    <div className="text-xs text-slate-500 font-mono mt-0.5">{l.employee?.employeeNumber}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {leaveTypes.find(t => t.value === l.type)?.label || l.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-700 dark:text-slate-300">
                                                    Du {new Date(l.startDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    Au {new Date(l.endDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={l.reason}>
                                                    {l.reason || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {l.status === 'PENDING' && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700">En attente</span>}
                                                {l.status === 'APPROVED' && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">Approuvé</span>}
                                                {l.status === 'REJECTED' && <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">Refusé</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {l.status === 'PENDING' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors" 
                                                            title="Approuver" 
                                                            onClick={() => updateStatus(l.id, 'APPROVED')}
                                                        >
                                                            <Check size={16} strokeWidth={3} />
                                                        </button>
                                                        <button 
                                                            className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors" 
                                                            title="Refuser" 
                                                            onClick={() => updateStatus(l.id, 'REJECTED')}
                                                        >
                                                            <X size={16} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-24 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 m-6 rounded-3xl">
                                <Plane size={64} className="opacity-20 mb-4" />
                                <h3 className="text-lg font-bold text-slate-600 mb-1">Aucune demande de congé</h3>
                                <p className="text-sm">Toutes les demandes de congés apparaîtront ici.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Demande */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <Calendar className="text-blue-600" size={20} /> Nouvelle Demande
                                </h2>
                                <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500" onClick={() => setShowModal(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employé *</label>
                                    <select required value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">-- Sélectionner l'employé --</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type de Congé *</label>
                                    <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {leaveTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date de début *</label>
                                        <Input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date de fin *</label>
                                        <Input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="rounded-xl border-slate-200 focus-visible:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motif / Raison</label>
                                    <textarea rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Détails optionnels..." />
                                </div>
                                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="rounded-xl hover:bg-slate-100">Annuler</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 shadow-md shadow-blue-500/20" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Check size={16} className="mr-2" />}
                                        Soumettre la demande
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
