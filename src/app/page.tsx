'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Landmark, ShieldCheck, GraduationCap, Users,
  ReceiptText, CheckCircle2,
  Lock, BookOpenCheck,
  Award, ChevronRight, Activity, Globe, Phone, Mail, HelpCircle
} from 'lucide-react';

export default function GovernmentFioriLandingPage() {
  const router = useRouter();

  const GUICHETS_FIORI = [
    {
      code: 'DIRECTION',
      title: 'Je suis le directeur / la directrice',
      desc: 'Voir l’état de l’école, les paiements, les absences et valider les demandes.',
      icon: <Landmark size={24} strokeWidth={1.75} className="text-[#0070F2]" />,
      badge: 'Direction',
      badgeClass: 'fiori-badge-info',
      borderColor: '#0070F2',
      href: '/login?role=ADMIN',
    },
    {
      code: 'SECRÉTARIAT',
      title: 'Je suis au secrétariat',
      desc: 'Inscrire un élève, retrouver un dossier, faire l’appel et imprimer les cartes.',
      icon: <GraduationCap size={24} strokeWidth={1.75} className="text-[#107E3E]" />,
      badge: 'Élèves',
      badgeClass: 'fiori-badge-positive',
      borderColor: '#107E3E',
      href: '/login?role=REGISTRE',
    },
    {
      code: 'ENSEIGNANT',
      title: 'Je suis enseignant / formateur',
      desc: 'Saisir les notes, remplir le cahier de texte et consulter mon emploi du temps.',
      icon: <BookOpenCheck size={24} strokeWidth={1.75} className="text-[#C55305]" />,
      badge: 'Cours & notes',
      badgeClass: 'fiori-badge-attention',
      borderColor: '#C55305',
      href: '/login?role=TEACHER',
    },
    {
      code: 'COMPTABILITÉ',
      title: 'Je suis à la caisse / comptabilité',
      desc: 'Encaisser un paiement, éditer un reçu, suivre les dépenses et les impayés.',
      icon: <ReceiptText size={24} strokeWidth={1.75} className="text-[#0A3B7B]" />,
      badge: 'Caisse',
      badgeClass: 'fiori-badge-info',
      borderColor: '#0A3B7B',
      href: '/login?role=FINANCE',
    },
    {
      code: 'PERSONNEL',
      title: 'Je gère le personnel (RH)',
      desc: 'Suivre les présences des formateurs, les congés et préparer les fiches de paie.',
      icon: <Users size={24} strokeWidth={1.75} className="text-[#5C35CC]" />,
      badge: 'Personnel',
      badgeClass: 'fiori-badge-neutral',
      borderColor: '#5C35CC',
      href: '/login?role=HR',
    },
    {
      code: 'FAMILLE',
      title: 'Je suis parent ou élève',
      desc: 'Voir les notes, les absences et les paiements de mon enfant.',
      icon: <Award size={24} strokeWidth={1.75} className="text-[#0284C7]" />,
      badge: 'Famille',
      badgeClass: 'fiori-badge-info',
      borderColor: '#0284C7',
      href: '/parent',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB] dark:bg-[#080C18] text-[#0F1523] dark:text-[#F0F4FF] font-fiori selection:bg-[#0070F2]/20">
      
      {/* ── TOP GOVERNMENT BANNER ── */}
      <div className="w-full bg-[#0A3B7B] text-white py-1.5 px-4 text-xs font-semibold tracking-wider uppercase border-b border-white/10 relative">
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
              Service Layer d'État Opérationnel
            </span>
            <span className="text-white/80 font-mono">Exercice 2025-2026</span>
          </div>
        </div>
      </div>

      {/* ── SAP FIORI SHELLBAR ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0D1224] border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-[#0A3B7B] to-[#0070F2] flex items-center justify-center text-white shadow-md shadow-blue-900/10 border border-white/20">
              <Landmark size={22} strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-[14px] font-extrabold tracking-tight text-[#0A3B7B] dark:text-blue-400 leading-tight">
                FIO-ERP • SYSTÈME NATIONAL DE GESTION SCOLAIRE
              </div>
              <div className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                École de Santé Bernard Kouchner (ESBK) — Bamako
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="#qui-etes-vous"
              className="px-4 py-2 rounded text-[13px] font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Par où commencer ?
            </a>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded text-[13px] font-bold text-white bg-[#0070F2] hover:bg-[#0056B3] shadow-sm transition-all flex items-center gap-2"
            >
              <Lock size={14} strokeWidth={2} />
              Se connecter
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO BANNER INSTITUTIONNEL (FIORI HORIZON STYLE) ── */}
      <section className="relative py-14 md:py-20 bg-gradient-to-b from-white via-[#F4F6FB] to-[#EEF0F7] dark:from-[#0D1224] dark:via-[#0A0E1A] dark:to-[#080C18] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#0070F2] text-[11px] font-bold uppercase tracking-wider mb-5">
                <ShieldCheck size={14} strokeWidth={2} />
                Plateforme officielle de gestion scolaire
              </div>
              
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#0A3B7B] dark:text-white leading-[1.15] mb-5">
                Gérez votre école simplement : élèves, notes, paiements.
              </h1>
              
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-2xl font-normal">
                Tout se fait au même endroit, en quelques clics. Connectez-vous avec votre compte, ou choisissez votre fonction plus bas pour savoir par où commencer.
              </p>

              {/* Parcours en 3 étapes */}
              <ol className="mb-8 grid sm:grid-cols-3 gap-3 max-w-2xl text-sm">
                {[
                  { n: '1', t: 'Connectez-vous', d: 'avec votre email et mot de passe' },
                  { n: '2', t: 'Choisissez une action', d: 'ex. « Inscrire un élève »' },
                  { n: '3', t: 'Suivez les étapes', d: 'l’écran vous guide' },
                ].map((s) => (
                  <li key={s.n} className="flex items-start gap-3 p-3 rounded-lg bg-white/80 dark:bg-[#111829] border border-slate-200 dark:border-slate-800">
                    <span className="w-7 h-7 rounded-full bg-[#0070F2] text-white text-sm font-bold flex items-center justify-center shrink-0">{s.n}</span>
                    <span>
                      <span className="block font-bold text-slate-900 dark:text-white">{s.t}</span>
                      <span className="block text-xs text-slate-500">{s.d}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="home-login-cta"
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 rounded text-base font-bold text-white bg-[#0070F2] hover:bg-[#0056B3] shadow-md shadow-blue-600/20 transition-all flex items-center gap-2.5"
                >
                  Se connecter <ChevronRight size={18} strokeWidth={2} />
                </button>
                <a
                  href="#qui-etes-vous"
                  className="px-6 py-4 rounded text-[14px] font-bold text-[#0A3B7B] dark:text-blue-300 bg-white dark:bg-[#111829] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  Je ne sais pas par où commencer
                </a>
              </div>

              {/* Badges de conformité d'État */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#107E3E]" strokeWidth={2} />
                  <span>Référentiel National APC Homologué</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#107E3E]" strokeWidth={2} />
                  <span>Chiffrement d'État 256-bit</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#107E3E]" strokeWidth={2} />
                  <span>Conforme Code du Travail & CGI Mali</span>
                </div>
              </div>
            </div>

            {/* Launchpad Quick Card */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-[#111829] rounded-lg border border-slate-300 dark:border-slate-800 shadow-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0070F2]" />
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      ESBK • ÉTAT DES REGISTRES PARAMÉDICAUX
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Session de contrôle académique en direct</p>
                  </div>
                  <span className="fiori-badge fiori-badge-positive">✓ En Règle</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Apprenants Inscrits</span>
                    <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">131</span>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">100% avec matricule officiel</span>
                  </div>
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Taux Recouvrement</span>
                    <span className="text-2xl font-black tabular-nums text-emerald-600">85%</span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Sur 12.5M FCFA planifiés</span>
                  </div>
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Assiduité Journalière</span>
                    <span className="text-2xl font-black tabular-nums text-[#0070F2]">94.2%</span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Émargement biométrique</span>
                  </div>
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Corps Formateurs</span>
                    <span className="text-2xl font-black tabular-nums text-purple-600">21</span>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Conventionnés & certifiés</span>
                  </div>
                </div>

                <div className="p-3 rounded bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity size={18} className="text-[#0070F2]" strokeWidth={2} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Balance Caisse : <span className="text-emerald-700 dark:text-emerald-400 font-black">Équilibrée</span>
                    </span>
                  </div>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-xs font-bold text-[#0070F2] hover:underline flex items-center gap-1"
                  >
                    Détails <ChevronRight size={13} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CATALOGUE DES GUICHETS & SERVICES PUBLICS (FIORI LAUNCHPAD) ── */}
      <section id="qui-etes-vous" className="py-16 bg-white dark:bg-[#0D1224] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <span className="fiori-badge fiori-badge-info mb-2 inline-block">
              PAR OÙ COMMENCER ?
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0A3B7B] dark:text-white tracking-tight">
              Qui êtes-vous ?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Cliquez sur votre fonction : vous arrivez sur la connexion, puis directement sur les actions qui vous concernent.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {GUICHETS_FIORI.map((g) => (
              <div
                key={g.code}
                onClick={() => router.push(g.href)}
                className="fiori-tile p-5 cursor-pointer hover:border-blue-400 transition-all flex flex-col justify-between group"
                style={{ borderTop: `3px solid ${g.borderColor}` }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {g.icon}
                    </div>
                    <span className={`fiori-badge ${g.badgeClass}`}>
                      {g.badge}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-1">
                    {g.code}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-[#0070F2] transition-colors mb-2">
                    {g.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {g.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-[#0070F2]">
                  <span>Me connecter</span>
                  <ChevronRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── BESOIN D'AIDE ── */}
      <section id="aide" className="py-14 bg-[#EEF0F7] dark:bg-[#080C18] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-[#111829] rounded-lg border border-slate-300 dark:border-slate-800 shadow-md p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded bg-[#0A3B7B] text-white flex items-center justify-center shrink-0">
                <HelpCircle size={22} strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Besoin d&apos;aide pour vous connecter ?
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
                  <li>Utilisez l&apos;adresse email et le mot de passe donnés par la direction de votre école.</li>
                  <li>Mot de passe oublié ? Demandez sa réinitialisation à la direction ou écrivez-nous.</li>
                  <li>Parent d&apos;élève ? Cliquez sur « Je suis parent ou élève » plus haut.</li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    id="help-login-cta"
                    onClick={() => router.push('/login')}
                    className="px-6 py-3 rounded text-sm font-bold text-white bg-[#0070F2] hover:bg-[#0056B3] transition-colors flex items-center gap-2"
                  >
                    <Lock size={15} strokeWidth={2} /> Se connecter
                  </button>
                  <a
                    href="mailto:contact@cfp-gao.edu.ml"
                    className="px-6 py-3 rounded text-sm font-bold text-[#0A3B7B] dark:text-blue-300 bg-white dark:bg-[#111829] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Mail size={15} strokeWidth={1.75} /> Contacter l&apos;assistance
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER INSTITUTIONNEL DE L'ÉTAT ── */}
      <footer className="bg-[#0A3B7B] text-white pt-12 pb-8 border-t-2 border-[#14A44D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/10 text-xs">
            
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded bg-white text-[#0A3B7B] flex items-center justify-center font-black">
                  ML
                </div>
                <div>
                  <div className="font-extrabold tracking-wider text-sm uppercase">RÉPUBLIQUE DU MALI</div>
                  <div className="text-white/70 text-[11px]">Ministère de l'Éducation Nationale • Tutelle Académique</div>
                </div>
              </div>
              <p className="text-white/75 text-xs leading-relaxed max-w-md">
                École de Santé Bernard Kouchner (ESBK) de Bamako. Plateforme de gestion de la scolarité, des stages cliniques, du personnel et de la trésorerie.
              </p>
            </div>

            <div>
              <h4 className="font-extrabold uppercase tracking-wider text-white mb-3 text-xs">Accès rapides</h4>
              <ul className="space-y-2 text-white/80">
                <li><button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Se connecter</button></li>
                <li><a href="#qui-etes-vous" className="hover:text-white transition-colors">Par où commencer ?</a></li>
                <li><button onClick={() => router.push('/parent')} className="hover:text-white transition-colors">Espace parents &amp; élèves</button></li>
                <li><a href="#aide" className="hover:text-white transition-colors">Besoin d&apos;aide ?</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold uppercase tracking-wider text-white mb-3 text-xs">Assistance Régionale</h4>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center gap-2"><Phone size={13} /> <span>Bamako — École de Santé Bernard Kouchner</span></li>
                <li className="flex items-center gap-2"><Mail size={13} /> <span>admin@esbk-bamako.ml</span></li>
                <li className="flex items-center gap-2"><Globe size={13} /> <span>education.gouv.ml</span></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/60 gap-3">
            <div>
              © 2026 République du Mali • Système FIO-ERP National • Tous droits réservés.
            </div>
            <div className="flex items-center gap-4">
              <span>Confidentialité & Protection des Données</span>
              <span>•</span>
              <span>Audit Ministériel Certifié</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
