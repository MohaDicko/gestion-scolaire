'use client';

import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Clock, FileText, TrendingUp, AlertTriangle, Loader2, ChevronRight, CheckCircle, XCircle, Bell, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

interface ChildSummary {
  id: string; studentNumber: string; firstName: string; lastName: string;
  gender: string; photoUrl?: string; campus?: string;
  currentClass?: string; currentLevel?: string; academicYear?: string;
  attendanceRate: number | null; generalAverage: number | null;
  unpaidAmount: number; unpaidCount: number;
  nextDue?: { amount: number; dueDate: string; title: string } | null;
  latestLesson?: { title: string; date: string; subject: string } | null;
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: '18px', fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );
}

function ChildCard({ child, onViewBulletin, onViewInvoices }: { child: ChildSummary; onViewBulletin: () => void; onViewInvoices: () => void }) {
  const initials = `${child.firstName[0]}${child.lastName[0]}`.toUpperCase();
  const avgColor = child.generalAverage === null ? '#94a3b8' : child.generalAverage >= 14 ? '#10b981' : child.generalAverage >= 10 ? '#f59e0b' : '#ef4444';
  const attColor = child.attendanceRate === null ? '#94a3b8' : child.attendanceRate >= 85 ? '#10b981' : child.attendanceRate >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(17,25,50,0.95), rgba(10,20,45,0.98))',
      borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
      transition: 'transform 0.3s ease', cursor: 'default',
    }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
    >
      {/* Header accent */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #4f8ef7, #8b5cf6, #ec4899)' }} />

      <div style={{ padding: '24px' }}>
        {/* Identité */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
            display: 'grid', placeItems: 'center',
            fontSize: '20px', fontWeight: 900, color: 'white',
            boxShadow: '0 8px 20px rgba(79,142,247,0.3)'
          }}>
            {child.photoUrl
              ? <img src={child.photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'white' }}>{child.firstName} {child.lastName}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              {child.currentClass ? `${child.currentClass}` : 'Classe non assignée'}
              {child.campus ? ` — ${child.campus}` : ''}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
              Matricule : <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{child.studentNumber}</span>
            </div>
          </div>
          {child.unpaidCount > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '4px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>{child.unpaidCount}</div>
              <div style={{ fontSize: '9px', color: '#ef4444', opacity: 0.7 }}>impayé(s)</div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
          <StatPill label="Moy. Générale" value={child.generalAverage !== null ? `${child.generalAverage}/20` : '—'} color={avgColor} />
          <StatPill label="Présence" value={child.attendanceRate !== null ? `${child.attendanceRate}%` : '—'} color={attColor} />
          <StatPill label="Impayés" value={child.unpaidAmount > 0 ? `${(child.unpaidAmount / 1000).toFixed(0)}K` : '✓'} color={child.unpaidAmount > 0 ? '#ef4444' : '#10b981'} />
        </div>

        {/* Alerte paiement */}
        {child.nextDue && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={14} color="#ef4444" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>{child.nextDue.title}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                Échéance : {new Date(child.nextDue.dueDate).toLocaleDateString('fr-FR')} — {child.nextDue.amount.toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <button onClick={onViewBulletin} style={{
            padding: '11px', borderRadius: '12px', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)',
            color: '#4f8ef7', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.2s'
          }}>
            <BookOpen size={14} /> Notes
          </button>
          <button onClick={onViewInvoices} style={{
            padding: '11px', borderRadius: '12px',
            background: child.unpaidCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${child.unpaidCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)'}`,
            color: child.unpaidCount > 0 ? '#ef4444' : '#10b981',
            fontWeight: 700, fontSize: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <FileText size={14} /> Factures
          </button>
        </div>
        <button onClick={() => window.location.href = '/lessons'} style={{
          width: '100%', padding: '11px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'white', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}>
          <ClipboardList size={14} /> Cahier de Texte (Cours & Devoirs)
        </button>
      </div>
    </div>
  );
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}

    fetch('/api/parent/children')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setChildren(d);
        else setError('Aucun enfant lié à ce compte.');
        setIsLoading(false);
      })
      .catch(() => { setError('Erreur de chargement.'); setIsLoading(false); });
  }, []);

  return (
    <AppLayout
      title="Espace Famille"
      subtitle={`Bienvenue, ${user?.firstName ?? 'Parent'} ${user?.lastName ?? ''} — Suivi scolaire de vos enfants`}
      breadcrumbs={[{ label: 'Espace Famille' }]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
          borderRadius: '20px', padding: '28px 32px', position: 'relative', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(79,142,247,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', height: '3px', marginBottom: '20px', borderRadius: '2px', overflow: 'hidden', maxWidth: '200px' }}>
              <div style={{ flex: 1, background: '#009a44' }} /><div style={{ flex: 1, background: '#fcd116' }} /><div style={{ flex: 1, background: '#ce1126' }} />
            </div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'white' }}>
              Bonjour, {user?.firstName ?? 'Parent'} 👋
            </h2>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
              {children.length > 0
                ? `Vous suivez ${children.length} enfant${children.length > 1 ? 's' : ''} scolarisé${children.length > 1 ? 's' : ''}.`
                : 'Votre portail famille est prêt.'}
            </p>
          </div>
        </div>

        {/* États */}
        {isLoading ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <Loader2 size={40} color="#4f8ef7" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
            <p style={{ color: '#94a3b8', margin: 0 }}>{`Chargement du dossier scolaire...`}</p>
          </div>
        ) : error || children.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '20px', border: '1px dashed #e2e8f0' }}>
            <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px', color: '#475569' }}>{`Aucun enfant trouvé`}</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
              {`Aucun enfant n'est encore associé à votre compte parent.`}
            </p>
            <p style={{ fontSize: '13px', maxWidth: '300px', margin: '8px auto', opacity: 0.7 }}>
              {`Veuillez contacter l'administration de l'école pour lier vos enfants à votre profil.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {children.map(child => (
              <ChildCard
                key={child.id}
                child={child}
                onViewBulletin={() => router.push(`/reports/bulletins?studentId=${child.id}`)}
                onViewInvoices={() => router.push(`/invoices?studentId=${child.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
