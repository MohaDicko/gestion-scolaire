'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallPromptProps {
  variant?: 'sidebar' | 'pill' | 'banner';
  className?: string;
}

export default function PWAInstallPrompt({ variant = 'sidebar', className = '' }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Vérifier si l'application est déjà exécutée en mode standalone
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isStandaloneMode);

      // 2. Détection iOS (Safari ne supporte pas beforeinstallprompt nativement)
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isAppleMobile);

      // 3. Écouter l'événement standard d'installation PWA (Chrome, Edge, Android)
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  // Ne rien afficher si l'app est déjà installée en plein écran
  if (isStandalone || isInstalled) {
    return null;
  }

  // Ne rien afficher si l'appareil n'est ni iOS ni n'a déclenché le prompt
  if (!deferredPrompt && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
    }
  };

  /* ── VARIANT PILL (Idéal pour la page de Login) ── */
  if (variant === 'pill') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer shadow-xs ${className}`}
          title="Installer l'application sur cet appareil"
        >
          <Smartphone size={14} className="shrink-0" />
          <span>Installer l'application</span>
        </button>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  /* ── VARIANT SIDEBAR (Idéal pour la barre latérale de l'ERP) ── */
  if (variant === 'sidebar') {
    return (
      <>
        <div className={`p-2.5 mx-2 my-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/40 border border-blue-200/60 dark:border-blue-900/40 ${className}`}>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Download size={16} strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                Application CFP-PAS
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Accès direct & mode hors-ligne
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="mt-2 w-full py-1.5 px-2 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Smartphone size={13} />
                <span>Installer sur l'appareil</span>
              </button>
            </div>
          </div>
        </div>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  /* ── VARIANT BANNER (Pour mobile en bas d'écran) ── */
  return (
    <>
      <div className={`fixed bottom-4 left-4 right-4 z-40 p-3 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Smartphone size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">Installer SchoolERP Pro</div>
            <div className="text-[10px] text-slate-400 truncate">Rapide, fluide et disponible hors-ligne</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-xs"
          >
            Installer
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
}

/* ── MODAL D'INSTRUCTIONS IPHONE / IPAD ── */
function IOSInstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Smartphone size={16} />
            </div>
            <span className="text-xs font-bold">Installer sur iPhone / iPad</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              1
            </div>
            <div>
              Dans Safari, appuyez sur le bouton <strong>Partager</strong> <Share size={12} className="inline mx-1 text-blue-500" /> en bas de votre écran.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              2
            </div>
            <div>
              Faites défiler le menu et sélectionnez <strong>« Sur l'écran d'accueil »</strong> <PlusSquare size={12} className="inline mx-1 text-slate-600 dark:text-slate-200" />.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              3
            </div>
            <div>
              Appuyez sur <strong>Ajouter</strong> en haut à droite. L'icône du CFP-PAS apparaîtra sur votre écran d'accueil !
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
}

