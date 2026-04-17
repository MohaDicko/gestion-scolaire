# SchoolERP - Next.js 15 Edition (100% Vercel)

Ce projet est la version modernisée et migrée du SchoolERP, passée d'un backend .NET à une architecture **Full-Stack Next.js 15** optimisée pour Vercel.

## 🚀 Déploiement sur Vercel

1. **GitHub** : Poussez ce code sur un dépôt GitHub.
2. **Vercel** : Importez le projet depuis le dashboard Vercel.
3. **Configuration** :
   - Framework Preset : `Next.js`
   - Build Command : `npx prisma generate && next build` (déjà configuré dans `vercel.json`)
4. **Variables d'Environnement** :
   Ajoutez les clés suivantes dans les réglages Vercel :
   - `DATABASE_URL` : Votre URL de connexion Supabase (PostgreSQL).
   - `JWT_SECRET` : Une chaîne de caractères secrète pour les tokens de session.

## 🛠️ Modules Inclus
- **Dashboard** : Analytics et graphiques financiers.
- **Scolarité** : Gestion des élèves, classes et inscriptions.
- **Académique** : Saisie des notes, appel (présences) et emplois du temps.
- **RH & Paie** : Gestion du personnel, absences, congés et génération de bulletins.
- **Comptabilité** : Facturation élèves et suivi des dépenses.
- **Portail Parent** : Accès public sécurisé pour les familles.

## 🔒 Sécurité
- Middleware Next.js (Edge Runtime) pour la protection des routes.
- Cookies HTTP-Only pour le stockage des sessions.
- Isolation Multi-tenant (Prêt pour plusieurs écoles).

---
*Optimisé par Antigravity - Powered by Vercel & Supabase*
