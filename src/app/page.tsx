'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, Loader2,
  ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  Landmark, Building2, Phone, Sprout, Wheat
} from 'lucide-react';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

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

  const handleQuickLogin = (accEmail: string, accPwd: string) => {
    setEmail(accEmail);
    setPassword(accPwd);
    setError('');
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between selection:bg-sky-500 selection:text-white font-sans overflow-x-hidden bg-[#F4F7FB] dark:bg-[#070F1E]">
      
      {/* ── IMAGE D'ARRIÈRE-PLAN CAMPUS CFP-PAS + OVERLAY TANDEM SOMBRE ── */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 z-0 bg-[#070F1E]"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('/images/school-campus.jpg')`,
          }}
        />
        {/* Voile dégradé Tandem Sapphire / Obsidian */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070F1E] via-[#070F1E]/90 to-[#0B1E38]/85 backdrop-blur-xs" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e3352_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* ── BANDEAU SUPÉRIEUR INSTITUTIONNEL ── */}
      <header className="relative z-10 w-full border-b border-white/10 bg-[#070F1E]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C8EE9] to-[#0259A1] text-white flex items-center justify-center shadow-lg shadow-sky-500/20 font-bold shrink-0">
              <Sprout size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">CFP-PAS GAO</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Portail Officiel
                </span>
              </div>
              <p className="text-xs text-slate-300">Centre de Formation Professionnelle Agro-Pastorale • Gao (Mali)</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallPrompt variant="pill" />
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Portail Connecté
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 flex items-center gap-1">
                <ShieldCheck size={14} className="text-sky-400" />
                Sécurisé TLS 1.3
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── CORPS PRINCIPAL : IDENTITÉ DU CFP-PAS & FORMULAIRE TANDEM ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* CÔTÉ GAUCHE : IDENTITÉ DU CENTRE DE GAO */}
          <div className="lg:col-span-7 space-y-6 text-white text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 backdrop-blur-md">
              <Landmark size={14} className="text-emerald-400" />
              <span>RÉPUBLIQUE DU MALI • Un Peuple - Un But - Une Foi</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Portail Numérique Officiel du CFP-PAS de Gao
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-normal">
                Plateforme officielle exclusive du Centre de Formation Professionnelle Agro-Pastorale. Pilotage académique, délibérations des jurys, bulletins de compétences et gestion comptable SYSCOHADA.
              </p>
            </div>

            {/* 3 piliers officiels du centre de Gao */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-[#0D1829]/80 border border-[#1E3352] rounded-2xl p-4 backdrop-blur-md text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5 font-bold">
                  🌾
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Agro-Pastorale & BT</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  1ère A, 2ème Élevage, 1ère & 2ème EA, BT2, Technicien d'Élevage.
                </p>
              </div>

              <div className="bg-[#0D1829]/80 border border-[#1E3352] rounded-2xl p-4 backdrop-blur-md text-left">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-2.5 font-bold">
                  📝
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Évaluations & Notes</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  Sauvegarde locale anti-coupure et bulletins certifiés avec sceau.
                </p>
              </div>

              <div className="bg-[#0D1829]/80 border border-[#1E3352] rounded-2xl p-4 backdrop-blur-md text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2.5 font-bold">
                  💰
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Caisse & Vacataires</h4>
                <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                  Reçus WhatsApp tuteurs (+223) et comptabilité SYSCOHADA.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Mode PWA Hors-Ligne
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Horaires & Emplois du Temps
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Base 163 Apprenants Actifs
              </span>
            </div>
          </div>

          {/* CÔTÉ DROIT : CARTE DE CONNEXION DESIGN TANDEM */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white/95 dark:bg-[#0D1829]/95 backdrop-blur-xl border border-slate-200/80 dark:border-[#1E3352] shadow-2xl rounded-2xl p-6 sm:p-8 text-[#051638] dark:text-[#F1F5F9] transition-all">
              
              {/* En-tête formulaire */}
              <div className="mb-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-[#0C8EE9] dark:text-sky-300 text-[11px] font-bold uppercase tracking-wider mb-2 border border-sky-200/60 dark:border-sky-800/50">
                  Direction du CFP-PAS
                </div>
                <h2 className="text-xl font-black text-[#051638] dark:text-white tracking-tight">
                  Espace d'Accès Sécurisé
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Connectez-vous avec votre identifiant institutionnel.
                </p>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in-50">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Adresse Email Officielle
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@cfppas-gao.ml"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#132238] border border-slate-200 dark:border-[#1E3352] rounded-xl text-sm text-[#051638] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C8EE9] focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Mot de Passe
                    </label>
                    <a href="mailto:support@cfppas-gao.ml" className="text-[11px] text-[#0C8EE9] hover:underline transition">
                      Aide connexion ?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPwd ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-[#132238] border border-slate-200 dark:border-[#1E3352] rounded-xl text-sm text-[#051638] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C8EE9] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Se souvenir de moi */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-100 dark:bg-[#132238] border-slate-300 dark:border-slate-700 text-[#0C8EE9] focus:ring-[#0C8EE9]"
                  />
                  <label htmlFor="remember-me" className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                    Mémoriser la session sur cet appareil
                  </label>
                </div>

                {/* Bouton de validation Tandem */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#0C8EE9] hover:bg-[#0170C7] active:scale-98 text-white rounded-xl font-bold text-sm shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Authentification en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Accéder au CFP-PAS</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Accès rapides de démonstration CFP-PAS */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#1E3352]">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                  <span className="font-semibold uppercase tracking-wider">Profils CFP-PAS configurés :</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@cfppas-gao.ml', 'CfpPasGao2026!')}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#132238] dark:hover:bg-[#1E3352] border border-slate-200 dark:border-[#1E3352] rounded-lg text-[#051638] dark:text-slate-200 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-medium">Directeur</span>
                    <span className="text-[10px] text-sky-500 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('compta@cfppas-gao.ml', 'admin123')}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#132238] dark:hover:bg-[#1E3352] border border-slate-200 dark:border-[#1E3352] rounded-lg text-[#051638] dark:text-slate-200 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-medium">Comptabilité</span>
                    <span className="text-[10px] text-sky-500 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('prof@cfppas-gao.ml', 'admin123')}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#132238] dark:hover:bg-[#1E3352] border border-slate-200 dark:border-[#1E3352] rounded-lg text-[#051638] dark:text-slate-200 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-medium">Formateur</span>
                    <span className="text-[10px] text-sky-500 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('superadmin@schoolerp.com', 'SuperAdminMali2026!')}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#132238] dark:hover:bg-[#1E3352] border border-slate-200 dark:border-[#1E3352] rounded-lg text-[#051638] dark:text-slate-200 text-left transition flex items-center justify-between group"
                  >
                    <span className="font-medium">Super Admin</span>
                    <span className="text-[10px] text-sky-500 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── PIED DE PAGE OFFICIEL DU CFP-PAS ── */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-[#070F1E]/90 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>© 2026 Centre de Formation Professionnelle Agro-Pastorale (CFP-PAS) • Gao, Mali</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Quartier Château, Route de Bourem</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-sky-400">
              <Phone size={12} />
              +223 21 82 07 62
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
