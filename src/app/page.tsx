'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Users, BookOpenCheck, Receipt,
  Calendar, CheckCircle2, ChevronRight, Lock,
  Shield, BarChart3, Clock, ArrowRight, HelpCircle,
  Mail, Phone
} from 'lucide-react';

export default function SchoolSaasLandingPage() {
  const router = useRouter();

  const PORTALS = [
    {
      role: 'Direction & Pilotage',
      title: 'Espace Direction',
      desc: 'Vue globale sur les effectifs, trésorerie, présences et validation des arbitrages.',
      icon: BarChart3,
      href: '/login?role=ADMIN',
      badge: 'Direction',
    },
    {
      role: 'Scolarité & Registres',
      title: 'Secrétariat & Admissions',
      desc: 'Inscriptions d\'élèves, gestion des dossiers, cartes scolaires et appels quotidiens.',
      icon: GraduationCap,
      href: '/login?role=REGISTRE',
      badge: 'Scolarité',
    },
    {
      role: 'Pédagogie & Évaluations',
      title: 'Espace Enseignants',
      desc: 'Saisie des notes, cahier de texte, assiduité des séances et emploi du temps.',
      icon: BookOpenCheck,
      href: '/login?role=TEACHER',
      badge: 'Enseignants',
    },
    {
      role: 'Recouvrement & Caisse',
      title: 'Comptabilité & Frais',
      desc: 'Émission de quittances, factures de scolarité, suivi des impayés et dépenses.',
      icon: Receipt,
      href: '/login?role=FINANCE',
      badge: 'Comptabilité',
    },
    {
      role: 'Personnel & Vacations',
      title: 'Ressources Humaines',
      desc: 'Gestion des formateurs, suivi des heures vacataires, congés et pré-paie.',
      icon: Users,
      href: '/login?role=HR',
      badge: 'Personnel',
    },
    {
      role: 'Suivi & Bulletins',
      title: 'Portail Parents & Élèves',
      desc: 'Consultation directe des notes, relevés d\'absence et quittances de paiement.',
      icon: Calendar,
      href: '/parent',
      badge: 'Familles',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white">

      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap size={20} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                EduGestion
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-500 font-medium border-l border-slate-200 dark:border-slate-700 pl-2">
                Plateforme de Gestion Scolaire
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#espaces"
              className="hidden md:inline-block text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              Modules & Espaces
            </a>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Tableau de bord
            </button>
            <button
              id="header-login-btn"
              onClick={() => router.push('/login')}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={13} strokeWidth={2.2} />
              <span>Se connecter</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Logiciel de gestion scolaire tout-en-un
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
            La solution simple et complète pour piloter votre établissement
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            Admissions, registre d'appel, saisie des notes, fiches de paie et recouvrement des scolarités. Tout votre établissement réuni dans une interface claire et rapide.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="hero-cta-dashboard"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Accéder au tableau de bord</span>
              <ArrowRight size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              Se connecter
            </button>
          </div>

          {/* Points de confiance */}
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-3">
              <span className="block text-2xl font-bold text-slate-900 dark:text-white tabular-nums">100%</span>
              <span className="text-xs text-slate-500">Accessible en ligne et sécurisé</span>
            </div>
            <div className="p-3">
              <span className="block text-2xl font-bold text-slate-900 dark:text-white tabular-nums">94.2%</span>
              <span className="text-xs text-slate-500">Assiduité journalière suivie</span>
            </div>
            <div className="p-3">
              <span className="block text-2xl font-bold text-slate-900 dark:text-white tabular-nums">Multi-filières</span>
              <span className="text-xs text-slate-500">Santé, Général, Technique & Pro</span>
            </div>
            <div className="p-3">
              <span className="block text-2xl font-bold text-slate-900 dark:text-white tabular-nums">Reçus & Bulletins</span>
              <span className="text-xs text-slate-500">Édition en un clic</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ESPACES & PORTAILS ── */}
      <section id="espaces" className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Choisissez votre espace de travail
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Accédez directement au portail adapté à votre rôle dans l'établissement
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PORTALS.map((portal) => {
            const IconComponent = portal.icon;
            return (
              <div
                key={portal.title}
                onClick={() => router.push(portal.href)}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-400 transition-colors">
                      <IconComponent size={20} strokeWidth={2} />
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {portal.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {portal.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Ouvrir l'espace</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER SIMPLE ── */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-blue-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">EduGestion</span>
            <span>• Logiciel de gestion scolaire</span>
          </div>
          <div>
            © {new Date().getFullYear()} — Tous droits réservés.
          </div>
        </div>
      </footer>

    </div>
  );
}
