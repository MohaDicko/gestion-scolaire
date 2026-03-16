import { useState } from 'react';
import { Bell, Send, Users } from 'lucide-react';
import { useSendNotification } from '../../../hooks/useNotifications';

const NOTIFICATION_TYPES = [
    { id: 5, label: '📢 Annonce générale' },
    { id: 1, label: '💰 Facture en retard' },
    { id: 2, label: '📝 Notes publiées' },
    { id: 3, label: '🚨 Alerte absence' },
    { id: 4, label: '✅ Paiement reçu' },
    { id: 6, label: '⚠️ Contrat expirant' },
];

export function SendNotificationPage() {
    const send = useSendNotification();
    const [form, setForm] = useState({ title: '', body: '', typeId: 5, linkUrl: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await send.mutateAsync({ title: form.title, body: form.body, typeId: form.typeId, linkUrl: form.linkUrl || undefined });
            setSent(true);
            setForm({ title: '', body: '', typeId: 5, linkUrl: '' });
            setTimeout(() => setSent(false), 3000);
        } catch (err: any) {
            alert('Erreur : ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="page" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Envoyer une Notification</h1>
                    <p className="page-subtitle">Diffusez des alertes ou annonces à tous les utilisateurs</p>
                </div>
            </div>

            {sent && (
                <div style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '10px', padding: '12px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={18} /> Notification envoyée avec succès !
                </div>
            )}

            <div className="card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Type de notification *</label>
                        <select value={form.typeId} onChange={e => setForm({ ...form, typeId: Number(e.target.value) })}>
                            {NOTIFICATION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Titre *</label>
                        <input required placeholder="Ex: Réunion parents-professeurs le 15 mars..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Corps du message *</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Entrez le détail de votre notification..."
                            value={form.body}
                            onChange={e => setForm({ ...form, body: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Lien (optionnel)</label>
                        <input placeholder="Ex: /finance/invoices" value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} />
                        <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Si renseigné, un clic sur la notification redirigera vers cette page.</small>
                    </div>

                    <div style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Users size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary)' }}>Diffusion globale</p>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                                Cette notification sera envoyée à <strong>tous les utilisateurs connectés</strong> de l'établissement.
                            </p>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={send.isPending} style={{ width: '100%', justifyContent: 'center', gap: '8px' }}>
                        <Send size={16} /> {send.isPending ? 'Envoi en cours...' : 'Envoyer la notification'}
                    </button>
                </form>
            </div>
        </div>
    );
}
