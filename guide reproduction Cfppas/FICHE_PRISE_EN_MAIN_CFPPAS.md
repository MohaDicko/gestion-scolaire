# 🇲🇱 RÉPUBLIQUE DU MALI
### MINISTÈRE DE L'ÉDUCATION NATIONALE • MINISTÈRE DE L'EMPLOI ET DE LA FORMATION PROFESSIONNELLE
**CENTRE DE FORMATION PROFESSIONNELLE AGRO-PASTORALE (CFP-PAS) DE GAO**  
*Quartier Château, Route de Bourem — Gao, Mali | Tél : +223 21 82 07 62*  
*Devise : « Discipline – Travail – Réussite »*

---

# 📘 FICHE DE PRISE EN MAIN RAPIDE • SYSTÈME SCHOOLERP PRO
**Document d'Exploitation Institutionnel à l'usage de la Direction, du Corps Enseignant et de l'Administration**

---

## 1. 🔑 Accès au Portail & Comptes par Fonction

### A. Adresses d'accès
* **En réseau local / Salle informatique :** `http://localhost:3000` (ou IP locale `http://172.30.16.1:3000`)
* **En ligne / Déploiement Cloud :** URL officielle Vercel du CFP-PAS.

### B. Matrice des profils & Accès initiaux

| Fonction | Rôle Système | Identifiant Démo / Officiel | Périmètre & Responsabilités |
| :--- | :---: | :--- | :--- |
| **Direction Générale** | `SCHOOL_ADMIN` | `admin@cfppas-gao.ml` | Pilotage global, paramétrage de l'école, clôture des périodes, audit. |
| **Service Comptabilité & Caisse** | `ACCOUNTANT` | `compta@cfppas-gao.ml` | Encaissement scolarités, reçus WhatsApp, Grand Livre SYSCOHADA. |
| **Ressources Humaines** | `HR_MANAGER` | `rh@cfppas-gao.ml` | Gestion des vacataires, émargement des heures, bordereaux de paie. |
| **Formateurs & Enseignants** | `TEACHER` | `prof@cfppas-gao.ml` | Saisie des notes, relevés de compétences, présence des apprenants. |
| **Surveillance & Discipline** | `SURVEILLANT` | `surveillant@cfppas-gao.ml` | Pointage des absences, retards, fiches de discipline. |
| **Super Administrateur DSI** | `SUPER_ADMIN` | `superadmin@schoolerp.ml` | Maintenance système, diagnostics, sauvegardes globales. |

> **Consigne de sécurité DSI :** Lors de la première prise de fonction officielle, chaque utilisateur doit immédiatement modifier son mot de passe temporaire dans la section **Mon Profil** (`/profile`).

---

## 2. 🌾 Gestion Pédagogique & Apprenants

### A. Promotions et Filières actives au CFP-PAS
L'ERP gère l'ensemble des filières professionnelles certifiées du centre :
* **Agro-Pastorale :** 1ère Année Agro-Pastorale (1ère A), 1ère Année Agriculture, 2ème Année Élevage (2ème E)
* **Entreprise Agricole (Brevet de Technicien) :** 1ère EA, 2ème EA, BT2 Entreprise Agricole
* **Santé Animale :** 1ère Année Technicien d'Élevage (1ère TE)
* **Cycles Professionnels :** 2ème Modulaire, 3ème & 4ème Année Classique

### B. Inscription et Cartes Scolaires
1. **Nouvel Apprenant :** Menu **Apprenants** ➔ **Nouvelle Inscription** (`/students/enroll`). Renseigner nom, prénom, filière, régime (interne/externe) et contact tuteur (+223).
2. **Édition des Badges / Cartes :** Menu **Cartes Scolaires** (`/students/cards`). Génération instantanée avec QR Code sécurisé et photo de l'apprenant.

---

## 3. 📝 Saisie des Notes & Bulletins Sécurisés

### A. Saisie Sécurisée avec Sauvegarde Anti-Coupure
Pour prévenir toute perte de saisie due aux coupures de courant ou d'Internet à Gao, l'interface de notation (`/grades`) intègre un **mécanisme local anti-perte** :
* Chaque note tapée est enregistrée en direct dans la mémoire du navigateur (`localStorage`).
* En cas de rechargement ou de déconnexion inopinée, un badge vert **« 💾 Brouillon local restauré »** réinjecte instantanément vos données.
* Bouton **« Enregistrer définitivement »** : envoie la grille complète sur le serveur sécurisé.

### B. Bulletins & Relevés de Compétences
* Menu **Rapports ➔ Bulletins Officiels** (`/reports/bulletins`).
* **Sceau Numérique & Signature :** Le bulletin officiel généré au format PDF intègre automatiquement l'en-tête ministériel du Mali, le cachet certifié de la Direction du CFP-PAS et les moyennes coefficientées.
* **Téléchargement & Impression :** Export individuel ou par classe complète en un seul clic.

---

## 4. 💰 Caisse, Scolarités & Comptabilité SYSCOHADA

### A. Encaissement & Reçu WhatsApp Immédiat
1. Accédez à **Finances ➔ Paiements** (`/finance/payments`).
2. Sélectionnez l'apprenant, le mois ou la tranche (Frais d'inscription, mensualité, internat).
3. Enregistrez le règlement (Espèces, Chèque, Orange Money).
4. **Partage WhatsApp instantané :** Cliquez sur le bouton vert **WhatsApp**. Le système préformate le reçu officiel certifié avec le montant, la filière et la référence de paiement, et l'envoie directement au numéro du tuteur (+223).

### B. Grand Livre & Plan Comptable SYSCOHADA Révisé
* Accédez à **Finances ➔ Grand Livre** (`/finance/ledger`) et **Rapports Financiers** (`/finance/report`).
* Le système ventile automatiquement les flux selon les normes comptables de l'OHADA :
  * **Comptes 706 / 708 :** Produits des scolarités et prestations de formation.
  * **Compte 661 :** Rémunération des formateurs vacataires et personnel enseignant.
  * **Compte 521 / 571 :** Banques et Caisse locale en FCFA.

---

## 5. ⏱️ Gestion des Vacataires & Ressources Humaines

### A. Suivi des Heures Dispensées
* Menu **Ressources Humaines ➔ Feuilles de Temps** (`/hr/timesheet`).
* Les formateurs ou le surveillant général saisissent les volumes horaires réels par module et par filière.

### B. Bordereaux d'Émargement & de Paiement
* Menu **Ressources Humaines ➔ Vacataires** (`/api/hr/vacataires`).
* Génération automatique du bordereau de règlement mensuel avec taux horaire contractuel, total des heures validées et visa de la Direction.

---

## 6. 🌐 Résilience & Continuité d'Activité (Mode Gao / PWA)

L'application a été spécialement durcie pour fonctionner dans des conditions de connectivité fluctuante :
* **Installation sur Téléphone / Tablette / PC :** L'application est une **PWA (Progressive Web App)**. Vous pouvez l'installer sur l'écran d'accueil sans passer par un magasin d'applications.
* **Mode Hors-Ligne :** Les consultations des listes d'apprenants, des emplois du temps et les saisies de notes restent fonctionnelles même sans connexion Internet active grâce au Service Worker local.

---

## 7. 📞 Support & Contacts Institutionnels

* **Direction du CFP-PAS de Gao :** Quartier Château, Route de Bourem, Gao
* **Téléphone Direction :** +223 21 82 07 62
* **Support Technique / DSI :** `support@cfppas-gao.ml` / `admin@cfppas-gao.ml`
* **Version du Système :** SchoolERP Pro v1.1.0 • Certification DSI 2026

