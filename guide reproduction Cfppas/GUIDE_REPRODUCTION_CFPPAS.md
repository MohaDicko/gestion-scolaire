# GUIDE DE REPRODUCTION INTÉGRALE — ERP & GESTION SCOLAIRE DU CFP-PAS (GAO)

Ce document est le **référentiel technique, architectural et métier exhaustif** conçu pour vous permettre de recréer de façon 100% autonome et fidèle l'application du **CFP-PAS (Centre de Formation Professionnelle pour la Promotion de l'Agriculture au Sahel)** dans un nouveau projet indépendant.

Il regroupe :
1. La stack technique détaillée avec `package.json` complet.
2. Le modèle de base de données complet (`prisma/schema.prisma`).
3. Le contenant intégral de la base de données réelle (163 apprenants, 30 formateurs/employés, 122 modules, 142 créneaux d'emplois du temps, facturation et plan comptable SYSCOHADA) contenu dans le dump joint `CFPPAS_DATABASE_DUMP.json`.
4. Le script de reproduction en 1 clic (`scripts/seed_from_dump.ts`).
5. Les moteurs de calcul métier indispensables (Barème APC /100, Feuille d'émargement vacataires à 1 750 FCFA/h, bulletins PDF, authentification multi-tenant JWT).

---

## 1. FICHE D'IDENTITÉ & VÉRITÉ TERRAIN DU CFP-PAS

- **Dénomination officielle :** Centre de Formation Professionnelle pour la Promotion de l'Agriculture au Sahel
- **Sigle :** CFP-PAS
- **Code Établissement :** `CFPPAS`
- **Statut Juridique :** Centre de Formation Professionnelle Agro-Pastorale
- **Localisation :** Gao, Mali (B.P. 226 - Quartier Château Secteur III, Rue 363 Porte 54)
- **Téléphone :** +223 21 82 07 62 / +223 70 12 34 56
- **Email officiel :** cfppasgao98@gmail.com
- **Devise officielle :** « Un Peuple - Un But - Une Foi | Excellence Agro-Pastorale au Sahel »
- **Directeur des Études / Directeur :** Ousmane MAMADOU (ou Salif MAÏGA)
- **Année Académique Active :** 2025-2026 (01/10/2025 au 30/06/2026)
- **Régime d'évaluation :** Approche Par Compétences (APC)
- **Échelle de notation officielle :** **Sur 100 points** (`gradingScale: 100`)
- **Seuil de validation :** $\ge 50/100$ (Seuils d'acquisition par module : $75/100$ ou $80/100$)
- **Formule de calcul des moyennes :**
  $$\text{Moyenne Module} = \frac{2 \times \text{Note Pratique / Contrôle Continu} + 1 \times \text{Examen de Synthèse}}{3}$$
- **Rémunération horaire des vacataires :** **1 750 FCFA / heure** (quota minimal : 20h/mois)
- **Effectif réel :** 163 apprenants enregistrés (dont 131 issus des listes officielles 2025-2026).
- **Corps enseignant :** 21 formateurs vacataires officiels + équipe administrative.
- **Grille horaire :** 6 jours / 7 (Lundi au Samedi), créneaux 08h-10h, 10h15-12h15, 14h30-16h30.

---

## 2. STACK TECHNIQUE & FICHIERS DE CONFIGURATION

### A. Technologies retenues
- **Framework :** Next.js 15+ (App Router)
- **Bibliothèque UI :** React 19
- **Langage :** TypeScript (ES2022)
- **Styling :** Tailwind CSS 4
- **Iconographie :** Lucide React (`lucide-react`)
- **ORM & BD :** Prisma ORM 5.x avec PostgreSQL
- **Authentification :** JWT chiffré (`jose`), `bcryptjs` pour le hachage des mots de passe
- **Export PDF officiel :** `jspdf` + `jspdf-autotable`
- **Traitement Excel :** `xlsx` (SheetJS)
- **Validation schémas :** `zod`

### B. `package.json` complet prêt à copier

```json
{
  "name": "cfppas-erp",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "tsx scripts/seed_from_dump.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "clsx": "^2.1.1",
    "framer-motion": "^11.11.17",
    "jose": "^5.9.6",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4",
    "lucide-react": "^0.460.0",
    "next": "^15.0.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.5.4",
    "xlsx": "^0.18.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.9.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.14.0",
    "eslint-config-next": "^15.0.3",
    "postcss": "^8.4.49",
    "prisma": "^5.22.0",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  },
  "prisma": {
    "seed": "tsx scripts/seed_from_dump.ts"
  }
}
```

### C. Variables d'Environnement (`.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cfppas_db?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/cfppas_db?schema=public"
JWT_SECRET="cfppas_gao_super_secret_jwt_key_2026_mali_excellence_agropastorale_secure_token"
NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"
NODE_ENV="development"
```

---

## 3. SCHÉMA DE BASE DE DONNÉES PRISMA INTÉGRAL (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum SchoolType {
  AGRO
  TECHNIQUE
  LYCEE
  SANTE
  FONDAMENTAL
  UNIVERSITE
  PUBLIC
  PRIVATE
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum UserRole {
  SUPER_ADMIN
  SCHOOL_ADMIN
  HR_MANAGER
  ACCOUNTANT
  CENSEUR
  SURVEILLANT
  TEACHER
  STUDENT
  PARENT
}

enum ContractType {
  CDI
  CDD
  TEMPORARY
  INTERN
}

enum ContractStatus {
  ACTIVE
  EXPIRED
  TERMINATED
  SUSPENDED
}

enum ExamType {
  CONTINUOUS
  MIDTERM
  FINAL
}

enum EnrollmentStatus {
  ACTIVE
  PROMOTED
  REPEATED
  WITHDRAWN
  TRANSFERRED
}

enum EmployeeType {
  TEACHER
  ADMINISTRATIVE
  SUPPORT
  DIRECTOR
  CENSEUR
  SURVEILLANT_GENERAL
  DIRECTEUR_DES_ETUDES
}

model School {
  id                   String         @id @default(uuid())
  name                 String
  code                 String         @unique
  address              String
  city                 String
  country              String         @default("Mali")
  phoneNumber          String
  email                String
  type                 SchoolType     @default(AGRO)
  drenCode             String?
  nationalRNE          String?
  logoUrl              String?
  motto                String?
  subdomain            String?        @unique
  customDomain         String?        @unique
  gradingScale         Int            @default(100) // 100 pour CFP-PAS
  defaultPaymentMethod String         @default("ESPECES")
  defaultTuition       Int            @default(150000)
  isActive             Boolean        @default(true)
  isSetupComplete      Boolean        @default(true)
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt

  campuses             Campus[]
  academicYears        AcademicYear[]
}

model Campus {
  id          String      @id @default(uuid())
  tenantId    String
  name        String
  address     String
  city        String
  region      String
  phoneNumber String
  managerName String?
  isActive    Boolean     @default(true)

  school      School      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  classrooms  Classroom[]
  students    Student[]
  employees   Employee[]

  @@index([tenantId])
}

model AcademicYear {
  id          String       @id @default(uuid())
  tenantId    String
  name        String       // "2025-2026"
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean      @default(false)

  school      School       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  classrooms  Classroom[]
  enrollments Enrollment[]
  grades      Grade[]

  @@index([tenantId])
}

model Department {
  id          String     @id @default(uuid())
  tenantId    String
  name        String
  code        String     // "PED", "ADM"
  description String?
  employees   Employee[]

  @@index([tenantId])
}

model Classroom {
  id             String       @id @default(uuid())
  tenantId       String
  campusId       String
  academicYearId String
  name           String
  level          String
  stream         String?
  maxCapacity    Int          @default(60)

  campus         Campus       @relation(fields: [campusId], references: [id])
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  enrollments    Enrollment[]
  lessonLogs     LessonLog[]
  timetables     Timetable[]
  attendances    Attendance[]

  @@index([tenantId])
  @@index([campusId])
  @@index([academicYearId])
}

model Student {
  id                 String       @id @default(uuid())
  tenantId           String
  campusId           String
  studentNumber      String       @unique
  firstName          String
  lastName           String
  dateOfBirth        DateTime
  gender             Gender
  nationalId         String
  parentName         String
  parentPhone        String
  parentEmail        String?
  parentRelationship String       @default("Tuteur")
  isActive           Boolean      @default(true)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  campus             Campus       @relation(fields: [campusId], references: [id])
  enrollments        Enrollment[]
  Grade              Grade[]
  Invoice            Invoice[]
  Attendance         Attendance[]

  @@index([tenantId])
  @@index([campusId])
}

model Enrollment {
  id             String           @id @default(uuid())
  studentId      String
  classroomId    String
  academicYearId String
  status         EnrollmentStatus @default(ACTIVE)
  enrollmentDate DateTime         @default(now())

  student        Student          @relation(fields: [studentId], references: [id], onDelete: Cascade)
  classroom      Classroom        @relation(fields: [classroomId], references: [id])
  academicYear   AcademicYear     @relation(fields: [academicYearId], references: [id])

  @@unique([studentId, academicYearId])
  @@index([classroomId])
  @@index([academicYearId])
}

model User {
  id        String   @id @default(uuid())
  tenantId  String?
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      UserRole
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
}

model Employee {
  id              String            @id @default(uuid())
  tenantId        String
  campusId        String
  departmentId    String
  employeeNumber  String            @unique
  firstName       String
  lastName        String
  email           String
  phoneNumber     String
  dateOfBirth     DateTime
  gender          Gender            @default(MALE)
  hireDate        DateTime
  employeeType    EmployeeType      @default(TEACHER)
  isActive        Boolean           @default(true)

  campus          Campus            @relation(fields: [campusId], references: [id])
  department      Department        @relation(fields: [departmentId], references: [id])
  contracts       Contract[]
  lessonLogs      LessonLog[]
  payslips        Payslip[]
  timetables      Timetable[]
  attendances     StaffAttendance[]

  @@index([tenantId])
  @@index([campusId])
  @@index([departmentId])
}

model Contract {
  id           String         @id @default(uuid())
  tenantId     String
  employeeId   String
  contractType ContractType   @default(TEMPORARY)
  baseSalary   Float          @default(0)
  hourlyRate   Float?         @default(1750)
  currency     String         @default("XOF")
  startDate    DateTime
  endDate      DateTime?
  status       ContractStatus @default(ACTIVE)

  employee     Employee       @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([employeeId])
}

model Subject {
  id          String      @id @default(uuid())
  tenantId    String
  name        String
  code        String
  coefficient Float       @default(2.5)

  grades      Grade[]
  lessonLogs  LessonLog[]
  timetables  Timetable[]

  @@index([tenantId])
}

model Grade {
  id             String       @id @default(uuid())
  tenantId       String
  studentId      String
  subjectId      String
  academicYearId String
  trimestre      Int          @default(1)
  examType       ExamType     @default(FINAL)
  score          Float        // /100
  maxScore       Float        @default(100.0)
  comment        String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  student        Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  subject        Subject      @relation(fields: [subjectId], references: [id])
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])

  @@index([tenantId])
  @@index([studentId])
  @@index([subjectId])
  @@index([academicYearId])
}

model LessonLog {
  id          String    @id @default(uuid())
  tenantId    String
  classroomId String
  subjectId   String
  employeeId  String
  date        DateTime  @default(now())
  title       String
  content     String
  homework    String?
  status      String    @default("COMPLETED")
  hoursCount  Float     @default(2.0)

  classroom   Classroom @relation(fields: [classroomId], references: [id])
  subject     Subject   @relation(fields: [subjectId], references: [id])
  teacher     Employee  @relation(fields: [employeeId], references: [id])

  @@index([tenantId])
  @@index([classroomId])
  @@index([subjectId])
  @@index([employeeId])
}

model Timetable {
  id          String    @id @default(uuid())
  tenantId    String
  classroomId String
  subjectId   String
  employeeId  String
  dayOfWeek   Int       // 1 = Lundi, 6 = Samedi
  startTime   String    // "08:00"
  endTime     String    // "10:00"

  classroom   Classroom @relation(fields: [classroomId], references: [id])
  teacher     Employee  @relation(fields: [employeeId], references: [id])
  subject     Subject   @relation(fields: [subjectId], references: [id])

  @@index([tenantId])
  @@index([classroomId])
  @@index([subjectId])
  @@index([employeeId])
}

model Attendance {
  id          String    @id @default(uuid())
  tenantId    String
  studentId   String
  classroomId String
  date        DateTime
  status      String    @default("PRESENT")

  classroom   Classroom @relation(fields: [classroomId], references: [id])
  student     Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([studentId])
  @@index([classroomId])
}

model StaffAttendance {
  id         String   @id @default(uuid())
  tenantId   String
  employeeId String
  date       DateTime
  checkIn    String?
  checkOut   String?
  status     String   @default("PRESENT")

  employee   Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([employeeId])
}

model Invoice {
  id            String    @id @default(uuid())
  tenantId      String
  studentId     String
  invoiceNumber String    @unique
  title         String
  amount        Float     // 150 000 FCFA
  status        String    @default("UNPAID")
  dueDate       DateTime
  paidDate      DateTime?
  paymentMethod String?
  notes         String?
  createdAt     DateTime  @default(now())

  student       Student   @relation(fields: [studentId], references: [id])
  payments      Payment[]

  @@index([tenantId])
  @@index([studentId])
}

model Payment {
  id          String   @id @default(uuid())
  tenantId    String
  invoiceId   String
  amount      Float
  paymentDate DateTime @default(now())
  method      String   @default("ESPECES")
  reference   String?
  notes       String?

  invoice     Invoice  @relation(fields: [invoiceId], references: [id])

  @@index([tenantId])
  @@index([invoiceId])
}

model Expense {
  id          String   @id @default(uuid())
  tenantId    String
  description String
  amount      Float
  category    String
  date        DateTime @default(now())
  status      String   @default("PAID")

  @@index([tenantId])
}

model Payslip {
  id                   String   @id @default(uuid())
  tenantId             String
  employeeId           String
  periodStart          DateTime
  periodEnd            DateTime
  baseSalary           Float    @default(0)
  taxableBonuses       Float    @default(0)
  nonTaxableBonuses    Float    @default(0)
  grossSalary          Float
  inpsEmployee         Float    @default(0)
  amoEmployee          Float    @default(0)
  totalDeductions      Float    @default(0)
  netSalary            Float
  inpsEmployer         Float    @default(0)
  amoEmployer          Float    @default(0)
  totalEmployerCharges Float    @default(0)
  status               String   @default("FINALIZED")

  employee             Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([employeeId])
}

model AuditLog {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String?
  userRole    String?
  userEmail   String?
  action      String
  entityType  String
  entityId    String
  oldValues   Json?
  newValues   Json?
  description String?
  createdAt   DateTime @default(now())

  @@index([tenantId])
  @@index([createdAt])
}
```

---

## 4. CONTENU INTÉGRAL DE LA BD (`CFPPAS_DATABASE_DUMP.json`)

Le fichier `CFPPAS_DATABASE_DUMP.json` (fourni dans le projet, 273 Ko) contient l'ensemble des données de production du CFP-PAS :

1. **Les 163 Apprenants réels :**
   - Avec leurs matricules officiels réels (ex : `RC18PB19G517M`, `14CFPPAS114M14BIS²`, etc.).
   - Leurs noms, prénoms, genre, téléphones des tuteurs.
   - Leurs inscriptions dans les classes :
     - `1ère Année Entreprise Agricole (1ère EA)` (52 apprenants)
     - `1ère Année Technicien d'Élevage (1ère TE)` (44 apprenants)
     - `2ème Année Entreprise Agricole (2ème EA)` (32 apprenants)
     - `1ère Année Agriculture` (20 apprenants)
     - `2ème Année Élevage` (8 apprenants)
     - `BT2 Entreprise Agricole` (7 apprenants)
   - Leurs factures de scolarité (150 000 FCFA) et quittances de règlement associées.

2. **Les 30 Formateurs & Personnels :**
   - Les 21 formateurs officiels avec leurs numéros de téléphone réels (ex: Ibrahim Ag Mohamed +223 76 05 14 76, Abdoulaye N'diaye +223 75 41 58 46, etc.).
   - Leurs contrats vacataires configurés à **1 750 FCFA / heure**.
   - Le Directeur des Études Ousmane MAMADOU et Directeur Salif MAÏGA.

3. **Les 122 Modules & Matières Pédagogiques APC :**
   - Les 38 modules APC complets du BT2 Entreprise Agricole (`MOD-01` à `MOD-32` + Générales `GEN-FR`, `GEN-MATH`, etc.) avec leurs coefficients officiels (1.0 à 3.0).

4. **Les 142 Créneaux d'Emploi du Temps Réels :**
   - Répartition hebdomadaire exacte du Lundi au Samedi avec affectation des classes, salles et formateurs.

5. **Le Plan Comptable SYSCOHADA :**
   - Compte `411-00` : Clients - élèves étatiques (Prise en charge par l'État malien)
   - Compte `411-100` : Clients - élèves privés (Familles)
   - Compte `421-10` : Personnel - Avances et acomptes formateurs
   - Comptes `521-01` et `521-02` : Banques BDM & BMS Gao
   - Compte `571-00` : Caisse Principale Établissement
   - Compte `706-00` : Droits de scolarité & prestations de formation

---

## 5. SCRIPT DE RESTAURATION EN 1 CLIC (`scripts/seed_from_dump.ts`)

Pour injecter l'intégralité du dump dans votre nouvelle base de données, exécutez simplement :
```bash
npx tsx scripts/seed_from_dump.ts
```

Le script lit `CFPPAS_DATABASE_DUMP.json` et crée automatiquement :
- L'école avec `gradingScale = 100`
- Le Super Administrateur (`superadmin@schoolerp.com` / `SuperAdminMali2026!`)
- Les comptes de l'école (Directeur `admin@cfppas-gao.ml`, Comptable `compta@cfppas-gao.ml`, Formateur `prof@cfppas-gao.ml`, Surveillant `surveillant@cfppas-gao.ml`)
- Toutes les classes, les formateurs avec contrats à 1 750 FCFA/h, les 122 modules, les 142 créneaux d'EDT et les 163 élèves avec factures.

---

## 6. MOTEURS DE CALCUL MÉTIER CLÉS (CODE SOURCE COMPLET)

### A. Moteur APC (/100) — `src/lib/gradingPolicy.ts`

```typescript
export interface GradingPolicy {
  profileKey: string;
  label: string;
  shortLabel: string;
  badgeText: string;
  formulaLabel: string;
  defaultScale: number; // 100 pour CFP-PAS
  passingScoreRatio: number; // 0.50 (50/100)
  weights: {
    continuousWeight: number; // 2
    compositionWeight: number; // 1
  };
}

export const CFPPAS_GRADING_POLICY: GradingPolicy = {
  profileKey: 'AGRO_TECHNIQUE',
  label: 'Centre Agro-Pastoral & Technique (CFP-PAS / APC)',
  shortLabel: 'Agro-Pastoral & CFP',
  badgeText: 'Barème /100 • Approche Par Compétences (APC)',
  formulaLabel: '(2 × Pratique/CC + 1 × Examen Final) ÷ 3 sur 100',
  defaultScale: 100,
  passingScoreRatio: 0.5,
  weights: {
    continuousWeight: 2,
    compositionWeight: 1,
  },
};

export function computeSubjectAverage(
  grades: Array<{ score: number; maxScore: number; examType: string }>,
  targetScale: number = 100
) {
  if (!grades || grades.length === 0) {
    return { classAverage: 0, compositionAverage: 0, finalAverage: 0, mention: 'Non évalué' };
  }

  const normalize = (g: { score: number; maxScore: number }) =>
    g.maxScore > 0 ? (g.score / g.maxScore) * targetScale : 0;

  const continuousGrades = grades.filter((g) => g.examType === 'CONTINUOUS');
  const compositionGrades = grades.filter((g) => g.examType !== 'CONTINUOUS');

  const classAvg = continuousGrades.length > 0
    ? continuousGrades.reduce((sum, g) => sum + normalize(g), 0) / continuousGrades.length
    : 0;

  const compoAvg = compositionGrades.length > 0
    ? compositionGrades.reduce((sum, g) => sum + normalize(g), 0) / compositionGrades.length
    : 0;

  // Formule officielle APC : 2/3 CC/Pratique + 1/3 Examen
  let finalAvg = 0;
  if (continuousGrades.length > 0 && compositionGrades.length > 0) {
    finalAvg = (classAvg * 2 + compoAvg * 1) / 3;
  } else if (compositionGrades.length > 0) {
    finalAvg = compoAvg;
  } else {
    finalAvg = classAvg;
  }

  const rounded = Math.round(finalAvg * 100) / 100;

  let mention = 'Insuffisant';
  if (rounded >= 80) mention = 'Très Bien';
  else if (rounded >= 70) mention = 'Bien';
  else if (rounded >= 60) mention = 'Assez Bien';
  else if (rounded >= 50) mention = 'Passable';

  return {
    classAverage: Math.round(classAvg * 100) / 100,
    compositionAverage: Math.round(compoAvg * 100) / 100,
    finalAverage: rounded,
    mention,
  };
}
```

### B. Moteur Émargement & Rémunération des Vacataires — `src/lib/timesheetCalculator.ts`

```typescript
export function computeTeacherTimesheet(
  lessonLogs: Array<{ hoursCount: number; status: string }>,
  contractRate: number = 1750
) {
  let completedHours = 0;
  let absentHours = 0;

  for (const log of lessonLogs) {
    if (log.status === 'COMPLETED') {
      completedHours += log.hoursCount;
    } else if (log.status === 'ABSENT') {
      absentHours += log.hoursCount;
    }
  }

  // Quota mensuel prévu minimal de 20 heures
  const plannedHours = Math.max(completedHours + absentHours, 20);
  const lostHours = Math.max(0, plannedHours - completedHours);
  const grossSalary = completedHours * contractRate;

  return {
    plannedHours,
    completedHours,
    lostHours,
    hourlyRate: contractRate,
    grossSalary,
  };
}
```

### C. Authentification Multi-Tenant JWT — `src/lib/auth.ts`

```typescript
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'cfppas_gao_super_secret_jwt_key_2026_mali_excellence_agropastorale_secure_token';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any, expiresIn: string = '7d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('refreshToken')?.value;
  if (!token) return null;
  return await decrypt(token);
}
```

---

## 7. COMPTES UTILISATEURS PRÉCONFIGURÉS

| Rôle | Email | Mot de passe | Description |
|---|---|---|---|
| **SUPER_ADMIN** | `superadmin@schoolerp.com` | `SuperAdminMali2026!` | Accès plateforme globale multi-écoles |
| **SCHOOL_ADMIN** | `admin@cfppas-gao.ml` | `CfpPasGao2026!` | Directeur général CFP-PAS Gao |
| **ACCOUNTANT** | `compta@cfppas-gao.ml` | `admin123` | Comptabilité, scolarités et paie vacataires |
| **TEACHER** | `prof@cfppas-gao.ml` | `admin123` | Formateur (Ibrahim Ag Mohamed) |
| **SURVEILLANT**| `surveillant@cfppas-gao.ml` | `admin123` | Surveillant Général (Amadou Kéita) |

---

## 8. GUIDE DE DÉPLOIEMENT EN 3 ÉTAPES

Dans votre nouveau dossier de projet :

```bash
# 1. Installer les dépendances
npm install

# 2. Synchroniser la base de données PostgreSQL
npx prisma db push

# 3. Injecter l'intégralité du dump CFP-PAS
npx tsx scripts/seed_from_dump.ts

# 4. Lancer le serveur
npm run dev
```

Connectez-vous sur `http://localhost:3000` avec **`admin@cfppas-gao.ml`** / **`CfpPasGao2026!`** : votre application contient l'intégralité des 163 apprenants, 30 formateurs, 122 matières, emplois du temps et règles comptables du CFP-PAS !
