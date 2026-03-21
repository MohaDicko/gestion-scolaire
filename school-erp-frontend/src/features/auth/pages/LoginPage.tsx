import { useState } from 'react';
import { useLogin } from '../hooks/useAuth';
import { School, Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const login = useLogin();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            await login.mutateAsync({ email, password });
        } catch {
            setErrorMsg('Email ou mot de passe incorrect.');
        }
    };

    // Demo login helper
    const demoLogin = () => {
        setEmail('admin@school.com');
        setPassword('Admin@1234');
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
                        <p className="login-tagline">Plateforme de gestion scolaire tout-en-un</p>
                    </div>
                    <ul className="login-features">
                        {['Gestion multi-école SaaS', 'Module Scolarité complet', 'RH & Paie intégrés', 'Sécurisé & Multi-rôles'].map(f => (
                            <li key={f}><span className="feature-dot" />{f}</li>
                        ))}
                    </ul>
                </div>

                {/* Right panel */}
                <div className="login-right">
                    <h2 className="login-title">Connexion</h2>
                    <p className="login-subtitle">Accédez à votre espace sécurisé</p>

                    {errorMsg && <div className="login-error">{errorMsg}</div>}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Adresse email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@ecole.com"
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
                            disabled={login.isPending}
                            className="btn-primary btn-full"
                        >
                            {login.isPending ? (
                                <><Loader2 size={18} className="spin" /> Connexion...</>
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    <button onClick={demoLogin} className="btn-demo">
                        🎯 Remplir avec le compte démo
                    </button>

                    <p className="login-footer-note">
                        SchoolERP &copy; 2025 — Tous droits réservés
                    </p>
                </div>
            </div>
        </div>
    );
}
