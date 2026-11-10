'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, Loader2,
  ArrowRight, ShieldCheck, CheckCircle2, AlertCircle,
  HelpCircle, Landmark, Building2, Phone, Sparkles
} from 'lucide-react';

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
          email: email.trim().toLowerCase(),
          password,
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

  const handleQuickLogin = (accEmail: string, accPwd: string) => {
    setEmail(accEmail);
    setPassword(accPwd);
    setError('');
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden">
      
      {/* ── IMAGE D'ARRIÈRE-PLAN ÉCOLE + OVERLAY INSTITUTIONNEL SOMBRE ── */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 z-0 bg-slate-950"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('/images/school-campus.jpg')`,
          }}
        />
        {/* Voile de dégradé sombre pour un contraste et une lisibilité 100% conformes aux normes DSI */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/90 backdrop-blur-xs" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* ── EN-TÊTE SUPÉRIEUR ── */}
      <header className="relative z-10 w-full border-b border-white/10 bg-slate-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">SchoolERP Pro</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Portail Officiel
                </span>
              </div>
              <p className="text-xs text-slate-400">Centre de Formation Professionnelle Agro-Pastorale (CFP-PAS)</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Système Opérationnel
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <ShieldCheck size={14} className="text-blue-400" />
              Connexion Sécurisée TLS 1.3
            </span>
          </div>
        </div>
      </header>

      {/* ── CORPS PRINCIPAL : PRÉSENTATION INSTITUTIONNELLE & FORMULAIRE ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* CÔTÉ GAUCHE : IDENTITÉ DE L'ÉTABLISSEMENT & CADRE ÉDUCATIF */}
          <div className="lg:col-span-7 space-y-6 text-white text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 backdrop-blur-md">
              <Landmark size={14} className="text-emerald-400" />
              <span>RÉPUBLIQUE DU MALI • Un Peuple - Un But - Une Foi</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Plateforme Numérique de Gestion des Établissements
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                Accès unifié pour la direction, le corps professoral, la comptabilité et la vie scolaire. Gestion académique intégrée, suivi des apprenants et conformité SYSCOHADA.
              </p>
            </div>

            {/* 3 piliers opérationnels institutionnels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md text-left">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5 font-bold">
                  ✓
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pédagogie & APC</h4>
                <p className="text-[11px] text-slate-400 mt-1">Barèmes /100 et /20, délibérations et bulletins officiels.</p>
              </div>

              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2.5 font-bold">
                  §
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Vacations & RH</h4>
                <p className="text-[11px] text-slate-400 mt-1">Suivi d'émargement mensuel au taux de 1 750 FCFA / heure.</p>
              </div>

              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-md text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2.5 font-bold">
                  $
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Caisse & Finance</h4>
                <p className="text-[11px] text-slate-400 mt-1">Scolarités, reçus WhatsApp, Grand Livre et plan SYSCOHADA.</p>
              </div>
            </div>
          </div>

          {/* CÔTÉ DROIT : CARTE DE CONNEXION PROFESSIONNELLE */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl text-slate-100 relative">
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Espace de Connexion</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Veuillez vous authentifier pour accéder à votre espace de travail.
                </p>
              </div>

              {error && (
                <div 
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email / Identifiant */}
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Adresse Email
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                      Mot de Passe
                    </label>
                    <a href="mailto:support@cfppas-gao.ml" className="text-[11px] text-blue-400 hover:text-blue-300 transition">
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
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
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
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="remember-me" className="text-xs text-slate-400 cursor-pointer">
                    Mémoriser la session sur cet appareil
                  </label>
                </div>

                {/* Bouton de validation */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Authentification en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter à mon espace</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Accès rapides de démonstration (discrets et ergonomiques pour l'équipe) */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
                  <span className="font-semibold uppercase tracking-wider">Comptes de test préconfigurés :</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@cfppas-gao.ml', 'CfpPasGao2026!')}
                    className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-200 text-left transition flex items-center justify-between group"
                  >
                    <span>Directeur</span>
                    <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('compta@cfppas-gao.ml', 'admin123')}
                    className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-200 text-left transition flex items-center justify-between group"
                  >
                    <span>Comptabilité</span>
                    <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('prof@cfppas-gao.ml', 'admin123')}
                    className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-200 text-left transition flex items-center justify-between group"
                  >
                    <span>Formateur</span>
                    <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('superadmin@schoolerp.com', 'SuperAdminMali2026!')}
                    className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-slate-200 text-left transition flex items-center justify-between group"
                  >
                    <span>Super Admin</span>
                    <span className="text-[10px] text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ── PIED DE PAGE INSTITUTIONNEL ── */}
      <footer className="relative z-10 w-full border-t border-white/10 bg-slate-950/80 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>© 2026 Centre de Formation Professionnelle (CFP-PAS) • Gao, Mali</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>B.P. 226 Château Secteur III</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone size={12} /> +223 21 82 07 62
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
