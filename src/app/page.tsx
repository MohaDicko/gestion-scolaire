'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Zap, Users, BarChart3, ArrowRight, 
  GraduationCap, Globe, Lock, Cpu, Star, CheckCircle2,
  Menu, X, Play
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Users size={24} />,
      title: "Gestion des Élèves",
      desc: "Suivi complet du cycle de vie de l'élève, de l'inscription à la diplomation avec cartes d'identité à codes-barres."
    },
    {
      icon: <BarChart3 size={24} />,
      title: "Pilotage Stratégique",
      desc: "Tableaux de bord exécutifs en temps réel pour une vision claire de la santé financière et académique."
    },
    {
      icon: <Shield size={24} />,
      title: "Sécurité Multi-Tenant",
      desc: "Isolation stricte des données et protection de grade bancaire pour la confidentialité de votre établissement."
    },
    {
      icon: <Zap size={24} />,
      title: "Paie Malienne Intégrée",
      desc: "Calcul automatique de l'ITS, INPS et AMO conforme au Code du Travail et au CGI du Mali."
    }
  ];

  return (
    <div className="landing-root">
      {/* ── Navigation ────────────────────────────────────────── */}
      <nav className={`nav ${isScrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-logo" onClick={() => window.scrollTo(0, 0)}>
            <div className="logo-box">
              <GraduationCap size={22} color="#fff" />
            </div>
            <span className="logo-text">SchoolERP<span className="text-primary">.pro</span></span>
          </div>

          <div className="nav-links desktop-only">
            <a href="#features">Fonctionnalités</a>
            <a href="#solutions">Solutions</a>
            <a href="#pricing">Tarifs</a>
            <button className="btn-login" onClick={() => router.push('/login')}>Connexion Admin</button>
            <button className="btn-get-started" onClick={() => router.push('/login')}>Essai Gratuit</button>
          </div>

          <button className="mobile-menu-toggle mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ───────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="mobile-menu animate-fade">
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
          <a href="#solutions" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Tarifs</a>
          <button className="btn-primary w-full" onClick={() => router.push('/login')}>Démarrer</button>
        </div>
      )}

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
        </div>

        <div className="container hero-content">
          <div className="hero-text animate-up">
            <div className="badge-promo">
              <span className="pulse"></span> Nouvelle version 2.0 disponible
            </div>
            <h1 className="hero-title">
              L'Elite de la Gestion <br />
              <span className="text-grad">Scolaire au Mali</span>
            </h1>
            <p className="hero-lead">
              Digitalisez votre établissement avec la plateforme la plus avancée du marché. 
              Gérez inscriptions, emplois du temps, notes et paie en toute simplicité.
            </p>
            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={() => router.push('/login')}>
                Démarrer maintenant <ArrowRight size={18} />
              </button>
              <button className="btn-hero-outline">
                <Play size={16} fill="currentColor" /> Voir la démo
              </button>
            </div>
            <div className="hero-social">
              <div className="avatars">
                {[1,2,3,4].map(i => <div key={i} className="avatar-mini" style={{background: `var(--bg-${i})`, border: '2px solid var(--bg)'}} />)}
              </div>
              <span>Rejoint par +150 établissements en Afrique de l'Ouest</span>
            </div>
          </div>

          <div className="hero-visual animate-fade">
             <div className="glass-mockup">
                <div className="mockup-header">
                  <div className="dots"><span></span><span></span><span></span></div>
                  <div className="address-bar">admin.schoolerp.pro</div>
                </div>
                <div className="mockup-content">
                   <div className="skeleton-line" style={{width: '60%', height: '14px', marginBottom: '20px'}}></div>
                   <div className="mockup-grid">
                      <div className="skeleton-card"></div>
                      <div className="skeleton-card"></div>
                      <div className="skeleton-card"></div>
                      <div className="skeleton-card"></div>
                   </div>
                   <div className="skeleton-line" style={{width: '100%', height: '100px', marginTop: '20px', borderRadius: '12px'}}></div>
                </div>
             </div>
             <div className="floating-stat stat-1 animate-float">
                <Users size={16} color="var(--primary)" />
                <div>
                   <div className="stat-n">1,420</div>
                   <div className="stat-l">Élèves actifs</div>
                </div>
             </div>
             <div className="floating-stat stat-2 animate-float" style={{animationDelay: '1s'}}>
                <Zap size={16} color="#f5a623" />
                <div>
                   <div className="stat-n">100%</div>
                   <div className="stat-l">Conformité DREN</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────── */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header text-center animate-up">
            <h2 className="section-title">Tout ce dont vous avez besoin</h2>
            <p className="section-subtitle">
              Une solution de bout-en-bout conçue pour les directeurs d'établissements exigeants.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card animate-up" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ─────────────────────────────────────── */}
      <section id="pricing" className="pricing">
        <div className="container">
          <div className="section-header text-center animate-up">
            <h2 className="section-title">Des Tarifs Transparents</h2>
            <p className="section-subtitle">
              Choisissez le pack adapté à la taille de votre établissement.
            </p>
          </div>

          <div className="pricing-grid">
            {/* Starter */}
            <div className="pricing-card animate-up">
              <div className="p-header">
                <h3 className="p-name">Starter</h3>
                <div className="p-price">150.000 <span>FCFA / an</span></div>
                <p className="p-target">Idéal pour les structures de moins de 250 élèves.</p>
              </div>
              <ul className="p-features">
                <li><CheckCircle2 size={18} className="text-primary" /> Inscriptions & Dossiers élèves</li>
                <li><CheckCircle2 size={18} className="text-primary" /> Bulletins de notes digitaux</li>
                <li><CheckCircle2 size={18} className="text-primary" /> Suivi des frais de scolarité</li>
                <li className="disabled"><X size={18} /> Module RH & Paie Mali</li>
                <li className="disabled"><X size={18} /> Notifications Automatiques</li>
              </ul>
              <button className="btn-p-outline" onClick={() => router.push('/login')}>Démarrer</button>
            </div>

            {/* Business */}
            <div className="pricing-card featured animate-up">
              <div className="p-badge">Plus Populaire</div>
              <div className="p-header">
                <h3 className="p-name">Business</h3>
                <div className="p-price">350.000 <span>FCFA / an</span></div>
                <p className="p-target">Pour les écoles de 250 à 750 élèves.</p>
              </div>
              <ul className="p-features">
                <li><CheckCircle2 size={18} className="text-primary" /> <strong>Tout du pack Starter</strong></li>
                <li><CheckCircle2 size={18} className="text-primary" /> Reçus de paiement PDF</li>
                <li><CheckCircle2 size={18} className="text-primary" /> Cartes ID avec Code-Barres</li>
                <li><CheckCircle2 size={18} className="text-primary" /> Notifications Emails & SMS</li>
                <li><CheckCircle2 size={18} className="text-primary" /> Emplois du temps avancés</li>
              </ul>
              <button className="btn-p-primary" onClick={() => router.push('/login')}>Choisir Business</button>
            </div>

            {/* Elite */}
            <div className="pricing-card animate-up">
              <div className="p-header">
                <h3 className="p-name">Elite</h3>
                <div className="p-price">750.000 <span>FCFA / an</span></div>
                <p className="p-target">Complexes scolaires & Multi-Campus.</p>
              </div>
              <ul className="p-features">
                <li><CheckCircle2 size={18} className="text-primary" /> <strong>Tout du pack Business</strong></li>
                <li><CheckCircle2 size={18} className="text-primary" /> Paie Malienne (ITS, INPS, AMO)</li>
                <li><CheckCircle2 size={18} className="text-primary" /> Gestion Multi-Campus centralisée</li>
                <li><CheckCircle2 size={18} className="text-primary" /> Audit Santé & Stress Test</li>
                <li><CheckCircle2 size={18} className="text-primary" /> Support VIP 24h/24</li>
              </ul>
              <button className="btn-p-outline" onClick={() => router.push('/login')}>Démarrer Elite</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────── */}
      <section className="cta animate-fade">
        <div className="cta-container">
          <h2 className="cta-title">Prêt à transformer votre établissement ?</h2>
          <p className="cta-desc">Rejoignez la révolution de l'éducation numérique au Mali.</p>
          <button className="btn-cta" onClick={() => router.push('/login')}>Créer mon compte établissement</button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo">
                <div className="logo-box"><GraduationCap size={20} color="#fff" /></div>
                <span className="logo-text">SchoolERP<span className="text-primary">.pro</span></span>
              </div>
              <p>Modernisation du système éducatif malien par l'innovation technologique.</p>
            </div>
            <div className="footer-links">
              <h4>Plateforme</h4>
              <a href="#">Académie</a>
              <a href="#">Finance</a>
              <a href="#">RH & Paie</a>
            </div>
            <div className="footer-links">
              <h4>Support</h4>
              <a href="#">Aide</a>
              <a href="#">Contact</a>
              <a href="#">Status</a>
            </div>
            <div className="footer-links">
              <h4>Légal</h4>
              <a href="#">Confidentialité</a>
              <a href="#">Conditions</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 SchoolERP Pro. Tous droits réservés.</p>
            <div className="social-icons">
               <Globe size={18} />
               <Cpu size={18} />
               <Star size={18} />
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .landing-root {
          background: #060b18;
          color: #f0f4ff;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── NAV ── */
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          padding: 24px 0;
          transition: all 0.3s var(--ease);
        }
        .nav-scrolled {
          background: rgba(11, 18, 37, 0.85);
          backdrop-filter: blur(20px);
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .logo-box {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #4f8ef7, #6366f1);
          border-radius: 10px;
          display: grid;
          place-items: center;
          box-shadow: 0 4px 12px rgba(79, 142, 247, 0.3);
        }
        .logo-text { font-size: 19px; fontWeight: 800; letter-spacing: -0.5px; }
        .text-primary { color: #4f8ef7; }

        .nav-links { display: flex; align-items: center; gap: 32px; font-size: 14px; fontWeight: 500; }
        .nav-links a { color: #c8d6f5; transition: color 0.2s; }
        .nav-links a:hover { color: #fff; }
        .btn-login { color: #fff; fontWeight: 600; padding: 8px 16px; borderRadius: 8px; border: 1px solid rgba(255,255,255,0.1); }
        .btn-get-started { background: #4f8ef7; color: #fff; fontWeight: 700; padding: 10px 20px; borderRadius: 8px; box-shadow: 0 4px 12px rgba(79, 142, 247, 0.25); }

        /* ── HERO ── */
        .hero {
          position: relative;
          padding: 180px 0 120px;
          overflow: hidden;
        }
        .hero-bg-orbs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: orb-move 20s infinite alternate;
        }
        .orb-1 { width: 600px; height: 600px; background: #4f8ef7; top: -100px; right: -200px; }
        .orb-2 { width: 500px; height: 500px; background: #6366f1; bottom: -100px; left: -200px; }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .hero-text { max-width: 580px; }
        .badge-promo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(79, 142, 247, 0.1);
          border: 1px solid rgba(79, 142, 247, 0.2);
          border-radius: 99px;
          color: #4f8ef7;
          font-size: 12px;
          fontWeight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 24px;
        }
        .pulse { width: 6px; height: 6px; background: #4f8ef7; border-radius: 50%; display: block; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }

        .hero-title { font-size: 64px; fontWeight: 900; line-height: 1.1; margin-bottom: 24px; letter-spacing: -2px; }
        .text-grad { background: linear-gradient(90deg, #4f8ef7, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-lead { font-size: 20px; color: #7a91b8; margin-bottom: 40px; line-height: 1.6; }
        
        .hero-actions { display: flex; gap: 16px; margin-bottom: 48px; }
        .btn-hero-primary { 
          padding: 16px 32px; background: #4f8ef7; color: #fff; borderRadius: 12px; 
          fontWeight: 700; fontSize: 16px; display: flex; alignItems: center; gap: 10px;
          box-shadow: 0 10px 25px rgba(79, 142, 247, 0.35); transition: all 0.3s;
        }
        .btn-hero-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(79, 142, 247, 0.45); }
        .btn-hero-outline { 
          padding: 16px 32px; background: rgba(255,255,255,0.03); color: #fff; borderRadius: 12px; 
          fontWeight: 700; fontSize: 16px; border: 1px solid rgba(255,255,255,0.1);
          display: flex; alignItems: center; gap: 10px; transition: all 0.3s;
        }
        .btn-hero-outline:hover { background: rgba(255,255,255,0.06); }

        .hero-social { display: flex; alignItems: center; gap: 16px; color: #4a5b7a; font-size: 14px; }
        .avatars { display: flex; }
        .avatar-mini { width: 32px; height: 32px; border-radius: 50%; margin-left: -8px; }
        .avatar-mini:first-child { margin-left: 0; }

        /* ── VISUAL ── */
        .hero-visual { position: relative; }
        .glass-mockup {
          background: rgba(15, 24, 48, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          overflow: hidden;
          width: 100%;
          transform: perspective(1000px) rotateY(-10deg) rotateX(10deg);
        }
        .mockup-header { padding: 12px 20px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 16px; }
        .dots { display: flex; gap: 6px; }
        .dots span { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2); }
        .address-bar { flex: 1; background: rgba(0,0,0,0.2); borderRadius: 6px; padding: 4px 12px; fontSize: 10px; color: #4a5b7a; textAlign: center; }
        .mockup-content { padding: 30px; }
        .skeleton-line { background: rgba(255,255,255,0.05); }
        .mockup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .skeleton-card { height: 60px; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }

        .floating-stat {
          position: absolute;
          background: #fff;
          color: #060b18;
          padding: 12px 20px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 10;
        }
        .stat-n { font-weight: 800; font-size: 16px; line-height: 1; }
        .stat-l { font-size: 10px; color: #4a5b7a; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
        .stat-1 { top: 20%; left: -40px; }
        .stat-2 { bottom: 10%; right: -20px; }

        @keyframes orb-move {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, 40px) scale(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        /* ── FEATURES ── */
        .features { padding: 120px 0; background: #0b1225; }
        .section-header { margin-bottom: 70px; max-width: 600px; margin-left: auto; margin-right: auto; }
        .section-title { font-size: 40px; fontWeight: 800; margin-bottom: 16px; }
        .section-subtitle { color: #7a91b8; font-size: 18px; }

        .features-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .feature-card {
           padding: 40px 30px; background: #0f1830; border: 1px solid rgba(255,255,255,0.05); 
           borderRadius: 24px; transition: all 0.3s;
        }
        .feature-card:hover { transform: translateY(-10px); border-color: #4f8ef7; background: #16213e; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .feature-icon { 
          width: 56px; height: 56px; background: rgba(79, 142, 247, 0.1); 
          color: #4f8ef7; borderRadius: 16px; display: grid; placeItems: center; 
          marginBottom: 24px;
        }
        .feature-title { fontSize: 18px; fontWeight: 700; marginBottom: 12px; }
        .feature-desc { color: #7a91b8; fontSize: 14px; line-height: 1.6; }

        /* ── CTA ── */
        .cta { padding: 100px 24px; }
        .cta-container {
          max-width: 1000px;
          margin: 0 auto;
          background: linear-gradient(135deg, #4f8ef7, #6366f1);
          padding: 80px 40px;
          border-radius: 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-container::before {
          content: ''; position: absolute; inset: 0; 
          background: radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent);
        }
        .cta-title { font-size: 44px; fontWeight: 800; margin-bottom: 16px; position: relative; }
        .cta-desc { font-size: 20px; opacity: 0.9; margin-bottom: 40px; position: relative; }
        .btn-cta { 
           padding: 20px 48px; background: #fff; color: #4f8ef7; borderRadius: 16px; 
           fontWeight: 800; fontSize: 18px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
           position: relative; transition: transform 0.3s;
        }
        .btn-cta:hover { transform: scale(1.05); }

        /* ── FOOTER ── */
        .footer { padding: 80px 0 40px; border-top: 1px solid rgba(255,255,255,0.05); background: #060b18; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 60px; }
        .footer-brand p { color: #4a5b7a; margin-top: 20px; max-width: 280px; }
        .footer-links h4 { fontSize: 16px; fontWeight: 700; marginBottom: 24px; }
        .footer-links a { display: block; color: #4a5b7a; marginBottom: 12px; transition: color 0.2s; }
        .footer-links a:hover { color: #4f8ef7; }
        .footer-bottom { 
          padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); 
          display: flex; justify-content: space-between; alignItems: center; color: #4a5b7a; fontSize: 13px;
        }
        .social-icons { display: flex; gap: 20px; }

        /* ── MOBILE ── */
        @media (max-width: 992px) {
          .hero-content { grid-template-columns: 1fr; textAlign: center; }
          .hero-text { max-width: 100%; }
          .hero-actions { justifyContent: center; }
          .hero-visual { marginTop: 40px; display: none; }
          .hero-title { font-size: 48px; }
          .features-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
          .footer-brand { grid-column: span 2; }
          .desktop-only { display: none; }
        }

        .mobile-only { display: none; }
        @media (max-width: 768px) { .mobile-only { display: block; } }

        .mobile-menu {
          position: fixed; top: 80px; left: 0; right: 0; background: #0b1225;
          padding: 24px; display: flex; flexDirection: column; gap: 20px;
          z-index: 999; border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        /* ── PRICING STYLES ── */
        .pricing { padding: 120px 0; background: #060b18; position: relative; }
        .pricing-grid { 
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 60px; 
          align-items: stretch;
        }
        .pricing-card {
          background: rgba(15, 24, 48, 0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 32px;
          padding: 48px 32px;
          position: relative;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          display: flex;
          flex-direction: column;
        }
        .pricing-card:hover {
          transform: translateY(-12px);
          background: rgba(15, 24, 48, 0.8);
          border-color: rgba(79, 142, 247, 0.3);
          box-shadow: 0 30px 60px rgba(0,0,0,0.4);
        }
        .pricing-card.featured {
          background: #0f1830;
          border: 1px solid #4f8ef7;
          box-shadow: 0 20px 50px rgba(79, 142, 247, 0.15);
          transform: scale(1.05);
          z-index: 2;
        }
        .pricing-card.featured:hover {
          transform: scale(1.05) translateY(-12px);
        }
        .p-badge {
          position: absolute; top: 20px; right: 20px;
          background: #4f8ef7; color: #fff; padding: 4px 12px;
          border-radius: 99px; font-size: 11px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .p-header { margin-bottom: 32px; }
        .p-name { font-size: 24px; font-weight: 800; margin-bottom: 16px; color: #fff; }
        .p-price { font-size: 36px; font-weight: 900; color: #fff; margin-bottom: 8px; }
        .p-price span { font-size: 14px; font-weight: 500; color: #7a91b8; }
        .p-target { font-size: 14px; color: #7a91b8; line-height: 1.5; }
        
        .p-features { list-style: none; padding: 0; margin: 0 0 40px 0; flex: 1; }
        .p-features li { 
          display: flex; align-items: center; gap: 12px; 
          font-size: 14px; color: #c8d6f5; margin-bottom: 16px; 
        }
        .p-features li.disabled { color: #4a5b7a; opacity: 0.5; }
        
        .btn-p-outline {
          width: 100%; padding: 14px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1); color: #fff;
          font-weight: 700; transition: all 0.2s;
        }
        .btn-p-outline:hover { background: rgba(255,255,255,0.05); border-color: #4f8ef7; }
        
        .btn-p-primary {
          width: 100%; padding: 14px; border-radius: 12px;
          background: #4f8ef7; color: #fff;
          font-weight: 700; transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(79, 142, 247, 0.3);
        }
        .btn-p-primary:hover { background: #3b82f6; transform: scale(1.02); }

        @media (max-width: 992px) {
          .pricing-grid { grid-template-columns: 1fr; max-width: 450px; margin-left: auto; margin-right: auto; }
          .pricing-card.featured { transform: scale(1); }
          .pricing-card.featured:hover { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
