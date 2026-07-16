'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Loader2, ShieldCheck, GraduationCap,
  BarChart3, Users, ArrowRight
} from 'lucide-react';

const FEATURES = [
  {
    icon: GraduationCap,
    label: 'Académique Complet',
    desc: 'Notes, bulletins, emplois du temps conformes.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Users,
    label: 'Ressources Humaines',
    desc: 'Congés, présences, paie pour tout le personnel.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BarChart3,
    label: 'Pilotage Financier',
    desc: 'Scolarités, dépenses, trésorerie en temps réel.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: ShieldCheck,
    label: 'Sécurisé & Multi-Écoles',
    desc: 'Données isolées par établissement.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
];

export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Identifiants incorrects');
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
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-indigo-500/30">
      {/* ─── LEFT PANEL (Branding) ─── */}
      <div className="hidden lg:flex flex-1 flex-col justify-between relative overflow-hidden bg-slate-950 p-12">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[120px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-cyan-600/20 blur-[100px]" 
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 text-white">
              <GraduationCap size={22} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SchoolERP <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Pro</span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              Gérez votre école <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                avec intelligence
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-12">
              La plateforme tout-en-un pour les établissements scolaires maliens.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-xl">
              {FEATURES.map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${f.bg} ${f.color}`}>
                    <f.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-1">{f.label}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative z-10 flex items-center gap-6 text-sm text-slate-500 font-medium"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Système Opérationnel
          </div>
          <span>•</span>
          <span>Version 1.1.0</span>
        </motion.div>
      </div>

      {/* ─── RIGHT PANEL (Form) ─── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="w-full max-w-[440px] bg-white rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-100 p-8 md:p-10 relative z-10"
        >
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wide mb-6">
              <ShieldCheck size={14} />
              Accès Sécurisé
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Bienvenue 👋
            </h2>
            <p className="text-sm text-slate-500">
              Connectez-vous à votre espace de gestion
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium"
            >
              <ShieldCheck size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="directeur@ecole.ml"
                required
                autoComplete="email"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700 flex justify-between">
                Mot de passe
                <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Oublié ?</a>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex items-center justify-center gap-2 px-4 py-4 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-sm shadow-slate-900/10"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Connexion...</>
              ) : (
                <>Se connecter <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Footer Tech Stack */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex flex-wrap justify-center gap-2">
              {['Next.js 15', 'Supabase', 'Prisma'].map(tech => (
                <span key={tech} className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-500">
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-6">
              Propulsé par <a href="https://sahelmultiservices.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600 hover:text-indigo-600 transition-colors">SAHEL MULTISERVICES</a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
