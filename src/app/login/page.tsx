'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Loader2, ShieldCheck, GraduationCap,
  BarChart3, Users, ArrowRight, Zap, BookOpen, Award
} from 'lucide-react';

const FEATURES = [
  {
    icon: GraduationCap,
    label: 'Académique Complet',
    desc: 'Notes, bulletins, emplois du temps — conforme aux standards maliens',
    color: '#4f8ef7',
  },
  {
    icon: Users,
    label: 'Ressources Humaines',
    desc: 'Congés, présences, paie — tout votre personnel en un clic',
    color: '#10d98e',
  },
  {
    icon: BarChart3,
    label: 'Pilotage Financier',
    desc: 'Scolarités, dépenses, trésorerie — tableaux de bord en temps réel',
    color: '#f5a623',
  },
  {
    icon: ShieldCheck,
    label: 'Sécurisé & Multi-Écoles',
    desc: 'Données isolées par établissement, hébergé sur Vercel + Supabase',
    color: '#a78bfa',
  },
];

export default function LoginPage() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => { 
    setMounted(true); 
    fetch('/api/school/info')
      .then(r => r.json())
      .then(data => {
        if (!data.error && !data.isMain) setSchoolInfo(data);
      })
      .catch(() => {});
  }, []);

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
    <>
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(40px, -30px) scale(1.08); }
          66%  { transform: translate(-25px, 20px) scale(0.95); }
        }
        @keyframes grid-enter {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes card-enter {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes left-enter {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,217,142,0.4); }
          50%      { box-shadow: 0 0 0 8px rgba(16,217,142,0); }
        }
        @keyframes shimmer-line {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }

        .login-root {
          display: flex;
          min-height: 100vh;
          background: #fbfcfd;
          font-family: 'Inter', 'Plus Jakarta Sans', system-ui, sans-serif;
          position: relative;
        }

        /* ── BACKGROUND ──────────────────────────────────── */
        .bg-layer {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          overflow: hidden;
        }
        .orb {
          position: absolute; border-radius: 50%; filter: blur(90px);
        }
        .orb-a {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(124, 58, 237, 0.4), transparent 65%);
          top: -150px; left: -100px;
          animation: orb-float 14s ease-in-out infinite;
        }
        .orb-b {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.3), transparent 65%);
          bottom: -150px; right: -50px;
          animation: orb-float 18s ease-in-out infinite reverse;
        }
        .orb-c {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(79, 70, 229, 0.4), transparent 65%);
          top: 30%; left: 30%;
          animation: orb-float 22s ease-in-out infinite 5s;
        }
        .dot-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 32px 32px;
          animation: grid-enter 1.5s ease both;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }

        /* ── LEFT PANEL ──────────────────────────────────── */
        .left-panel {
          flex: 1.2;
          background: linear-gradient(145deg, #4f46e5 0%, #312e81 100%);
          margin: 16px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 56px;
          position: relative;
          z-index: 1;
          overflow: hidden;
          box-shadow: 0 24px 48px rgba(79, 70, 229, 0.15);
          animation: left-enter 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        .left-inner {
          max-width: 520px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 48px;
          position: relative;
          z-index: 2;
        }

        /* Brand */
        .brand-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .brand-logo {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #ffffff, #f1f5f9);
          display: grid; place-items: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          animation: float-icon 3s ease-in-out infinite;
          flex-shrink: 0;
        }
        .brand-name {
          font-size: 24px;
          font-weight: 900;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: -0.5px;
        }
        .brand-pro {
          background: linear-gradient(135deg, #06b6d4, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Hero */
        .hero-title {
          font-size: clamp(34px, 4.5vw, 52px);
          font-weight: 900;
          line-height: 1.12;
          color: #ffffff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: -1.5px;
          margin-bottom: 18px;
        }
        .hero-highlight {
          background: linear-gradient(120deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-desc {
          font-size: 16px;
          color: rgba(255,255,255,0.8);
          line-height: 1.75;
          max-width: 420px;
        }

        /* Feature cards */
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .feature-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          transition: all 0.25s ease;
          cursor: default;
        }
        .feature-card:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .feature-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: grid; place-items: center;
          flex-shrink: 0;
          font-size: 18px;
        }
        .feature-label {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 3px;
        }
        .feature-desc {
          font-size: 11.5px;
          color: rgba(255,255,255,0.65);
          line-height: 1.45;
        }

        /* Stats row */
        .stats-bar {
          display: flex;
          gap: 28px;
          align-items: center;
          padding: 16px 20px;
          background: rgba(0,0,0,0.15);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          backdrop-filter: blur(12px);
        }
        .stat-item { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .stat-num { font-size: 22px; font-weight: 900; color: #ffffff; font-family: 'Plus Jakarta Sans', sans-serif; }
        .stat-lbl { font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 500; }
        .stat-sep { width: 1px; height: 32px; background: rgba(255,255,255,0.15); }

        /* ── RIGHT PANEL ─────────────────────────────────── */
        .right-panel {
          width: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 40px;
          position: relative;
          z-index: 1;
        }
        .form-card {
          width: 100%;
          background: #ffffff;
          border: 1px solid rgba(9, 9, 11, 0.08);
          border-radius: 28px;
          padding: 48px 44px;
          box-shadow:
            0 24px 64px rgba(9, 9, 11, 0.05),
            0 4px 12px rgba(9, 9, 11, 0.02);
          position: relative;
          overflow: hidden;
          animation: card-enter 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both;
        }
        /* Glowing top border */
        .form-card::before {
          content: '';
          position: absolute;
          top: 0; left: 15%; right: 15%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4f46e5, #7c3aed, transparent);
          opacity: 0.8;
        }

        /* Header */
        .form-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          border-radius: 99px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #10b981;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 20px;
          animation: badge-pulse 2s ease infinite;
        }
        .form-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .form-title {
          font-size: 30px;
          font-weight: 900;
          color: #09090b;
          font-family: 'Plus Jakarta Sans', sans-serif;
          letter-spacing: -0.6px;
          margin-bottom: 6px;
        }
        .form-subtitle {
          font-size: 14px;
          color: #71717a;
          margin-bottom: 32px;
        }

        /* Error */
        .form-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #ef4444;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
          animation: card-enter 0.3s ease both;
        }

        /* Form fields */
        .field-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .field-label {
          font-size: 13px;
          font-weight: 600;
          color: #3f3f46;
          letter-spacing: 0.01em;
        }
        .field-input {
          padding: 14px 16px;
          background: #f4f4f5;
          border: 1px solid rgba(9, 9, 11, 0.08);
          border-radius: 12px;
          color: #09090b;
          font-size: 14.5px;
          font-family: inherit;
          outline: none;
          width: 100%;
          transition: all 0.25s ease;
        }
        .field-input:focus {
          border-color: #4f46e5;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15), 0 0 20px rgba(79, 70, 229, 0.05);
        }
        .field-input::placeholder { color: #a1a1aa; }
        .pwd-wrap { position: relative; }
        .pwd-toggle {
          position: absolute;
          right: 14px; top: 50%;
          transform: translateY(-50%);
          color: #71717a;
          background: none; border: none; cursor: pointer;
          display: grid; place-items: center;
          padding: 4px;
          transition: color 0.15s;
          border-radius: 6px;
        }
        .pwd-toggle:hover { color: #4f46e5; }

        /* Submit */
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 15px 24px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          width: 100%;
          margin-top: 8px;
          font-family: 'Plus Jakarta Sans', inherit;
          transition: all 0.25s ease;
          box-shadow: 0 6px 24px rgba(79, 70, 229, 0.25);
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.5s ease;
        }
        .submit-btn:hover::before { left: 100%; }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(79, 70, 229, 0.35);
          filter: brightness(1.08);
        }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        /* Footer text */
        .form-footer {
          text-align: center;
          font-size: 12px;
          color: #71717a;
          margin-top: 28px;
          line-height: 1.6;
        }

        /* Divider */
        .divider-line {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 20px;
          color: #a1a1aa;
          font-size: 12px;
        }
        .divider-line::before,
        .divider-line::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(9, 9, 11, 0.08);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .login-root { flex-direction: column; }
          .left-panel { padding: 40px 28px 24px; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .right-panel { width: 100%; padding: 20px 24px 48px; }
        }
        @media (max-width: 640px) {
          .left-inner { gap: 28px; }
          .hero-title { font-size: 28px; letter-spacing: -1px; }
          .features-grid { display: none; }
          .stats-bar { display: none; }
          .left-panel { padding: 32px 20px 20px; }
          .form-card { padding: 36px 24px; border-radius: 20px; }
        }
      `}</style>

      <div className="login-root">
        {/* ─── LEFT PANEL ─── */}
        <div className="left-panel">
          <div className="bg-layer">
            <div className="orb orb-a" />
            <div className="orb orb-b" />
            <div className="orb orb-c" />
            <div className="dot-grid" />
          </div>
          <div className="left-inner">

            {/* Brand */}
            <div className="brand-row">
              <div className="brand-logo">
                <GraduationCap size={26} color="#fff" />
              </div>
              <span className="brand-name">
                SchoolERP <span className="brand-pro">Pro</span>
              </span>
            </div>

            {/* Hero */}
            <div>
              <h1 className="hero-title">
                Gérez votre école<br />
                <span className="hero-highlight">avec intelligence</span>
              </h1>
              <p className="hero-desc">
                La plateforme tout-en-un pour les établissements scolaires maliens — académique, RH et finances, dans un seul outil sécurisé.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="features-grid">
              {FEATURES.map((f, i) => (
                <div className="feature-card" key={i} style={{ animationDelay: `${0.1 * i}s` }}>
                  <div className="feature-icon" style={{ background: `${f.color}18`, color: f.color }}>
                    <f.icon size={18} />
                  </div>
                  <div>
                    <div className="feature-label">{f.label}</div>
                    <div className="feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats bar */}
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-num">6+</span>
                <span className="stat-lbl">Types d'écoles</span>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <span className="stat-num">100%</span>
                <span className="stat-lbl">Cloud Mali</span>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <span className="stat-num">Multi</span>
                <span className="stat-lbl">Établissements</span>
              </div>
              <div className="stat-sep" />
              <div className="stat-item">
                <span className="stat-num">SAP</span>
                <span className="stat-lbl">Niveau ERP</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="right-panel">
          <div className="form-card">
            {/* Branding Personnalisé */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              {schoolInfo?.logoUrl ? (
                <Image 
                  src={schoolInfo.logoUrl} 
                  alt={schoolInfo.name} 
                  width={80}
                  height={80}
                  style={{ objectFit: 'contain', marginBottom: '16px', borderRadius: '12px' }} 
                />
              ) : (
                <div className="form-badge">
                  <span className="form-badge-dot" />
                  Accès Sécurisé
                </div>
              )}

              <h2 className="form-title" style={{ fontSize: schoolInfo ? '24px' : '30px' }}>
                {schoolInfo ? `Bienvenue au ${schoolInfo.name}` : 'Bienvenue 👋'}
              </h2>
              <p className="form-subtitle">
                {schoolInfo?.motto || 'Connectez-vous à votre espace de gestion'}
              </p>
              {schoolInfo?.city && (
                <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '-12px', marginBottom: '20px' }}>
                  {schoolInfo.city}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="form-error">
                <ShieldCheck size={15} />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="email" className="field-label">Adresse email</label>
                <input
                  id="email"
                  type="email"
                  className="field-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="directeur@ecole.ml"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field-group">
                <label htmlFor="password" className="field-label">Mot de passe</label>
                <div className="pwd-wrap">
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    className="field-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    className="pwd-toggle"
                    onClick={() => setShowPwd(!showPwd)}
                    tabIndex={-1}
                    aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? (
                  <><Loader2 size={18} className="spin" /> Connexion en cours...</>
                ) : (
                  <>Se connecter <ArrowRight size={17} /></>
                )}
              </button>
            </form>

            <div className="divider-line">Technologie & Sécurité</div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {['Next.js 15', 'Supabase', 'Prisma ORM', 'JWT Auth'].map(tech => (
                <div key={tech} style={{
                  fontSize: 11, color: '#71717a', padding: '4px 10px',
                  borderRadius: 6, border: '1px solid rgba(9, 9, 11, 0.08)',
                  background: '#f4f4f5'
                }}>
                  {tech}
                </div>
              ))}
            </div>

            <p className="form-footer">
              SchoolERP Pro &copy; {new Date().getFullYear()} • Développé par 
              <a href="https://sahelmultiservices.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 800, marginLeft: '5px' }}>
                SAHEL MULTISERVICES
              </a>
              <br />
              <span style={{ color: '#a1a1aa' }}>Version Stable 1.1.0 — Propulsion technologique malienne</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
