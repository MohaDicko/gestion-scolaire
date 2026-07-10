'use client';

import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { Button } from './button';
import { HelpCircle } from 'lucide-react';

export function TourGuide() {
  
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      doneBtnText: 'Terminer',
      nextBtnText: 'Suivant ➔',
      prevBtnText: '⬅ Précédent',
      progressText: 'Étape {{current}} sur {{total}}',
      popoverClass: 'driverjs-theme',
      steps: [
        {
          popover: {
            title: '👋 Bienvenue sur SchoolERP Pro',
            description: 'Cette visite guidée va vous montrer comment maîtriser votre nouvel outil en 2 minutes chrono. Prêt ?'
          }
        },
        {
          element: '#tour-sidebar',
          popover: {
            title: '🗺️ Le Menu Principal',
            description: 'C\'est le centre de contrôle de votre école. Vous y trouverez tous les modules (Scolarité, Finances, RH).',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#tour-search',
          popover: {
            title: '🚀 La Magie (Recherche Rapide)',
            description: 'Appuyez sur "Ctrl + K" n\'importe quand pour ouvrir la recherche rapide. Tapez "Facture" ou "Élève" et gagnez un temps fou !',
            side: 'bottom',
            align: 'center'
          }
        },
        {
          element: '#tour-notifications',
          popover: {
            title: '🔔 Vos Alertes',
            description: 'Les paiements en retard ou les alertes de présence s\'afficheront ici. Gardez toujours un œil dessus.',
            side: 'bottom',
            align: 'end'
          }
        },
        {
          element: '#tour-profile',
          popover: {
            title: '👤 Votre Compte',
            description: 'Cliquez ici pour changer votre mot de passe, ou pour vous déconnecter en fin de journée.',
            side: 'bottom',
            align: 'end'
          }
        },
        {
          popover: {
            title: '🎉 Vous êtes prêt !',
            description: 'Vous maîtrisez maintenant l\'essentiel. Vous pouvez relancer ce tutoriel à tout moment en cliquant sur le bouton (?) en bas de l\'écran.'
          }
        }
      ]
    });

    driverObj.drive();
  };

  useEffect(() => {
    // Lancer automatiquement au premier chargement (si pas déjà fait)
    const hasSeenTour = localStorage.getItem('has_seen_tour');
    if (!hasSeenTour) {
      // Petite pause pour laisser l'interface se charger
      setTimeout(() => {
        startTour();
        localStorage.setItem('has_seen_tour', 'true');
      }, 1500);
    }
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .driverjs-theme {
          border-radius: 16px !important;
          padding: 20px !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid var(--border) !important;
          background: var(--bg-3) !important;
          color: var(--text) !important;
        }
        .driver-popover-title {
          font-size: 18px !important;
          font-weight: 800 !important;
          margin-bottom: 8px !important;
          color: var(--text) !important;
        }
        .driver-popover-description {
          font-size: 14px !important;
          color: var(--text-muted) !important;
          line-height: 1.5 !important;
        }
        .driver-popover-footer {
          margin-top: 16px !important;
        }
        .driver-popover-progress-text {
          color: var(--text-dim) !important;
          font-size: 12px !important;
        }
        .driver-popover-next-btn, .driver-popover-prev-btn {
          background-color: var(--bg-2) !important;
          color: var(--text) !important;
          border-radius: 8px !important;
          border: 1px solid var(--border) !important;
          padding: 6px 12px !important;
          font-weight: 600 !important;
          text-shadow: none !important;
        }
        .driver-popover-next-btn:hover, .driver-popover-prev-btn:hover {
          background-color: var(--primary) !important;
          color: white !important;
          border-color: var(--primary) !important;
        }
      `}} />
      
      {/* Bouton d'aide flottant pour relancer le tutoriel */}
      <Button
        onClick={startTour}
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-bg-3/80 backdrop-blur-md border border-border hover:scale-110 hover:bg-primary hover:text-white transition-all z-40"
        title="Lancer la visite guidée"
      >
        <HelpCircle size={24} />
      </Button>
    </>
  );
}
