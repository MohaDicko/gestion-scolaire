'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Save, AlertCircle, Loader2, CheckCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AttendancePage() {
  const router = useRouter();
  const toast  = useToast();

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);

  useEffect(() => {
    fetch('/api/classrooms')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setClassrooms(d); })
      .catch(() => toast.error('Impossible de charger les classes.'));
  }, [toast]);

  const loadAttendance = useCallback(async () => {
    if (!selectedClassroom || !selectedDate) {
      setStudents([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance?classroomId=${selectedClassroom}&date=${selectedDate}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erreur lors du chargement de l\'appel.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClassroom, selectedDate, router, toast]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleStatusChange = (studentId: string, status: string) => {
    setStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, status } : s));
  };

  const handleSave = async () => {
    if (!selectedClassroom || !selectedDate || students.length === 0) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classroomId: selectedClassroom, date: selectedDate, records: students })
      });
      if (!res.ok) throw new Error();
      toast.success('Appel enregistré avec succès !');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout
      title="Registre d'Appel"
      subtitle="Pointage quotidien des présences"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Présences' }]}
    >
      <div className="flex flex-col gap-6">
        
        {/* Filtres Card */}
        <Card variant="glass" className="flex flex-col sm:flex-row gap-6 items-end">
          <div className="flex-1 w-full flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Classe</label>
            <select 
              value={selectedClassroom} 
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full h-11 px-4 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sélectionner une classe --</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name} {c.stream ? `(${c.stream})` : ''}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Date</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="w-full h-11 px-4 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </Card>

        {/* Grille d'appel */}
        {selectedClassroom && selectedDate ? (
          <Card variant="glass" noPadding className="overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <CalendarCheck size={18} />
                </div>
                <CardTitle className="text-base uppercase tracking-tight">Liste d'appel</CardTitle>
              </div>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSave} 
                className="bg-primary text-white"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={16} />}
                Valider l'appel
              </Button>
            </CardHeader>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-sm font-bold">Synchronisation...</p>
              </div>
            ) : students.length > 0 ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800/50">
                    <th className="px-6 py-4">Élève</th>
                    <th className="px-6 py-4 text-center">Présence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {students.map(s => (
                    <tr key={s.studentId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            {s.matricule?.slice(-2)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{s.studentName}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{s.matricule}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 flex justify-center">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                          {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(s.studentId, status)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                                s.status === status 
                                  ? (status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                                     status === 'ABSENT' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 
                                     'bg-amber-500 text-white shadow-lg shadow-amber-500/20')
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                              }`}
                            >
                              {status === 'PRESENT' ? 'P' : status === 'ABSENT' ? 'A' : status === 'LATE' ? 'R' : 'E'}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 opacity-30 text-center px-10">
                <AlertCircle size={48} className="mb-4" />
                <h3 className="text-lg font-black uppercase tracking-widest">Effectif vide</h3>
                <p className="text-xs max-w-xs mt-2">Vérifiez les inscriptions dans cette classe pour la période sélectionnée.</p>
              </div>
            )}
          </Card>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Users size={64} className="mb-4 opacity-10" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Sélectionnez une classe</h3>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
