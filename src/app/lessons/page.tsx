'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Search, Clock, User, FileText, Loader2, Save, X, ClipboardList, School, Timer, ChevronRight, TrendingUp, Award, Edit3, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

const CLASS_COLORS: Record<string, string> = {
  '1ère TE': 'from-emerald-500 to-teal-600',
  '1ère EA': 'from-blue-500 to-indigo-600',
  '2ème EA': 'from-purple-500 to-violet-600',
};

export default function LessonLogsPage() {
  const router = useRouter();
  const toast  = useToast();

  const [logs, setLogs]             = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects]     = useState<any[]>([]);
  const [employees, setEmployees]   = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [schoolType, setSchoolType] = useState<string | null>(null);
  const isAgroOrTech = schoolType === 'AGRO' || schoolType === 'TECHNIQUE';
  const [showModal, setShowModal]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab]   = useState<'journal'|'synthese'>('journal');

  const [filters, setFilters] = useState({ classroomId: '', subjectId: '' });
  const [formData, setFormData] = useState({
    classroomId: '', subjectId: '', employeeId: '', title: '', content: '', homework: '',
    date: new Date().toISOString().split('T')[0],
    hoursCount: 1, // Nombre d'heures de la séance
    status: 'COMPLETED'
  });

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ classroomId: filters.classroomId, subjectId: filters.subjectId }).toString();
      const res = await fetch(`/api/lessons?${query}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error();
      setLogs(await res.json());
    } catch {
      toast.error('Impossible de charger le cahier de texte.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, router, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    Promise.all([
      fetch('/api/classrooms').then(r => r.json()),
      fetch('/api/subjects').then(r => r.json()),
      fetch('/api/employees').then(r => r.json()),
      fetch('/api/school/config').then(r => r.json()),
    ]).then(([cData, sData, eData, config]) => {
      if (Array.isArray(cData)) setClassrooms(cData);
      if (Array.isArray(sData)) setSubjects(sData);
      if (eData?.items) setEmployees(eData.items);
      if (config?.type) setSchoolType(config.type);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classroomId || !formData.subjectId || !formData.title || !formData.content) {
      toast.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error();
      toast.success('Cours enregistré avec succès. ✅');
      setShowModal(false);
      setFormData({ ...formData, title: '', content: '', homework: '', hoursCount: 1 });
      fetchLogs();
    } catch {
      toast.error("Erreur lors de l'enregistrement du cours.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Synthèse par professeur ──
  const teacherStats = logs.reduce((acc: Record<string, any>, log) => {
    if (!log.teacher) return acc;
    const key = log.teacher.id || `${log.teacher.firstName}-${log.teacher.lastName}`;
    if (!acc[key]) {
      acc[key] = {
        name: `${log.teacher.firstName} ${log.teacher.lastName}`,
        totalHours: 0,
        totalPay: 0,
        sessions: 0,
        classes: new Set<string>(),
        subjects: new Set<string>(),
      };
    }
    const rate = log.teacher?.contracts?.[0]?.hourlyRate || 0;
    acc[key].totalHours += (log.hoursCount || 1);
    acc[key].totalPay += ((log.hoursCount || 1) * rate);
    acc[key].sessions += 1;
    if (log.classroom?.name) acc[key].classes.add(log.classroom.name);
    if (log.subject?.name) acc[key].subjects.add(log.subject.name);
    return acc;
  }, {});

  const totalHoursAll = logs.reduce((sum, l) => sum + (l.hoursCount || 1), 0);
  const totalSessionsAll = logs.length;
  const totalPayAll = Object.values(teacherStats).reduce((sum: any, t: any) => sum + t.totalPay, 0);

  return (
    <AppLayout
      title="Cahier de Texte & Émargement"
      subtitle="Journal pédagogique officiel — CFP-PAS de Gao (2025-2026)"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Cahier de Texte' }]}
      actions={
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Saisir un Cours
        </button>
      }
    >
      <div className="flex flex-col gap-6">

        {/* ── KPI Bar ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">Total Séances</div>
            <div className="text-3xl font-black">{totalSessionsAll}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1">Heures dispensées</div>
            <div className="text-3xl font-black">{totalHoursAll}h</div>
          </div>
          <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-200 mb-1">Coût estimé</div>
            <div className="text-2xl font-black">{totalPayAll.toLocaleString('fr-FR')}</div>
            <div className="text-xs text-amber-200">FCFA</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-200 mb-1">Professeurs actifs</div>
            <div className="text-3xl font-black">{Object.keys(teacherStats).length}</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'journal' ? 'bg-white dark:bg-zinc-900 shadow text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            📖 Journal de Classe
          </button>
          <button
            onClick={() => setActiveTab('synthese')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'synthese' ? 'bg-white dark:bg-zinc-900 shadow text-indigo-600' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            📊 Synthèse par Professeur
          </button>
        </div>

        {/* ── Filtres ── */}
        {activeTab === 'journal' && (
          <div className="card shadow-sm" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div className="search-box" style={{ flex: 1, minWidth: '180px' }}>
              <Search size={15} />
              <input type="text" placeholder="Rechercher un cours..." className="form-input" style={{ border: 'none', background: 'transparent' }} />
            </div>
            <select className="form-input" style={{ width: '180px' }} value={filters.classroomId} onChange={(e) => setFilters({ ...filters, classroomId: e.target.value })}>
              <option value="">Toutes les classes</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="form-input" style={{ width: '200px' }} value={filters.subjectId} onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}>
              <option value="">{isAgroOrTech ? 'Tous les modules' : 'Toutes les matières'}</option>
              {subjects.slice(0, 30).map(s => <option key={s.id} value={s.id}>{s.name.slice(0, 40)}</option>)}
            </select>
          </div>
        )}

        {/* ── Journal Tab ── */}
        {activeTab === 'journal' && (
          isLoading ? (
            <div style={{ padding: '80px', textAlign: 'center' }}>
              <Loader2 size={36} className="spin text-primary" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Chargement du journal...</p>
            </div>
          ) : logs.length > 0 ? (
            <div className="flex flex-col gap-4">
              {logs.map((log) => {
                const className = log.classroom?.name || '';
                const gradientClass = CLASS_COLORS[className] || 'from-gray-500 to-gray-700';
                const hours = log.hoursCount || 1;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-stretch">
                      {/* Date Badge */}
                      <div className={`bg-gradient-to-b ${gradientClass} w-20 flex flex-col items-center justify-center p-4 text-white shrink-0`}>
                        <span className="text-2xl font-black">{new Date(log.date).getDate()}</span>
                        <span className="text-xs font-bold uppercase opacity-80">{new Date(log.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                        <div className="mt-2 bg-white/20 rounded-full px-2 py-0.5 text-[10px] font-bold">{hours}h</div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">{log.title}</h3>
                            <div className="flex gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                <BookOpen size={9} /> {log.subject?.name?.slice(0, 35)}
                              </span>
                              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                <School size={9} /> {className}
                              </span>
                              {(() => {
                                const rate = log.teacher?.contracts?.[0]?.hourlyRate;
                                if (!rate) return null;
                                return (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                    <Timer size={9} /> {hours}h × {rate.toLocaleString('fr-FR')} = {(hours * rate).toLocaleString('fr-FR')} FCFA
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 justify-end">
                              <User size={11} /> {log.teacher?.firstName} {log.teacher?.lastName}
                            </div>
                            <div className="inline-flex items-center gap-1 mt-1 bg-green-50 dark:bg-green-900/30 text-green-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <CheckCircle size={8} /> Validé
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap border border-zinc-100 dark:border-zinc-700/50">
                          {log.content}
                        </div>

                        {log.homework && (
                          <div className="mt-3 flex gap-3 items-start bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
                            <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0">
                              <ClipboardList size={13} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase mb-0.5">Devoirs / Travaux à faire</p>
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">{log.homework}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center p-20">
              <FileText size={56} className="mx-auto mb-4 opacity-10" />
              <h3 className="font-bold text-zinc-900 dark:text-white">Cahier vide</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-xs mx-auto">Aucun cours n'a été enregistré. Cliquez sur "Saisir un Cours" pour commencer.</p>
              <button className="btn-primary mt-6" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Premier cours du journal
              </button>
            </div>
          )
        )}

        {/* ── Synthèse Tab ── */}
        {activeTab === 'synthese' && (
          <div className="flex flex-col gap-4">
            {Object.values(teacherStats).length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center p-16">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-10" />
                <p className="text-sm text-zinc-500 font-medium">Aucune donnée disponible. Commencez par enregistrer des cours.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Object.values(teacherStats) as any[])
                  .sort((a: any, b: any) => b.totalHours - a.totalHours)
                  .map((teacher: any, idx: number) => {
                    const salary = teacher.totalHours * HOURLY_RATE;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                              {teacher.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white text-sm">{teacher.name}</div>
                              <div className="text-xs text-zinc-500">{teacher.sessions} séance{teacher.sessions > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-zinc-500 mb-0.5">Salaire estimé</div>
                            <div className="font-black text-emerald-600 dark:text-emerald-400 text-base">{salary.toLocaleString('fr-FR')} FCFA</div>
                          </div>
                        </div>

                        {/* Heures Bar */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-zinc-500">Heures dispensées</span>
                            <span className="text-indigo-600">{teacher.totalHours}h</span>
                          </div>
                          <div className="h-2 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (teacher.totalHours / Math.max(...Object.values(teacherStats).map((t: any) => t.totalHours))) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Classes & Modules */}
                        <div className="flex gap-1.5 flex-wrap">
                          {[...teacher.classes].map((cls: string) => (
                            <span key={cls} className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                              🎓 {cls}
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                          <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                            <Award size={10} /> Tarif : {HOURLY_RATE.toLocaleString('fr-FR')} FCFA/h
                          </div>
                          <div className="text-[10px] text-zinc-400 font-bold">
                            {teacher.subjects.size} module{teacher.subjects.size > 1 ? 's' : ''}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Modal Ajout Cours ── */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: '17px' }}>📝 Saisie d'un Cours</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Journal officiel du Cahier de Texte – CFP-PAS de Gao</p>
                </div>
                <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Classe, Matière, Professeur */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label>Classe *</label>
                    <select required value={formData.classroomId} onChange={e => setFormData({...formData, classroomId: e.target.value})} className="form-input">
                      <option value="">-- Sélectionner --</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {/* Module / Matière */}
                  <div className="form-group" style={{ flex: '1 1 200px' }}>
                    <label>{isAgroOrTech ? 'Module *' : 'Matière *'}</label>
                    <select className="form-input" value={formData.subjectId} onChange={e => setFormData({ ...formData, subjectId: e.target.value })} required>
                      <option value="">-- Sélectionnez --</option>
                      {subjects.slice(0, 50).map(s => <option key={s.id} value={s.id}>{s.name.slice(0, 50)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Professeur *</label>
                    <select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="form-input">
                      <option value="">-- Auto (connecté) --</option>
                      {employees.filter(e => e.employeeType === 'TEACHER').map(e => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date et durée */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label>Date du cours *</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="flex items-center gap-2">
                      <Timer size={13} className="text-amber-500" />
                      Nombre d'heures *
                    </label>
                    <input
                      type="number" min="0.5" max="8" step="0.5"
                      value={formData.hoursCount}
                      onChange={e => setFormData({...formData, hoursCount: parseFloat(e.target.value)})}
                      className="form-input"
                      required
                    />
                    {formData.hoursCount > 0 && (
                      <p className="text-xs text-emerald-600 font-bold mt-1">
                        💰 Rémunération calculée automatiquement lors de la paie.
                      </p>
                    )}
                  </div>
                </div>

                {/* Titre */}
                <div className="form-group">
                  <label>Titre de la leçon *</label>
                  <input
                    required
                    placeholder="Ex: Anatomie et physiologie des bovins — Introduction"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="form-input"
                    style={{ fontSize: '15px', fontWeight: 700 }}
                  />
                </div>

                {/* Contenu */}
                <div className="form-group">
                  <label>Contenu du cours (Objectifs, Résumé, Points clés) *</label>
                  <textarea
                    required rows={5}
                    placeholder="Décrivez les points abordés lors de cette séance..."
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="form-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Devoirs */}
                <div className="form-group" style={{ background: 'var(--bg-3)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <label style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClipboardList size={13} /> Devoirs & Travaux à faire (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Exercices ou travaux pratiques pour la prochaine séance..."
                    value={formData.homework}
                    onChange={e => setFormData({...formData, homework: e.target.value})}
                    className="form-input"
                    style={{ border: 'none', background: 'transparent', resize: 'none', padding: '8px 0' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                  <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 size={15} className="spin" /> Enregistrement...</> : <><Save size={15} /> Valider l'Émargement</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
