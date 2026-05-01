# 🏫 SchoolERP Pro — SaaS de Gestion Scolaire (ERP/SIS)

> Système de gestion intégrée (ERP) multi-tenant pour établissements scolaires (Primaire, Lycée, Technique, Supérieur). Conçu spécifiquement pour répondre aux standards académiques et financiers maliens.

---

## 🏗️ Architecture & Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Base de Données**: [PostgreSQL](https://www.postgresql.org/) (via Supabase)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Design System**: Vanilla CSS Premium + Lucide Icons + Recharts
- **Authentification**: JWT (jose) via HTTPOnly Cookies & Middleware

---

## 🚀 Installation & Démarrage

### 1. Variables d'environnement
Créez un fichier `.env` à la racine :
```env
DATABASE_URL="votre_url_supabase_pooler"
DIRECT_URL="votre_url_supabase_direct"
JWT_SECRET="une_cle_secrete_de_plus_de_32_caracteres"
```

### 2. Installation des dépendances
```bash
npm install
```

### 3. Initialisation de la Base de Données
```bash
# Appliquer le schéma
npx prisma db push

# Remplir avec les données de test (Etablissement, Admin, Classes, Matières)
npx prisma db seed
```

### 4. Lancer l'application
```bash
npm run dev
```
Accès : `http://localhost:3000`

---

### 5. Docker Deployment (Recommended for Production)
```bash
# Lancer l'environnement complet (App + Postgres)
docker-compose up --build -d

# Initialiser la base de données Docker
docker-compose exec app npx prisma db push
docker-compose exec app npx prisma db seed
```

---

## 🔑 Identifiants de Test
| Champ | Valeur | Rôle |
| :--- | :--- | :--- |
| **Email** | `superadmin@schoolerp.com` | `SUPER_ADMIN` (Global SaaS Control) |
| **Email** | `admin@schoolerp.com` | `SCHOOL_ADMIN` (Local School Control) |
| **Mot de passe** | `admin123` | (Commun aux deux) |

---

## 📋 Modules Implémentés

### 🏛️ Module Académique
- [x] **Tableau de Bord Exécutif** : KPIs temps réel, Flux de trésorerie, Taux de présence.
- [x] **Gestion des Élèves** : Inscriptions, Importation Excel en masse.
- [x] **Cartes Scolaires** : Génération PDF au format CR80 avec **Codes-barres (CODE128)**.
- [x] **Évaluation** : Saisie des notes, Calcul des bulletins (Norme Malienne : 1/3 classe + 2/3 compo).
- [x] **Relevés de Notes** : Génération de transcripts annuels officiels avec moyennes consolidées.
- [x] **Emploi du Temps** : Planning hebdomadaire avec version optimisée pour l'impression.

### 💼 Module RH & Paie
- [x] **Gestion du Personnel** : Dossiers employés, contrats.
- [x] **Pointage** : Système de présence staff avec heures d'entrée/sortie.
- [x] **Congés** : Workflow de demande et validation des absences.
- [x] **Paie Malienne** : Moteur de calcul (ITS, INPS, AMO) et fiches de paie PDF.

### 💰 Module Finance
- [x] **Dashboard Financier** : Analyse des recettes vs dépenses.
- [x] **Facturation** : Émission de factures scolarité, marquage des paiements.
- [x] **Journal des Charges** : Suivi des dépenses opérationnelles.

---

## 🔐 Sécurité & Conformité
- **Multi-tenant** : Isolation stricte des données par `tenantId` au niveau du moteur de base de données.
- **Headers de Sécurité** : CSP, HSTS, X-Frame-Options, XSS Protection activés via middleware.
- **Protection des Routes** : Accès réservé aux utilisateurs authentifiés avec redirection automatique.

---

*Fait avec ❤️ pour la modernisation du système éducatif malien.*
