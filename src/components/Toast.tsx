'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: {
    success: (msg: string) => void;
    error:   (msg: string) => void;
    warning: (msg: string) => void;
    info:    (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error:   (msg: string) => addToast(msg, 'error'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info:    (msg: string) => addToast(msg, 'info'),
  };

  const icons: Record<ToastType, string> = {
    success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'
  };
  const colors: Record<ToastType, string> = {
    success: 'var(--success)',
    error:   'var(--danger)',
    warning: 'var(--warning)',
    info:    'var(--info)',
  };
  const bgs: Record<ToastType, string> = {
    success: 'var(--success-dim)',
    error:   'var(--danger-dim)',
    warning: 'var(--warning-dim)',
    info:    'var(--info-dim)',
  };

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 9999, maxWidth: '380px'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: bgs[t.type],
            border: `1px solid ${colors[t.type]}`,
            borderRadius: '12px',
            padding: '14px 18px',
            color: colors[t.type],
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13.5px', fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            animation: 'fadeUp 0.3s var(--ease) both',
            backdropFilter: 'blur(10px)',
          }}>
            <span style={{ fontSize: '16px' }}>{icons[t.type]}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ color: 'inherit', opacity: 0.6, padding: '0 4px', fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.toast;
}
