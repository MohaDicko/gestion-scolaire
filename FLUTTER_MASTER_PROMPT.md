# 🚀 FLUTTER MASTER PROMPT — School ERP Mobile
> Copie-colle ce fichier entier dans Cursor / Claude / ChatGPT pour démarrer le projet Flutter.

---

## CONTEXTE GÉNÉRAL

Tu vas créer une application mobile Flutter complète appelée **SchoolERP Mobile**.
Elle se connecte à un backend **Next.js 15 / API REST** déjà existant et fonctionnel.
La base de données est **PostgreSQL (Supabase)** partagée avec la version web.
**Tu ne touches PAS au backend.** Tu consommes uniquement les API REST décrites ci-dessous.

### Informations clés
- **Nom de l'app** : SchoolERP
- **Langue UI** : Français
- **Devise** : FCFA (XOF) — toujours afficher avec `formatXOF()`
- **Marché** : Écoles africaines (Mali, Afrique de l'Ouest)
- **Plateforme cible** : Android (priorité) + iOS
- **API Base URL** : configurable via `.env` (ex: `https://schoolerp.pro`) — stocké dans `lib/config/env.dart`

---

## ARCHITECTURE FLUTTER

### Structure des dossiers
```
lib/
├── config/
│   ├── env.dart              # BASE_URL, constantes
│   └── theme.dart            # ThemeData, couleurs, typographie
├── core/
│   ├── api/
│   │   ├── api_client.dart   # Dio client avec interceptors JWT
│   │   └── endpoints.dart    # Toutes les URLs des endpoints
│   ├── auth/
│   │   ├── auth_service.dart
│   │   └── auth_state.dart   # Riverpod provider
│   ├── models/               # Tous les modèles Dart (fromJson/toJson)
│   └── utils/
│       ├── formatters.dart   # formatXOF(), formatDate()
│       └── snackbar.dart     # showSuccess / showError
├── features/
│   ├── auth/                 # Login screen
│   ├── dashboard/            # Dashboard par rôle
│   ├── students/             # Liste, détail, création élèves
│   ├── attendance/           # Appel de présences
│   ├── grades/               # Notes
│   ├── finance/              # Factures, paiements
│   ├── hr/                   # Employés, congés, fiches de paie
│   ├── timetable/            # Emploi du temps
│   └── profile/              # Profil utilisateur
└── main.dart
```

### State Management
- **Riverpod** (`flutter_riverpod: ^2.x`) — utiliser `AsyncNotifierProvider` pour les appels API
- **GoRouter** pour la navigation avec redirection basée sur le rôle

### Packages requis (`pubspec.yaml`)
```yaml
dependencies:
  flutter_riverpod: ^2.5.1
  go_router: ^13.0.0
  dio: ^5.4.0
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.3
  intl: ^0.19.0
  google_fonts: ^6.2.1
  fl_chart: ^0.68.0
  shimmer: ^3.0.0
  cached_network_image: ^3.3.1
  flutter_svg: ^2.0.10+1
  lottie: ^3.1.0
  connectivity_plus: ^6.0.3
  permission_handler: ^11.3.1
```

---

## AUTHENTIFICATION

### ⚠️ Authentification mobile — Bearer token (✅ déjà implémenté côté backend)
Le backend utilise un cookie `httpOnly` pour le `refreshToken` (web), **inaccessible en mobile**.
**Solution déjà en place** : utiliser le `accessToken` retourné dans le body JSON.
Le backend accepte **deux méthodes en parallèle** :
- Cookie `refreshToken` → clients web (priorité)
- Header `Authorization: Bearer <accessToken>` → clients mobiles Flutter

Stocker l'`accessToken` dans `flutter_secure_storage` et l'envoyer dans chaque requête.

### Endpoint Login
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "admin@ecole.ml",
  "password": "motdepasse"
}

Réponse 200:
{
  "accessToken": "eyJhbGc...",   ← stocker dans SecureStorage
  "user": {
    "id": "uuid",
    "email": "admin@ecole.ml",
    "firstName": "Moussa",
    "lastName": "Koné",
    "role": "SCHOOL_ADMIN",     ← détermine la navigation
    "tenantId": "uuid-ecole"
  }
}

Erreurs:
- 401: Email ou mot de passe incorrect
- 403: Compte désactivé
- 429: Trop de tentatives (rate limit)
```

### Endpoint Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
```

### AuthService (`lib/core/auth/auth_service.dart`)
```dart
// Stocker après login:
await secureStorage.write(key: 'access_token', value: data['accessToken']);
await secureStorage.write(key: 'user_json', value: jsonEncode(data['user']));

// Lire le token pour les requêtes:
final token = await secureStorage.read(key: 'access_token');

// Vérifier si connecté au démarrage:
final token = await secureStorage.read(key: 'access_token');
if (token == null) → redirige vers /login
```

### Intercepteur Dio
```dart
// Dans api_client.dart — ajouter automatiquement le token à chaque requête
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) async {
    final token = await secureStorage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  },
  onError: (error, handler) {
    if (error.response?.statusCode == 401) {
      // Token expiré → rediriger vers login
      authService.logout();
    }
    handler.next(error);
  },
));
```

---

## RÔLES ET NAVIGATION

Après login, rediriger selon `user.role` :

| Rôle | Route Flutter | Écrans accessibles |
|---|---|---|
| `SCHOOL_ADMIN` | `/dashboard` | Tout |
| `TEACHER` | `/teacher` | Dashboard, Présences, Notes, Emploi du temps |
| `STUDENT` | `/student` | Dashboard perso, Notes, Emploi du temps |
| `PARENT` | `/parent` | Suivi enfant, Notes, Factures |
| `ACCOUNTANT` | `/finance` | Factures, Paiements, Rapports |
| `HR_MANAGER` | `/hr` | Employés, Congés, Paie |
| `CENSEUR` | `/attendance` | Présences, Discipline |
| `SURVEILLANT` | `/attendance` | Présences |
| `SUPER_ADMIN` | `/admin` | Gestion multi-écoles |

---

## MODÈLES DART (lib/core/models/)

### User
```dart
class UserModel {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? tenantId;
}
```

### Student
```dart
class StudentModel {
  final String id;
  final String tenantId;
  final String studentNumber;    // ex: STU-2025-12345
  final String firstName;
  final String lastName;
  final DateTime dateOfBirth;
  final String gender;           // MALE | FEMALE | OTHER
  final String? photoUrl;
  final String nationalId;
  final String parentName;
  final String parentPhone;
  final String parentEmail;
  final String parentRelationship;
  final bool isActive;
  final String campusId;
}
```

### Grade (Note)
```dart
class GradeModel {
  final String id;
  final String studentId;
  final String subjectId;
  final String academicYearId;
  final int trimestre;           // 1, 2, ou 3
  final String examType;         // CONTINUOUS | MIDTERM | FINAL
  final double score;            // sur 20
  final double maxScore;         // = 20.0
  final String? comment;
  // relations incluses:
  final String? subjectName;
  final String? studentName;
}
```

### Invoice (Facture)
```dart
class InvoiceModel {
  final String id;
  final String tenantId;
  final String studentId;
  final String invoiceNumber;
  final String title;
  final String type;             // TUITION | REGISTRATION | etc.
  final double amount;           // en FCFA
  final String status;           // UNPAID | PAID | PARTIAL
  final DateTime dueDate;
  final DateTime? paidDate;
  final String? paymentMethod;   // ESPECES | ORANGE_MONEY | MOOV_MONEY | VIREMENT | CHEQUE
}
```

### Employee
```dart
class EmployeeModel {
  final String id;
  final String tenantId;
  final String employeeNumber;
  final String firstName;
  final String lastName;
  final String email;
  final String phoneNumber;
  final String employeeType;     // TEACHER | ADMINISTRATIVE | SUPPORT | DIRECTOR | ...
  final bool isActive;
  final String departmentId;
  final String? photoUrl;
}
```

### Attendance
```dart
class AttendanceRecord {
  final String studentId;
  final String studentName;
  final String matricule;
  final String status;           // PRESENT | ABSENT | LATE | EXCUSED
  final String? notes;
}
```

### DashboardStats
```dart
class DashboardStats {
  final int studentsCount;
  final int employeesCount;
  final double invoicesTotal;    // FCFA
  final double invoicesPaid;     // FCFA
}
```

### Timetable
```dart
class TimetableEntry {
  final String id;
  final String classroomId;
  final String subjectId;
  final String employeeId;
  final int dayOfWeek;           // 1=Lundi ... 5=Vendredi
  final String startTime;        // "08:00"
  final String endTime;          // "10:00"
  final String? subjectName;
  final String? teacherName;
}
```

---

## ENDPOINTS API COMPLETS

### Base URL
```dart
// lib/config/env.dart
const String kBaseUrl = 'https://YOUR_PRODUCTION_URL'; // ou http://localhost:3000 en dev
```

### Dashboard
```
GET /api/dashboard/stats
Auth: Bearer token requis
Réponse: { studentsCount, employeesCount, invoicesTotal, invoicesPaid }
```

### Élèves
```
GET  /api/students?search=&pageNumber=1&pageSize=20
POST /api/students
Body POST: {
  firstName, lastName, dateOfBirth (ISO), gender (MALE|FEMALE|OTHER),
  nationalId, parentName, parentPhone, parentEmail, parentRelationship,
  campusId,
  createStudentAccount: bool, studentEmail?, studentPassword?,
  createParentAccount: bool, parentAccountPassword?
}
Réponse POST: { id, studentNumber }

GET  /api/students/{id}
PUT  /api/students/{id}
```

### Présences
```
GET  /api/attendance?classroomId=uuid&date=2025-01-15
Réponse: [{ studentId, studentName, matricule, status, notes }]

POST /api/attendance
Body: {
  classroomId: "uuid",
  date: "2025-01-15",
  records: [
    { studentId: "uuid", status: "PRESENT|ABSENT|LATE|EXCUSED", notes: "" }
  ]
}
Réponse: { success: true }
```

### Notes
```
GET  /api/grades?studentId=uuid&trimestre=1&academicYearId=uuid
POST /api/grades
Body: { studentId, subjectId, academicYearId, trimestre, examType, score, comment }

GET  /api/grades?classroomId=uuid   ← notes d'une classe entière
```

### Classes
```
GET  /api/classrooms?academicYearId=uuid&campusId=uuid
POST /api/classrooms
Body: { name, level, stream?, series?, maxCapacity, campusId, academicYearId }
```

### Emploi du temps
```
GET    /api/timetable?classroomId=uuid
POST   /api/timetable
Body: { classroomId, subjectId, employeeId, dayOfWeek (1-7), startTime, endTime }
DELETE /api/timetable?id=uuid
```

### Matières
```
GET  /api/subjects
POST /api/subjects
Body: { name, code, coefficient }
```

### Années scolaires
```
GET  /api/academic-years
POST /api/academic-years
Body: { name, startDate, endDate, isActive }
```

### Campus
```
GET  /api/campuses
POST /api/campuses (ELITE uniquement — multi-campus)
Body: { name, address, city, region, phoneNumber, email?, managerName? }
```

### Finances — Factures
```
GET  /api/invoices?studentId=uuid&status=UNPAID
POST /api/invoices
Body: { studentId, title, type, amount, dueDate, notes? }

GET  /api/invoices/{id}
PUT  /api/invoices/{id}
```

### Finances — Paiements
```
POST /api/payments
Body: {
  invoiceId, amount, method (ESPECES|ORANGE_MONEY|MOOV_MONEY|VIREMENT|CHEQUE),
  reference?, notes?
}
```

### RH — Employés
```
GET  /api/employees?search=&type=TEACHER
POST /api/employees
Body: { firstName, lastName, email, phoneNumber, dateOfBirth, gender,
        hireDate, employeeType, departmentId, campusId }

GET  /api/employees/{id}
PUT  /api/employees/{id}
```

### RH — Congés
```
GET   /api/hr/leaves
POST  /api/hr/leaves
Body: { employeeId, startDate, endDate, type (SICK|ANNUAL|PERSONAL), reason }
PATCH /api/hr/leaves
Body: { id, status (APPROVED|REJECTED) }
```

### Fiches de paie (plan ELITE uniquement)
```
GET  /api/payslips?employeeId=uuid
POST /api/payslips
Body: {
  employeeId, periodStart, periodEnd, baseSalary,
  taxableBonuses?, nonTaxableBonuses?, numberOfChildren?
}
Réponse inclut: { payslip, maliBulletin: { netSalary, grossSalary, its, inpsEmployee, ... } }
```

### Inscriptions
```
GET  /api/enrollments?studentId=uuid&academicYearId=uuid
POST /api/enrollments
Body: { studentId, classroomId, academicYearId }
```

### Bibliothèque
```
GET  /api/library?search=
POST /api/library         ← ajouter un livre
POST /api/library/loans   ← emprunter un livre
Body loan: { bookId, studentId?, employeeId?, dueDate }
```

### Inventaire
```
GET  /api/inventory?category=
POST /api/inventory
POST /api/inventory/transactions
Body transaction: { itemId, type (IN|OUT|ADJUSTMENT), quantity, notes? }
```

### Dépenses
```
GET  /api/expenses?category=&startDate=&endDate=
POST /api/expenses
Body: { description, amount, date, category }
```

### Paramètres école
```
GET /api/school
PUT /api/settings
Body: { name, address, phoneNumber, email, motto?, logoUrl? }
```

### IA Assistant
```
POST /api/ai/analyze
Body: { prompt: "Quels sont les élèves en difficulté ?" }
Réponse: { answer: "...", contextUsed: { activeStudents, ... } }
```

---

## DESIGN SYSTEM FLUTTER

### Couleurs (`lib/config/theme.dart`)
```dart
const Color kPrimary = Color(0xFF4F8EF7);       // Bleu principal
const Color kSecondary = Color(0xFF0F172A);     // Bleu marine foncé
const Color kAccent = Color(0xFF8B5CF6);        // Violet (IA, actions spéciales)
const Color kSuccess = Color(0xFF10B981);       // Vert — payé, présent
const Color kWarning = Color(0xFFF59E0B);       // Ambre — en attente
const Color kDanger = Color(0xFFEF4444);        // Rouge — absent, impayé
const Color kBackground = Color(0xFFF8FAFC);    // Fond général
const Color kSurface = Color(0xFFFFFFFF);       // Cartes
const Color kBorder = Color(0xFFE2E8F0);        // Bordures
const Color kText = Color(0xFF0F172A);          // Texte principal
const Color kTextLight = Color(0xFF64748B);     // Texte secondaire
```

### Typographie
```dart
// Utiliser Google Fonts — Inter
TextTheme textTheme = GoogleFonts.interTextTheme();
```

### Thème global
```dart
ThemeData get lightTheme => ThemeData(
  colorScheme: ColorScheme.fromSeed(seedColor: kPrimary),
  useMaterial3: true,
  fontFamily: GoogleFonts.inter().fontFamily,
  scaffoldBackgroundColor: kBackground,
  cardTheme: CardTheme(
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: BorderSide(color: kBorder),
    ),
  ),
  appBarTheme: AppBarTheme(
    backgroundColor: kSurface,
    foregroundColor: kText,
    elevation: 0,
    centerTitle: false,
  ),
);
```

### Formatters (`lib/core/utils/formatters.dart`)
```dart
String formatXOF(double amount) {
  final formatter = NumberFormat('#,###', 'fr_FR');
  return '${formatter.format(amount.round())} FCFA';
}

String formatDate(DateTime date) {
  return DateFormat('dd/MM/yyyy', 'fr_FR').format(date);
}

String formatDateLong(DateTime date) {
  return DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(date);
}

Color statusColor(String status) {
  switch (status) {
    case 'PAID': case 'PRESENT': case 'APPROVED': return kSuccess;
    case 'UNPAID': case 'ABSENT': case 'REJECTED': return kDanger;
    case 'PARTIAL': case 'LATE': case 'PENDING': return kWarning;
    default: return kTextLight;
  }
}

String statusLabel(String status) {
  const labels = {
    'PAID': 'Payé', 'UNPAID': 'Impayé', 'PARTIAL': 'Partiel',
    'PRESENT': 'Présent', 'ABSENT': 'Absent', 'LATE': 'En retard', 'EXCUSED': 'Excusé',
    'PENDING': 'En attente', 'APPROVED': 'Approuvé', 'REJECTED': 'Rejeté',
    'ACTIVE': 'Actif', 'INACTIVE': 'Inactif',
  };
  return labels[status] ?? status;
}
```

---

## ÉCRANS À CRÉER (par ordre de priorité)

### 1. Login Screen (`features/auth/login_screen.dart`)
- Logo SchoolERP centré
- Champ Email + Mot de passe
- Bouton Connexion avec loading state
- Gestion des erreurs (rate limit, compte désactivé)
- Redirection automatique selon le rôle

### 2. Dashboard Admin (`features/dashboard/admin_dashboard.dart`)
- Barre du haut : "Bonjour [Prénom]", date du jour
- 4 KPI cards : Élèves, Employés, Total facturé, Total encaissé (FCFA)
- Accès rapides : grille de boutons vers les modules
- Design premium avec cards et ombres légères

### 3. Liste Élèves (`features/students/students_list_screen.dart`)
- Recherche en temps réel (debounce 300ms)
- Liste paginée (20 items par page)
- Card élève : photo (placeholder avatar), nom, matricule, statut
- FAB pour créer un nouvel élève
- Pull-to-refresh

### 4. Détail Élève (`features/students/student_detail_screen.dart`)
- Photo, infos personnelles
- Contacts parent (tap = appel téléphonique)
- Onglets : Infos | Notes | Factures | Présences

### 5. Appel de Présences (`features/attendance/attendance_screen.dart`)
- Sélecteur de classe (dropdown)
- Sélecteur de date (date picker)
- Liste élèves avec switch PRÉSENT / ABSENT / RETARD / EXCUSÉ
- Bouton "Enregistrer" qui POSTe tout d'un coup
- Indicateur visuel en temps réel (nb absents)

### 6. Notes (`features/grades/grades_screen.dart`)
- Filtre par trimestre (1, 2, 3) et type d'examen
- Tableau des notes : Matière | Note | /20 | Coefficient
- Calcul de la moyenne générale affiché en grand
- Couleur rouge si note < 10

### 7. Factures (`features/finance/invoices_screen.dart`)
- Onglets : IMPAYÉES | PAYÉES | TOUTES
- Card facture : titre, montant FCFA, date d'échéance, statut coloré
- Bouton paiement rapide
- FAB créer nouvelle facture

### 8. Enregistrer un Paiement (`features/finance/payment_screen.dart`)
- Sélecteur de méthode : Espèces | Orange Money | Moov Money | Virement | Chèque
- Montant à payer (pré-rempli, modifiable pour paiement partiel)
- Champ référence (numéro de reçu)
- Confirmation avec dialog

### 9. Emploi du Temps (`features/timetable/timetable_screen.dart`)
- Vue hebdomadaire (Lun → Ven)
- Grille horaire par heure
- Chaque créneau : matière, professeur, couleur par matière

### 10. Profil (`features/profile/profile_screen.dart`)
- Infos utilisateur
- Bouton déconnexion avec confirmation

### 11. Dashboard Professeur (`features/teacher/teacher_dashboard.dart`)
- Mes classes aujourd'hui (emploi du temps du jour)
- Accès rapide : Prendre les présences | Saisir des notes

### 12. Dashboard Élève (`features/student/student_dashboard.dart`)
- Mes notes du trimestre courant
- Mon emploi du temps
- Mes absences

### 13. Dashboard Parent (`features/parent/parent_dashboard.dart`)
- Notes de mon enfant
- Absences récentes
- Factures impayées avec montant total dû

---

## WIDGETS RÉUTILISABLES À CRÉER

```dart
// lib/core/widgets/

// Carte KPI
KpiCard({ required String title, required String value, required IconData icon, required Color color })

// Chip de statut coloré
StatusChip({ required String status })  // utilise statusColor() et statusLabel()

// Shimmer de chargement
LoadingShimmer({ double height = 80 })

// État vide
EmptyState({ required String message, required IconData icon })

// Bouton principal
PrimaryButton({ required String label, required VoidCallback onPressed, bool isLoading = false })

// En-tête de section
SectionHeader({ required String title, Widget? action })

// Indicateur de connexion hors ligne
OfflineBanner()  // utilise connectivity_plus
```

---

## GESTION DES ERREURS

```dart
// Structure de réponse erreur du backend:
// { "error": "Message d'erreur lisible" }

class ApiException implements Exception {
  final int statusCode;
  final String message;
}

// Dans chaque provider Riverpod:
// state = AsyncValue.error(ApiException(statusCode: 403, message: 'Accès refusé'), stackTrace)

// Affichage:
// ref.watch(myProvider).when(
//   loading: () => LoadingShimmer(),
//   error: (e, _) => ErrorState(message: e is ApiException ? e.message : 'Erreur inconnue'),
//   data: (data) => MyWidget(data: data),
// )
```

---

## PROVIDERS RIVERPOD EXEMPLE

```dart
// lib/features/students/students_provider.dart

@riverpod
class StudentsNotifier extends _$StudentsNotifier {
  @override
  Future<List<StudentModel>> build() async {
    return _fetchStudents();
  }

  Future<List<StudentModel>> _fetchStudents({String search = '', int page = 1}) async {
    final client = ref.read(apiClientProvider);
    final response = await client.get(
      '/api/students',
      queryParameters: {'search': search, 'pageNumber': page, 'pageSize': 20},
    );
    return (response.data['items'] as List)
        .map((e) => StudentModel.fromJson(e))
        .toList();
  }

  Future<void> createStudent(Map<String, dynamic> data) async {
    final client = ref.read(apiClientProvider);
    await client.post('/api/students', data: data);
    ref.invalidateSelf(); // rafraîchit la liste
  }
}
```

---

## POINTS SPÉCIAUX À IMPLÉMENTER

### 1. Mode hors ligne
- Mettre en cache les données critiques (élèves, emploi du temps) avec `shared_preferences`
- Afficher `OfflineBanner` si pas de connexion
- Les actions de création/modification ne sont pas disponibles hors ligne

### 2. Téléphonie
```dart
// Appel parent depuis la fiche élève
import 'package:url_launcher/url_launcher.dart';
await launchUrl(Uri.parse('tel:${student.parentPhone}'));
```

### 3. Format des dates pour l'API
```dart
// Toujours envoyer les dates en ISO 8601
DateTime.now().toIso8601String()  // "2025-01-15T10:30:00.000Z"
```

### 4. Pagination
```dart
class PaginatedResponse<T> {
  final List<T> items;
  final int totalCount;
  final int totalPages;
  final int pageNumber;
}
```

### 5. Sécurité du token
```dart
// Durée de vie du accessToken : 15 minutes
// Si 401 reçu → vider le SecureStorage et rediriger vers /login
// NE PAS implémenter de refresh token silencieux (le backend ne l'expose pas encore)
// L'utilisateur devra se reconnecter manuellement après 15 minutes
// TODO futur: ajouter un endpoint /api/auth/refresh
```

---

## CONFIGURATION INITIALE

### Commandes pour créer le projet
```bash
flutter create school_erp_mobile --org ml.schoolerp --platforms android,ios
cd school_erp_mobile
flutter pub add flutter_riverpod riverpod_annotation dio flutter_secure_storage shared_preferences intl google_fonts fl_chart shimmer cached_network_image lottie connectivity_plus go_router
flutter pub add --dev build_runner riverpod_generator json_serializable
```

### `lib/config/env.dart`
```dart
class Env {
  // Changer cette URL selon l'environnement
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://10.0.2.2:3000', // Android emulator → localhost
  );
  // iOS simulator: 'http://localhost:3000'
  // Appareil physique: 'http://192.168.x.x:3000' (IP locale)
  // Production: 'https://schoolerp.pro'
}
```

---

## ORDRE DE DÉVELOPPEMENT RECOMMANDÉ

1. **Setup** : Créer projet, ajouter packages, configurer theme et couleurs
2. **ApiClient** : Dio + intercepteur JWT + gestion erreurs
3. **Auth** : Login screen + AuthService + SecureStorage + navigation par rôle
4. **Dashboard** : KPIs avec vraies données API
5. **Élèves** : Liste paginée + Détail
6. **Présences** : Appel + Enregistrement (fonctionnalité la plus utilisée quotidiennement)
7. **Notes** : Consultation + Saisie
8. **Finance** : Factures + Paiements
9. **RH** : Employés + Congés
10. **Emploi du temps** : Vue hebdomadaire
11. **Dashboard Prof / Élève / Parent** : Vues spécialisées par rôle
12. **Polish** : Animations, offline mode, téléphonie

---

*Ce prompt est auto-suffisant. L'IA n'a pas besoin d'accéder au code backend pour développer l'app Flutter.*
