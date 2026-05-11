'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, ArrowLeft, GraduationCap, Calendar, 
  FileText, Receipt, User, Globe, Award, CheckCircle2, Activity
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// Components
import { StudentSidebar } from '@/components/students/StudentSidebar';

type TabType = 'overview' | 'grades' | 'attendance' | 'finance';

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${id}`);
      if (!res.ok) throw new Error();
      setStudent(await res.json());
    } catch {
      toast.error('Élève introuvable.');
      router.push('/students');
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (isLoading) {
    return (
      <AppLayout title="Chargement..." breadcrumbs={[{ label: 'Élèves', href: '/students' }, { label: 'Profil' }]}>
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      </AppLayout>
    );
  }

  const currentEnrollment = student.enrollments?.[0];

  return (
    <AppLayout
      title={`${student.firstName} ${student.lastName}`}
      subtitle={`Dossier scolaire n° ${student.studentNumber}`}
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Élèves', href: '/students' }, { label: 'Profil' }]}
      actions={
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft size={16} /> Retour</Button>
          <Button variant="secondary" size="sm" onClick={() => toast.info('Génération PDF en cours...')}><FileText size={16} /> Fiche PDF</Button>
          <Button size="sm" className="bg-primary text-white"><Globe size={16} /> Lien Portail</Button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: Identity Sidebar */}
        <StudentSidebar student={student} currentEnrollment={currentEnrollment} />

        {/* Right: Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Custom Tab Switcher */}
          <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'grades', label: 'Notes', icon: Award },
              { id: 'attendance', label: 'Appel', icon: Calendar },
              { id: 'finance', label: 'Compta', icon: Receipt },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon size={15} />
                <span className="uppercase tracking-widest hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card variant="glass">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><GraduationCap size={18}/></div>
                    <CardTitle className="text-sm uppercase tracking-tight">Parcours Scolaire</CardTitle>
                  </div>
                  <div className="space-y-4">
                    {student.enrollments?.map((en: any) => (
                      <div key={en.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                        <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{en.classroom?.name}</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{en.academicYear?.name} — {en.classroom?.level}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card variant="glass">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 size={18}/></div>
                    <CardTitle className="text-sm uppercase tracking-tight">Performances</CardTitle>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                      <div className="text-3xl font-black text-blue-600">{student.grades?.length || 0}</div>
                      <div className="text-[9px] font-black text-slate-500 uppercase mt-2 tracking-tighter">Évaluations</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="text-3xl font-black text-emerald-600">
                        {Math.round(((student.attendance?.filter((a:any) => a.status === 'PRESENT').length || 0) / (student.attendance?.length || 1)) * 100)}%
                      </div>
                      <div className="text-[9px] font-black text-slate-500 uppercase mt-2 tracking-tighter">Présence</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab !== 'overview' && (
              <Card variant="glass" noPadding className="overflow-hidden">
                 <div className="py-20 flex flex-col items-center justify-center text-slate-400 opacity-20">
                    <Activity size={48} className="mb-4" />
                    <h3 className="text-lg font-black uppercase tracking-widest">Contenu en chargement</h3>
                 </div>
              </Card>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
