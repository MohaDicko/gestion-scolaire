'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import { 
  Shield, Zap, Users, BarChart3, ArrowRight, 
  GraduationCap, Globe, Lock, Cpu, Star, CheckCircle2,
  Menu, X, Play, ChevronRight, BookOpen, Clock, Activity
} from 'lucide-react';

// Animation Variants
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export default function LandingPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Users className="text-indigo-600 dark:text-indigo-400" size={28} />,
      title: "Gestion des Élèves",
      desc: "Suivi complet du cycle de vie de l'élève, de l'inscription à la diplomation avec cartes d'identité à codes-barres.",
      color: "bg-indigo-100 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800/60"
    },
    {
      icon: <BarChart3 className="text-purple-600 dark:text-purple-400" size={28} />,
      title: "Pilotage Stratégique",
      desc: "Tableaux de bord exécutifs en temps réel pour une vision claire de la santé financière et académique.",
      color: "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800/60"
    },
    {
      icon: <Shield className="text-emerald-600 dark:text-emerald-400" size={28} />,
      title: "Sécurité Multi-Tenant",
      desc: "Isolation stricte des données et protection de grade bancaire pour la confidentialité de votre établissement.",
      color: "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800/60"
    },
    {
      icon: <Zap className="text-amber-600 dark:text-amber-400" size={28} />,
      title: "Paie Malienne Intégrée",
      desc: "Calcul automatique de l'ITS, INPS et AMO conforme au Code du Travail et au CGI du Mali.",
      color: "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800/60"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* ── Navigation ────────────────────────────────────────── */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'py-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 shadow-sm' 
            : 'py-6 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              SchoolERP<span className="text-indigo-600 dark:text-indigo-400">.pro</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm">
            <a href="#features" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#solutions" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Solutions</a>
            <a href="#pricing" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">Tarifs</a>
            
            <div className="flex items-center gap-4 ml-4">
              <button 
                onClick={() => router.push('/login')}
                className="px-5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors font-semibold"
              >
                Connexion
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 font-semibold"
              >
                Essai Gratuit
              </button>
            </div>
          </div>

          <button className="md:hidden text-zinc-900 dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </motion.nav>

      {/* ── Mobile Menu ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-0 top-[72px] bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4 z-40 shadow-2xl md:hidden"
        >
          <a href="#features" className="text-lg font-medium p-2 border-b border-zinc-100 dark:border-zinc-900" onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
          <a href="#solutions" className="text-lg font-medium p-2 border-b border-zinc-100 dark:border-zinc-900" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
          <a href="#pricing" className="text-lg font-medium p-2 border-b border-zinc-100 dark:border-zinc-900" onClick={() => setMobileMenuOpen(false)}>Tarifs</a>
          <button className="w-full mt-4 py-3 rounded-xl bg-indigo-600 text-white font-bold" onClick={() => router.push('/login')}>Démarrer</button>
        </motion.div>
      )}

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none -z-10">
          <motion.div style={{ y: y1 }} className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px]" />
          <motion.div style={{ y: y2 }} className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-purple-500/20 dark:bg-purple-600/20 blur-[100px]" />
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="max-w-2xl"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-sm font-semibold mb-8">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              Nouvelle version 3.0 propulsée par l'IA
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              L'Élite de la Gestion <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Scolaire au Mali
              </span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed">
              Digitalisez votre établissement avec la plateforme la plus avancée du marché. 
              Pilotez les inscriptions, les notes, et la paie (ITS, INPS, AMO) depuis un espace unifié et sécurisé.
            </motion.p>
            
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={() => router.push('/login')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                Démarrer l'expérience <ArrowRight size={20} />
              </button>
              <button className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold text-lg shadow-sm hover:shadow-md transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <Play size={20} className="text-indigo-600 dark:text-indigo-400" /> Voir la démo
              </button>
            </motion.div>
            
            <motion.div variants={fadeUp} className="flex items-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <div className="flex -space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white dark:border-zinc-950 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 z-${4-i}`} />
                ))}
              </div>
              <p>Adopté par <strong className="text-zinc-900 dark:text-white">+150 établissements</strong> d'excellence</p>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
            className="relative hidden md:block"
          >
            {/* Main Glass Mockup */}
            <div className="relative z-10 w-full rounded-3xl border border-white/40 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl shadow-2xl shadow-indigo-900/10 p-3 overflow-hidden transform perspective-[2000px] rotate-y-[-12deg] rotate-x-[8deg]">
              <div className="bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
                {/* Mockup Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-zinc-100/50 dark:bg-zinc-900/50 border-b border-zinc-200/50 dark:border-zinc-800/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm" />
                  </div>
                  <div className="mx-auto bg-white dark:bg-zinc-950 px-6 py-1.5 rounded-md text-[11px] text-zinc-500 font-medium shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                    <Lock size={12} /> admin.schoolerp.pro
                  </div>
                </div>
                {/* Mockup Body */}
                <div className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="h-6 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-md mb-3" />
                      <div className="h-4 w-60 bg-zinc-100 dark:bg-zinc-900 rounded-md" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                       <div className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-950" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-200/50 dark:bg-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                      <Users className="text-indigo-600 dark:text-indigo-400 mb-3" size={24} />
                      <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-1">1,420</div>
                      <div className="text-sm text-indigo-600/80 dark:text-indigo-400 font-semibold">Élèves Actifs</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-200/50 dark:bg-emerald-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                      <Activity className="text-emerald-600 dark:text-emerald-400 mb-3" size={24} />
                      <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-1">98%</div>
                      <div className="text-sm text-emerald-600/80 dark:text-emerald-400 font-semibold">Taux Présence</div>
                    </div>
                  </div>
                  <div className="h-40 w-full rounded-2xl bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col justify-end p-4">
                     {/* Fake Chart Lines */}
                     <div className="flex items-end gap-2 h-full opacity-50">
                       {[30, 50, 40, 70, 60, 90, 80, 100].map((h, i) => (
                         <div key={i} className="flex-1 bg-indigo-200 dark:bg-indigo-800/50 rounded-t-md" style={{ height: `${h}%` }}></div>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-16 top-1/3 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl shadow-indigo-900/10 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Paie Validée</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">INPS & AMO calculés</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-12 bottom-1/4 z-20 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl shadow-purple-900/10 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                <GraduationCap size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Notes publiées</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">1er Trimestre 2026</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────── */}
      <section id="features" className="py-32 bg-white dark:bg-zinc-950 relative z-10 border-y border-zinc-200 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
              Tout ce dont vous avez besoin, <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">réinventé.</span>
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Une architecture modulaire pensée pour les directeurs d'établissements exigeants. Fini les tableurs Excel dispersés et les erreurs de paie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 100 }}
                className="group relative p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className={`w-16 h-16 rounded-2xl ${feature.color} border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white relative z-10">{feature.title}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm relative z-10">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ───────────────────────────────────── */}
      <section id="pricing" className="py-32 relative overflow-hidden bg-zinc-50 dark:bg-zinc-900/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Des tarifs transparents</h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Des forfaits adaptés à la taille et aux ambitions de votre établissement. Sans frais cachés.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {/* Starter */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl"
            >
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-zinc-500 text-sm mb-6 font-medium">Idéal pour les structures &lt; 250 élèves</p>
              <div className="text-4xl font-extrabold mb-8 text-zinc-900 dark:text-white">150.000 <span className="text-lg text-zinc-400 font-medium">FCFA/an</span></div>
              <ul className="space-y-4 mb-8">
                {['Inscriptions & Dossiers', 'Bulletins digitaux', 'Suivi de scolarité'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 size={22} className="text-indigo-500 shrink-0" /> {item}
                  </li>
                ))}
                {['Module RH & Paie', 'SMS Automatiques'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-zinc-400 dark:text-zinc-600 line-through">
                    <X size={22} className="shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push('/login')} className="w-full py-4 rounded-2xl font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">Démarrer Starter</button>
            </motion.div>

            {/* Business */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-10 rounded-[2.5rem] bg-gradient-to-b from-indigo-900 to-zinc-950 dark:from-indigo-950 dark:to-zinc-950 border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 text-white transform md:-translate-y-4"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
                Plus Populaire
              </div>
              <h3 className="text-2xl font-bold mb-2">Business</h3>
              <p className="text-indigo-200/80 text-sm mb-6 font-medium">Pour les écoles de 250 à 750 élèves</p>
              <div className="text-5xl font-extrabold mb-8">350.000 <span className="text-lg text-indigo-300/60 font-medium">FCFA/an</span></div>
              <ul className="space-y-4 mb-8">
                {['Tout du pack Starter', 'Reçus PDF automatiques', 'Cartes ID Code-Barres', 'Emails & SMS', 'Emplois du temps avancés'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-indigo-50">
                    <CheckCircle2 size={22} className="text-indigo-400 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push('/login')} className="w-full py-4 rounded-2xl font-bold text-indigo-950 bg-white hover:bg-zinc-100 transition-colors shadow-lg hover:scale-105 active:scale-95 duration-200">Choisir Business</button>
            </motion.div>

            {/* Elite */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-[2.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl"
            >
              <h3 className="text-2xl font-bold mb-2">Elite</h3>
              <p className="text-zinc-500 text-sm mb-6 font-medium">Complexes & Multi-Campus</p>
              <div className="text-4xl font-extrabold mb-8 text-zinc-900 dark:text-white">750.000 <span className="text-lg text-zinc-400 font-medium">FCFA/an</span></div>
              <ul className="space-y-4 mb-8">
                {['Tout du pack Business', 'Paie Malienne (INPS/AMO)', 'Gestion Multi-Campus', 'Audit & Stress Test', 'Support VIP 24/7'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 size={22} className="text-indigo-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push('/login')} className="w-full py-4 rounded-2xl font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">Démarrer Elite</button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-32 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 px-8 py-20 md:px-20 md:py-32 text-center shadow-2xl shadow-indigo-900/20"
          >
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-purple-500/50 rounded-full mix-blend-screen filter blur-[100px] opacity-60 pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-indigo-400/40 rounded-full mix-blend-screen filter blur-[100px] opacity-60 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tight">Prêt à transformer votre école ?</h2>
              <p className="text-xl md:text-2xl text-indigo-100/90 mb-12 max-w-2xl mx-auto font-medium">
                Rejoignez la révolution de l'éducation numérique au Mali avec la plateforme la plus performante.
              </p>
              <button onClick={() => router.push('/login')} className="px-10 py-5 rounded-2xl bg-white text-indigo-900 font-extrabold text-lg hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-white/10 border border-white/20">
                Créer mon espace maintenant
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-zinc-50 dark:bg-zinc-950 py-20 border-t border-zinc-200 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold">SchoolERP<span className="text-indigo-600 dark:text-indigo-400">.pro</span></span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm leading-relaxed font-medium">
              Modernisation du système éducatif malien par l'innovation technologique et l'excellence logicielle. Conçu pour les leaders.
            </p>
          </div>
          <div>
            <h4 className="font-extrabold text-zinc-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Plateforme</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Académie</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Finance & Paie</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Ressources Humaines</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold text-zinc-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Support</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Contactez-nous</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Status système</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-extrabold text-zinc-900 dark:text-white mb-6 uppercase tracking-wider text-xs">Légal</h4>
            <ul className="space-y-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">CGV</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">© 2026 SchoolERP Pro. Tous droits réservés.</p>
          <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
            Développé avec <span className="text-red-500">❤️</span> par <a href="https://sahelmultiservices.com" className="font-bold text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">SAHEL MULTISERVICES</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
