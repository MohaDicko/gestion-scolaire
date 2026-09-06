/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, BackgroundSyncPlugin, NetworkOnly } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that points to the precache manifest.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Configuration du Background Sync pour les données saisies hors-ligne
const bgSyncPlugin = new BackgroundSyncPlugin('schoolerp-offline-queue', {
  maxRetentionTime: 24 * 60, // 24 heures pour réessayer
});

const customCaching: RuntimeCaching[] = [
  // Intercepter les appels POST vers l'API quand on est hors-ligne
  {
    matcher: ({ request, url }) => request.method === 'POST' && url.pathname.startsWith('/api/'),
    handler: new NetworkOnly({
      plugins: [bgSyncPlugin],
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCaching,
});

serwist.addEventListeners();
