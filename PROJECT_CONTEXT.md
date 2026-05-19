# 📚 PROJECT_CONTEXT.md — School ERP
> **LIRE CE FICHIER EN PREMIER.** Il contient toute l'information nécessaire pour travailler sur ce projet sans parcourir le code source.  
> Dernière mise à jour : 2026-05-19

---

## 1. 🎯 Vue d'ensemble du projet

| Champ | Valeur |
|---|---|
| **Nom** | School ERP (Gestion Scolaire) |
| **Version** | 1.1.0 |
| **Type** | ERP SaaS Multi-tenant pour écoles africaines |
| **Marché cible** | Écoles privées, lycées, universités (Mali, Afrique de l'Ouest) |
| **Devise** | FCFA (XOF) |
| **Langue UI** | Français |
| **Statut** | Production (déployé sur Vercel + Supabase) |

**Description** : Système ERP complet pour la gestion scolaire. Architecture SaaS multi-tenant : chaque école (`tenantId`) est isolée dans la même base de données. Inclut la gestion des élèves, RH, finances, notes, présences, emplois du temps, bibliothèque et inventaire.

---

## 2. 🏗️ Stack Technique

| Couche | Technologie |
|---|---|
| **Framework** | Next.js 15.1.9 (App Router) |
| **Language** | TypeScript 5.4 |
| **Runtime** | React 19.0.0 |
| **Styling** | TailwindCSS 3.4 + CSS Variables (globals.css) |
| **UI Components** | Shadcn/ui + Radix UI + Framer Motion |
| **ORM** | Prisma 5.15 (PostgreSQL) |
| **Base de données** | Supabase (PostgreSQL) — pgBouncer pooling |
| **Auth** | JWT (jose) via cookie `refreshToken` httpOnly |
| **Email** | Resend (resend.com) |
| **Paie** | Moteur custom Mali (`src/lib/maliPayroll.ts`) |
| **Export** | jsPDF + jspdf-autotable, xlsx, papaparse |
| **Graphiques** | Recharts |
| **Notifications Push** | Web Push API (VAPID) |
| **IA (actuel)** | Simulation mots-clés (PAS un vrai LLM — à connecter) |
| **Déploiement** | Vercel (standalone output) + Docker disponible |

---

## 3. 📁 Structure des dossiers

```
/
├── prisma/
│   ├── schema.prisma          # Schéma BDD complet (source de vérité)
│   ├── seed.js                # Données de test (école demo)
│   └── seed_heavy.js          # Données massives (stress test)
│
├── src/
│   ├── app/                   # Pages Next.js (App Router)
│   │   ├── api/               # Toutes les API Routes
│   │   ├── dashboard/         # Dashboard admin principal
│   │   ├── students/          # Gestion élèves
│   │   ├── hr/                # Ressources humaines
│   │   ├── finance/           # Finance et facturation
│   │   ├── grades/            # Notes et bulletins
│   │   ├── attendance/        # Présences élèves
│   │   ├── timetable/         # Emploi du temps
│   │   ├── library/           # Bibliothèque
│   │   ├── inventory/         # Stock et inventaire
│   │   ├── reports/           # Rapports PDF/Excel
│   │   ├── settings/          # Paramètres + audit
│   │   ├── login/             # Page de connexion
│   │   ├── portal/            # Portail parents (public)
│   │   ├── admin/             # Super Admin (multi-école)
│   │   ├── student/           # Dashboard élève
│   │   ├── teacher/           # Dashboard professeur
│   │   ├── parent/            # Dashboard parent
│   │   ├── chat/              # Messagerie interne
│   │   ├── payslips/          # Fiches de paie
│   │   └── globals.css        # Styles globaux + variables CSS
│   │
│   ├── components/
│   │   ├── AppLayout.tsx      # Layout principal avec sidebar
│   │   ├── AIDashboardAssistant.tsx  # Widget IA (bouton flottant)
│   │   ├── Toast.tsx          # Système de notifications toast
│   │   ├── PushNotificationManager.tsx
│   │   ├── dashboard/         # Composants du dashboard
│   │   ├── shared/            # Composants partagés (SystemHealth...)
│   │   ├── students/          # Composants élèves
│   │   └── ui/                # Composants Shadcn (button, card, table...)
│   │
│   ├── lib/
│   │   ├── auth.ts            # JWT encrypt/decrypt/getSession
│   │   ├── prisma.ts          # Singleton Prisma client
│   │   ├── plans.ts           # Logique plans STARTER/BUSINESS/ELITE
│   │   ├── maliPayroll.ts     # Moteur de calcul de paie malien
│   │   ├── audit.ts           # Système d'audit trail
│   │   ├── email.ts           # Envoi d'emails (Resend)
│   │   ├── grading.ts         # Calcul des moyennes et bulletins
│   │   ├── sms.ts             # Envoi SMS
│   │   ├── push.ts            # Notifications push
│   │   ├── rateLimit.ts       # Rate limiting API
│   │   └── exportUtils.ts     # Utilitaires export
│   │
│   └── middleware.ts          # Auth JWT + headers sécurité
│
├── .env                       # Variables d'environnement (local)
├── next.config.js             # Config Next.js + headers sécurité
├── package.json               # Dépendances
└── PROJECT_CONTEXT.md         # CE FICHIER
```

---

## 4. 🗄️ Modèles de base de données (Prisma)

### Modèles principaux

| Modèle | Description | Champs clés |
|---|---|---|
| `School` | Établissement (tenant) | `id`, `code`, `subdomain`, `plan`, `isActive` |
| `Campus` | Site physique d'une école | `tenantId`, `name`, `city`, `region` |
| `AcademicYear` | Année scolaire | `tenantId`, `name`, `isActive`, `startDate`, `endDate` |
| `Classroom` | Classe | `tenantId`, `campusId`, `academicYearId`, `name`, `level` |
| `Student` | Élève | `tenantId`, `studentNumber`, `firstName`, `lastName`, `parentPhone`, `isActive` |
| `Enrollment` | Inscription d'un élève dans une classe | `studentId`, `classroomId`, `academicYearId`, `status` |
| `User` | Utilisateur du système | `email`, `password`, `role`, `tenantId` |
| `Employee` | Employé/Enseignant | `tenantId`, `employeeType`, `departmentId`, `campusId` |
| `Department` | Département RH | `tenantId`, `name`, `code` |
| `Contract` | Contrat employé | `employeeId`, `contractType`, `baseSalary`, `currency` (XOF) |
| `Subject` | Matière | `tenantId`, `name`, `code`, `coefficient` |
| `Grade` | Note | `studentId`, `subjectId`, `score` (/`maxScore`=20), `examType`, `trimestre` |
| `Payslip` | Fiche de paie | `tenantId`, `employeeId`, `netSalary`, `status` (DRAFT/VALIDATED) |
| `Invoice` | Facture élève | `tenantId`, `studentId`, `amount`, `status` (UNPAID/PAID/PARTIAL) |
| `Payment` | Paiement d'une facture | `invoiceId`, `amount`, `method` (ESPECES/ORANGE_MONEY/MOOV_MONEY/VIREMENT/CHEQUE) |
| `Attendance` | Présence élève | `tenantId`, `studentId`, `classroomId`, `date`, `status` |
| `StaffAttendance` | Présence employé | `employeeId`, `checkIn`, `checkOut`, `status` |
| `LeaveRequest` | Congé employé | `employeeId`, `type`, `status` (PENDING/APPROVED/REJECTED) |
| `Timetable` | Emploi du temps | `classroomId`, `subjectId`, `employeeId`, `dayOfWeek`, `startTime`, `endTime` |
| `LessonLog` | Journal de cours | `classroomId`, `subjectId`, `employeeId`, `title`, `content`, `homework` |
| `Expense` | Dépense | `tenantId`, `description`, `amount`, `category` |
| `StockItem` | Article inventaire | `tenantId`, `name`, `category`, `quantity`, `minThreshold` |
| `Book` | Livre bibliothèque | `tenantId`, `title`, `author`, `totalCopies`, `availableCopies` |
| `Loan` | Emprunt livre | `bookId`, `studentId?`, `employeeId?`, `dueDate`, `status` |
| `AuditLog` | Piste d'audit immuable | `tenantId`, `userId`, `action`, `entityType`, `entityId`, `oldValues`, `newValues` |
| `Conversation` | Fil de messagerie | `tenantId`, `participants[]`, `messages[]` |
| `Message` | Message interne | `conversationId`, `senderId`, `content`, `isRead` |
| `PushSubscription` | Abonnement notif push | `userId`, `endpoint`, `p256dh`, `auth` |

### Enums importants

```typescript
UserRole     = SUPER_ADMIN | SCHOOL_ADMIN | HR_MANAGER | ACCOUNTANT | TEACHER | STUDENT | CENSEUR | SURVEILLANT | PARENT
EmployeeType = TEACHER | ADMINISTRATIVE | SUPPORT | DIRECTOR | CENSEUR | SURVEILLANT_GENERAL | DIRECTEUR_DES_ETUDES
Plan         = STARTER | BUSINESS | ELITE
ExamType     = CONTINUOUS | MIDTERM | FINAL
SchoolType   = PUBLIC | PRIVATE | CONFESSIONAL | INTERNATIONAL | PRESCOLAIRE | PRIMAIRE | FONDAMENTAL | LYCEE | TECHNIQUE | SANTE | AGRO | UNIVERSITE
ContractType = CDI | CDD | TEMPORARY | INTERN
AuditAction  = CREATE | UPDATE | DELETE | LOGIN | LOGOUT | EXPORT | APPROVE | REJECT
EnrollmentStatus = ACTIVE | PROMOTED | REPEATED | WITHDRAWN | TRANSFERRED
```

---

## 5. 🔑 Plans d'abonnement (`src/lib/plans.ts`)

| Feature | STARTER | BUSINESS | ELITE |
|---|---|---|---|
| Max élèves | 250 | 750 | Illimité |
| Module RH | ❌ | ❌ | ✅ |
| Finance | Basique | ✅ | ✅ |
| Emploi du temps | ✅ | ✅ | ✅ |
| Emails | ❌ | ✅ | ✅ |
| Cartes ID | ❌ | ✅ | ✅ |
| Multi-campus | ❌ | ❌ | ✅ |

---

## 6. 🔐 Authentification & Sécurité

- **Mécanisme** : JWT HS256 signé avec `JWT_SECRET` (min 32 chars), stocké dans cookie `refreshToken` (httpOnly)
- **Session** : `getSession()` → `{ id, email, role, tenantId }` — appelé dans toutes les API routes
- **Middleware** : `src/middleware.ts` protège toutes les routes, vérifie JWT sur Edge Runtime
- **Routes publiques** : `/`, `/login`, `/api/auth/login`, `/portal`
- **Super Admin guard** : `/api/admin/dashboard/stats` et `/api/admin/diagnostics` → role `SUPER_ADMIN` uniquement
- **Headers sécurité** : HSTS, X-Frame-Options: DENY, CSP, nosniff, XSS-Protection (configurés dans `next.config.js` ET middleware)
- **Redirection par rôle** (dans `/dashboard/page.tsx`) :
  - `STUDENT` → `/student/dashboard`
  - `TEACHER` → `/teacher/dashboard`
  - `ACCOUNTANT` → `/finance/dashboard`
  - `HR_MANAGER` → `/hr/dashboard`
  - `SUPER_ADMIN` → `/admin/schools`
  - `PARENT` → `/parent/dashboard`
  - `CENSEUR/SURVEILLANT` → `/attendance`
  - `SCHOOL_ADMIN` → reste sur `/dashboard`

---

## 7. 💰 Moteur de paie malien (`src/lib/maliPayroll.ts`)

Conforme au **Code du Travail du Mali (Loi N°92-020)** et **CGI Art. 118**.

| Cotisation | Taux |
|---|---|
| INPS salarié | 3.60% (plafonné à 500 000 XOF) |
| INPS patronal | 15.40% (plafonné à 500 000 XOF) |
| AMO salarié | 1.50% |
| AMO patronal | 4.50% |
| SMIG | 45 000 XOF/mois |

**Barème ITS progressif** (Art. 118 CGI) :
- 0 – 25 000 : 0%
- 25 001 – 50 000 : 5%
- 50 001 – 250 000 : 12%
- 250 001 – 500 000 : 18%
- 500 001 – 1 000 000 : 26%
- > 1 000 001 : 37%

**Abattements famille** : marié = 10%, par enfant = 5% (plafonné 40%)
**Prime ancienneté** : 3% à partir de 3 ans, +1%/an supplémentaire (max 30%)

**Fonction principale** : `calculateMaliPayroll(input: MaliPayrollInput): MaliPayrollResult`

---

## 8. 🌐 Variables d'environnement requises

```env
# Base de données
DATABASE_URL=postgresql://...@pooler.supabase.com:6543/Ecole?pgbouncer=true
DIRECT_URL=postgresql://...@pooler.supabase.com:5432/Ecole

# Auth
JWT_SECRET=<min 32 chars>

# App
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000   # En prod: schoolerp.pro

# Email (Resend)
RESEND_API_KEY=...

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@schoolerp.pro

# IA (À AJOUTER — PAS ENCORE CONFIGURÉ)
GEMINI_API_KEY=<clé Google AI Studio>
```

---

## 9. 🤖 Module IA (`src/app/api/ai/analyze/route.ts`)

**⚠️ PROBLÈME ACTUEL** : L'IA est une **simulation par mots-clés**, PAS un vrai LLM.

**Flux actuel** :
1. Le composant `AIDashboardAssistant.tsx` envoie un `POST /api/ai/analyze` avec `{ prompt }`
2. L'API récupère des données réelles (élèves, notes, finances) de la BDD
3. Elle répond avec une réponse simulée selon les mots dans le prompt (if/else sur "risque", "finance", etc.)

**Ce qui manque** : Connexion à Google Gemini (ou autre LLM).

**Contexte injecté disponible** :
- `activeStudents` : nombre d'élèves actifs
- `activeStaff` : nombre d'employés actifs
- `unpaidInvoices` : nombre de factures impayées
- `atRiskStudents` : élèves avec note < 10/20
- `revenue` : résumé financier par statut

**Pour connecter Gemini** : Installer `@google/generative-ai`, ajouter `GEMINI_API_KEY` dans `.env`, remplacer le bloc if/else par un appel `model.generateContent(prompt + JSON.stringify(context))`.

---

## 10. 📡 Routes API principales

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Connexion, crée le cookie JWT |
| POST | `/api/auth/logout` | Supprime le cookie |
| GET | `/api/dashboard/stats` | KPIs du tableau de bord |
| GET/POST | `/api/students` | Liste / création élèves |
| GET/PUT/DELETE | `/api/students/[id]` | Détail / modif / suppression élève |
| GET/POST | `/api/employees` | Employés |
| GET/POST | `/api/hr/leaves` | Congés |
| GET/POST | `/api/grades` | Notes |
| GET/POST | `/api/invoices` | Factures |
| GET/POST | `/api/payments` | Paiements |
| GET/POST | `/api/payslips` | Fiches de paie |
| GET/POST | `/api/attendance` | Présences élèves |
| GET/POST | `/api/timetable` | Emploi du temps |
| GET/POST | `/api/classrooms` | Classes |
| GET/POST | `/api/subjects` | Matières |
| GET/POST | `/api/library` | Bibliothèque (livres) |
| GET/POST | `/api/inventory` | Inventaire |
| GET/POST | `/api/expenses` | Dépenses |
| GET/POST | `/api/reports` | Rapports PDF/Excel |
| POST | `/api/ai/analyze` | Assistant IA (simulation) |
| GET/POST | `/api/chat` | Messagerie interne |
| GET | `/api/audit` | Journal d'audit |
| GET | `/api/admin/schools` | Super Admin : liste écoles |
| GET | `/api/school` | Infos de l'école courante |
| GET/PUT | `/api/settings` | Paramètres école |
| GET | `/api/notifications` | Notifications |
| POST | `/api/sms` | Envoi SMS |

---

## 11. 🎨 Design System

- **Framework CSS** : TailwindCSS + variables CSS personnalisées dans `globals.css`
- **Thème** : Light mode (Enterprise B2B, SAP-class aesthetics)
- **Police** : Inter (Google Fonts)
- **Couleur principale** : `var(--primary)` → bleu-slate (`#4f8ef7` par défaut, personnalisable par école)
- **Composants UI** : `src/components/ui/` (button, card, table, Modal, etc.)
- **Layout** : `AppLayout.tsx` — sidebar fixe + header + breadcrumbs + zone de contenu
- **Animations** : Framer Motion pour les transitions de page

---

## 12. 🧰 Scripts npm

```bash
npm run dev          # Serveur de développement (Next.js)
npm run build        # prisma generate + next build
npm run start        # Production
npm run prisma:generate  # Regénérer le client Prisma
npm run prisma:migrate   # Appliquer les migrations
```

---

## 13. 📌 Points d'attention / Gotchas

1. **Multi-tenancy** : Chaque requête API doit filtrer par `tenantId` = `session.tenantId`. Ne jamais oublier ce filtre.
2. **Session** : Toujours appeler `const session = await getSession()` en début d'API route, retourner 401 si null.
3. **Prisma + pgBouncer** : Utiliser `DATABASE_URL` avec `?pgbouncer=true&connection_limit=1` pour éviter les problèmes de pool.
4. **Plans** : Vérifier `isFeatureAllowed(school.plan, 'hasHR')` avant d'accéder aux fonctions premium.
5. **Paie** : Toutes les valeurs monétaires en **FCFA (XOF)**. Utiliser `formatXOF()` pour l'affichage.
6. **Notes** : Sur **20** (`maxScore = 20`). Seuil d'alerte = 10/20.
7. **Trimesters** : 3 trimestres (`trimestre: 1 | 2 | 3`), 3 types d'exam (`CONTINUOUS | MIDTERM | FINAL`).
8. **Audit** : Logger toutes les actions critiques via `src/lib/audit.ts` — obligatoire pour APPROVE/REJECT/DELETE.
9. **IA** : La route `/api/ai/analyze` n'utilise PAS de vrai LLM — simulé par if/else sur mots-clés. À connecter à Gemini.
10. **`.env` encodé** : Le fichier `.env` contient des lignes en UTF-16 (null bytes visibles) pour les variables VAPID. Vérifier l'encodage si problème.

---

## 14. 🔗 URLs de déploiement

| Environnement | URL |
|---|---|
| **Local dev** | `http://localhost:3000` |
| **Production** | Vercel (domaine configuré dans `NEXT_PUBLIC_ROOT_DOMAIN`) |
| **BDD** | Supabase — projet `oazsaromxdghzkpdyicq` (région: aws-1-eu-west-3) |

---

*Ce fichier est la source de vérité du projet. Mettre à jour après chaque changement majeur d'architecture.*
