import { useState } from 'react';
import {
    Settings, School, Save, User, Bell,
    Shield, Database, CheckCircle, Palette
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

const SECTIONS = [
    { id: 'school', label: 'Établissement', icon: School },
    { id: 'profile', label: 'Mon Profil', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'system', label: 'Système', icon: Database },
];

export function SettingsPage() {
    const { user } = useAuthStore();
    const isAdmin = ['SuperAdmin', 'SchoolAdmin'].includes(user?.role ?? '');

    const [activeSection, setActiveSection] = useState('school');
    const [saved, setSaved] = useState(false);

    const [schoolSettings, setSchoolSettings] = useState({
        name: user?.schoolName || 'Mon École',
        motto: user?.schoolMotto || 'Excellence, Discipline, Réussite',
        address: user?.schoolAddress || 'Abidjan, Côte d\'Ivoire',
        phone: '+225 00 00 00 00',
        email: 'contact@ecole.ci',
        website: 'www.ecole.ci',
        principalName: 'M. Directeur',
        currency: 'XAF',
        language: 'fr',
        logoUrl: user?.schoolLogo || null as string | null,
    });

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSchoolSettings({ ...schoolSettings, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const [profileSettings, setProfileSettings] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: '',
    });

    const [notifSettings, setNotifSettings] = useState({
        absences: true,
        invoices: true,
        grades: true,
        general: true,
    });

    const [securitySettings, setSecuritySettings] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const renderSchoolSection = () => (
        <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700 }}>⚙️ Informations de l'Établissement</h2>
            
            {/* Logo Upload */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'var(--bg-2)', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--bg-3)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {schoolSettings.logoUrl ? (
                        <img src={schoolSettings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <School size={30} style={{ opacity: 0.3 }} />
                    )}
                </div>
                <div>
                    <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '14px' }}>Logo de l'école</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <label className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px', cursor: 'pointer' }}>
                            Choisir un fichier
                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                        </label>
                        {schoolSettings.logoUrl && (
                            <button className="btn-ghost" onClick={() => setSchoolSettings({ ...schoolSettings, logoUrl: null })} style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--danger)' }}>
                                Supprimer
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                    <label>Nom de l'établissement</label>
                    <input value={schoolSettings.name} onChange={e => setSchoolSettings({ ...schoolSettings, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Devise / Slogan</label>
                    <input value={schoolSettings.motto} onChange={e => setSchoolSettings({ ...schoolSettings, motto: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Adresse complète</label>
                    <input value={schoolSettings.address} onChange={e => setSchoolSettings({ ...schoolSettings, address: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Téléphone</label>
                    <input type="tel" value={schoolSettings.phone} onChange={e => setSchoolSettings({ ...schoolSettings, phone: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Email officiel</label>
                    <input type="email" value={schoolSettings.email} onChange={e => setSchoolSettings({ ...schoolSettings, email: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Site web</label>
                    <input value={schoolSettings.website} onChange={e => setSchoolSettings({ ...schoolSettings, website: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Nom du Directeur</label>
                    <input value={schoolSettings.principalName} onChange={e => setSchoolSettings({ ...schoolSettings, principalName: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Devise</label>
                    <select value={schoolSettings.currency} onChange={e => setSchoolSettings({ ...schoolSettings, currency: e.target.value })}>
                        <option value="XAF">XAF — Franc CFA (BEAC)</option>
                        <option value="XOF">XOF — Franc CFA (BCEAO)</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="USD">USD — Dollar américain</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Langue de l'interface</label>
                    <select value={schoolSettings.language} onChange={e => setSchoolSettings({ ...schoolSettings, language: e.target.value })}>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇬🇧 English</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderProfileSection = () => (
        <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700 }}>👤 Mon Profil</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', padding: '20px', background: 'var(--bg-color)', borderRadius: '12px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: 'white' }}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '18px' }}>{user?.firstName} {user?.lastName}</p>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>{user?.role} · {user?.schoolName}</p>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                    <label>Prénom</label>
                    <input value={profileSettings.firstName} onChange={e => setProfileSettings({ ...profileSettings, firstName: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Nom de famille</label>
                    <input value={profileSettings.lastName} onChange={e => setProfileSettings({ ...profileSettings, lastName: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={profileSettings.email} onChange={e => setProfileSettings({ ...profileSettings, email: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>Téléphone</label>
                    <input type="tel" value={profileSettings.phone} placeholder="+225 00 00 00 00" onChange={e => setProfileSettings({ ...profileSettings, phone: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Rôle</label>
                    <input value={user?.role || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                </div>
            </div>
        </div>
    );

    const renderNotificationsSection = () => (
        <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700 }}>🔔 Préférences de Notifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                    { key: 'absences', label: 'Alertes Absences', desc: 'Être notifié en cas d\'absence répétée d\'un élève' },
                    { key: 'invoices', label: 'Factures et Paiements', desc: 'Rappels pour les factures impayées et paiements reçus' },
                    { key: 'grades', label: 'Publication des Notes', desc: 'Être informé quand de nouvelles notes sont publiées' },
                    { key: 'general', label: 'Annonces Générales', desc: 'Recevoir les annonces et communications importantes' },
                ].map(item => (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{item.label}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                            <input
                                type="checkbox"
                                checked={(notifSettings as any)[item.key]}
                                onChange={e => setNotifSettings({ ...notifSettings, [item.key]: e.target.checked })}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                background: (notifSettings as any)[item.key] ? 'var(--primary)' : 'var(--border)',
                                borderRadius: '34px', transition: '0.3s',
                            }}>
                                <span style={{
                                    position: 'absolute', content: '', height: '18px', width: '18px',
                                    left: (notifSettings as any)[item.key] ? '23px' : '3px', bottom: '3px',
                                    background: 'white', borderRadius: '50%', transition: '0.3s'
                                }} />
                            </span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAppearanceSection = () => (
        <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700 }}>🎨 Apparence</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 12px', fontWeight: 600 }}>Thème de l'interface</p>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-muted)' }}>Utilisez le bouton 🌙/☀️ en bas de la barre latérale pour basculer entre les modes clair et sombre.</p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ flex: 1, padding: '16px', background: '#1a1a2e', borderRadius: '8px', border: '2px solid var(--primary)', textAlign: 'center' }}>
                            <p style={{ margin: 0, color: 'white', fontSize: '13px', fontWeight: 600 }}>🌙 Mode Sombre</p>
                            <p style={{ margin: '4px 0 0', color: '#8b8b9e', fontSize: '11px' }}>Recommandé</p>
                        </div>
                        <div style={{ flex: 1, padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '2px solid var(--border)', textAlign: 'center' }}>
                            <p style={{ margin: 0, color: '#1e293b', fontSize: '13px', fontWeight: 600 }}>☀️ Mode Clair</p>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '11px' }}>Bureau</p>
                        </div>
                    </div>
                </div>
                <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 600 }}>Couleur principale</p>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-muted)' }}>Couleur par défaut : Violet SchoolERP</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['#7c3aed', '#2563eb', '#059669', '#dc2626', '#d97706', '#0891b2'].map(color => (
                            <div key={color} style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, border: color === '#7c3aed' ? '3px solid white' : 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSecuritySection = () => (
        <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700 }}>🔐 Sécurité</h2>
            <div className="form-group">
                <label>Mot de passe actuel</label>
                <input type="password" value={securitySettings.currentPassword} onChange={e => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="form-group">
                <label>Nouveau mot de passe</label>
                <input type="password" value={securitySettings.newPassword} onChange={e => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })} placeholder="Minimum 8 caractères" />
            </div>
            <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input type="password" value={securitySettings.confirmPassword} onChange={e => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })} placeholder="Répétez le nouveau mot de passe" />
            </div>
            <div style={{ padding: '16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '10px', fontSize: '13px', color: 'var(--text)' }}>
                <strong>Bonnes pratiques :</strong> Utilisez au moins 8 caractères, incluez des chiffres, des majuscules et des symboles.
            </div>
        </div>
    );

    const renderSystemSection = () => (
        <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '18px', fontWeight: 700 }}>🗄️ Système & Données</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                    { label: 'Version de l\'application', value: 'SchoolERP v2.0.0', icon: '📦' },
                    { label: 'Environnement', value: 'Production', icon: '🌐' },
                    { label: 'Base de données', value: 'SQLite (Local)', icon: '🗄️' },
                    { label: 'Backend API', value: '.NET 8 + MediatR + EF Core', icon: '⚙️' },
                    { label: 'Frontend', value: 'React 18 + TypeScript + Vite', icon: '⚛️' },
                    { label: 'Dernière mise à jour', value: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }), icon: '🕐' },
                ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '13px' }}>{item.icon} {item.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>{item.value}</span>
                    </div>
                ))}
            </div>

            {isAdmin && (
                <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--danger)' }}>⚠️ Zone Dangereuse</h3>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-muted)' }}>Ces actions sont irréversibles. Procédez avec prudence.</p>
                    <button className="btn-ghost" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                        🗑️ Réinitialiser toutes les données de démonstration
                    </button>
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'school': return renderSchoolSection();
            case 'profile': return renderProfileSection();
            case 'notifications': return renderNotificationsSection();
            case 'appearance': return renderAppearanceSection();
            case 'security': return renderSecuritySection();
            case 'system': return renderSystemSection();
            default: return null;
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Settings size={28} className="text-primary" /> Paramètres
                    </h1>
                    <p className="page-subtitle">Configurez l'établissement et vos préférences</p>
                </div>
                {saved && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600 }}>
                        <CheckCircle size={18} /> Enregistré !
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
                {/* Sidebar nav */}
                <div className="card" style={{ padding: '12px', alignSelf: 'flex-start' }}>
                    {SECTIONS.filter(s => s.id !== 'school' || isAdmin).map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: 500,
                                background: activeSection === s.id ? 'var(--primary-dim)' : 'transparent',
                                color: activeSection === s.id ? 'var(--primary)' : 'var(--text)',
                                transition: 'background 0.15s'
                            }}
                        >
                            <s.icon size={16} />
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="card">
                    {renderContent()}
                    {activeSection !== 'appearance' && activeSection !== 'system' && (
                        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                            <button className="btn-ghost">Annuler</button>
                            <button className="btn-primary" onClick={handleSave}>
                                <Save size={16} /> Enregistrer les modifications
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
