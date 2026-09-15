// @vitest-environment node
/**
 * ================================================================
 * TESTS UNITAIRES — Module d'Authentification (auth.ts)
 * Couvre : encrypt, decrypt, getSessionFromBearer, getSessionUniversal
 * ================================================================
 *
 * NOTE : JWT_SECRET est injecté dans vitest.setup.ts (avant tout import)
 * ce qui permet d'importer auth.ts directement ici sans erreur.
 */
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, getSessionFromBearer, getSessionUniversal } from './auth';

// ─────────────────────────────────────────────────────────────────────────────
// encrypt
// ─────────────────────────────────────────────────────────────────────────────
describe('encrypt — Génération de token JWT', () => {
  it('Retourne une chaîne non vide', async () => {
    const token = await encrypt({ id: 'u1', email: 'test@test.com', role: 'ADMIN', tenantId: 't1' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });

  it('Le token JWT contient 3 parties séparées par des points', async () => {
    const token = await encrypt({ id: 'u1', email: 'a@b.com', role: 'TEACHER', tenantId: 't1' });
    expect(token.split('.')).toHaveLength(3);
  });

  it('Deux appels successifs produisent des tokens différents (iat varie)', async () => {
    const payload = { id: 'u1', email: 'a@b.com', role: 'ADMIN', tenantId: 't1' };
    const t1 = await encrypt(payload);
    await new Promise(r => setTimeout(r, 1000));
    const t2 = await encrypt(payload);
    expect(t1).not.toBe(t2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// decrypt
// ─────────────────────────────────────────────────────────────────────────────
describe('decrypt — Décodage de token JWT', () => {
  it('Décode correctement un token valide et retourne le payload complet', async () => {
    const payload = { id: 'user-42', email: 'admin@cfppas-gao.ml', role: 'SCHOOL_ADMIN', tenantId: 'tenant-cfppas' };
    const token = await encrypt(payload);
    const result = await decrypt(token);
    expect(result).not.toBeNull();
    expect(result.id).toBe(payload.id);
    expect(result.email).toBe(payload.email);
    expect(result.role).toBe(payload.role);
    expect(result.tenantId).toBe(payload.tenantId);
  });

  it('Retourne null pour un token invalide (chaîne aléatoire)', async () => {
    expect(await decrypt('token.invalide.bidonnage')).toBeNull();
  });

  it('Retourne null pour une chaîne vide', async () => {
    expect(await decrypt('')).toBeNull();
  });

  it('Retourne null pour un token expiré', async () => {
    const token = await encrypt({ id: 'u1', role: 'ADMIN' }, '1s');
    await new Promise(r => setTimeout(r, 1500));
    expect(await decrypt(token)).toBeNull();
  }, 10_000);

  it('Retourne null pour un JWT bien formé mais avec une signature incorrecte', async () => {
    // Header.Payload valides mais signature falsifiée
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2UifQ.mauvaise_signature_ici';
    expect(await decrypt(fakeToken)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSessionFromBearer
// ─────────────────────────────────────────────────────────────────────────────
describe('getSessionFromBearer — Extraction du token Bearer', () => {
  it('Extrait et décode le token depuis le header Authorization', async () => {
    const payload = { id: 'u1', email: 'prof@cfppas-gao.ml', role: 'TEACHER', tenantId: 'cfppas' };
    const token = await encrypt(payload);
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const session = await getSessionFromBearer(req);
    expect(session).not.toBeNull();
    expect(session!.email).toBe(payload.email);
    expect(session!.role).toBe(payload.role);
  });

  it('Retourne null si le header Authorization est absent', async () => {
    const req = new Request('http://localhost/api/test');
    expect(await getSessionFromBearer(req)).toBeNull();
  });

  it('Retourne null si le header ne commence pas par "Bearer "', async () => {
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Basic dXNlcjpwYXNz' },
    });
    expect(await getSessionFromBearer(req)).toBeNull();
  });

  it('Retourne null pour un token Bearer invalide', async () => {
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: 'Bearer mauvais.token.ici' },
    });
    expect(await getSessionFromBearer(req)).toBeNull();
  });

  it('Fonctionne avec le header en minuscules "authorization" (clients mobiles Flutter)', async () => {
    const payload = { id: 'u2', email: 'rh@cfppas-gao.ml', role: 'HR_MANAGER', tenantId: 'cfppas' };
    const token = await encrypt(payload);
    const req = new Request('http://localhost/api/test', {
      headers: { authorization: `Bearer ${token}` },
    });
    const session = await getSessionFromBearer(req);
    expect(session).not.toBeNull();
    expect(session!.role).toBe('HR_MANAGER');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSessionUniversal
// ─────────────────────────────────────────────────────────────────────────────
describe('getSessionUniversal — Stratégie double (Cookie + Bearer)', () => {
  it('Retourne null si aucun cookie ni Bearer n\'est fourni', async () => {
    const req = new Request('http://localhost/api/test');
    // Hors contexte Next.js : cookies() lève une erreur → fallback Bearer → null
    expect(await getSessionUniversal(req)).toBeNull();
  });

  it('Utilise le header Bearer comme fallback si pas de cookie Next.js (client mobile)', async () => {
    const payload = { id: 'mobile-user', email: 'eleve@cfppas.ml', role: 'STUDENT', tenantId: 'cfppas' };
    const token = await encrypt(payload);
    const req = new Request('http://localhost/api/test', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const session = await getSessionUniversal(req);
    expect(session).not.toBeNull();
    expect(session!.id).toBe('mobile-user');
    expect(session!.role).toBe('STUDENT');
  });
});
