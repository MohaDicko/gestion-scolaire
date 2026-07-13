'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardCheck, Save, Calendar, Search, 
  Loader2, UserCheck, UserX, Clock, 
  Coffee, AlertCircle 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function StaffAttendancePage() {
    const router = useRouter();
    const toast = useToast();
    
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAttendance = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/hr/attendance?date=${date}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setRecords(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Erreur lors du chargement des présences');
        } finally {
            setIsLoading(false);
        }
    }, [date, toast]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleStatusChange = (id: string, status: string) => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    };

    const handleTimeChange = (id: string, field: 'checkIn' | 'checkOut', value: string) => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/hr/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, records })
            });
            if (!res.ok) throw new Error();
            toast.success('Pointage enregistré avec succès');
        } catch {
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredRecords = records.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        present: records.filter(r => r.status === 'PRESENT').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
    };

    return (
        <AppLayout
            title="Registre Personnel"
            subtitle="Pointage journalier et suivi des retards du staff"
            breadcrumbs={[{ label: 'RH', href: '/hr/dashboard' }, { label: 'Présences' }]}
        >
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 border-l-4 border-l-emerald-500">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Présents</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.present}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 border-l-4 border-l-red-500">
                        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                            <UserX size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Absents</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.absent}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 border-l-4 border-l-amber-500">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                            <Coffee size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">En Congé</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.onLeave}</div>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end justify-between">
                    <div className="flex flex-wrap gap-4 flex-1">
                        <div className="space-y-1.5 w-full sm:w-auto">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date du Pointage</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input 
                                    type="date" 
                                    className="pl-10 rounded-xl border-slate-200 h-12 focus-visible:ring-blue-500" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-[250px]">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rechercher un employé</label>
                            <div className="relative">
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input 
                                    type="text" 
                                    className="pl-10 rounded-xl border-slate-200 h-12 focus-visible:ring-blue-500" 
                                    placeholder="Nom, matricule..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || records.length === 0} 
                        className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 shadow-lg shadow-blue-600/20 w-full sm:w-auto"
                    >
                        {isSaving ? (
                            <><Loader2 size={18} className="animate-spin mr-2" /> Enregistrement...</>
                        ) : (
                            <><Save size={18} className="mr-2" /> Valider le pointage</>
                        )}
                    </Button>
                </div>

                {/* Table Data */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                                <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
                                <p className="font-semibold text-sm">Chargement du personnel...</p>
                            </div>
                        ) : filteredRecords.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-5">Employé</th>
                                        <th className="px-6 py-5">Département</th>
                                        <th className="px-6 py-5">Statut de présence</th>
                                        <th className="px-6 py-5">Arrivée (H)</th>
                                        <th className="px-6 py-5">Départ (H)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredRecords.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800 dark:text-slate-100">{r.name}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">{r.employeeNumber}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {r.department || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    className={`h-10 px-3 rounded-xl border-none outline-none font-bold text-xs cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 ${
                                                        r.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700' : 
                                                        r.status === 'ABSENT' ? 'bg-red-50 text-red-700' : 
                                                        'bg-amber-50 text-amber-700'
                                                    }`}
                                                    value={r.status} 
                                                    onChange={e => handleStatusChange(r.id, e.target.value)}
                                                >
                                                    <option value="PRESENT" className="font-bold">Présent</option>
                                                    <option value="ABSENT" className="font-bold">Absent</option>
                                                    <option value="ON_LEAVE" className="font-bold">En Congé</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="time" 
                                                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    value={r.checkIn || ''} 
                                                    onChange={e => handleTimeChange(r.id, 'checkIn', e.target.value)}
                                                    disabled={r.status !== 'PRESENT'}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input 
                                                    type="time" 
                                                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-400 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    value={r.checkOut || ''} 
                                                    onChange={e => handleTimeChange(r.id, 'checkOut', e.target.value)}
                                                    disabled={r.status !== 'PRESENT'}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-24 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 m-6 rounded-3xl">
                                <ClipboardCheck size={64} className="opacity-20 mb-4" />
                                <h3 className="text-lg font-bold text-slate-600 mb-1">Aucun employé trouvé</h3>
                                <p className="text-sm">Vérifiez que vous avez des employés actifs enregistrés.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
