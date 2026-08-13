'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity, Clock, UserCheck, GraduationCap, BookOpen,
  ChevronRight, Sun, Moon, CloudSun, AlertCircle,
  CheckCircle2, Plus, Receipt, FileText, ArrowRight, Wallet,
  TrendingUp, Users, BookMarked, Coins, BarChart3, Calendar,
  Award, Zap, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';
import { motion } from 'framer-motion';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function DashboardPage() {
  const router  = useRouter();
  const toast   = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting]   = useState('Bonjour');
  const [greetEmoji, setGreetEmoji] = useState('☀️');
  const [stats, setStats] = useState({
    studentsCount: 0, employeesCount: 0,
    invoicesTotal: 0, invoicesPaid: 0,
    pendingLeaves: 0, classroomsCount: 3,
    subjectsCount: 116, timetableCount: 81,
  });
  const [user, setUser] = useState<{ firstName?: string; role?: string } | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) { setGreeting('Bonne nuit'); setGreetEmoji('🌙'); }
    else if (hour < 12) { setGreeting('Bonjour'); setGreetEmoji('☀️'); }
    else if (hour < 18) { setGreeting('Bon après-midi'); setGreetEmoji('🌤️'); }
    else { setGreeting('Bonsoir'); setGreetEmoji('🌙'); }
    try { const s = localStorage.getItem('auth_user'); if (s) setUser(JSON.parse(s)); } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        switch (u.role) {
          case 'STUDENT':    router.push('/student/dashboard'); return;
          case 'TEACHER':    router.push('/teacher/dashboard'); return;
          case 'ACCOUNTANT': router.push('/finance/dashboard'); return;
          case 'HR_MANAGER': router.push('/hr/dashboard'); return;
          case 'SUPER_ADMIN':router.push('/admin/schools'); return;
          case 'PARENT':     router.push('/parent'); return;
          case 'CENSEUR':
          case 'SURVEILLANT':router.push('/attendance'); return;
        }
      }
    } catch {}
    fetchStats();
  }, [fetchStats, router]);

  const kpis = [
    {
      label: 'Apprenants', value: isLoading ? '...' : (stats.studentsCount || 131),
      sub: 'Inscrits (2025-2026)', icon: <GraduationCap size={28} />,
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
      glow: 'rgba(30,58,138,0.25)',
      href: '/students',
    },
    {
      label: 'Formateurs', value: isLoading ? '...' : (stats.employeesCount || 21),
      sub: '1 750 FCFA / heure', icon: <Users size={28} />,
      gradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
      glow: 'rgba(5,150,105,0.25)',
      href: '/employees',
    },
    {
      label: 'Filières', value: stats.classroomsCount || 3,
      sub: '1ère TE • 1ère EA • 2ème EA', icon: <BookOpen size={28} />,
      gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
      glow: 'rgba(124,58,237,0.25)',
      href: '/classrooms',
    },
    {
      label: 'Modules APC', value: stats.subjectsCount || 116,
      sub: 'Catalogue officiel CFP-PAS', icon: <BookMarked size={28} />,
      gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
      glow: 'rgba(217,119,6,0.25)',
      href: '/subjects',
    },
    {
      label: 'Créneaux / Semaine', value: stats.timetableCount || 81,
      sub: '3 classes planifiées', icon: <Clock size={28} />,
      gradient: 'linear-gradient(135deg, #164e63 0%, #0891b2 100%)',
      glow: 'rgba(8,145,178,0.25)',
      href: '/timetable',
    },
  ];

  const quickActions = [
    { label: 'Nouvelle Inscription', icon: Plus, color: '#1e3a8a', bg: 'rgba(30,58,138,0.08)', href: '/students/enroll', desc: 'Ajouter un apprenant' },
    { label: 'Encaisser un Paiement', icon: Wallet, color: '#059669', bg: 'rgba(5,150,105,0.08)', href: '/finance/payments', desc: 'Frais de scolarité' },
    { label: 'Saisir un Cours', icon: BookOpen, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', href: '/lessons', desc: 'Émargement & Journal' },
    { label: "Faire l'Appel", icon: UserCheck, color: '#d97706', bg: 'rgba(217,119,6,0.08)', href: '/attendance', desc: 'Présences du jour' },
    { label: 'Saisir les Notes', icon: FileText, color: '#0891b2', bg: 'rgba(8,145,178,0.08)', href: '/grades', desc: 'Évaluations & résultats' },
    { label: 'Voir les Bulletins', icon: Award, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', href: '/reports/bulletins', desc: '1er trimestre' },
  ];

  const pendingTasks = [
    { type: 'finance', title: 'Factures en retard', desc: '12 frais de scolarité non réglés', priority: 'high', href: '/invoices', dot: '#ef4444' },
    { type: 'hr', title: 'Demandes de congé', desc: '3 formateurs en attente de validation', priority: 'medium', href: '/hr/leaves', dot: '#f59e0b' },
    { type: 'academic', title: 'Bulletins à valider', desc: 'Trimestre 1 prêt pour signature', priority: 'medium', href: '/reports/bulletins', dot: '#f59e0b' },
    { type: 'payroll', title: 'Calcul de paie', desc: 'Novembre 2025 — 21 formateurs', priority: 'low', href: '/payslips', dot: '#10b981' },
  ];

  return (
    <AppLayout
      title={`${greetEmoji} ${greeting}${user?.firstName ? `, ${user.firstName}` : ''}`}
      subtitle="CFP-PAS de Gao — Année scolaire 2025-2026"
      actions={
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', borderRadius: 12,
          background: 'var(--bg-4)', border: '1.5px solid var(--border)',
          fontSize: 13, fontWeight: 700, color: 'var(--text-muted)',
        }}>
          <Calendar size={14} style={{ color: 'var(--primary)' }} />
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      }
    >
      <motion.div className="flex flex-col gap-8" initial="hidden" animate="visible" variants={stagger}>

        {/* ── KPI GRID ── */}
        <motion.section variants={fadeUp}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {kpis.map((kpi, i) => (
              <motion.div
                key={i}
                onClick={() => router.push(kpi.href)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                style={{
                  background: kpi.gradient,
                  borderRadius: 18,
                  padding: '20px 22px',
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px ${kpi.glow}`,
                  color: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                whileHover={{ y: -3, scale: 1.01 }}
              >
                {/* Background circle decoration */}
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 90, height: 90, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }} />
                <div style={{
                  position: 'absolute', bottom: -30, right: -10,
                  width: 70, height: 70, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, position: 'relative' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.75 }}>
                    {kpi.label}
                  </span>
                  <div style={{ opacity: 0.25 }}>{kpi.icon}</div>
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-2px', lineHeight: 1, position: 'relative' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 11, opacity: 0.65, marginTop: 8, fontWeight: 600, position: 'relative' }}>
                  {kpi.sub}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── QUICK ACTIONS ── */}
        <motion.section variants={fadeUp}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 20, borderRadius: 99, background: 'var(--primary-grad)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.3px' }}>
              Actions Rapides
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {quickActions.map((a, i) => (
              <motion.div
                key={i}
                onClick={() => router.push(a.href)}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 + 0.3 }}
                whileHover={{ y: -2 }}
                style={{
                  background: 'var(--bg-3)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 16,
                  padding: '18px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                }}
                className="group"
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: a.bg, display: 'grid', placeItems: 'center',
                  marginBottom: 12, color: a.color,
                  transition: 'transform 0.2s',
                }}>
                  <a.icon size={20} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 3, fontFamily: 'Outfit, sans-serif' }}>
                  {a.label}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 500 }}>
                  {a.desc}
                </div>
                <div style={{
                  position: 'absolute', bottom: 14, right: 14,
                  color: a.color, opacity: 0,
                  transition: 'all 0.2s',
                }}
                  className="group-action-arrow"
                >
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── BOTTOM ROW ── */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }} className="grid-cols-1 lg:grid-cols-[1fr_340px]">

          {/* Tasks Panel */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 3, height: 20, borderRadius: 99, background: 'linear-gradient(180deg, #d97706, #f59e0b)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.3px' }}>
                Tâches en attente
              </h2>
              <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--danger-dim)', color: 'var(--danger)', padding: '2px 8px', borderRadius: 99 }}>
                {pendingTasks.length}
              </span>
            </div>

            <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {pendingTasks.map((task, i) => (
                <div
                  key={i}
                  onClick={() => router.push(task.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 18px',
                    borderBottom: i < pendingTasks.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  className="hover-bg-surface"
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.dot, flexShrink: 0, boxShadow: `0 0 0 3px ${task.dot}22` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500 }}>{task.desc}</div>
                  </div>
                  <ChevronRight size={15} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                </div>
              ))}
              <div style={{ padding: '12px 18px', textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>
                  Voir toutes les tâches
                </span>
              </div>
            </div>
          </div>

          {/* Status Widget */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Daily status card */}
            <div style={{
              background: 'linear-gradient(145deg, #0f1f5c 0%, #1e3a8a 50%, #1a2f7a 100%)',
              borderRadius: 18,
              padding: '22px 22px',
              color: '#fff',
              boxShadow: '0 12px 40px rgba(30,58,138,0.3)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Flag band */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #14A44D 33%, #FCD116 33% 66%, #CE1126 66%)' }} />
              
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              
              <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: 16 }}>
                📊 État du Jour
              </h3>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.55, marginBottom: 6 }}>Présence Apprenants</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 38, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-2px' }}>94%</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>↑ +2%</span>
                </div>
                <div style={{ marginTop: 10, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: '94%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0 16px' }} />

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.55, marginBottom: 6 }}>Recouvrement Mensuel</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Outfit, sans-serif', letterSpacing: '-1px' }}>12.5M</span>
                  <span style={{ fontSize: 13, opacity: 0.6, fontWeight: 600 }}>FCFA</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4, fontWeight: 600 }}>85% des frais réglés</div>
              </div>
            </div>

            {/* School Identity Card */}
            <div style={{
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: '18px 18px',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #14A44D 33%, #FCD116 33% 66%, #CE1126 66%)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-grad)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'var(--shadow-glow)' }}>
                  <Shield size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'Outfit, sans-serif' }}>CFP-PAS de Gao</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gao, Mali</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Approche', value: 'APC — Compétences' },
                  { label: 'Tarif formateur', value: '1 750 FCFA/h' },
                  { label: 'Année scolaire', value: '2025-2026' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>{row.label}</span>
                    <span style={{ color: 'var(--text-soft)', fontWeight: 800 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </AppLayout>
  );
}
