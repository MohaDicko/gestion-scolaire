'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Search, Calendar, Clock, User, FileText, ChevronRight, Loader2, Save, X, BookCheck, ClipboardList, School } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function LessonLogsPage() {
  const router = useRouter();
  const toast  = useToast();

  const [logs, setLogs]             = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [subjects, setSubjects]     = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filters, setFilters] = useState({ classroomId: '', subjectId: '' });
  const [formData, setFormData] = useState({
    classroomId: '', subjectId: '', title: '', content: '', homework: '', date: new Date().toISOString().split('T')[0], status: 'COMPLETED'
  });

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
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

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    Promise.all([
      fetch('/api/classrooms').then(r => r.json()),
      fetch('/api/subjects').then(r => r.json()),
    ]).then(([cData, sData]) => {
      if (Array.isArray(cData)) setClassrooms(cData);
      if (Array.isArray(sData)) setSubjects(sData);
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
      toast.success('Cours enregistré avec succès.');
      setShowModal(false);
      setFormData({ ...formData, title: '', content: '', homework: '' });
      fetchLogs();
    } catch {
      toast.error("Erreur lors de l'enregistrement du cours.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Cahier de Texte"
      subtitle="Suivi pédagogique et journal de classe"
      breadcrumbs={[{ label: 'Accueil', href: '/dashboard' }, { label: 'Cahier de Texte' }]}
      actions={
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nouveau Cours
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        
        {/* Filtres Bar */}
        <div className="card shadow-sm" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Rechercher par titre ou contenu..." 
              className="form-input" 
              style={{ border: 'none', background: 'transparent' }}
            />
          </div>
          <select 
            className="form-input" 
            style={{ width: '200px' }}
            value={filters.classroomId}
            onChange={(e) => setFilters({ ...filters, classroomId: e.target.value })}
          >
            <option value="">Toutes les classes</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            className="form-input" 
            style={{ width: '200px' }}
            value={filters.subjectId}
            onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
          >
            <option value="">Toutes les matières</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Liste des logs */}
        {isLoading ? (
          <div style={{ padding: '100px', textAlign: 'center' }}>
            <Loader2 size={40} className="spin text-primary" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Chargement du journal...</p>
          </div>
        ) : logs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {logs.map((log) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover-glow"
                style={{ padding: 0, overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  {/* Date Badge */}
                  <div style={{ 
                    width: '80px', background: 'var(--bg-3)', borderRight: '1px solid var(--border)', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                  }}>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text)' }}>{new Date(log.date).getDate()}</span>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      {new Date(log.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div style={{ flex: 1, padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{log.title}</h3>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BookOpen size={10} /> {log.subject.name}
                          </span>
                          <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <School size={10} /> {log.classroom.name}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={12} /> {log.teacher.firstName} {log.teacher.lastName}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                          Saisi le {new Date(log.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      background: 'rgba(var(--primary-rgb), 0.03)', borderRadius: '12px', padding: '16px', 
                      fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap',
                      border: '1px solid rgba(var(--primary-rgb), 0.05)'
                    }}>
                      {log.content}
                    </div>

                    {log.homework && (
                      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ 
                          padding: '8px', background: 'var(--warning-soft)', color: 'var(--warning)', borderRadius: '8px',
                          display: 'grid', placeItems: 'center'
                        }}>
                          <ClipboardList size={16} />
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '4px' }}>Devoirs / Exercices</p>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{log.homework}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: '80px', color: 'var(--text-muted)' }}>
            <FileText size={64} style={{ margin: '0 auto 20px', opacity: 0.1 }} />
            <h3 style={{ fontWeight: 700, color: 'var(--text)' }}>Cahier vide</h3>
            <p style={{ fontSize: '14px', maxWidth: '300px', margin: '8px auto' }}>
              Aucun cours n'a encore été enregistré pour ces critères.
            </p>
          </div>
        )}

      </div>

      {/* Modal Ajout */}
      <AnimatePresence>
        {showModal && (
          <div style={{ 
            position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card" 
              style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto', padding: 0 }}
            >
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontWeight: 800, fontSize: '18px' }}>Journal de Cours</h2>
                <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Classe *</label>
                    <select required value={formData.classroomId} onChange={e => setFormData({...formData, classroomId: e.target.value})} className="form-input">
                      <option value="">-- Sélectionner --</option>
                      {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Matière *</label>
                    <select required value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="form-input">
                      <option value="">-- Sélectionner --</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Date du cours</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input" />
                </div>

                <div className="form-group">
                  <label>Titre de la leçon *</label>
                  <input 
                    required 
                    placeholder="Ex: Les équations du second degré" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="form-input" 
                    style={{ fontSize: '16px', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label>Contenu détaillé (Objectifs, Résumé...) *</label>
                  <textarea 
                    required 
                    rows={6}
                    placeholder="Qu'est-ce qui a été enseigné aujourd'hui ?" 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})} 
                    className="form-input" 
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group" style={{ background: 'var(--bg-3)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <label style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClipboardList size={14} /> Devoirs à faire
                  </label>
                  <textarea 
                    rows={3}
                    placeholder="Exercices à faire pour le prochain cours..." 
                    value={formData.homework} 
                    onChange={e => setFormData({...formData, homework: e.target.value})} 
                    className="form-input" 
                    style={{ border: 'none', background: 'transparent', resize: 'none', padding: '8px 0' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 size={16} className="spin" /> Enregistrement...</> : <><Save size={16} /> Enregistrer le cours</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .hover-glow:hover {
          box-shadow: 0 0 0 1px var(--primary), 0 20px 40px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .hover-glow { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </AppLayout>
  );
}
