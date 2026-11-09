'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, Loader2,
  ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  HelpCircle, Sprout, Stethoscope, Calculator, BookOpen,
  Scale, Layers, Sparkles
} from 'lucide-react';
import {
  GRADING_POLICIES,
  InstitutionalProfileKey,
  GradingPolicy
} from '@/lib/gradingPolicy';

const PROFILE_TABS: Array<{
  key: InstitutionalProfileKey;
  label: string;
  shortBadge: string;
  icon: React.ElementType;
  accentClass: string;
}> = [
  {
    key: 'ALL',
    label: 'Tous',
    shortBadge: 'Multi-barèmes',
    icon: Layers,
    accentClass: 'text-slate-700 dark:text-slate-200',
  },
  {
    key: 'AGRO_TECHNIQUE',
    label: 'Agro-Pastoral & CFP',
    shortBadge: '/100 • APC',
    icon: Sprout,
    accentClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'LYCEE_GENERAL',
    label: 'Lycée & Général',
    shortBadge: '/20 • Coef 1/2',
    icon: GraduationCap,
    accentClass: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'SANTE_SUPERIEUR',
    label: 'Santé & Supérieur',
    shortBadge: '/20 • LMD 40/60',
    icon: Stethoscope,
    accentClass: 'text-blue-600 dark:text-blue-400',
  },
  {
    key: 'FONDAMENTAL',
    label: 'Fondamental',
    shortBadge: '/20 • 50/50',
    icon: BookOpen,
    accentClass: 'text-amber-600 dark:text-amber-400',
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
    // Si déjà authentifié, redirection vers le tableau de bord
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  const activePolicy: GradingPolicy | null =
    selectedProfile === 'ALL' ? null : GRADING_POLICIES[selectedProfile];

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-600/10">
      
      {/* ── TOP NAV HEADER ── */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs py-3.5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-2xs">
              <GraduationCap size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">EduGestion</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                  SaaS Établissements
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Système unifié pour lycées, instituts de santé & centres agro-pastoraux
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Plateforme Opérationnelle
            </span>
            <a
              href="mailto:support@edugestion.ml"
              className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <HelpCircle size={14} />
              <span>Assistance</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT: LOGIN CARD + CLASSIFICATION ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-lg">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs p-6 sm:p-8">
            
            {/* Card Header */}
            <div className="mb-5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Connexion à votre espace
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Sélectionnez la filière de votre établissement ou connectez-vous directement : le barème et la formule de calcul des notes s&apos;adaptent automatiquement.
              </p>
            </div>

            {/* ── SCHOOL TYPE CLASSIFICATION SELECTOR ── */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Scale size={12} className="text-blue-600 dark:text-blue-400" />
                  Type d&apos;établissement & Système d&apos;évaluation
                </span>
                {activePolicy && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                    Barème /{activePolicy.defaultScale}
                  </span>
                )}
              </div>

              <div
                role="tablist"
                aria-label="Classification du type d'établissement"
                className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70"
              >
                {PROFILE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = selectedProfile === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      id={`tab-profile-${tab.key.toLowerCase()}`}
                      aria-selected={isSelected}
                      onClick={() => setSelectedProfile(tab.key)}
                      className={`px-2 py-1.5 rounded-md text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-semibold text-[11px] truncate">
                        <Icon size={12} className={isSelected ? tab.accentClass : 'text-slate-400'} />
                        <span className="truncate">{tab.label}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                        {tab.shortBadge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Grading Policy Rule Banner */}
              {activePolicy ? (
                <div
                  id="active-grading-policy-banner"
                  className="mt-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      {activePolicy.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <strong>Calcul :</strong> {activePolicy.formulaLabel}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Découpage :</strong> {activePolicy.periodCount} {activePolicy.periodLabelPlural}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Lexique :</strong> {activePolicy.terms.student} / {activePolicy.terms.subject}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Détection automatique du barème (/20 ou /100) selon votre identifiant école.</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Auto-détection</span>
                </div>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email-input">
                  Adresse e-mail professionnelle
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="password-input">
                    Mot de passe
                  </label>
                  <a
                    href="mailto:support@edugestion.ml?subject=Mot%20de%20passe%20oublié"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mot de passe oublié ?
                  </a>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password-input"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
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
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
                          ? `Se connecter (${activePolicy.shortLabel})`
                          : 'Se connecter'}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Quick Demo Accounts Pill Selector */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Accès direct (Comptes configurés) :
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Cliquez pour pré-remplir
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  id="btn-quick-cfppas"
                  onClick={() =>
                    handleSelectQuickAccount('admin@cfppas-gao.ml', 'CfpPasGao2026!', 'AGRO_TECHNIQUE')
                  }
                  className={`p-2.5 rounded-lg border text-left transition-colors flex flex-col cursor-pointer ${
                    selectedProfile === 'AGRO_TECHNIQUE'
                      ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-100/80 dark:bg-emerald-950/60 ring-1 ring-emerald-500/30'
                      : 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
                  } text-emerald-800 dark:text-emerald-300`}
                >
                  <div className="flex items-center justify-between gap-1 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5 truncate">
                      <Sprout size={13} className="text-emerald-600 shrink-0" />
                      <span>CFP-PAS Gao</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                      /100
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate mt-0.5">
                    Directeur O. Maïga • Agro-Pastoral
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-quick-esbk"
                  onClick={() =>
                    handleSelectQuickAccount('admin@esbk-bamako.ml', 'admin123', 'SANTE_SUPERIEUR')
                  }
                  className={`p-2.5 rounded-lg border text-left transition-colors flex flex-col cursor-pointer ${
                    selectedProfile === 'SANTE_SUPERIEUR'
                      ? 'border-blue-500 dark:border-blue-500 bg-blue-100/80 dark:bg-blue-950/60 ring-1 ring-blue-500/30'
                      : 'border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/50'
                  } text-blue-800 dark:text-blue-300`}
                >
                  <div className="flex items-center justify-between gap-1 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5 truncate">
                      <Stethoscope size={13} className="text-blue-600 shrink-0" />
                      <span>ESBK Bamako</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-200/70 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                      /20 LMD
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-700/80 dark:text-blue-400/80 truncate mt-0.5">
                    Dr. I. Traoré • Institut Santé
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-quick-compta"
                  onClick={() =>
                    handleSelectQuickAccount('compta@cfppas-gao.ml', 'admin123', 'AGRO_TECHNIQUE')
                  }
                  className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-left hover:bg-amber-100/70 dark:hover:bg-amber-900/50 transition-colors flex flex-col cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5 truncate">
                      <Calculator size={13} className="text-amber-600 shrink-0" />
                      <span>Comptabilité</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      SYSCOHADA
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate mt-0.5">
                    Caisse, Scolarité & Vacataires
                  </span>
                </button>

                <button
                  type="button"
                  id="btn-quick-prof"
                  onClick={() =>
                    handleSelectQuickAccount('prof@cfppas-gao.ml', 'admin123', 'AGRO_TECHNIQUE')
                  }
                  className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 text-left hover:bg-purple-100/70 dark:hover:bg-purple-900/50 transition-colors flex flex-col cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1 font-semibold text-[11px]">
                    <span className="flex items-center gap-1.5 truncate">
                      <BookOpen size={13} className="text-purple-600 shrink-0" />
                      <span>Formateur</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-200/70 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                      Modules
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-700/80 dark:text-purple-400/80 truncate mt-0.5">
                    M. Diarra • Saisie & Appel
                  </span>
                </button>
              </div>
            </div>

          </div>

          {/* Institutional Trust Footer under Card */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={13} className="text-slate-400" />
              Chiffrement sécurisé SSL 256-bit
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={13} className="text-slate-400" />
              Cloisonnement multi-établissements & barèmes dédiés
            </span>
          </div>

        </div>
      </main>

      {/* ── BOTTOM SITE FOOTER ── */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-3.5 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} EduGestion • Système de Gestion Scolaire & Universitaire — Tous droits réservés.</p>
      </footer>

    </div>
  );
}
