import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, AlertCircle, DollarSign, GraduationCap, UserCheck, Info, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkRead, NotificationDto } from '../hooks/useNotifications';

const TYPE_CONFIG: Record<number, { icon: any; color: string; bg: string }> = {
    1: { icon: DollarSign, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },  // InvoiceOverdue
    2: { icon: GraduationCap, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },  // GradePublished
    3: { icon: UserCheck, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },   // AbsenceAlert
    4: { icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },  // PaymentReceived
    5: { icon: Info, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },  // GeneralAnnouncement
    6: { icon: AlertCircle, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },  // ContractExpiring
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
}

export function NotificationBell() {
    const { data: notifications = [] } = useNotifications();
    const markRead = useMarkRead();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const unread = notifications.filter(n => !n.isRead);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleClick = async (n: NotificationDto) => {
        if (!n.isRead) await markRead.mutateAsync(n.id);
        if (n.linkUrl) { navigate(n.linkUrl); setOpen(false); }
    };

    const handleMarkAllRead = async () => {
        for (const n of unread) {
            await markRead.mutateAsync(n.id);
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                }}
                title="Notifications"
            >
                <Bell size={20} />
                {unread.length > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'var(--danger)',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 700,
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                    }}>
                        {unread.length > 9 ? '9+' : unread.length}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '360px',
                    background: 'var(--surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    animation: 'fadeInDown 0.15s ease'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                            🔔 Notifications {unread.length > 0 && <span style={{ fontSize: '12px', background: 'var(--danger)', color: 'white', borderRadius: '20px', padding: '1px 8px', marginLeft: '6px' }}>{unread.length}</span>}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {unread.length > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    title="Tout marquer comme lu"
                                >
                                    <CheckCheck size={14} /> Tout lire
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notification list */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Bell size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '13px' }}>Aucune notification</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG[5];
                                const IconComp = cfg.icon;
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => handleClick(n)}
                                        style={{
                                            display: 'flex',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            cursor: n.linkUrl ? 'pointer' : 'default',
                                            borderBottom: '1px solid var(--border)',
                                            background: n.isRead ? 'transparent' : 'var(--primary-dim)',
                                            transition: 'background 0.15s',
                                            alignItems: 'flex-start'
                                        }}
                                    >
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: cfg.bg, color: cfg.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <IconComp size={16} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                <p style={{ margin: 0, fontSize: '13px', fontWeight: n.isRead ? 400 : 700, lineHeight: 1.4 }}>{n.title}</p>
                                                {!n.isRead && (
                                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '4px' }} />
                                                )}
                                            </div>
                                            <p style={{ margin: '2px 0 4px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.body}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px' }}>
                                                <Clock size={11} /> {timeAgo(n.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
