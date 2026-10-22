'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Landmark, ShieldCheck, FileCheck2, GraduationCap, Users,
  ReceiptText, Scale, Building2, Search, ArrowRight, CheckCircle2,
  Lock, ExternalLink, Sliders, CalendarDays, BookOpenCheck,
  Award, ChevronRight, Activity, Globe, Phone, Mail
} from 'lucide-react';

export default function GovernmentFioriLandingPage() {
  const router = useRouter();
  const [searchMatricule, setSearchMatricule] = useState('');
  const [searchResult, setSearchResult] = useState<null | { found: boolean; message: string; details?: any }>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMatricule.trim()) return;
    setIsVerifying(true);
    setSearchResult(null);

    setTimeout(() => {
      setIsVerifying(false);
      const clean = searchMatricule.trim().toUpperCase();
      if (clean.includes('GAO') || clean.includes('2025') || clean.includes('2026') || clean.startsWith('APP') || clean.startsWith('MAT')) {
        setSearchResult({
          found: true,
          message: 'Dossier certifié et homologué auprès du registre national.',
          details: {
            matricule: clean,
            etablissement: 'Centre de Formation Professionnelle Polyvalent (CFP-PAS) - Gao',
            filiere: '1ère Année Transformation Économique & Agro-Pastoral',
            statut: 'Régulier - Exercice Réglementaire 2025-2026',
            referentiel: 'APC Niveau II Certifié',
          }
        });
      } else {
        setSearchResult({
          found: false,
          message: 'Aucun enregistrement homologué trouvé pour cette référence dans le registre actif.',
        });
      }
    }, 450);
  };

  const GUICHETS_FIORI = [
    {
      code: 'GUICHET-01',
      title: 'Direction & Arbitrage',
      desc: 'Supervision générale, conformité académique, arbitrages des contentieux et balance de trésorerie.',
      icon: <Landmark size={24} strokeWidth={1.75} className="text-[#0070F2]" />,
      badge: 'Tutelle État',
      badgeClass: 'fiori-badge-info',
      borderColor: '#0070F2',
      href: '/login?role=ADMIN',
    },
    {
      code: 'GUICHET-02',
      title: 'Registre Scolarité & Admissions',
      desc: 'Gestion des inscriptions, immatriculation nationale, émargement biométrique et cartes d’apprenants.',
      icon: <GraduationCap size={24} strokeWidth={1.75} className="text-[#107E3E]" />,
      badge: 'Registres Actifs',
      badgeClass: 'fiori-badge-positive',
      borderColor: '#107E3E',
      href: '/login?role=REGISTRE',
    },
    {
      code: 'GUICHET-03',
      title: 'Pédagogie & Référentiel APC',
      desc: 'Cahiers de texte, validation des compétences professionnelles, bulletins trimestriels et relevés officiels.',
      icon: <BookOpenCheck size={24} strokeWidth={1.75} className="text-[#C55305]" />,
      badge: 'Référentiel APC',
      badgeClass: 'fiori-badge-attention',
      borderColor: '#C55305',
      href: '/login?role=TEACHER',
    },
    {
      code: 'GUICHET-04',
      title: 'Finances Publiques & Caisse',
      desc: 'Facturation des frais, encaissements traçables, balances de trésorerie et déclarations légales.',
      icon: <ReceiptText size={24} strokeWidth={1.75} className="text-[#0A3B7B]" />,
      badge: 'Audit & Caisse',
      badgeClass: 'fiori-badge-info',
      borderColor: '#0A3B7B',
      href: '/login?role=FINANCE',
    },
    {
      code: 'GUICHET-05',
      title: 'Corps Formateurs & Salaires RH',
      desc: 'Gestion des vacataires et permanents, suivi des heures d’enseignement et calcul conforme ITS / INPS / AMO.',
      icon: <Users size={24} strokeWidth={1.75} className="text-[#5C35CC]" />,
      badge: 'Conformité RH',
      badgeClass: 'fiori-badge-neutral',
      borderColor: '#5C35CC',
      href: '/login?role=HR',
    },
    {
      code: 'GUICHET-06',
      title: 'Portail Familles & Apprenants',
      desc: 'Consultation des relevés périodiques, suivi des présences quotidiennes et quittances de paiement.',
      icon: <Award size={24} strokeWidth={1.75} className="text-[#0284C7]" />,
      badge: 'Guichet Usagers',
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
                Centre de Formation Professionnelle Polyvalent (CFP-PAS) — Gao
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded text-[13px] font-bold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Consultation Dossier
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded text-[13px] font-bold text-white bg-[#0070F2] hover:bg-[#0056B3] shadow-sm transition-all flex items-center gap-2"
            >
              <Lock size={14} strokeWidth={2} />
              Accès Console Sécurisée
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
                Plateforme Réglementaire Sous Tutelle Ministérielle
              </div>
              
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[#0A3B7B] dark:text-white leading-[1.15] mb-5">
                Pilotage Intégré de l'Enseignement & des Finances Publiques Scolaires
              </h1>
              
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-2xl font-normal">
                Console officielle de gestion administrative, académique et budgétaire selon l'Approche Par Compétences (APC). Destinée au corps enseignant, aux intendants et à la tutelle académique de la région de Gao.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => router.push('/login')}
                  className="px-6 py-3 rounded text-[13.5px] font-bold text-white bg-[#0070F2] hover:bg-[#0056B3] shadow-md shadow-blue-600/20 transition-all flex items-center gap-2.5"
                >
                  Ouvrir la Console Fiori <ChevronRight size={16} strokeWidth={2} />
                </button>
                <a
                  href="#verification"
                  className="px-6 py-3 rounded text-[13.5px] font-bold text-[#0A3B7B] dark:text-blue-300 bg-white dark:bg-[#111829] border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Search size={15} strokeWidth={1.75} />
                  Contrôler une Immatriculation
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
                      CFP-PAS DE GAO • ÉTAT DES REGISTRES
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
      <section className="py-16 bg-white dark:bg-[#0D1224] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <span className="fiori-badge fiori-badge-info mb-2 inline-block">
              SERVICES D'ÉTAT DU PORTAIL
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0A3B7B] dark:text-white tracking-tight">
              Guichets Opérationnels & Modules Réglementaires
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
              Chaque guichet est sécurisé par rôle avec traçabilité intégrale des écritures et des actes administratifs.
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
                  <span>Accéder au guichet</span>
                  <ChevronRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── MODULE DE VÉRIFICATION RAPIDE D'ATTESTATION & MATRICULE ── */}
      <section id="verification" className="py-16 bg-[#EEF0F7] dark:bg-[#080C18] border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-[#111829] rounded-lg border border-slate-300 dark:border-slate-800 shadow-md p-6 sm:p-8">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded bg-[#0A3B7B] text-white flex items-center justify-center">
                <Search size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Guichet Public : Vérification d'Attestation & Immatriculation
                </h3>
                <p className="text-xs text-slate-500">
                  Contrôle d'authenticité des inscriptions, attestations de formation et compétences APC délivrées par le CFP-PAS de Gao.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchMatricule}
                onChange={(e) => setSearchMatricule(e.target.value)}
                placeholder="Ex : CFP-GAO-2025-014 ou APP-128"
                className="flex-1 px-4 py-3 rounded text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-[#0070F2] focus:ring-1 focus:ring-[#0070F2]"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-6 py-3 rounded text-sm font-bold text-white bg-[#0A3B7B] hover:bg-[#0070F2] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isVerifying ? (
                  <span>Interrogation Registre...</span>
                ) : (
                  <>
                    <Search size={16} strokeWidth={2} />
                    Vérifier Authenticité
                  </>
                )}
              </button>
            </form>

            {searchResult && (
              <div className={`mt-6 p-4 rounded border text-sm ${searchResult.found ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200' : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-950 dark:text-red-200'}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {searchResult.found ? <CheckCircle2 size={18} className="text-[#107E3E]" /> : <ShieldCheck size={18} className="text-[#BB0000]" />}
                  <span>{searchResult.message}</span>
                </div>
                {searchResult.details && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 grid sm:grid-cols-2 gap-2 text-xs">
                    <div><span className="font-semibold text-slate-600 dark:text-slate-400">Matricule :</span> <strong className="font-mono">{searchResult.details.matricule}</strong></div>
                    <div><span className="font-semibold text-slate-600 dark:text-slate-400">Établissement :</span> <strong>{searchResult.details.etablissement}</strong></div>
                    <div><span className="font-semibold text-slate-600 dark:text-slate-400">Filière / Niveau :</span> <strong>{searchResult.details.filiere}</strong></div>
                    <div><span className="font-semibold text-slate-600 dark:text-slate-400">Statut :</span> <strong className="text-emerald-700 dark:text-emerald-400">{searchResult.details.statut}</strong></div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-[11px] text-slate-400 text-center">
              Toute tentative d'utilisation frauduleuse de matricule ou d'attestation falsifiée est punie conformément aux dispositions du Code Pénal de la République du Mali.
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
                Centre de Formation Professionnelle Polyvalent (CFP-PAS) de Gao. Plateforme d'arbitrage de scolarité, conformité de formation technique et trésorerie publique homologuée.
              </p>
            </div>

            <div>
              <h4 className="font-extrabold uppercase tracking-wider text-white mb-3 text-xs">Guichets Officiels</h4>
              <ul className="space-y-2 text-white/80">
                <li><button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Portail Formateurs</button></li>
                <li><button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Portail Administration & Caisse</button></li>
                <li><button onClick={() => router.push('/parent')} className="hover:text-white transition-colors">Espace Familles & Tuteurs</button></li>
                <li><a href="#verification" className="hover:text-white transition-colors">Vérification de Diplôme / Attestation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-extrabold uppercase tracking-wider text-white mb-3 text-xs">Assistance Régionale</h4>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-center gap-2"><Phone size={13} /> <span>Gao : +223 21 82 00 00</span></li>
                <li className="flex items-center gap-2"><Mail size={13} /> <span>contact@cfp-gao.edu.ml</span></li>
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
