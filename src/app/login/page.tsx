'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Landmark, ShieldCheck, Lock, Eye, EyeOff, Loader2,
  ArrowRight, ArrowLeft, AlertCircle,
  FileCheck2, KeyRound
} from 'lucide-react';

export default function GovernmentFioriLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Identifiant ou mot de passe non homologué.');
      localStorage.setItem('auth_token', data.accessToken);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] dark:bg-[#080C18] text-[#0F1523] dark:text-[#F0F4FF] font-fiori flex flex-col selection:bg-[#0070F2]/20">
      
      {/* ── TOP GOVERNMENT BANNER (IDEM ACCUEIL) ── */}
      <div className="w-full bg-[#0A3B7B] text-white py-1.5 px-4 text-xs font-semibold tracking-wider uppercase border-b border-white/10 relative flex-shrink-0">
        <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-gradient-to-r from-[#14A44D] via-[#FCD116] to-[#CE1126]" />
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-widest">RÉPUBLIQUE DU MALI</span>
            <span className="opacity-40">•</span>
            <span className="text-[11px] opacity-90 font-medium">Un Peuple • Un But • Une Foi</span>
            <span className="opacity-40 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-[11px] text-blue-200">Ministère de l'Éducation Nationale</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-400/30 px-2 py-0.5 rounded text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Guichet Sécurisé Agréé
            </span>
            <span className="text-white/80 font-mono">Exercice 2025-2026</span>
          </div>
        </div>
      </div>

      {/* ── MAIN SPLIT SHELL ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ── LEFT PANEL: INSTITUTIONAL BRANDING & STATE SECURITY ── */}
        <div className="lg:w-[50%] xl:w-[48%] bg-[#0A3B7B] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-r border-blue-900/40">
          
          {/* Subtle Institutional Background Patterns */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border-[30px] border-white/20" />
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full border-[20px] border-blue-400/20" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
          </div>

          {/* Top Brand Block */}
          <div className="relative z-10">
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-200 hover:text-white transition-colors mb-10 py-1.5 px-3 rounded bg-white/5 border border-white/10 hover:bg-white/10"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Retour au Portail National
            </Link>

            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-white/20 to-[#0070F2] flex items-center justify-center text-white shadow-lg border border-white/30 flex-shrink-0">
                <Landmark size={28} strokeWidth={1.75} />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-blue-200 block">
                  SYSTÈME D'INFORMATION NATIONAL
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  FIO-ERP • GESTION SCOLAIRE & REGISTRES
                </h1>
                <p className="text-xs text-blue-200/90 font-medium mt-1">
                  Centre de Formation Professionnelle Polyvalent (CFP-PAS) — Gao
                </p>
              </div>
            </div>

            <div className="space-y-4 max-w-lg mb-10">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-blue-100 font-bold text-sm mb-1.5">
                  <ShieldCheck size={18} className="text-emerald-400" strokeWidth={2} />
                  <span>Chiffrement d'État & Audit Réglementaire</span>
                </div>
                <p className="text-xs text-blue-200/80 leading-relaxed font-normal">
                  Chaque accès agent est audité et horodaté selon les dispositions de la Direction Nationale de l'Enseignement Technique et Professionnel.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-blue-100 font-bold text-sm mb-1.5">
                  <FileCheck2 size={18} className="text-amber-300" strokeWidth={2} />
                  <span>Référentiel APC & Validation des Compétences</span>
                </div>
                <p className="text-xs text-blue-200/80 leading-relaxed font-normal">
                  Accès unifié aux livrets de compétences des apprenants, cahiers de texte, jurys d'examens et clôture des balances de trésorerie.
                </p>
              </div>
            </div>

            {/* Aide à la connexion (aucun identifiant n'est affiché ici) */}
            <div className="pt-6 border-t border-white/10">
              <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <KeyRound size={13} strokeWidth={2} />
                Comment vous connecter
              </div>
              <ol className="space-y-1.5 text-xs text-blue-100/90 list-decimal pl-5">
                <li>Saisissez l&apos;email donné par la direction de votre école.</li>
                <li>Saisissez votre mot de passe, puis cliquez sur « Ouvrir la session ».</li>
                <li>Mot de passe oublié ? Contactez la direction de votre école.</li>
              </ol>
            </div>

          </div>

          {/* Footer of Left Panel */}
          <div className="relative z-10 pt-6 mt-8 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/70">
            <span>© 2026 République du Mali</span>
            <span>Protocole SSL d'État 256-bit</span>
          </div>

        </div>

        {/* ── RIGHT PANEL: FIORI HORIZON AUTHENTICATION FORM ── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#F4F6FB] dark:bg-[#080C18]">
          <div className="w-full max-w-[460px]">
            
            {/* Form Card */}
            <div className="bg-white dark:bg-[#111829] rounded-lg border border-slate-300 dark:border-slate-800 shadow-lg p-7 sm:p-9 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3.5px] bg-[#0070F2]" />

              {/* Form Title & Context */}
              <div className="mb-7">
                <div className="flex items-center justify-between mb-3">
                  <span className="fiori-badge fiori-badge-info">
                    GUICHET D'ACCÈS RÉGLEMENTAIRE
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    SESSION-ML-2026
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A3B7B] dark:text-white tracking-tight leading-snug">
                  Authentification Console Sécurisée
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-normal leading-relaxed">
                  Renseignez vos identifiants institutionnels pour accéder aux registres d'arbitrage et de scolarité.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 p-3.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-[#BB0000] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="flex-1 leading-relaxed">
                    {error}
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Identifiant Administratif / Courriel Officiel
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom.prenom@cfppas-gao.ml"
                      required
                      autoComplete="email"
                      className="w-full px-3.5 py-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-sans focus:outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-colors"
                    />
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-1 block">
                    Format : matricule ou adresse académique officielle.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mot de Passe d'Habilitation
                    </label>
                    <a
                      href="mailto:support@cfppas-gao.ml?subject=Demande de reinitialisation de mot de passe habilitation"
                      className="text-[11px] font-bold text-[#0070F2] hover:underline"
                    >
                      Assistance Mot de Passe
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-3.5 pr-11 py-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-sans focus:outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0070F2] transition-colors"
                    >
                      {showPwd ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded text-sm font-bold text-white bg-[#0070F2] hover:bg-[#0056B3] active:bg-[#004085] shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Vérification des Habilitations...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} strokeWidth={2} />
                        <span>Ouvrir la Session Sécurisée</span>
                        <ArrowRight size={16} strokeWidth={2} className="ml-1" />
                      </>
                    )}
                  </button>
                </div>

              </form>

              {/* State Warning & Legal Disclaimers */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
                <ShieldCheck size={14} className="text-[#0A3B7B] dark:text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                  Accès exclusivement réservé aux agents de l'État, formateurs habilités et représentants légaux. Tout accès non autorisé est passible de sanctions administratives et judiciaires.
                </span>
              </div>

            </div>

            {/* Quick Link back to Home Portal */}
            <div className="mt-5 text-center text-xs text-slate-500">
              Besoin d'un renseignement public ?{' '}
              <Link href="/" className="text-[#0070F2] font-bold hover:underline">
                Consulter le portail d'accueil
              </Link>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
