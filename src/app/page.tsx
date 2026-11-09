'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, Loader2,
  ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  HelpCircle, Sprout, Stethoscope, Calculator, BookOpen,
  Scale, Layers, Sparkles, Calendar, Award, Wifi, Landmark,
  FileSpreadsheet, ArrowUpRight, Compass, Shield
} from 'lucide-react';
import {
  GRADING_POLICIES,
  InstitutionalProfileKey,
  GradingPolicy
} from '@/lib/gradingPolicy';

interface ProfileMeta {
  key: InstitutionalProfileKey;
  label: string;
  shortBadge: string;
  subtitle: string;
  icon: React.ElementType;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  glowColor: string;
  buttonBg: string;
  scaleBadge: string;
  formula: string;
  highlights: string[];
}

const PROFILE_CARDS: ProfileMeta[] = [
  {
    key: 'ALL',
    label: 'Tous les portails',
    shortBadge: 'Auto-détection',
    subtitle: 'Détection transparente selon votre compte rattaché',
    icon: Layers,
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    glowColor: 'from-blue-600/20 via-indigo-600/10 to-transparent',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20',
    scaleBadge: '/20 ou /100',
    formula: 'Auto-calibré selon le statut d’établissement',
    highlights: [
      'Barème officiel adapté instantanément à la connexion',
      'Comptabilité SYSCOHADA & suivi des vacataires',
      'Mode hors-ligne résilient avec synchronisation auto',
    ],
  },
  {
    key: 'AGRO_TECHNIQUE',
    label: 'Agro-Pastoral & CFP',
    shortBadge: 'Barème /100 • APC',
    subtitle: 'CFP-PAS, Centres professionnels, BT & CAP',
    icon: Sprout,
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/40',
    glowColor: 'from-emerald-600/20 via-teal-600/10 to-transparent',
    buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20',
    scaleBadge: 'Barème /100',
    formula: '(2 × Pratique/CC + 1 × Examen) ÷ 3 sur 100',
    highlights: [
      'Notation sur 100 avec approche par compétences (APC)',
      'Pondération : 2/3 Travaux Pratiques & CC + 1/3 Examen',
      'Émargement horaire des formateurs vacataires (1 750 FCFA/h)',
    ],
  },
  {
    key: 'LYCEE_GENERAL',
    label: 'Lycée & Secondaire',
    shortBadge: 'Barème /20 • Coef 1/2',
    subtitle: 'Séries TSE, TExp, TSS, TLL, TSECO & Collèges',
    icon: GraduationCap,
    accentText: 'text-indigo-400',
    accentBg: 'bg-indigo-500/10',
    accentBorder: 'border-indigo-500/40',
    glowColor: 'from-indigo-600/20 via-blue-600/10 to-transparent',
    buttonBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/20',
    scaleBadge: 'Barème /20',
    formula: '(Moyenne Classe + 2 × Composition) ÷ 3 sur 20',
    highlights: [
      'Formule officielle MEN : moyenne devoirs + 2× composition',
      'Coefficients différenciés par série et calcul du rang',
      'Bulletins trimestriels avec mentions honorifiques et PDF A4',
    ],
  },
  {
    key: 'SANTE_SUPERIEUR',
    label: 'Santé & Supérieur',
    shortBadge: 'Barème /20 • LMD 40/60',
    subtitle: 'Instituts paramédicaux (ESBK), IDE, SF & Universités',
    icon: Stethoscope,
    accentText: 'text-sky-400',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/40',
    glowColor: 'from-sky-600/20 via-cyan-600/10 to-transparent',
    buttonBg: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-500/20',
    scaleBadge: 'Barème /20 LMD',
    formula: '40% Contrôle Continu/TP + 60% Examen Semestriel',
    highlights: [
      'Norme LMD / OOAS : 40% TP & contrôle continu + 60% Examen',
      'Découpage en 2 Semestres (S1, S2) et Unités d’Enseignement',
      'Suivi des stages cliniques hospitaliers et validations d’UE',
    ],
  },
  {
    key: 'FONDAMENTAL',
    label: 'Fondamental (DEF)',
    shortBadge: 'Barème /20 • 50/50',
    subtitle: '1er et 2nd cycles de l’enseignement fondamental',
    icon: BookOpen,
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/40',
    glowColor: 'from-amber-600/20 via-orange-600/10 to-transparent',
    buttonBg: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/20',
    scaleBadge: 'Barème /20',
    formula: '(Moyenne de Classe + Composition) ÷ 2 sur 20',
    highlights: [
      'Formule officielle : parité égale 50% classe / 50% composition',
      'Suivi d’assiduité quotidien et livret scolaire trimestriel',
      'Préparation aux examens du DEF et statistiques de promotion',
    ],
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<InstitutionalProfileKey>('ALL');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  const activePolicy: GradingPolicy | null =
    selectedProfile === 'ALL' ? null : GRADING_POLICIES[selectedProfile];

  const currentMeta =
    PROFILE_CARDS.find((p) => p.key === selectedProfile) || PROFILE_CARDS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et mot de passe.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          preferredProfile: selectedProfile !== 'ALL' ? selectedProfile : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Identifiant ou mot de passe incorrect.');
      }

      localStorage.setItem('auth_token', data.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      if (data.user?.gradingPolicy) {
        localStorage.setItem('school_grading_policy', JSON.stringify(data.user.gradingPolicy));
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (
    accEmail: string,
    accPwd: string,
    profileKey?: Exclude<InstitutionalProfileKey, 'ALL'>
  ) => {
    setEmail(accEmail);
    setPassword(accPwd);
    if (profileKey) {
      setSelectedProfile(profileKey);
    }
    setError('');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-500/20 selection:text-white relative overflow-x-hidden">
      
      {/* ── HIGH-END AMBIENT BACKDROP ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/15 via-indigo-600/8 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-[60%] -right-[10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* ── TOP NAV HEADER ── */}
      <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl py-4 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl blur-xs opacity-50 group-hover:opacity-100 transition duration-300" />
              <div className="relative w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 text-white flex items-center justify-center shadow-md">
                <GraduationCap size={22} strokeWidth={2.2} className="text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  EduGestion
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ERP National
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Système unifié pour lycées, instituts de santé & centres agro-pastoraux
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-400">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Plateforme Opérationnelle
            </span>
            <a
              href="mailto:support@edugestion.ml"
              className="inline-flex items-center gap-1.5 font-medium hover:text-white transition-colors"
            >
              <HelpCircle size={15} />
              <span>Assistance</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── MAIN SPLIT-SCREEN PORTAL ── */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-10">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ── LEFT COLUMN (7 COLS): INTERACTIVE ARCHITECTURE & CLASSIFICATION ── */}
          <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
            
            {/* Hero Card */}
            <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/90 p-7 sm:p-9 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl ${currentMeta.glowColor} rounded-full blur-2xl pointer-events-none transition-all duration-700`} />
              
              <div className="relative z-10 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-blue-300">
                  <Scale size={13} className="text-blue-400" />
                  <span>Architecture Pédagogique Conforme Mali</span>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                    Quatre régimes d&apos;évaluation officiels, un moteur infaillible.
                  </h2>
                  <p className="text-sm text-slate-300 mt-2.5 leading-relaxed max-w-xl">
                    Chaque établissement bénéficie de ses propres formules de calcul, découpages et barèmes (<span className="text-emerald-400 font-mono font-bold">/100</span> ou <span className="text-blue-400 font-mono font-bold">/20</span>).
                  </p>
                </div>

                {/* Classification Tabs */}
                <div
                  role="tablist"
                  aria-label="Classification du type d'établissement"
                  className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2"
                >
                  {PROFILE_CARDS.map((card) => {
                    const Icon = card.icon;
                    const isSelected = selectedProfile === card.key;
                    return (
                      <button
                        key={card.key}
                        type="button"
                        role="tab"
                        id={`tab-profile-${card.key.toLowerCase()}`}
                        aria-selected={isSelected}
                        onClick={() => setSelectedProfile(card.key)}
                        className={`group relative p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer border flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-800/95 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/30'
                            : 'bg-slate-900/40 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                          }`}>
                            <Icon size={14} />
                          </div>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          )}
                        </div>
                        <div>
                          <div className={`font-bold text-xs leading-snug truncate ${
                            isSelected ? 'text-white' : 'text-slate-300'
                          }`}>
                            {card.label}
                          </div>
                          <div className={`text-[10px] font-semibold mt-0.5 truncate ${
                            isSelected ? 'text-blue-300' : 'text-slate-500'
                          }`}>
                            {card.shortBadge}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Dynamic Feature Callout */}
                <div
                  id="active-grading-policy-banner"
                  className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 space-y-4 shadow-inner"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {activePolicy ? activePolicy.label : 'Régime Pédagogique Universel'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {currentMeta.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {currentMeta.scaleBadge}
                    </span>
                  </div>

                  {activePolicy ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Équation Officielle
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          {activePolicy.formulaLabel}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Calendrier Périodique
                        </span>
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Calendar size={13} className="text-blue-400" />
                          {activePolicy.periodCount} {activePolicy.periodLabelPlural}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Lexique Pédagogique
                        </span>
                        <span className="font-bold text-white text-xs">
                          {activePolicy.terms.student} • {activePolicy.terms.subject}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {currentMeta.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-2.5 text-slate-300"
                        >
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-snug">{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Institutional Triple Metric Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-md flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Landmark size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Norme SYSCOHADA
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    Grand livre, facturation scolarité, déclarations INPS/ITS et vacataires.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-md flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Saisie Clavier Rapide
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    Touches Entrée / Flèches et export automatique de bulletins officiels.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-md flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Wifi size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Résilience Hors-Ligne
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    PWA opérationnelle avec détection réseau et sauvegarde en local.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (5 COLS): LUXURY GLASS LOGIN CARD ── */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-emerald-600/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition duration-500" />
              
              <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl shadow-black/60">
                
                {/* Card Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-blue-400">
                      <ShieldCheck size={14} />
                      Accès Sécurisé
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {currentMeta.shortBadge}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    Connexion à votre espace
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Connectez-vous pour piloter les inscriptions, notes et finances scolaires.
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      className="block text-xs font-bold text-slate-300 mb-1.5"
                      htmlFor="email-input"
                    >
                      Adresse e-mail professionnelle
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={
                          selectedProfile === 'AGRO_TECHNIQUE'
                            ? 'admin@cfppas-gao.ml'
                            : selectedProfile === 'SANTE_SUPERIEUR'
                            ? 'admin@esbk-bamako.ml'
                            : 'directeur@etablissement.ml'
                        }
                        required
                        autoComplete="email"
                        className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        className="text-xs font-bold text-slate-300"
                        htmlFor="password-input"
                      >
                        Mot de passe
                      </label>
                      <a
                        href="mailto:support@edugestion.ml?subject=Mot%20de%20passe%20oublié"
                        className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Mot de passe oublié ?
                      </a>
                    </div>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        id="password-input"
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full pl-10 pr-10 py-3 text-sm bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      id="submit-login-button"
                      disabled={loading}
                      className={`w-full py-3.5 px-4 ${currentMeta.buttonBg} disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]`}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Connexion en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>
                            {activePolicy
                              ? `Accéder à l'espace (${activePolicy.shortLabel})`
                              : 'Accéder à mon établissement'}
                          </span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Quick Demo Accounts Pill Selector */}
                <div className="mt-7 pt-5 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Comptes Démo Pré-Configurés
                    </span>
                    <span className="text-[10px] font-semibold text-blue-400">
                      1 clic pour tester
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <button
                      type="button"
                      id="btn-quick-cfppas"
                      onClick={() =>
                        handleSelectQuickAccount('admin@cfppas-gao.ml', 'CfpPasGao2026!', 'AGRO_TECHNIQUE')
                      }
                      className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col cursor-pointer ${
                        email === 'admin@cfppas-gao.ml'
                          ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30'
                          : 'border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 font-bold text-xs">
                        <span className="flex items-center gap-1.5 truncate text-white">
                          <Sprout size={14} className="text-emerald-400 shrink-0" />
                          <span>CFP-PAS Gao</span>
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          /100
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate mt-1">
                        Directeur O. Maïga • Agro
                      </span>
                    </button>

                    <button
                      type="button"
                      id="btn-quick-esbk"
                      onClick={() =>
                        handleSelectQuickAccount('admin@esbk-bamako.ml', 'admin123', 'SANTE_SUPERIEUR')
                      }
                      className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col cursor-pointer ${
                        email === 'admin@esbk-bamako.ml'
                          ? 'border-sky-500 bg-sky-500/15 ring-2 ring-sky-500/30'
                          : 'border-slate-800 hover:border-sky-500/50 bg-slate-950/60 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 font-bold text-xs">
                        <span className="flex items-center gap-1.5 truncate text-white">
                          <Stethoscope size={14} className="text-sky-400 shrink-0" />
                          <span>ESBK Bamako</span>
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                          /20 LMD
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate mt-1">
                        Dr. I. Traoré • Santé
                      </span>
                    </button>

                    <button
                      type="button"
                      id="btn-quick-compta"
                      onClick={() =>
                        handleSelectQuickAccount('compta@cfppas-gao.ml', 'admin123', 'AGRO_TECHNIQUE')
                      }
                      className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col cursor-pointer ${
                        email === 'compta@cfppas-gao.ml'
                          ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30'
                          : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/60 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 font-bold text-xs">
                        <span className="flex items-center gap-1.5 truncate text-white">
                          <Calculator size={14} className="text-amber-400 shrink-0" />
                          <span>Comptabilité</span>
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Caisse
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate mt-1">
                        Économat & Vacataires
                      </span>
                    </button>

                    <button
                      type="button"
                      id="btn-quick-prof"
                      onClick={() =>
                        handleSelectQuickAccount('prof@cfppas-gao.ml', 'admin123', 'AGRO_TECHNIQUE')
                      }
                      className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col cursor-pointer ${
                        email === 'prof@cfppas-gao.ml'
                          ? 'border-purple-500 bg-purple-500/15 ring-2 ring-purple-500/30'
                          : 'border-slate-800 hover:border-purple-500/50 bg-slate-950/60 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 font-bold text-xs">
                        <span className="flex items-center gap-1.5 truncate text-white">
                          <BookOpen size={14} className="text-purple-400 shrink-0" />
                          <span>Formateur</span>
                        </span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          Notes
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate mt-1">
                        M. Diarra • Saisie & Appel
                      </span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Trust Footer Badges */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Chiffrement JWT & TLS 256-bit
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-blue-400" />
                Isolation Multi-Tenant Stricte
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* ── BOTTOM SITE FOOTER ── */}
      <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} EduGestion • Système Multi-Établissements — Tous droits réservés.</p>
      </footer>
    </div>
  );
}
