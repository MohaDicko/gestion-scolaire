# 📦 DOSSIER REPRODUCTION INTÉGRALE — CFP-PAS GAO (ERP & GESTION SCOLAIRE)

Ce dossier autonome contient **tout ce qui est nécessaire à 100%** pour recréer l'application complète du CFP-PAS dans un nouveau projet sans aucune dépendance manquante.

---

## 📁 CONTENU DU DOSSIER

1. **`GUIDE_REPRODUCTION_CFPPAS.md`**
   - Le guide pas-à-pas complet (explications, formules APC, barème /100, émargements à 1 750 FCFA/h, comptabilité SYSCOHADA, comptes de test).

2. **`CFPPAS_DATABASE_DUMP.json` (273 Ko)**
   - **Le contenant intégral de la base de données réelle du CFP-PAS :**
     - **163 apprenants réels** avec matricules officiels (`RC18PB19G517M`, etc.), tuteurs, factures de scolarité et quittances.
     - **30 formateurs et personnels** (dont les 21 enseignants officiels avec téléphones et contrats vacataires à 1 750 FCFA/h).
     - **122 modules et matières** (dont les 38 modules APC complets du BT2 Entreprise Agricole avec coefficients).
     - **142 créneaux d'emplois du temps réels** (Lundi au Samedi, créneaux 08h-10h, 10h15-12h15, etc.).
     - **Plan comptable SYSCOHADA** (Comptes 411-00 État, 411-100 Familles, 421-10 Avances, 521 Banques, 571 Caisse, 706 Scolarités).

3. **`seed_from_dump.ts`**
   - Script TypeScript autonome qui injecte en **1 seule commande** tout le contenu de `CFPPAS_DATABASE_DUMP.json` dans votre nouvelle base de données PostgreSQL.

4. **`schema.prisma`**
   - Le schéma Prisma complet avec toutes les tables, énumérations et index optimisés.

5. **`package.json`**
   - Liste exacte de toutes les dépendances (Next.js 15, React 19, Tailwind CSS 4, Lucide, Prisma, jsPDF, etc.).

6. **`code_source/`**
   - `gradingPolicy.ts` : Moteur de calcul officiel APC sur 100 points : $(2 \times \text{CC} + 1 \times \text{Examen}) \div 3$.
   - `auth.ts` : Authentification JWT sécurisée multi-tenant (cookie httpOnly + Bearer pour mobile).
   - `exportVacatairesPdf.ts` : Génération PDF officielle de l'état mensuel de paiement des vacataires.
   - `exportSyscohadaBilanPdf.ts` : Génération PDF du bilan financier SYSCOHADA officiel.
   - `api_auth_login.ts` : Route API `/api/auth/login` avec anti timing-attack et validation Zod.
   - `api_reports_bulletins.ts` : Route API `/api/reports/bulletins` avec calcul de rang et de moyennes APC.
   - `api_hr_timesheet.ts` : Route API `/api/hr/timesheet` pour le suivi des heures et honoraires vacataires.

7. **`documents_officiels/`**
   - Les fichiers sources originaux Excel et documents de l'école :
     - `Liste des élèves Année 2025 - 2026.xlsx`
     - `Liste des professeurs.xlsx`
     - `Découpage du programme E.A.xlsx`
     - `Emploi du temps 2025 - 2026.xlsx`
     - `tableaux utilitaire cfppas.xlsx` (Relevé clients SYSCOHADA 411)
     - `bilan 2024 CFPPAS.xls`
     - `Logo CFPPAS GAO.docx` & Photos de terrain.

---

## 🚀 COMMENT DÉMARRER VOTRE NOUVEAU PROJET EN 3 MINUTES

```bash
# 1. Créez votre dossier de projet
mkdir cfppas-erp && cd cfppas-erp

# 2. Copiez les fichiers de ce dossier dans votre nouveau projet :
#    - package.json
#    - schema.prisma -> dans un dossier prisma/schema.prisma
#    - seed_from_dump.ts -> dans scripts/seed_from_dump.ts
#    - CFPPAS_DATABASE_DUMP.json -> à la racine du projet
#    - Les fichiers de code_source/ -> dans src/lib/ et src/app/api/

# 3. Installez les packages
npm install

# 4. Créez un fichier .env avec votre URL PostgreSQL :
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cfppas_db?schema=public"
# JWT_SECRET="cfppas_gao_super_secret_jwt_key_2026_mali_excellence_agropastorale_secure_token"

# 5. Poussez le schéma en base
npx prisma db push

# 6. Injectez toutes les données réelles du CFP-PAS
npx tsx scripts/seed_from_dump.ts

# 7. Lancez l'application !
npm run dev
```

---

## 🔑 COMPTES DE CONNEXION PRÉCONFIGURÉS

- **Directeur de l'établissement :** `admin@cfppas-gao.ml` / `CfpPasGao2026!` (Rôle: `SCHOOL_ADMIN`)
- **Super Administrateur :** `superadmin@schoolerp.com` / `SuperAdminMali2026!` (Rôle: `SUPER_ADMIN`)
- **Comptable :** `compta@cfppas-gao.ml` / `admin123` (Rôle: `ACCOUNTANT`)
- **Formateur :** `prof@cfppas-gao.ml` / `admin123` (Rôle: `TEACHER`)
- **Surveillant Général :** `surveillant@cfppas-gao.ml` / `admin123` (Rôle: `SURVEILLANT`)

