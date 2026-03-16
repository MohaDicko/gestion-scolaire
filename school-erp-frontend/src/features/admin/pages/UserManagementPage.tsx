import { useState } from 'react';
import { Shield, Search, Plus, CheckCircle, XCircle, Mail, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../lib/apiClient';

interface AppUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastLogin: string;
}

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
    SuperAdmin: { label: 'Super Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    SchoolAdmin: { label: 'Directeur', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    Teacher: { label: 'Professeur', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    HR_Manager: { label: 'RH', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    Accountant: { label: 'Comptable', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    Student: { label: 'Élève', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

// Demo credentials hint
const DEMO_PASSWORDS: Record<string, string> = {
    'super@schoolerp.com': 'Super@1234',
};
const DEFAULT_PASS = 'Admin@1234';

export function UserManagementPage() {
    const [search, setSearch] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', role: 'Teacher' });

    const { data: users = [], isLoading } = useQuery<AppUser[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await apiClient.get('/auth/users');
            return data;
        }
    });

    const filtered = users.filter(u =>
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    );

    const roleCount = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Shield size={28} className="text-primary" /> Gestion des Utilisateurs
                    </h1>
                    <p className="page-subtitle">{users.length} comptes enregistrés · {users.filter(u => u.isActive).length} actifs</p>
                </div>
                <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
                    <Plus size={18} /> Inviter un Utilisateur
                </button>
            </div>

            {/* Role distribution */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {Object.entries(roleCount).map(([role, count]) => {
                    const meta = ROLE_META[role] || { label: role, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
                    return (
                        <span key={role} style={{ padding: '5px 14px', borderRadius: '20px', background: meta.bg, color: meta.color, fontSize: '12px', fontWeight: 700 }}>
                            {meta.label} ({count})
                        </span>
                    );
                })}
            </div>

            {/* Users table */}
            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="search-box" style={{ flex: 1, maxWidth: '320px' }}>
                        <Search size={16} />
                        <input
                            placeholder="Rechercher un utilisateur..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Dernière Connexion</th>
                                <th>Mot de passe (démo)</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(user => {
                                const meta = ROLE_META[user.role] || { label: user.role, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
                                const password = DEMO_PASSWORDS[user.email] || DEFAULT_PASS;
                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{user.firstName} {user.lastName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                <Mail size={13} /> {user.email}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: meta.bg, color: meta.color }}>
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: user.isActive ? '#10b981' : '#ef4444' }}>
                                                {user.isActive
                                                    ? <><CheckCircle size={14} /> Actif</>
                                                    : <><XCircle size={14} /> Inactif</>}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                <Clock size={12} />
                                                {new Date(user.lastLogin).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: '11px', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>{password}</code>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn-ghost" style={{ fontSize: '12px' }}>Modifier</button>
                                            <button className="btn-ghost" style={{ fontSize: '12px', color: 'var(--danger)' }}>
                                                {user.isActive ? 'Désactiver' : 'Activer'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>✉️ Inviter un Utilisateur</h2>
                            <button className="btn-ghost" onClick={() => setShowInviteModal(false)}><XCircle size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Prénom *</label>
                                    <input value={inviteForm.firstName} onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })} placeholder="Jean" />
                                </div>
                                <div className="form-group">
                                    <label>Nom *</label>
                                    <input value={inviteForm.lastName} onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })} placeholder="Dupont" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="jean.dupont@ecole.ci" />
                            </div>
                            <div className="form-group">
                                <label>Rôle *</label>
                                <select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}>
                                    <option value="Teacher">👨‍🏫 Professeur</option>
                                    <option value="HR_Manager">👥 Responsable RH</option>
                                    <option value="Accountant">💰 Comptable</option>
                                    <option value="SchoolAdmin">🎓 Directeur</option>
                                    <option value="Student">📚 Élève</option>
                                </select>
                            </div>
                            <div style={{ padding: '12px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <strong>Note :</strong> En production, un email d'invitation serait envoyé automatiquement à l'adresse indiquée avec un lien pour créer son mot de passe.
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-ghost" onClick={() => setShowInviteModal(false)}>Annuler</button>
                            <button className="btn-primary" onClick={() => { alert(`✅ Invitation envoyée à ${inviteForm.email} (démo)`); setShowInviteModal(false); }}>
                                <Mail size={16} /> Envoyer l'Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
