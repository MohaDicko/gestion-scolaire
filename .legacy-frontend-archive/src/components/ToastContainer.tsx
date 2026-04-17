import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type Toast, type ToastType } from '../store/toastStore';

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

const colors: Record<ToastType, { border: string; icon: string; bg: string }> = {
    success: { border: '#10b981', icon: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    error:   { border: '#ef4444', icon: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    warning: { border: '#f59e0b', icon: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    info:    { border: '#6366f1', icon: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
};

function ToastItem({ toast }: { toast: Toast }) {
    const remove = useToastStore((s) => s.remove);
    const c = colors[toast.type];

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                background: 'var(--bg-2)',
                border: `1px solid ${c.border}`,
                borderLeft: `4px solid ${c.border}`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                minWidth: '300px',
                maxWidth: '420px',
                animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1) forwards',
                position: 'relative',
                backgroundColor: c.bg,
                backdropFilter: 'blur(12px)',
            }}
        >
            <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>
                {icons[toast.type]}
            </span>
            <p style={{ flex: 1, fontSize: '13px', color: 'var(--text)', lineHeight: '1.5', fontFamily: 'Inter, sans-serif' }}>
                {toast.message}
            </p>
            <button
                onClick={() => remove(toast.id)}
                style={{
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
            >
                <X size={14} />
            </button>
        </div>
    );
}

export function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts);

    useEffect(() => {
        // Inject keyframe animation once
        const styleId = 'toast-keyframes';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                zIndex: 9999,
            }}
            role="region"
            aria-label="Notifications"
            aria-live="polite"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} />
            ))}
        </div>
    );
}
