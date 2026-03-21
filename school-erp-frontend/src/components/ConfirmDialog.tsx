import { useEffect, useRef } from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';
import { useConfirmStore, type DialogVariant } from '../store/confirmStore';

const META: Record<DialogVariant, { icon: React.ReactNode; color: string; btnClass: string }> = {
    danger: {
        icon: <Trash2 size={22} />,
        color: 'var(--danger)',
        btnClass: 'btn-danger',
    },
    warning: {
        icon: <AlertTriangle size={22} />,
        color: 'var(--warning)',
        btnClass: 'btn-warning',
    },
    info: {
        icon: <Info size={22} />,
        color: 'var(--primary)',
        btnClass: 'btn-primary',
    },
};

export function ConfirmDialog() {
    const { open, options, inputValue, _accept, _cancel, _setInput } = useConfirmStore();
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus automatique sur l'input si mode prompt, sinon sur le bouton confirmer
    useEffect(() => {
        if (open && options?.inputLabel && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open, options?.inputLabel]);

    // Fermer sur Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') _cancel();
            if (e.key === 'Enter' && !options?.inputLabel) _accept();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, _cancel, _accept, options?.inputLabel]);

    if (!open || !options) return null;

    const variant = options.variant ?? 'info';
    const meta = META[variant];
    const isPrompt = options.inputLabel !== undefined;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={_cancel}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 10000,
                    animation: 'fadeIn 0.15s ease',
                }}
            />

            {/* Dialog */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10001,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '28px',
                    width: '440px',
                    maxWidth: '90vw',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                {/* Close button */}
                <button
                    onClick={_cancel}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-dim)',
                        display: 'flex',
                        padding: '4px',
                        borderRadius: '6px',
                        transition: 'color 0.15s',
                    }}
                    aria-label="Fermer"
                >
                    <X size={18} />
                </button>

                {/* Icon + Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: `${meta.color}18`,
                        color: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        {meta.icon}
                    </div>
                    <div style={{ flex: 1, paddingTop: '2px' }}>
                        <h3
                            id="confirm-title"
                            style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}
                        >
                            {options.title}
                        </h3>
                        <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                            {options.message}
                        </p>
                    </div>
                </div>

                {/* Input (mode prompt) */}
                {isPrompt && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                            {options.inputLabel}
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={options.inputPlaceholder}
                            value={inputValue}
                            onChange={(e) => _setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && _accept()}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: `1px solid ${meta.color}66`,
                                background: 'var(--bg-color)',
                                color: 'var(--text)',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                )}

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--border)', margin: '16px -28px', marginTop: isPrompt ? 0 : '16px' }} />

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px' }}>
                    <button
                        className="btn-ghost"
                        onClick={_cancel}
                        style={{ fontFamily: 'inherit', fontSize: '14px' }}
                    >
                        {options.cancelLabel ?? 'Annuler'}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={_accept}
                        disabled={isPrompt && !inputValue.trim()}
                        style={{
                            background: meta.color,
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            opacity: isPrompt && !inputValue.trim() ? 0.5 : 1,
                        }}
                    >
                        {options.confirmLabel ?? 'Confirmer'}
                    </button>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>
        </>
    );
}
