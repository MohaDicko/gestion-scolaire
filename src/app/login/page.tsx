'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck, GraduationCap, BarChart3, Users } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsPending(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur de connexion');
            localStorage.setItem('auth_token', data.accessToken);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            router.push('/dashboard');
        } catch (error: any) {
            setErrorMsg(error.message || 'Email ou mot de passe incorrect.');
        } finally {
            setIsPending(false);
        }
    };

    const features = [
        { icon: <GraduationCap size={20} />, label: 'Gestion des élèves & classes', desc: 'Suivi complet des effectifs' },
        { icon: <Users size={20} />, label: 'Ressources Humaines', desc: 'Personnel, contrats & paie' },
        { icon: <BarChart3 size={20} />, label: 'Analytiques & Rapports', desc: 'Indicateurs de performance en temps réel' },
        { icon: <ShieldCheck size={20} />, label: 'Multi-établissements sécurisé', desc: 'Isolation complète des données' },
    ];

    return (
        <div className="login-v2-root">
            {/* Animated background */}
            <div className="login-v2-bg">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <div className="orb orb-3" />
                <div className="grid-overlay" />
            </div>

            {/* Left Panel */}
            <div className="login-v2-left">
                <div className="login-v2-left-inner">
                    <div className="login-v2-brand">
                        <div className="login-v2-logo-wrap">
                            <GraduationCap size={28} />
                        </div>
                        <span className="login-v2-brand-name">SchoolERP <span className="login-v2-brand-pro">Pro</span></span>
                    </div>

                    <div className="login-v2-hero">
                        <h1 className="login-v2-hero-title">
                            Gérez votre école<br />
                            <span className="login-v2-hero-highlight">avec intelligence</span>
                        </h1>
                        <p className="login-v2-hero-desc">
                            La plateforme tout-en-un pour les établissements scolaires maliens. Simple, sécurisée, et pensée pour vos besoins.
                        </p>
                    </div>

                    <div className="login-v2-features">
                        {features.map((f, i) => (
                            <div className="login-v2-feature-item" key={i}>
                                <div className="login-v2-feature-icon">{f.icon}</div>
                                <div>
                                    <div className="login-v2-feature-label">{f.label}</div>
                                    <div className="login-v2-feature-desc">{f.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="login-v2-footer-stat">
                        <div className="login-v2-stat">
                            <span className="login-v2-stat-num">6+</span>
                            <span className="login-v2-stat-lbl">Types d'école</span>
                        </div>
                        <div className="login-v2-stat-divider" />
                        <div className="login-v2-stat">
                            <span className="login-v2-stat-num">100%</span>
                            <span className="login-v2-stat-lbl">Cloud Vercel</span>
                        </div>
                        <div className="login-v2-stat-divider" />
                        <div className="login-v2-stat">
                            <span className="login-v2-stat-num">Multi</span>
                            <span className="login-v2-stat-lbl">Tenant isolé</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="login-v2-right">
                <div className="login-v2-form-card">
                    <div className="login-v2-form-header">
                        <div className="login-v2-form-badge">Accès Sécurisé</div>
                        <h2 className="login-v2-form-title">Bienvenue</h2>
                        <p className="login-v2-form-subtitle">Connectez-vous à votre espace de gestion</p>
                    </div>

                    {errorMsg && (
                        <div className="login-v2-error">
                            <ShieldCheck size={14} />
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="login-v2-form">
                        <div className="login-v2-field">
                            <label htmlFor="email" className="login-v2-label">Adresse email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@schoolerp.com"
                                required
                                className="login-v2-input"
                            />
                        </div>

                        <div className="login-v2-field">
                            <label htmlFor="password" className="login-v2-label">Mot de passe</label>
                            <div className="login-v2-input-wrap">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••••"
                                    required
                                    className="login-v2-input"
                                    style={{ paddingRight: '48px' }}
                                />
                                <button
                                    type="button"
                                    className="login-v2-eye-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="login-v2-submit"
                        >
                            {isPending ? (
                                <><Loader2 size={18} className="spin" /> Connexion en cours...</>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </form>

                    <p className="login-v2-footer-text">
                        SchoolERP Pro &copy; {new Date().getFullYear()} &mdash; Version Stable 1.1.0
                    </p>
                </div>
            </div>
        </div>
    );
}
