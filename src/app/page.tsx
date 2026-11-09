'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, Loader2,
  ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  HelpCircle, Sprout, Stethoscope, Calculator, BookOpen,
  Scale, Layers, Sparkles, Building2, Calendar, Award,
  Wifi, Landmark, FileSpreadsheet
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
  buttonBg: string;
  highlights: string[];
}

const PROFILE_CARDS: ProfileMeta[] = [
  {
    key: 'ALL',
    label: 'Tous les portails',
    shortBadge: 'Auto-détection',
    subtitle: 'Adaptation automatique selon votre compte établissement',
    icon: Layers,
    accentText: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
    highlights: [
      'Barème /20 ou /100 détecté dès l’authentification',
      'Comptabilité SYSCOHADA & suivi des vacataires',
      'Mode hors-ligne résilient avec synchronisation auto',
    ],
  },
  {
    key: 'AGRO_TECHNIQUE',
    label: 'Agro-Pastoral & CFP',
    shortBadge: 'Barème /100 • APC',
    subtitle: 'CFP-PAS, Centres de formation professionnelle, BT & CAP',
    icon: Sprout,
    accentText: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/40',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
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
    accentText: 'text-indigo-600 dark:text-indigo-400',
    accentBg: 'bg-indigo-500/10',
    accentBorder: 'border-indigo-500/40',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800',
    highlights: [
      'Formule officielle : (Moyenne Classe + 2 × Composition) ÷ 3',
      'Coefficients différenciés par série et calcul du rang',
      'Bulletins trimestriels avec moyennes pondérées et mentions',
    ],
  },
  {
    key: 'SANTE_SUPERIEUR',
    label: 'Santé & Supérieur',
    shortBadge: 'Barème /20 • LMD 40/60',
    subtitle: 'Instituts des sciences de la santé (ESBK), IDE, SF & Universités',
    icon: Stethoscope,
    accentText: 'text-sky-600 dark:text-sky-400',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/40',
    buttonBg: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800',
    highlights: [
      'Norme LMD / OOAS : 40% Contrôle Continu & TP + 60% Examen',
      'Découpage en 2 Semestres (S1, S2) et Unités d’Enseignement',
      'Suivi des stages cliniques hospitaliers et validations d’UE',
    ],
  },
  {
    key: 'FONDAMENTAL',
    label: 'Fondamental (DEF)',
    shortBadge: 'Barème /20 • 50/50',
    subtitle: '1er et 2nd cycles de l’enseignement fondamental & CAP',
    icon: BookOpen,
    accentText: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/40',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
    highlights: [
      'Formule équilibrée : (Moyenne de Classe + Composition) ÷ 2',
      'Suivi d’assiduité quotidien et livret scolaire trimestriel',
      'Préparation aux examens du DEF et statistiques par classe',
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-600/15 relative overflow-x-hidden">
      {/* Subtle architectural background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"
      />

      {/* ── TOP NAV HEADER ── */}
      <header className="relative z-10 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-sm">
              <GraduationCap size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  EduGestion
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50">
                  ERP Multi-Établissements
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Architecture unifiée pour lycées, instituts de santé & centres agro-pastoraux
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
            <span className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Services Opérationnels
            </span>
            <a
              href="mailto:support@edugestion.ml"
              className="inline-flex items-center gap-1.5 font-medium hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <HelpCircle size={15} />
              <span>Support Technique</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── MAIN SPLIT-SCREEN PORTAL ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* ── LEFT COLUMN (7 COLS): INSTITUTIONAL CLASSIFICATION & GRADING ENGINE SHOWCASE ── */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6 order-2 lg:order-1">
            
            {/* Hero Block */}
            <div className="bg-slate-900 dark:bg-slate-900/95 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl"
              />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-blue-300 mb-4">
                  <Scale size={13} />
                  <span>Moteur Pédagogique & Financier Adaptatif</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Un seul ERP. Quatre régimes d&apos;évaluation calibrés au millimètre.
                </h2>
                <p className="text-sm text-slate-300 mt-2.5 leading-relaxed max-w-2xl">
                  Choisissez la typologie de votre établissement ci-dessous pour prévisualiser les règles de calcul des moyennes, le barème (<code className="text-emerald-300 font-semibold">/100</code> ou <code className="text-blue-300 font-semibold">/20</code>) et le découpage académique appliqués à votre espace.
                </p>

                {/* Interactive School Classification Grid */}
                <div
                  role="tablist"
                  aria-label="Classification du type d'établissement"
                  className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-6"
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
                        className={`p-3 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white text-slate-900 border-white shadow-lg scale-[1.01]'
                            : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <Icon
                            size={16}
                            className={isSelected ? card.accentText : 'text-slate-400'}
                          />
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-xs leading-snug truncate">
                            {card.label}
                          </div>
                          <div
                            className={`text-[10px] font-semibold mt-0.5 truncate ${
                              isSelected ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            {card.shortBadge}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Active Formula & Rules Specification Box */}
                <div
                  id="active-grading-policy-banner"
                  className="mt-6 rounded-xl bg-slate-950/90 border border-slate-800 p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {activePolicy ? activePolicy.label : 'Profil Universel Multi-Établissements'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {currentMeta.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {activePolicy ? `Barème /${activePolicy.defaultScale}` : 'Barème /20 ou /100'}
                    </span>
                  </div>

                  {activePolicy ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/90">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Formule de Moyenne
                        </span>
                        <span className="font-mono font-bold text-emerald-300 text-xs">
                          {activePolicy.formulaLabel}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/90">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Découpage Annuel
                        </span>
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Calendar size={13} className="text-blue-400" />
                          {activePolicy.periodCount} {activePolicy.periodLabelPlural}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/90">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Terminologie Métier
                        </span>
                        <span className="font-bold text-white text-xs">
                          {activePolicy.terms.student} • {activePolicy.terms.subject}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      {currentMeta.highlights.map((h, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start gap-2 text-slate-300"
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

            {/* Bottom 3 Architectural Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Landmark size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Norme SYSCOHADA
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    Grand livre, facturation scolarité, paie INPS/AMO/ITS et vacataires.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Saisie Clavier & Excel
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    Navigation rapide par touches directionnelles et bulletins PDF A4.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Wifi size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Continuité Terrain
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                    Indicateur réseau en direct et protection contre les coupures.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (5 COLS): DIRECT LOGIN CARD & QUICK ACCOUNTS ── */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 p-6 sm:p-8">
              
              {/* Card Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <ShieldCheck size={14} />
                    Portail Authentifié
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {currentMeta.shortBadge}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Connexion à votre espace
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Accédez à votre établissement, vos dossiers scolaires et votre suivi de scolarité.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
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
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="text-xs font-bold text-slate-700 dark:text-slate-300"
                      htmlFor="password-input"
                    >
                      Mot de passe
                    </label>
                    <a
                      href="mailto:support@edugestion.ml?subject=Mot%20de%20passe%20oublié"
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
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
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50/70 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                    className={`w-full py-3 px-4 ${currentMeta.buttonBg} disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Authentification en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {activePolicy
                            ? `Se connecter • ${activePolicy.shortLabel}`
                            : 'Se connecter à mon établissement'}
                        </span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Demo Accounts Pill Selector */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Accès direct (Comptes configurés)
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
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
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col cursor-pointer ${
                      email === 'admin@cfppas-gao.ml'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500/20'
                        : 'border-emerald-200/80 dark:border-emerald-900/70 bg-emerald-50/50 dark:bg-emerald-950/25 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                    } text-emerald-900 dark:text-emerald-200`}
                  >
                    <div className="flex items-center justify-between gap-1 font-bold text-xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <Sprout size={14} className="text-emerald-600 shrink-0" />
                        <span>CFP-PAS Gao</span>
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                        /100
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700/85 dark:text-emerald-400/85 truncate mt-1">
                      Directeur O. Maïga • Agro
                    </span>
                  </button>

                  <button
                    type="button"
                    id="btn-quick-esbk"
                    onClick={() =>
                      handleSelectQuickAccount('admin@esbk-bamako.ml', 'admin123', 'SANTE_SUPERIEUR')
                    }
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col cursor-pointer ${
                      email === 'admin@esbk-bamako.ml'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                        : 'border-sky-200/80 dark:border-sky-900/70 bg-sky-50/50 dark:bg-sky-950/25 hover:bg-sky-100/60 dark:hover:bg-sky-900/40'
                    } text-sky-900 dark:text-sky-200`}
                  >
                    <div className="flex items-center justify-between gap-1 font-bold text-xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <Stethoscope size={14} className="text-sky-600 shrink-0" />
                        <span>ESBK Bamako</span>
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-sky-200/80 dark:bg-sky-900 text-sky-900 dark:text-sky-200">
                        /20 LMD
                      </span>
                    </div>
                    <span className="text-[10px] text-sky-700/85 dark:text-sky-400/85 truncate mt-1">
                      Dr. I. Traoré • Santé
                    </span>
                  </button>

                  <button
                    type="button"
                    id="btn-quick-compta"
                    onClick={() =>
                      handleSelectQuickAccount('compta@cfppas-gao.ml', 'admin123', 'AGRO_TECHNIQUE')
                    }
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col cursor-pointer ${
                      email === 'compta@cfppas-gao.ml'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 ring-2 ring-amber-500/20'
                        : 'border-amber-200/80 dark:border-amber-900/70 bg-amber-50/50 dark:bg-amber-950/25 hover:bg-amber-100/60 dark:hover:bg-amber-900/40'
                    } text-amber-900 dark:text-amber-200`}
                  >
                    <div className="flex items-center justify-between gap-1 font-bold text-xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <Calculator size={14} className="text-amber-600 shrink-0" />
                        <span>Comptabilité</span>
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                        Caisse
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-700/85 dark:text-amber-400/85 truncate mt-1">
                      Économat & Vacataires
                    </span>
                  </button>

                  <button
                    type="button"
                    id="btn-quick-prof"
                    onClick={() =>
                      handleSelectQuickAccount('prof@cfppas-gao.ml', 'admin123', 'AGRO_TECHNIQUE')
                    }
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col cursor-pointer ${
                      email === 'prof@cfppas-gao.ml'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 ring-2 ring-purple-500/20'
                        : 'border-purple-200/80 dark:border-purple-900/70 bg-purple-50/50 dark:bg-purple-950/25 hover:bg-purple-100/60 dark:hover:bg-purple-900/40'
                    } text-purple-900 dark:text-purple-200`}
                  >
                    <div className="flex items-center justify-between gap-1 font-bold text-xs">
                      <span className="flex items-center gap-1.5 truncate">
                        <BookOpen size={14} className="text-purple-600 shrink-0" />
                        <span>Formateur</span>
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-200/80 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                        Notes
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-700/85 dark:text-purple-400/85 truncate mt-1">
                      M. Diarra • Saisie & Appel
                    </span>
                  </button>
                </div>
              </div>

            </div>

            {/* Trust Badges under Login Card */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                Chiffrement JWT & TLS 256-bit
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
                Cloisonnement strict Multi-Établissements
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* ── BOTTOM SITE FOOTER ── */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs py-3.5 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} EduGestion • Système de Gestion Scolaire, Professionnelle & Universitaire — Tous droits réservés.</p>
      </footer>
    </div>
  );
}
