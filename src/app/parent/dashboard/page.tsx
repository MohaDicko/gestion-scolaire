'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, BookOpen, Clock, FileText, TrendingUp, AlertTriangle, Loader2, ChevronRight, CheckCircle, XCircle, Bell, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import Image from 'next/image';

interface ChildSummary {
  id: string; studentNumber: string; firstName: string; lastName: string;
  gender: string; photoUrl?: string; campus?: string;
  currentClass?: string; currentLevel?: string; academicYear?: string;
  attendanceRate: number | null; generalAverage: number | null;
  unpaidAmount: number; unpaidCount: number;
  nextDue?: { amount: number; dueDate: string; title: string } | null;
  latestLesson?: { title: string; date: string; subject: string } | null;
}

function StatPill({ label, value, colorClass, bgClass }: { label: string; value: string; colorClass: string; bgClass: string }) {
  return (
    <div className={`text-center p-3 sm:p-4 rounded-xl border ${bgClass} transition-all`}>
      <div className={`text-lg sm:text-xl font-black ${colorClass}`}>{value}</div>
      <div className="text-[9px] sm:text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function ChildCard({ child, onViewBulletin, onViewInvoices }: { child: ChildSummary; onViewBulletin: () => void; onViewInvoices: () => void }) {
  const initials = `${child.firstName[0]}${child.lastName[0]}`.toUpperCase();
  
  // Tailwind color classes logic
  const avgColors = child.generalAverage === null 
    ? { text: 'text-slate-400', bg: 'bg-slate-50 border-slate-100' }
    : child.generalAverage >= 14 
      ? { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' }
      : child.generalAverage >= 10 
        ? { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' }
        : { text: 'text-red-600', bg: 'bg-red-50 border-red-100' };

  const attColors = child.attendanceRate === null 
    ? { text: 'text-slate-400', bg: 'bg-slate-50 border-slate-100' }
    : child.attendanceRate >= 85 
      ? { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' }
      : child.attendanceRate >= 70 
        ? { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' }
        : { text: 'text-red-600', bg: 'bg-red-50 border-red-100' };

  const unpaidColors = child.unpaidAmount > 0 
    ? { text: 'text-red-600', bg: 'bg-red-50 border-red-100' }
    : { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col h-full">
      
      {/* Header accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Identité */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shrink-0 bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner relative overflow-hidden ring-4 ring-white">
            {child.photoUrl ? (
              <Image src={child.photoUrl} alt="" fill className="object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
              {child.firstName} {child.lastName}
            </h3>
            <div className="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5">
              {child.currentClass ? `${child.currentClass}` : 'Classe non assignée'}
              {child.campus ? ` — ${child.campus}` : ''}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 mt-1">
              Matricule : <span className="font-bold text-slate-600">{child.studentNumber}</span>
            </div>
          </div>
          
          {child.unpaidCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center shrink-0 animate-pulse">
              <div className="text-xs sm:text-sm font-black text-red-600">{child.unpaidCount}</div>
              <div className="text-[8px] sm:text-[9px] font-bold text-red-500 uppercase tracking-widest mt-0.5">impayé(s)</div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          <StatPill 
            label="Moyenne" 
            value={child.generalAverage !== null ? `${child.generalAverage}/20` : '—'} 
            colorClass={avgColors.text} 
            bgClass={avgColors.bg} 
          />
          <StatPill 
            label="Présence" 
            value={child.attendanceRate !== null ? `${child.attendanceRate}%` : '—'} 
            colorClass={attColors.text} 
            bgClass={attColors.bg} 
          />
          <StatPill 
            label="Impayés" 
            value={child.unpaidAmount > 0 ? `${(child.unpaidAmount / 1000).toFixed(0)}K` : '✓'} 
            colorClass={unpaidColors.text} 
            bgClass={unpaidColors.bg} 
          />
        </div>

        {/* Alerte paiement (Next Due) */}
        {child.nextDue && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3 sm:p-4 mb-6 flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-xl shrink-0 mt-0.5">
              <Bell size={16} className="text-red-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs sm:text-sm font-bold text-red-800">{child.nextDue.title}</div>
              <div className="text-[10px] sm:text-xs text-red-600 font-medium mt-1">
                Échéance : <span className="font-bold">{new Date(child.nextDue.dueDate).toLocaleDateString('fr-FR')}</span> — {child.nextDue.amount.toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          </div>
        )}
        
        {/* Spacer pour pousser les actions en bas si l'alerte n'est pas là */}
        <div className="flex-1" />

        {/* Actions Principales */}
        <div className="space-y-2 sm:space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button 
              onClick={onViewBulletin} 
              className="w-full py-3 sm:py-4 px-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all active:scale-95"
            >
              <BookOpen size={16} className="mb-1 sm:mb-0" /> Bulletins
            </button>
            <button 
              onClick={onViewInvoices} 
              className={`w-full py-3 sm:py-4 px-2 rounded-2xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all active:scale-95 border ${
                child.unpaidCount > 0 
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-md shadow-red-600/20' 
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100'
              }`}
            >
              <FileText size={16} className="mb-1 sm:mb-0" /> Factures
            </button>
          </div>
          
          <button 
            onClick={() => window.location.href = '/lessons'} 
            className="w-full py-3 sm:py-4 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ClipboardList size={16} /> Cahier de Texte
          </button>
        </div>

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

  const fetchChildren = useCallback(async () => {
    try {
      const res = await fetch('/api/parent/children');
      const d = await res.json();
      if (Array.isArray(d)) setChildren(d);
      else setError('Aucun enfant lié à ce compte.');
    } catch {
      setError('Erreur de chargement.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}

    fetchChildren();
  }, [fetchChildren]);

  return (
    <AppLayout
      title="Espace Famille"
      subtitle={`Bienvenue, ${user?.firstName ?? 'Parent'} ${user?.lastName ?? ''} — Suivi scolaire de vos enfants`}
      breadcrumbs={[{ label: 'Espace Famille' }]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Banner ── */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 relative overflow-hidden border border-slate-800 shadow-xl">
          {/* Motif décoratif fond */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Liseré Mali */}
            <div className="flex h-1.5 w-24 mb-6 rounded-full overflow-hidden">
              <div className="flex-1 bg-[#009a44]" /><div className="flex-1 bg-[#fcd116]" /><div className="flex-1 bg-[#ce1126]" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              Bonjour, {user?.firstName ?? 'Parent'} 👋
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-medium max-w-lg">
              {children.length > 0
                ? `Bienvenue sur votre portail sécurisé. Vous y retrouverez le suivi académique et financier de vos ${children.length} enfant${children.length > 1 ? 's' : ''}.`
                : 'Votre portail famille est en cours de configuration.'}
            </p>
          </div>
        </div>

        {/* ── États (Loading / Error) ── */}
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200 py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-bold tracking-wide">Chargement du dossier scolaire...</p>
          </div>
        ) : error || children.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl py-20 px-6 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white rounded-full border border-slate-200 shadow-sm flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Aucun enfant trouvé</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-4">
              Aucun dossier d'élève n'est actuellement lié à votre adresse e-mail.
            </p>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl max-w-md">
              Veuillez contacter l'administration de l'école (Direction) pour mettre à jour la fiche de renseignement de votre enfant.
            </div>
          </div>
        ) : (
          /* ── Grille des Enfants ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
    </AppLayout>
  );
}
