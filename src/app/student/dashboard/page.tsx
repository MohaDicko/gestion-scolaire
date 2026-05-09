'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, CalendarCheck, Award, Receipt, Bell, ChevronRight, Loader2, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

interface StudentData {
  firstName: string;
  lastName: string;
  studentNumber: string;
  classroom?: string;
  attendanceRate: number | null;
  generalAverage: number | null;
  unpaidAmount: number;
  unpaidCount: number;
  latestLesson?: { title: string; date: string; homework?: string } | null;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get basic info from localStorage first
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        const user = JSON.parse(stored);
        setStudent(prev => prev ? prev : {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          studentNumber: '',
          attendanceRate: null,
          generalAverage: null,
          unpaidAmount: 0,
          unpaidCount: 0
        });
      }
    } catch {}

    // Then fetch real data from the portal API
    const fetchData = async () => {
      try {
        const res = await fetch('/api/parent/children');
        if (res.ok) {
          const data = await res.json();
          // For a student, "children" returns their own record
          if (Array.isArray(data) && data.length > 0) {
            const s = data[0];
            setStudent({
              firstName: s.firstName,
              lastName: s.lastName,
              studentNumber: s.studentNumber,
              classroom: s.enrollments?.[0]?.classroom?.name,
              attendanceRate: s.attendanceRate,
              generalAverage: s.generalAverage,
              unpaidAmount: s.unpaidAmount || 0,
              unpaidCount: s.unpaidCount || 0,
              latestLesson: s.latestLesson
            });
          }
        }
      } catch {/* use localStorage fallback */}
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const kpis = [
    {
      label: 'Emploi du Temps',
      value: 'Voir →',
      icon: CalendarCheck,
      color: '#4f8ef7',
      bg: 'rgba(79,142,247,0.12)',
      href: '/timetable',
      description: 'Planning de la semaine'
    },
    {
      label: 'Mes Notes',
      value: student?.generalAverage != null ? `${student.generalAverage.toFixed(2)}/20` : 'Voir →',
      icon: Award,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      href: '/reports/bulletins',
      description: student?.generalAverage != null ? (student.generalAverage >= 10 ? '✅ Au-dessus de la moyenne' : '⚠️ En dessous de la moyenne') : 'Consulter le bulletin'
    },
    {
      label: 'Présence',
      value: student?.attendanceRate != null ? `${student.attendanceRate}%` : '--',
      icon: TrendingUp,
      color: student?.attendanceRate != null && student.attendanceRate < 80 ? '#f59e0b' : '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
      href: '/attendance',
      description: student?.attendanceRate != null && student.attendanceRate < 80 ? '⚠️ Assiduité insuffisante' : 'Taux d\'assiduité'
    },
    {
      label: 'Frais de Scolarité',
      value: student?.unpaidAmount != null && student.unpaidAmount > 0 ? `${student.unpaidAmount.toLocaleString()} XOF` : 'À jour ✅',
      icon: Receipt,
      color: student?.unpaidAmount != null && student.unpaidAmount > 0 ? '#f43f5e' : '#10b981',
      bg: student?.unpaidAmount != null && student.unpaidAmount > 0 ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
      href: '/invoices',
      description: student?.unpaidCount != null && student.unpaidCount > 0 ? `${student.unpaidCount} facture(s) impayée(s)` : 'Paiements à jour'
    }
  ];

  if (isLoading) {
    return (
      <AppLayout title="Mon Espace Élève" subtitle="Chargement..." breadcrumbs={[{ label: 'Mon Espace' }]}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Mon Espace Élève"
      subtitle={student ? `Bienvenue, ${student.firstName} ${student.lastName}${student.classroom ? ` — ${student.classroom}` : ''}` : 'Mon Espace'}
      breadcrumbs={[{ label: 'Mon Espace' }]}
    >
      {/* Alerte impayés */}
      {student && student.unpaidAmount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', background: 'rgba(244,63,94,0.1)',
          border: '1px solid rgba(244,63,94,0.35)', borderRadius: '12px',
          marginBottom: '24px', color: '#f43f5e'
        }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>
            Attention — {student.unpaidAmount.toLocaleString()} XOF de frais de scolarité impayés.
          </span>
          <button
            onClick={() => router.push('/invoices')}
            style={{ marginLeft: 'auto', background: '#f43f5e', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Régler maintenant
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {kpis.map((kpi, i) => (
          <div
            key={i}
            onClick={() => router.push(kpi.href)}
            style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '24px',
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
              position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            {/* Background glow */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: kpi.bg, filter: 'blur(20px)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', position: 'relative' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: kpi.bg, display: 'grid', placeItems: 'center' }}>
                <kpi.icon size={22} style={{ color: kpi.color }} />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {kpi.label}
              </div>
            </div>

            <div style={{ fontSize: '22px', fontWeight: 900, color: kpi.color, marginBottom: '6px', position: 'relative' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{kpi.description}</span>
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Dernière Leçon */}
      {student?.latestLesson && (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={15} /> Dernier Cours Enregistré
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{student.latestLesson.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} /> {new Date(student.latestLesson.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
            {student.latestLesson.homework && (
              <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '12px 16px', flex: 1, minWidth: '200px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '4px', textTransform: 'uppercase' }}>📚 Devoir</div>
                <div style={{ fontSize: '13px', color: 'var(--text)' }}>{student.latestLesson.homework}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accès rapides */}
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={15} /> Accès Rapides
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {[
            { label: 'Mes Bulletins de Notes', href: '/reports/bulletins', icon: Award },
            { label: 'Emploi du Temps', href: '/timetable', icon: CalendarCheck },
            { label: 'Mes Présences', href: '/attendance', icon: TrendingUp },
            { label: 'Mes Factures', href: '/invoices', icon: Receipt },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '10px',
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <item.icon size={15} style={{ color: 'var(--primary)' }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
