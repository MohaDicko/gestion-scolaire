'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { TrendingUp, Users, DollarSign, BookOpen, Award, AlertCircle, Loader2, RefreshCw, BarChart2, PieChart, Target } from 'lucide-react';

interface AnalyticsData {
  academic: {
    totalStudents: number; activeStudents: number; totalEmployees: number; attendanceRate: number;
    gradesByTrimestre: { trimestre: string; moyenne: number; count: number }[];
    mentions: { excellent: number; bien: number; assezBien: number; passable: number; insuffisant: number };
    classroomStats: { name: string; enrolled: number; capacity: number; rate: number }[];
  };
  finance: {
    totalRevenue: number; paidRevenue: number; pendingRevenue: number; collectionRate: number;
    revenueByMonth: { label: string; revenue: number; expenses: number }[];
    expensesByCategory: Record<string, number>;
  };
  hr: { totalEmployees: number; pendingLeaves: number };
}

function fmt(n: number) { return n.toLocaleString('fr-FR'); }
function fmtXOF(n: number) { return `${fmt(n)} FCFA`; }

// Mini bar chart component
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
      <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', minWidth: '32px' }}>{pct}%</span>
    </div>
  );
}

// KPI Card
function KpiCard({ title, value, sub, icon: Icon, color, bg }: { title: string; value: string; sub?: string; icon: any; color: string; bg: string }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: bg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon size={22} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/reports/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <AppLayout title="Analytics & BI" subtitle="Tableau de bord Intelligence d'Affaires" breadcrumbs={[{ label: 'Analytics' }]}>
      <div style={{ display: 'grid', placeItems: 'center', height: '400px', gap: '16px' }}>
        <Loader2 size={48} color="#4f8ef7" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#94a3b8', margin: 0 }}>Calcul des indicateurs en cours...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );

  if (!data) return (
    <AppLayout title="Analytics & BI" subtitle="" breadcrumbs={[{ label: 'Analytics' }]}>
      <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
        <AlertCircle size={48} style={{ marginBottom: '16px' }} />
        <p>Impossible de charger les données.</p>
        <button onClick={load} style={{ marginTop: '12px', padding: '10px 20px', background: '#4f8ef7', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>Réessayer</button>
      </div>
    </AppLayout>
  );

  const { academic, finance, hr } = data;
  const maxRevenue = Math.max(...finance.revenueByMonth.map(m => Math.max(m.revenue, m.expenses)), 1);
  const mentionTotal = Object.values(academic.mentions).reduce((a, b) => a + b, 0) || 1;

  return (
    <AppLayout
      title="Analytics & BI"
      subtitle="Tableau de bord Intelligence d'Affaires — Vue Exécutive"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}
      actions={
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
          <RefreshCw size={14} /> Actualiser
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── KPIs principaux ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <KpiCard title="Élèves actifs" value={fmt(academic.activeStudents)} sub={`sur ${fmt(academic.totalStudents)} inscrits`} icon={Users} color="#4f8ef7" bg="rgba(79,142,247,0.1)" />
          <KpiCard title="Taux de présence" value={`${academic.attendanceRate}%`} sub="depuis le début d'année" icon={Target} color="#10b981" bg="rgba(16,185,129,0.1)" />
          <KpiCard title="Chiffre d'affaires" value={fmtXOF(finance.totalRevenue)} sub={`${finance.collectionRate}% encaissé`} icon={DollarSign} color="#f59e0b" bg="rgba(245,158,11,0.1)" />
          <KpiCard title="Reste à encaisser" value={fmtXOF(finance.pendingRevenue)} sub="factures impayées" icon={TrendingUp} color="#ef4444" bg="rgba(239,68,68,0.1)" />
          <KpiCard title="Personnel actif" value={fmt(academic.totalEmployees)} sub={`${hr.pendingLeaves} congé(s) en attente`} icon={Award} color="#8b5cf6" bg="rgba(139,92,246,0.1)" />
        </div>

        {/* ── Ligne 1 : Finance + Présence ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

          {/* Graphique revenus vs dépenses */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ width: '36px', height: '36px', background: 'rgba(79,142,247,0.1)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
                <BarChart2 size={18} color="#4f8ef7" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Revenus vs Dépenses</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>6 derniers mois</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '160px' }}>
              {finance.revenueByMonth.map((m, i) => {
                const revH = Math.round((m.revenue / maxRevenue) * 140);
                const expH = Math.round((m.expenses / maxRevenue) * 140);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '140px' }}>
                      <div title={`Revenus: ${fmtXOF(m.revenue)}`} style={{ width: '14px', height: `${revH || 4}px`, background: 'linear-gradient(180deg, #4f8ef7, #3b6fd4)', borderRadius: '4px 4px 0 0', cursor: 'pointer', transition: 'opacity 0.2s' }} />
                      <div title={`Dépenses: ${fmtXOF(m.expenses)}`} style={{ width: '14px', height: `${expH || 4}px`, background: 'linear-gradient(180deg, #ef4444, #dc2626)', borderRadius: '4px 4px 0 0', cursor: 'pointer', transition: 'opacity 0.2s' }} />
                    </div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>{m.label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#4f8ef7' }} /> Revenus</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} /> Dépenses</div>
            </div>
          </div>

          {/* Taux de recouvrement */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
                <PieChart size={18} color="#10b981" />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Recouvrement</h3>
            </div>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '8px 0' }}>
              <svg viewBox="0 0 100 100" style={{ width: '130px', height: '130px', transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="12"
                  strokeDasharray={`${finance.collectionRate * 2.513} ${251.3}`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{finance.collectionRate}%</div>
                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>ENCAISSÉ</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Encaissé</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>{fmtXOF(finance.paidRevenue)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>En attente</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>{fmtXOF(finance.pendingRevenue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ligne 2 : Notes + Classes ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Moyennes par trimestre */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
                <BookOpen size={18} color="#8b5cf6" />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Performance Académique</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {academic.gradesByTrimestre.map(t => (
                <div key={t.trimestre}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{t.trimestre} — {t.count} évaluations</span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: t.moyenne >= 10 ? '#10b981' : '#ef4444' }}>{t.moyenne}/20</span>
                  </div>
                  <MiniBar value={t.moyenne} max={20} color={t.moyenne >= 14 ? '#10b981' : t.moyenne >= 10 ? '#f59e0b' : '#ef4444'} />
                </div>
              ))}
            </div>
            {/* Mentions */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' }}>Répartition des mentions</div>
              <div style={{ display: 'flex', gap: '4px', height: '24px', borderRadius: '8px', overflow: 'hidden' }}>
                {[
                  { label: 'Excellent', val: academic.mentions.excellent, color: '#10b981' },
                  { label: 'Bien', val: academic.mentions.bien, color: '#3b82f6' },
                  { label: 'Assez bien', val: academic.mentions.assezBien, color: '#f59e0b' },
                  { label: 'Passable', val: academic.mentions.passable, color: '#f97316' },
                  { label: 'Insuffisant', val: academic.mentions.insuffisant, color: '#ef4444' },
                ].map(m => (
                  <div key={m.label} title={`${m.label}: ${m.val}`}
                    style={{ flex: m.val || 0, background: m.color, minWidth: m.val > 0 ? '4px' : '0', transition: 'flex 0.8s ease' }} />
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {[
                  { label: '≥16 Excellent', val: academic.mentions.excellent, color: '#10b981' },
                  { label: '14-16 Bien', val: academic.mentions.bien, color: '#3b82f6' },
                  { label: '12-14 A.Bien', val: academic.mentions.assezBien, color: '#f59e0b' },
                  { label: '10-12 Passable', val: academic.mentions.passable, color: '#f97316' },
                  { label: '<10 Insuffisant', val: academic.mentions.insuffisant, color: '#ef4444' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748b' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: m.color }} />
                    {m.label}: <strong>{Math.round((m.val / mentionTotal) * 100)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Taux d'occupation des classes */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '36px', height: '36px', background: 'rgba(245,158,11,0.1)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
                <Users size={18} color="#f59e0b" />
              </div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Occupation des Classes</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {academic.classroomStats.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>Aucune donnée disponible</p>
              ) : academic.classroomStats.map((c, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{c.name}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{c.enrolled}/{c.capacity}</span>
                  </div>
                  <MiniBar value={c.enrolled} max={c.capacity} color={c.rate >= 90 ? '#ef4444' : c.rate >= 70 ? '#f59e0b' : '#10b981'} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
