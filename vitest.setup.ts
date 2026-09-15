import '@testing-library/jest-dom'

// ── Variables d'environnement globales pour les tests ─────────────────────────
// Doit être défini avant l'import de tout module utilisant process.env au niveau module
// (ex: auth.ts initialise 'key' à partir de JWT_SECRET dès le chargement du module)
process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-for-vitest!!';
