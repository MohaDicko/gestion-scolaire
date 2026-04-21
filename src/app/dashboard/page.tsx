'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, BookOpen, FileText, Wallet, Activity, TrendingUp, TrendingDown,
  Loader2, BadgeCheck, GraduationCap, Briefcase, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ClipboardCheck, Receipt, Clock,
  ChevronRight, BarChart3, Bell, Zap, Target, Award, UserCheck,
  DollarSign
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import AppLayout from '@/components/AppLayout';
import { useToast } from '@/components/Toast';

// ─── Dummy chart data — remplacé par des données réelles en production ───
const revenueData = [
  { name: 'Sep', recettes: 1200000, dépenses: 480000 },
  { name: 'Oct', recettes: 2100000, dépenses: 650000 },
  { name: 'Nov', recettes: 1800000, dépenses: 720000 },
  { name: 'Déc', recettes: 2800000, dépenses: 900000 },
  { name: 'Jan', recettes: 2400000, dépenses: 580000 },
  { name: 'Fév', recettes: 3200000, dépenses: 810000 },
  { name: 'Mar', recettes: 3800000, dépenses: 950000 },
];

const presenceData = [
  { name: 'Lun', taux: 94 },
  { name: 'Mar', taux: 91 },
  { name: 'Mer', taux: 87 },
  { name: 'Jeu', taux: 95 },
  { name: 'Ven', taux: 88 },
  { name: 'Sam', taux: 76 },
];

const recouvrement = [{ name: 'Recouvrement', value: 72, fill: 'var(--primary)' }];

const RECENT_EVENTS = [
  { icon: GraduationCap, label: 'Nouvelle inscription', value: 'Issa Mariko — Terminale A', time: '10 min', color: 'var(--info)', urgent: false },
  { icon: AlertTriangle, label: 'Facture impayée', value: 'Scolarité Fatima Sidibé — 75 000 XOF', time: '1h', color: 'var(--danger)', urgent: true },
  { icon: FileText, label: 'Notes saisies', value: 'Mathématiques DS2 — 3ème A (32 élèves)', time: '2h', color: 'var(--primary)', urgent: false },
  { icon: Wallet, label: 'Paiement reçu', value: '45 000 XOF — Frais de scolarité', time: '3h', color: 'var(--success)', urgent: false },
  { icon: Clock, label: 'Congé soumis', value: 'M. Diallo — 5 jours maladie', time: '4h', color: 'var(--warning)', urgent: false },
  { icon: BadgeCheck, label: 'Bulletin générés', value: 'Délibération Terminale — Trimestre 2', time: 'Hier', color: 'var(--purple)', urgent: false },
];

const QUICK_ACTIONS = [
  { icon: Users, label: 'Inscrire un élève', href: '/students', color: 'var(--primary)', dim: 'var(--primary-dim)' },
  { icon: FileText, label: 'Saisir des notes', href: '/grades', color: 'var(--success)', dim: 'var(--success-dim)' },
  { icon: Receipt, label: 'Émettre une facture', href: '/invoices', color: 'var(--accent)', dim: 'var(--accent-dim)' },
  { icon: ClipboardCheck, label: 'Pointer les présences', href: '/attendance', color: 'var(--info)', dim: 'var(--info-dim)' },
  { icon: Award, label: 'Générer les bulletins', href: '/reports/bulletins', color: 'var(--purple)', dim: 'var(--purple-dim)' },
  { icon: Briefcase, label: 'Gérer le personnel', href: '/employees', color: 'var(--warning)', dim: 'var(--warning-dim)' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border-md)',
        borderRadius: '12px', padding: '12px 16px', boxShadow: 'var(--shadow-lg)'
      }}>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
            <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
            <span style={{ fontWeight: 700 }}>{(p.value / 1000000).toFixed(2)}M XOF</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    studentsCount: 0,
    employeesCount: 0,
    invoicesTotal: 0,
    invoicesPaid: 0,
    pendingLeaves: 0,
    todayAttendance: 0,
  });

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      toast.error('Échec du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const paymentRate = stats.invoicesTotal > 0
    ? Math.round((stats.invoicesPaid / stats.invoicesTotal) * 100)
    : 0;

  const unpaid = stats.invoicesTotal - stats.invoicesPaid;

  return (
    <AppLayout
      title="Vue Stratégique"
      subtitle={`Tableau de bord exécutif — ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`}
      breadcrumbs={[{ label: 'Dashboard' }]}
      actions={
        <button className="btn-ghost" onClick={fetchStats}>
          <Activity size={15} /> Actualiser
        </button>
      }
    >
      {/* ── KPI Row ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

        {/* Élèves */}
        <div className="stat-card animate-up" style={{ borderTop: '3px solid var(--primary)' }}>
          <div className="stat-icon" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
            <Users size={22} />
          </div>
          <div className="stat-body">
            <div className="stat-label">Élèves Inscrits</div>
            <div className="stat-value">{isLoading ? <Loader2 className="spin" size={20} /> : stats.studentsCount.toLocaleString()}</div>
            <div className="stat-change"><ArrowUpRight size={11} /> Effectif actif</div>
          </div>
        </div>

        {/* Recettes */}
        <div className="stat-card animate-up" style={{ animationDelay: '0.07s', borderTop: '3px solid var(--success)' }}>
          <div className="stat-icon" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-body">
            <div className="stat-label">Recettes Encaissées</div>
            <div className="stat-value" style={{ fontSize: '18px' }}>
              {isLoading ? <Loader2 className="spin" size={20} /> : `${(stats.invoicesPaid / 1000000).toFixed(2)}M`}
              <span style={{ fontSize: '11px', marginLeft: 4 }}>XOF</span>
            </div>
            <div className="stat-change" style={{ background: 'var(--success-dim)', color: 'var(--success)' }}>
              {paymentRate}% recouvré
            </div>
          </div>
        </div>

        {/* Impayés */}
        <div className="stat-card animate-up" style={{ animationDelay: '0.14s', borderTop: '3px solid var(--danger)' }}>
          <div className="stat-icon" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-body">
            <div className="stat-label">Restes à Recouvrer</div>
            <div className="stat-value" style={{ fontSize: '18px', color: 'var(--danger)' }}>
              {isLoading ? <Loader2 className="spin" size={20} /> : `${(unpaid / 1000).toFixed(0)}k`}
              <span style={{ fontSize: '11px', marginLeft: 4 }}>XOF</span>
            </div>
            <div className="stat-change" style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
              <AlertTriangle size={10} /> Action requise
            </div>
          </div>
        </div>

        {/* Personnel */}
        <div className="stat-card animate-up" style={{ animationDelay: '0.21s', borderTop: '3px solid var(--info)' }}>
          <div className="stat-icon" style={{ background: 'var(--info-dim)', color: 'var(--info)' }}>
            <Briefcase size={22} />
          </div>
          <div className="stat-body">
            <div className="stat-label">Personnel Actif</div>
            <div className="stat-value">{isLoading ? <Loader2 className="spin" size={20} /> : stats.employeesCount}</div>
            <div className="stat-change">Ens. + Administratifs</div>
          </div>
        </div>
      </div>

      {/* ── SECONDARY KPIs ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Congés en attente', value: stats.pendingLeaves || 3, icon: Clock, color: 'var(--warning)', action: '/hr/leaves' },
          { label: 'Taux de présence', value: '92%', icon: UserCheck, color: 'var(--success)', action: '/attendance' },
          { label: 'Classes actives', value: '12', icon: GraduationCap, color: 'var(--primary)', action: '/classrooms' },
          { label: 'Cours planifiés', value: '48', icon: BookOpen, color: 'var(--purple)', action: '/timetable' },
        ].map((kpi, i) => (
          <div
            key={i}
            className="card"
            onClick={() => router.push(kpi.action)}
            style={{
              padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer', background: 'var(--bg-3)'
            }}
          >
            <kpi.icon size={18} style={{ color: kpi.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{kpi.label}</div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: kpi.color }}>{isLoading ? '—' : kpi.value}</div>
            </div>
            <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-dim)' }} />
          </div>
        ))}
      </div>

      {/* ── CHARTS ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Cash Flow Area Chart */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={18} className="text-primary" /> Flux de Trésorerie
            </h3>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 3, borderRadius: 2, background: 'var(--primary)' }} /> Recettes
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 3, borderRadius: 2, background: 'var(--danger)', opacity: 0.7 }} /> Dépenses
              </span>
            </div>
          </div>
          <div style={{ height: 280, padding: '16px 8px 8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v / 1000000}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" name="Recettes" dataKey="recettes" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#gradRev)" />
                <Area type="monotone" name="Dépenses" dataKey="dépenses" stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="5 3" fillOpacity={1} fill="url(#gradDep)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Bars + Recouvrement Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Recouvrement gauge */}
          <div className="card" style={{ padding: '20px 24px', flex: '0 0 auto' }}>
            <h3 className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>Taux de Recouvrement</h3>
            <div style={{ position: 'relative', height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="100%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={[{ value: paymentRate, fill: paymentRate >= 75 ? 'var(--success)' : paymentRate >= 50 ? 'var(--warning)' : 'var(--danger)' }]}>
                  <RadialBar dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: paymentRate >= 75 ? 'var(--success)' : paymentRate >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                  {paymentRate}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Objectif: 90%</div>
              </div>
            </div>
          </div>

          {/* Présence bar chart */}
          <div className="card" style={{ padding: '16px 20px', flex: 1 }}>
            <h3 className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>Présence (7 jours)</h3>
            <div style={{ height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={presenceData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={10} stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} stroke="var(--text-muted)" tickLine={false} axisLine={false} domain={[60, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-3)' }}
                    contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any) => [`${v}%`, 'Présence']}
                  />
                  <Bar dataKey="taux" radius={[4, 4, 0, 0]} barSize={22}>
                    {presenceData.map((entry, index) => (
                      <Cell key={index} fill={entry.taux >= 90 ? 'var(--success)' : entry.taux >= 80 ? 'var(--primary)' : 'var(--warning)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM: EVENTS + QUICK ACTIONS ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>

        {/* Activity Feed */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={16} className="text-primary" /> Activités & Alertes
            </h3>
            <span className="badge badge-danger">
              {RECENT_EVENTS.filter(e => e.urgent).length} urgente(s)
            </span>
          </div>
          <div>
            {RECENT_EVENTS.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '13px 24px',
                  borderBottom: idx < RECENT_EVENTS.length - 1 ? '1px solid var(--border)' : 'none',
                  background: ev.urgent ? 'rgba(244,91,105,0.04)' : 'transparent',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: `${ev.color}18`, color: ev.color,
                  display: 'grid', placeItems: 'center'
                }}>
                  <ev.icon size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {ev.label}
                    {ev.urgent && <span className="badge badge-danger" style={{ fontSize: 9, padding: '1px 6px' }}>URGENT</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.value}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0 }}>{ev.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="card" style={{ padding: '18px' }}>
          <h3 className="card-title" style={{ marginBottom: 16, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} className="text-accent" /> Actions Rapides
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {QUICK_ACTIONS.map((qa, i) => (
              <button
                key={i}
                onClick={() => router.push(qa.href)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 8, padding: '14px 10px', borderRadius: '12px',
                  background: 'var(--bg-4)', border: `1px solid var(--border)`,
                  cursor: 'pointer', transition: 'all 0.2s', fontSize: 11,
                  fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center',
                  lineHeight: 1.3
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = qa.dim;
                  (e.currentTarget as HTMLElement).style.borderColor = qa.color;
                  (e.currentTarget as HTMLElement).style.color = qa.color;
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-4)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: qa.dim, color: qa.color }}>
                  <qa.icon size={18} />
                </div>
                {qa.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1100px) {
          .dash-charts { grid-template-columns: 1fr !important; }
          .dash-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppLayout>
  );
}
