# 🏫 SchoolERP — SaaS de Gestion Scolaire (ERP/SIS)

> Application multi-tenant de gestion globale d'école couvrant la Scolarité, les RH et la Paie.

---

## 🏗️ Architecture du Projet

```
gestion scolaire/
├── backend/                    # Solution .NET (Clean Architecture)
│   └── src/
│       ├── SchoolERP.Domain/   # Entités, Value Objects, Interfaces
│       ├── SchoolERP.Application/  # CQRS, Commands, Queries, DTOs
│       ├── SchoolERP.Infrastructure/  # EF Core, Repos, Services
│       └── SchoolERP.Api/      # Controllers, Middleware, Program.cs
│
└── school-erp-frontend/        # React + TypeScript (Vite)
    └── src/
        ├── app/                # Layout global
        ├── components/         # Composants réutilisables
        ├── features/
        │   ├── auth/           # Authentification JWT
        │   ├── academic/       # Scolarité (élèves, notes...)
        │   ├── hr/             # RH (employés, contrats...)
        │   └── payroll/        # Paie (fiches de paie...)
        ├── hooks/              # Hooks globaux
        ├── lib/                # Axios, QueryClient
        ├── store/              # Zustand (authStore)
        └── types/              # TypeScript types
```

---

## 🚀 Démarrage Rapide

### Prérequis
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/)

### 1. Configurer la base de données

Créer une base de données PostgreSQL :
```sql
CREATE DATABASE "SchoolERP_Dev";
```

### 2. Lancer le Backend

```bash
cd backend/src/SchoolERP.Api

# Mettre à jour la connection string dans appsettings.json
# puis :
dotnet run
```

L'API sera disponible sur : `http://localhost:5000`  
Swagger UI : `http://localhost:5000/swagger`

### 3. Lancer le Frontend

```bash
cd school-erp-frontend
npm install
npm run dev
```

L'application sera disponible sur : `http://localhost:5173`

---

## 🔑 Architecture Multi-Tenant

Chaque école est un **Tenant** identifié par un `TenantId` (Guid).

- Le `TenantId` est inclus dans le **token JWT** à la connexion
- Il est transmis via le header **`X-Tenant-ID`** sur chaque requête
- EF Core applique automatiquement un **Global Query Filter** pour isoler les données
- Les `SuperAdmin` peuvent bypasser le filtre avec `.IgnoreQueryFilters()`

---

## 🔐 Rôles Utilisateurs (RBAC)

| Rôle | Accès |
|------|-------|
| `SuperAdmin` | Toutes les écoles, toutes les fonctionnalités |
| `SchoolAdmin` | Administration complète d'une école |
| `HR_Manager` | RH + Paie |
| `Accountant` | Paie uniquement |
| `Teacher` | Notes + Emploi du temps |
| `Student` | Ses propres données |

---

## 📚 Stack Technique

### Backend
- **ASP.NET Core 8** (C#)
- **Entity Framework Core** + PostgreSQL
- **MediatR** (CQRS)
- **FluentValidation**
- **JWT** Authentication

### Frontend
- **React 18** + **TypeScript** (Vite)
- **TanStack Query** (React Query v5)
- **Zustand** (état global)
- **Axios** (intercepteurs JWT)
- **React Router v6** (routing RBAC)
- **React Hook Form** + **Zod** (formulaires)
- **Lucide React** (icônes)

---

## 📋 Modules

### ✅ Phase 1 — Fondations (En cours)
- [x] Structure Clean Architecture backend
- [x] Entités Domain (Academic, HR, Payroll)
- [x] AppDbContext + Multi-tenant + Audit Trail
- [x] Structure React/Vite + Feature-Based Design
- [x] Auth Store (Zustand) + Axios intercepteurs
- [x] Routeur RBAC (ProtectedRoute)

### ✅ Phase 2 — Module Academic
- [x] CRUD Élèves + API
- [x] Inscriptions + Transferts
- [x] Notes + Bulletins (PDF)
- [x] Emploi du Temps

### ✅ Phase 3 — Module RH
- [x] CRUD Employés
- [x] Gestion des Contrats
- [x] Workflow Congés
- [x] Présences

### ✅ Phase 4 — Module Paie
- [x] Moteur de calcul
- [x] Génération Fiches de Paie (PDF)
- [x] Historique & Exports

---

## 🌐 Déploiement Production

Le projet est configuré pour un déploiement optimisé sur **Vercel** et **Supabase**, sans dépendance à Railway.

### 🎨 Frontend & Backend Proxy (Vercel)
Vercel héberge nativement le frontend React. Pour le backend .NET, il est recommandé d'utiliser un hébergeur compatible .NET (comme Azure ou Render) tout en pointant votre domaine Vercel vers celui-ci via un proxy ou sous-domaine.

1.  Connectez votre repo GitHub à Vercel.
2.  Configurez les variables d'environnement suivantes dans Vercel :
    - `VITE_API_URL` : L'URL de votre API de production.
    - `VITE_SUPABASE_URL` : Votre URL Supabase.
    - `VITE_SUPABASE_ANON_KEY` : Votre clé publique Supabase.

### 🗄️ Base de Données (Supabase)
Le projet utilise déjà **PostgreSQL sur Supabase** avec le pooler de transactions (Port 6543) pour une performance maximale.

### 🔑 Variables d'Environnement (Backend)
Si vous déployez le backend sur un service compatible (ex: App Service), utilisez ces noms :
| Variable | Valeur recommandée |
| :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | URL de pooling Supabase (Port 6543) |
| `Jwt__Key` | Votre clé secrète JWT |
| `Cors__AllowedOrigins` | Votre domaine Vercel (ex: `https://app.schoolerp.com`) |

---

*Projet analysé et optimisé par Antigravity — v1.0 Production Ready*
