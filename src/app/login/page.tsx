'use client';

import { useState } from 'react';
import { School, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

            if (!res.ok) {
              throw new Error(data.error || 'Erreur de connexion');
            }

            // Persist locally if needed (like the store did)
            localStorage.setItem('auth_token', data.accessToken);
            localStorage.setItem('auth_user', JSON.stringify(data.user));

            router.push('/dashboard');
        } catch (error: any) {
            setErrorMsg(error.message || 'Email ou mot de passe incorrect.');
        } finally {
            setIsPending(false);
        }
    };


    return (
        <div className="login-root">
            <div className="login-bg-shapes">
                <div className="shape shape-1" />
                <div className="shape shape-2" />
                <div className="shape shape-3" />
            </div>

            <div className="login-card">
                {/* Left panel */}
                <div className="login-left">
                    <div className="login-brand">
                        <div className="login-logo"><School size={32} /></div>
                        <h1 className="login-brand-name">SchoolERP</h1>
                        <p className="login-tagline">Plateforme de gestion scolaire 100% Vercel</p>
                    </div>
                    <ul className="login-features">
                        {['Architecture Next.js intégrée', 'Base de données Supabase', 'Déploiement ultra rapide', 'Sécurité Zero-Config'].map(f => (
                            <li key={f}><span className="feature-dot" />{f}</li>
                        ))}
                    </ul>
                </div>

                {/* Right panel */}
                <div className="login-right">
                    <h2 className="login-title">Connexion</h2>
                    <p className="login-subtitle">Accédez à votre espace Next.js</p>

                    {errorMsg && <div className="login-error">{errorMsg}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Adresse email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@schoolerp.com"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Mot de passe</label>
                            <div className="input-with-icon">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    className="input-icon-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="btn-primary btn-full"
                        >
                            {isPending ? (
                                <><Loader2 size={18} className="spin" /> Connexion...</>
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    <p className="login-footer-note" style={{ marginTop: '20px' }}>
                        SchoolERP &copy; 2026 — Version Professionnelle
                    </p>
                </div>
            </div>
        </div>
    );
}
