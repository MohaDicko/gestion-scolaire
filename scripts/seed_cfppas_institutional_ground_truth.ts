import { PrismaClient, Gender, EmployeeType, ContractType, ContractStatus, ExamType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage de l\'alimentation institutionnelle CFP-PAS...');

  // 1. Récupération de l'école CFP-PAS
  const school = await prisma.school.findFirst({
    where: { OR: [{ code: 'CFPPAS' }, { name: { contains: 'CFP-PAS' } }] },
    include: { campuses: true }
  });

  if (!school) {
    throw new Error('❌ École CFP-PAS introuvable !');
  }

  console.log(`✅ École : ${school.name} (${school.id})`);

  // Mise à jour des informations officielles de l'école
  await prisma.school.update({
    where: { id: school.id },
    data: {
      name: "Centre de Formation Professionnelle pour la Promotion de l'Agriculture au Sahel",
      address: "B.P. 226 - Quartier Château Secteur III, Rue 363 Porte 54",
      city: "Gao",
      country: "Mali",
      phoneNumber: "+223 21 82 07 62",
      email: "cfppasgao98@gmail.com",
      gradingScale: 100, // Barème APC officiel
      motto: "Un Peuple - Un But - Une Foi | Excellence Agro-Pastorale au Sahel"
    }
  });

  // Campus
  let campus = school.campuses[0];
  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        tenantId: school.id,
        name: 'Campus Principal Gao - Château Secteur III',
        address: 'B.P. 226, Rue 363 Porte 54',
        city: 'Gao',
        region: 'Gao',
        phoneNumber: '+223 21 82 07 62',
        managerName: 'Ousmane MAMADOU'
      }
    });
  }

  // Année académique
  let academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: school.id, isActive: true }
  });
  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        tenantId: school.id,
        name: '2025-2026',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2026-06-30'),
        isActive: true
      }
    });
  }

  // Département Pédagogique
  let dept = await prisma.department.findFirst({
    where: { tenantId: school.id, code: 'PED' }
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        tenantId: school.id,
        name: 'Pédagogie Agro-Pastorale',
        code: 'PED',
        description: 'Formation Professionnelle Agricole & Élevage'
      }
    });
  }

  // 2. Les 21 Professeurs Officiels (Liste transmise)
  const officialTeachers = [
    { num: 1, firstName: 'Ibrahim', lastName: 'Ag Mohamed', phone: '+223 76 05 14 76', email: 'ibrahim.agmohamed@cfppas-gao.ml' },
    { num: 2, firstName: 'Abdoulaye', lastName: "N'diaye", phone: '+223 75 41 58 46', email: 'abdoulaye.ndiaye@cfppas-gao.ml' },
    { num: 3, firstName: 'Yacouba', lastName: 'Alassane', phone: '+223 76 05 16 93', email: 'yacouba.alassane@cfppas-gao.ml' },
    { num: 4, firstName: 'Ousmane', lastName: 'Alhassane', phone: '+223 79 24 42 39', email: 'ousmane.alhassane@cfppas-gao.ml' },
    { num: 5, firstName: 'Sinaly', lastName: 'Ousmane', phone: '+223 77 71 51 65', email: 'sinaly.ousmane@cfppas-gao.ml' },
    { num: 6, firstName: 'Sekou', lastName: 'Konta', phone: '+223 79 03 67 55', email: 'sekou.konta@cfppas-gao.ml' },
    { num: 7, firstName: 'Djibrilla', lastName: 'Maiga', phone: '+223 76 14 61 67', email: 'djibrilla.maiga@cfppas-gao.ml' },
    { num: 8, firstName: 'Alkassou', lastName: 'Youssouf', phone: '+223 75 20 31 30', email: 'alkassou.youssouf@cfppas-gao.ml' },
    { num: 9, firstName: 'Abdrhamane', lastName: 'Abdoulaye', phone: '+223 78 74 61 48', email: 'abdrhamane.abdoulaye@cfppas-gao.ml' },
    { num: 10, firstName: 'Ahmaou Aliou', lastName: 'Maiga', phone: '+223 93 23 55 44', email: 'ahmaou.maiga@cfppas-gao.ml' },
    { num: 11, firstName: 'Aguissa', lastName: 'Issoufi', phone: '+223 75 73 18 55', email: 'aguissa.issoufi@cfppas-gao.ml' },
    { num: 12, firstName: 'Soumaguil', lastName: 'Ibrahim', phone: '+223 75 37 44 20', email: 'soumaguil.ibrahim@cfppas-gao.ml' },
    { num: 13, firstName: 'Abdoul Naser', lastName: 'Maiga', phone: '+223 94 96 22 31', email: 'abdoulnaser.maiga@cfppas-gao.ml' },
    { num: 14, firstName: 'Abdoul Naser', lastName: 'Touré', phone: '+223 77 50 73 74', email: 'abdoulnaser.toure@cfppas-gao.ml' },
    { num: 15, firstName: 'Hawa', lastName: 'Idrissa', phone: '+223 73 18 29 33', email: 'hawa.idrissa@cfppas-gao.ml', gender: Gender.FEMALE },
    { num: 16, firstName: 'Sidi', lastName: 'Kalane', phone: '+223 78 88 32 16', email: 'sidi.kalane@cfppas-gao.ml' },
    { num: 17, firstName: 'Ibrahim', lastName: 'Hamidou', phone: '+223 75 31 61 81', email: 'ibrahim.hamidou@cfppas-gao.ml' },
    { num: 18, firstName: 'Souleymane', lastName: 'Ongoiba', phone: '+223 77 41 48 45', email: 'souleymane.ongoiba@cfppas-gao.ml' },
    { num: 19, firstName: 'Mahamadou Seyba', lastName: 'Kondo', phone: '+223 70 37 71 49', email: 'mahamadou.kondo@cfppas-gao.ml' },
    { num: 20, firstName: 'Abdoulaye', lastName: 'Amadou', phone: '+223 74 73 75 48', email: 'abdoulaye.amadou@cfppas-gao.ml' },
    { num: 21, firstName: 'Abdoulaye Youssouf Yana', lastName: 'Touré', phone: '+223 73 37 25 08', email: 'abdoulaye.yana@cfppas-gao.ml' }
  ];

  console.log('👨‍🏫 Synchronisation des 21 professeurs officiels...');
  const teacherMap = new Map<number, string>();

  for (const t of officialTeachers) {
    const empNumber = `ENS-CFP-${String(t.num).padStart(3, '0')}`;
    let employee = await prisma.employee.findUnique({
      where: { employeeNumber: empNumber }
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          tenantId: school.id,
          employeeNumber: empNumber,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phoneNumber: t.phone,
          dateOfBirth: new Date(1985, 0, 1),
          gender: t.gender || Gender.MALE,
          hireDate: new Date(2023, 9, 1),
          employeeType: EmployeeType.TEACHER,
          departmentId: dept.id,
          campusId: campus.id,
          isActive: true
        }
      });
      console.log(`  + Enseignant créé : ${t.num}. ${t.firstName} ${t.lastName} (${t.phone})`);
    } else {
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          firstName: t.firstName,
          lastName: t.lastName,
          phoneNumber: t.phone,
          email: t.email
        }
      });
      console.log(`  * Enseignant actualisé : ${t.num}. ${t.firstName} ${t.lastName} (${t.phone})`);
    }

    teacherMap.set(t.num, employee.id);

    // Contrat Vacataire à 1 750 FCFA / h
    const existingContract = await prisma.contract.findFirst({
      where: { employeeId: employee.id, status: ContractStatus.ACTIVE }
    });

    if (!existingContract) {
      await prisma.contract.create({
        data: {
          tenantId: school.id,
          employeeId: employee.id,
          contractType: ContractType.TEMPORARY,
          baseSalary: 0,
          hourlyRate: 1750,
          startDate: new Date('2025-10-01'),
          status: ContractStatus.ACTIVE,
          currency: 'XOF'
        }
      });
    } else {
      await prisma.contract.update({
        where: { id: existingContract.id },
        data: { hourlyRate: 1750 }
      });
    }
  }

  // 3. Référentiel des 38 Matières & Modules BT2 Entreprise Agricole
  const officialModules = [
    // 6 Enseignements généraux
    { n: 1, code: 'GEN-FR', name: 'Français 9 unités', hours: 135, threshold: 75, coef: 2.0, note: 79 },
    { n: 2, code: 'GEN-MATH', name: 'Maths', hours: 135, threshold: 75, coef: 2.0, note: 75 },
    { n: 3, code: 'GEN-ANG', name: 'Anglais technique 6 unités', hours: 90, threshold: 75, coef: 1.5, note: 78 },
    { n: 4, code: 'GEN-EPS', name: 'Éducation physique et sportive 8 unités', hours: 60, threshold: 75, coef: 1.0, note: 80 },
    { n: 5, code: 'GEN-PC', name: 'Physique et chimie 7 unités', hours: 105, threshold: 75, coef: 1.5, note: 75 },
    { n: 6, code: 'GEN-ECM', name: 'Éducation civique et morale 4 unités', hours: 60, threshold: 75, coef: 1.0, note: 75 },
    // 32 Modules techniques professionnels
    { n: 7, code: 'MOD-01', name: 'Module 01 : Métier et formation', hours: 15, threshold: 75, coef: 1.0, note: 90 },
    { n: 8, code: 'MOD-02', name: 'Module 02 : Hygiène, Santé et Sécurité au travail', hours: 30, threshold: 75, coef: 1.0, note: 80 },
    { n: 9, code: 'MOD-03', name: "Module 03 : Étude de l'anatomie, de la morphologie et de la physiologie végétale", hours: 120, threshold: 80, coef: 2.5, note: 90 },
    { n: 10, code: 'MOD-04', name: "Module 04 : Étude de la topographie d'un terrain", hours: 75, threshold: 75, coef: 1.5, note: 75 },
    { n: 11, code: 'MOD-05', name: "Module 05 : L'outillage et la machinerie agricole", hours: 60, threshold: 75, coef: 1.5, note: 95 },
    { n: 12, code: 'MOD-06', name: "Module 06 : Étude du sol", hours: 120, threshold: 80, coef: 2.5, note: 95 },
    { n: 13, code: 'MOD-07', name: "Module 07 : Amendement du sol", hours: 75, threshold: 75, coef: 1.5, note: 85 },
    { n: 14, code: 'MOD-08', name: "Module 08 : Préparation du sol", hours: 120, threshold: 80, coef: 2.5, note: 85 },
    { n: 15, code: 'MOD-09', name: "Module 09 : Les pesticides et leurs utilisations", hours: 120, threshold: 75, coef: 2.0, note: 75 },
    { n: 16, code: 'MOD-10', name: "Module 10 : Fertilisation des sols", hours: 120, threshold: 80, coef: 2.5, note: 85 },
    { n: 17, code: 'MOD-11', name: "Module 11 : Conservation et restauration des sols", hours: 120, threshold: 75, coef: 2.0, note: 78 },
    { n: 18, code: 'MOD-12', name: "Module 12 : Protection des végétaux", hours: 120, threshold: 80, coef: 2.5, note: 92.5 },
    { n: 19, code: 'MOD-13', name: "Module 13 : Semis et entretien du champ", hours: 90, threshold: 80, coef: 2.0, note: 85 },
    { n: 20, code: 'MOD-14', name: "Module 14 : Les principales cultures", hours: 120, threshold: 75, coef: 2.5, note: 75 },
    { n: 21, code: 'MOD-15', name: "Module 15 : Pratique du maraîchage", hours: 120, threshold: 75, coef: 2.5, note: 75 },
    { n: 22, code: 'MOD-16', name: "Module 16 : Pratique de l'arboriculture", hours: 15, threshold: 75, coef: 1.0, note: 75 },
    { n: 23, code: 'MOD-17', name: "Module 17 : Étude de l'anatomie, de la morphologie et de la physiologie animale", hours: 90, threshold: 75, coef: 2.0, note: 78 },
    { n: 24, code: 'MOD-18', name: "Module 18 : Élevage des bovins, ovins, caprins et camelins", hours: 120, threshold: 75, coef: 2.5, note: 75 },
    { n: 25, code: 'MOD-19', name: "Module 19 : Pratique de l'aviculture", hours: 90, threshold: 75, coef: 2.0, note: 75 },
    { n: 26, code: 'MOD-20', name: "Module 20 : Pratique de l'apiculture", hours: 90, threshold: 75, coef: 2.0, note: 85 },
    { n: 27, code: 'MOD-21', name: "Module 21 : Récolte et gestion de la production", hours: 90, threshold: 80, coef: 2.0, note: 100 },
    { n: 28, code: 'MOD-22', name: "Module 22 : Protection de l'environnement", hours: 60, threshold: 75, coef: 1.5, note: 75 },
    { n: 29, code: 'MOD-23', name: "Module 23 : Étude des normes de construction et d'entretien des bâtiments agricoles", hours: 60, threshold: 75, coef: 1.5, note: 75 },
    { n: 30, code: 'MOD-24', name: "Module 24 : Études des méthodes comptables", hours: 45, threshold: 75, coef: 1.5, note: 75 },
    { n: 31, code: 'MOD-25', name: "Module 25 : Exploitation de l'outil informatique", hours: 60, threshold: 75, coef: 1.5, note: 77 },
    { n: 32, code: 'MOD-26', name: "Module 26 : La communication", hours: 45, threshold: 75, coef: 1.0, note: 75 },
    { n: 33, code: 'MOD-27', name: "Module 27 : Gestion et planification des ressources humaines", hours: 45, threshold: 75, coef: 1.5, note: 78 },
    { n: 34, code: 'MOD-28', name: "Module 28 : Gestion et planification des ressources matérielles", hours: 45, threshold: 75, coef: 1.5, note: 75 },
    { n: 35, code: 'MOD-29', name: "Module 29 : Pratique des techniques d'élaboration d'un projet", hours: 75, threshold: 75, coef: 2.0, note: 75 },
    { n: 36, code: 'MOD-30', name: "Module 30 : Gestion d'entreprise agricole", hours: 75, threshold: 75, coef: 2.0, note: 80 },
    { n: 37, code: 'MOD-31', name: "Module 31 : Techniques de recherche d'emploi", hours: 30, threshold: 75, coef: 1.0, note: 80 },
    { n: 38, code: 'MOD-32', name: "Module 32 : Stage en milieu de travail", hours: 120, threshold: 75, coef: 3.0, note: 75.5 }
  ];

  console.log('📚 Synchronisation des 38 modules du référentiel APC...');
  const subjectMap = new Map<string, string>();

  for (const m of officialModules) {
    let subject = await prisma.subject.findFirst({
      where: { tenantId: school.id, code: m.code }
    });

    if (!subject) {
      subject = await prisma.subject.create({
        data: {
          tenantId: school.id,
          name: m.name,
          code: m.code,
          coefficient: m.coef
        }
      });
      console.log(`  + Module créé : ${m.code} - ${m.name}`);
    } else {
      await prisma.subject.update({
        where: { id: subject.id },
        data: { name: m.name, coefficient: m.coef }
      });
      console.log(`  * Module actualisé : ${m.code} - ${m.name}`);
    }
    subjectMap.set(m.code, subject.id);
  }

  // 4. Classe BT2 Entreprise Agricole
  let bt2Class = await prisma.classroom.findFirst({
    where: { tenantId: school.id, name: 'BT2 Entreprise Agricole' }
  });
  if (!bt2Class) {
    bt2Class = await prisma.classroom.create({
      data: {
        tenantId: school.id,
        campusId: campus.id,
        academicYearId: academicYear.id,
        name: 'BT2 Entreprise Agricole',
        level: 'BT2',
        stream: 'Entreprise Agricole',
        maxCapacity: 40
      }
    });
    console.log(`✅ Classe créée : BT2 Entreprise Agricole`);
  }

  // 5. Étudiant Officiel : Souleymane ALASSANE (Matricule: RC18PB19G517M)
  const studentMle = 'RC18PB19G517M';
  let student = await prisma.student.findUnique({
    where: { studentNumber: studentMle }
  });

  if (!student) {
    student = await prisma.student.create({
      data: {
        tenantId: school.id,
        campusId: campus.id,
        studentNumber: studentMle,
        firstName: 'Souleymane',
        lastName: 'ALASSANE',
        gender: Gender.MALE,
        nationalId: 'NIN-RC18PB19G517M',
        dateOfBirth: new Date(1999, 4, 12),
        parentName: 'Alassane Touré',
        parentPhone: '+223 76 05 16 93',
        parentEmail: 'contact.alassane@gmail.com',
        parentRelationship: 'Père',
        isActive: true
      }
    });
    console.log(`✅ Étudiant créé : Souleymane ALASSANE (${studentMle})`);
  }

  // Inscription
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, classroomId: bt2Class.id }
  });
  if (!existingEnrollment) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classroomId: bt2Class.id,
        academicYearId: academicYear.id,
        status: 'ACTIVE'
      }
    });
    console.log(`✅ Inscription validée en BT2 Entreprise Agricole`);
  }

  // 6. Notes officielles (.../100) pour Souleymane ALASSANE
  console.log('📝 Insertion des 38 notes officielles (/100) pour Souleymane ALASSANE...');
  for (const m of officialModules) {
    const subjId = subjectMap.get(m.code);
    if (!subjId) continue;

    const existingGrade = await prisma.grade.findFirst({
      where: {
        studentId: student.id,
        subjectId: subjId,
        academicYearId: academicYear.id
      }
    });

    if (!existingGrade) {
      await prisma.grade.create({
        data: {
          studentId: student.id,
          subjectId: subjId,
          academicYearId: academicYear.id,
          trimestre: 1,
          examType: ExamType.FINAL,
          score: m.note,
          maxScore: 100.0,
          comment: `Seuil ${m.threshold}% - SUCCES`
        }
      });
    } else {
      await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          score: m.note,
          maxScore: 100.0,
          comment: `Seuil ${m.threshold}% - SUCCES`
        }
      });
    }
  }

  console.log('🎉 Alimentation terminée avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'alimentation :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
