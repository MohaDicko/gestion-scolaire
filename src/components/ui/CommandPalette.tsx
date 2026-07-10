'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, Users, FileText, Settings, LayoutDashboard, CreditCard, X, GraduationCap as StudentIcon, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Définition des raccourcis globaux
const PAGES = [
  { id: 'dashboard', title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, category: 'Général' },
  { id: 'students', title: 'Liste des élèves', href: '/students', icon: StudentIcon, category: 'Scolarité' },
  { id: 'attendance', title: 'Faire l\'appel (Présences)', href: '/attendance', icon: Users, category: 'Scolarité' },
  { id: 'id-cards', title: 'Générer les Cartes Scolaires (Badges)', href: '/admin/id-cards', icon: FileText, category: 'Scolarité' },
  { id: 'certificates', title: 'Générer un Certificat de Scolarité', href: '/admin/certificates', icon: GraduationCap, category: 'Scolarité' },
  { id: 'employees', title: 'Liste du Personnel (RH)', href: '/employees', icon: Briefcase, category: 'Ressources Humaines' },
  { id: 'finance', title: 'Finances & Factures', href: '/finance', icon: CreditCard, category: 'Finances' },
  { id: 'settings', title: 'Paramètres du système', href: '/settings', icon: Settings, category: 'Général' },
];

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique de l'input quand on ouvre la palette
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Fermer avec Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtrer les pages
  const filteredPages = PAGES.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const navigateTo = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay avec effet blur (Glassmorphism) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modale */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Que cherchez-vous ? (Ex: Cartes, Factures...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-16 bg-transparent border-none focus:ring-0 text-lg px-4 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
              />
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg bg-slate-100 dark:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Liste des résultats */}
            <div className="max-h-[350px] overflow-y-auto p-2">
              {filteredPages.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {/* Regroupement par catégorie (facultatif, ici on affiche direct) */}
                  {filteredPages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => navigateTo(page.href)}
                      className="flex items-center gap-4 w-full p-3 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <page.icon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{page.title}</span>
                        <span className="text-xs text-slate-400">{page.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Aucun résultat trouvé pour "{search}"</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-center items-center gap-2 text-xs text-slate-400">
              <span>Utilisez</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] shadow-sm">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] shadow-sm">↓</kbd>
              <span>pour naviguer,</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px] shadow-sm">Enter</kbd>
              <span>pour valider.</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
