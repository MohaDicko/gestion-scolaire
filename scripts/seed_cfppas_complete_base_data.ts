import { PrismaClient, Gender, EnrollmentStatus, ExamType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage de l\'intégration complète des données de base CFP-PAS...');

  // 1. École et Campus
  const school = await prisma.school.findFirst({
    where: { OR: [{ code: 'CFPPAS' }, { name: { contains: 'CFP-PAS' } }] },
    include: { campuses: true }
  });
  if (!school) throw new Error("École CFP-PAS introuvable");

  const campus = school.campuses[0];
  const academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: school.id, isActive: true }
  });
  if (!academicYear) throw new Error("Année académique introuvable");

  // 2. Classes
  const class1A = await prisma.classroom.findFirst({ where: { tenantId: school.id, name: { contains: '1ère' } } });
  const class2E = await prisma.classroom.findFirst({ where: { tenantId: school.id, name: { contains: '2ème Année' } } });
  const classBT2 = await prisma.classroom.findFirst({ where: { tenantId: school.id, name: { contains: 'BT2' } } });
  const classMod = await prisma.classroom.findFirst({ where: { tenantId: school.id, name: { contains: 'Modulaire' } } });

  if (!class1A || !class2E || !classBT2) {
    throw new Error("Classes introuvables");
  }

  // 3. Récupération des enseignants
  const teachers = await prisma.employee.findMany({
    where: { tenantId: school.id, employeeType: 'TEACHER' }
  });
  console.log(`👨‍🏫 Enseignants trouvés : ${teachers.length}`);

  const teacherByPhone = new Map<string, string>();
  for (const t of teachers) {
    const rawDigits = t.phoneNumber.replace(/\D/g, '').slice(-8);
    teacherByPhone.set(rawDigits, t.id);
  }

  // Helper pour trouver un prof
  const getProfId = (phoneDigits: string, fallbackIndex = 0) => {
    return teacherByPhone.get(phoneDigits) || teachers[fallbackIndex]?.id;
  };

  // 4. Récupération des matières
  const subjects = await prisma.subject.findMany({ where: { tenantId: school.id } });
  const subjectByCode = new Map<string, string>();
  for (const s of subjects) {
    subjectByCode.set(s.code, s.id);
  }

  // 5. Nettoyage et insertion des Emplois du Temps (Timetable)
  console.log('📅 Génération des emplois du temps officiels par classe...');
  await prisma.timetable.deleteMany({ where: { tenantId: school.id } });

  const timetableEntries: Array<{
    classroomId: string;
    subjectCode: string;
    profPhone: string;
    dayOfWeek: number; // 1=Lundi .. 6=Samedi
    startTime: string;
    endTime: string;
  }> = [
    // ─── 1ère Année Agro-Pastorale (1ère A) ──────────────────────────────────
    // Lundi
    { classroomId: class1A.id, subjectCode: 'GEN-FR', profPhone: '76051693', dayOfWeek: 1, startTime: '07:30', endTime: '09:30' }, // Yacouba Alassane
    { classroomId: class1A.id, subjectCode: 'MOD-01', profPhone: '76051476', dayOfWeek: 1, startTime: '09:30', endTime: '11:30' }, // Ibrahim Ag Mohamed
    { classroomId: class1A.id, subjectCode: 'MOD-03', profPhone: '74737548', dayOfWeek: 1, startTime: '11:30', endTime: '13:30' }, // Abdoulaye Amadou
    // Mardi
    { classroomId: class1A.id, subjectCode: 'GEN-MATH', profPhone: '75415846', dayOfWeek: 2, startTime: '07:30', endTime: '09:30' }, // Abdoulaye N'diaye
    { classroomId: class1A.id, subjectCode: 'MOD-06', profPhone: '78746148', dayOfWeek: 2, startTime: '09:30', endTime: '11:30' }, // Abdrhamane Abdoulaye
    { classroomId: class1A.id, subjectCode: 'GEN-PC', profPhone: '75374420', dayOfWeek: 2, startTime: '11:30', endTime: '13:30' }, // Soumaguil Ibrahim
    // Mercredi
    { classroomId: class1A.id, subjectCode: 'GEN-ANG', profPhone: '75731855', dayOfWeek: 3, startTime: '07:30', endTime: '09:30' }, // Aguissa Issoufi
    { classroomId: class1A.id, subjectCode: 'MOD-13', profPhone: '76146167', dayOfWeek: 3, startTime: '09:30', endTime: '11:30' }, // Djibrilla Maiga
    { classroomId: class1A.id, subjectCode: 'MOD-02', profPhone: '73182933', dayOfWeek: 3, startTime: '11:30', endTime: '13:30' }, // Hawa Idrissa
    // Jeudi
    { classroomId: class1A.id, subjectCode: 'MOD-05', profPhone: '77715165', dayOfWeek: 4, startTime: '07:30', endTime: '09:30' }, // Sinaly Ousmane
    { classroomId: class1A.id, subjectCode: 'GEN-ECM', profPhone: '79036755', dayOfWeek: 4, startTime: '09:30', endTime: '11:30' }, // Sekou Konta
    { classroomId: class1A.id, subjectCode: 'MOD-17', profPhone: '70377149', dayOfWeek: 4, startTime: '11:30', endTime: '13:30' }, // Mahamadou Seyba Kondo
    // Vendredi
    { classroomId: class1A.id, subjectCode: 'GEN-EPS', profPhone: '77414845', dayOfWeek: 5, startTime: '07:30', endTime: '09:30' }, // Souleymane Ongoiba
    { classroomId: class1A.id, subjectCode: 'MOD-22', profPhone: '75203130', dayOfWeek: 5, startTime: '09:30', endTime: '11:30' }, // Alkassou Youssouf
    // Samedi
    { classroomId: class1A.id, subjectCode: 'MOD-15', profPhone: '76146167', dayOfWeek: 6, startTime: '08:00', endTime: '12:00' }, // Djibrilla Maiga

    // ─── 2ème Année Élevage (2ème E) ─────────────────────────────────────────
    // Lundi
    { classroomId: class2E.id, subjectCode: 'MOD-18', profPhone: '79244239', dayOfWeek: 1, startTime: '07:30', endTime: '09:30' }, // Ousmane Alhassane
    { classroomId: class2E.id, subjectCode: 'MOD-19', profPhone: '94962231', dayOfWeek: 1, startTime: '09:30', endTime: '11:30' }, // Abdoul Naser Maiga
    { classroomId: class2E.id, subjectCode: 'GEN-FR', profPhone: '76051693', dayOfWeek: 1, startTime: '11:30', endTime: '13:30' }, // Yacouba Alassane
    // Mardi
    { classroomId: class2E.id, subjectCode: 'MOD-09', profPhone: '93235544', dayOfWeek: 2, startTime: '07:30', endTime: '09:30' }, // Ahmaou Aliou Maiga
    { classroomId: class2E.id, subjectCode: 'MOD-20', profPhone: '77507374', dayOfWeek: 2, startTime: '09:30', endTime: '11:30' }, // Abdoul Naser Touré
    { classroomId: class2E.id, subjectCode: 'GEN-ANG', profPhone: '75731855', dayOfWeek: 2, startTime: '11:30', endTime: '13:30' }, // Aguissa Issoufi
    // Mercredi
    { classroomId: class2E.id, subjectCode: 'MOD-23', profPhone: '73372508', dayOfWeek: 3, startTime: '07:30', endTime: '09:30' }, // Abdoulaye Youssouf Yana Touré
    { classroomId: class2E.id, subjectCode: 'MOD-18', profPhone: '79244239', dayOfWeek: 3, startTime: '09:30', endTime: '11:30' }, // Ousmane Alhassane
    { classroomId: class2E.id, subjectCode: 'GEN-MATH', profPhone: '75415846', dayOfWeek: 3, startTime: '11:30', endTime: '13:30' }, // Abdoulaye N'diaye
    // Jeudi
    { classroomId: class2E.id, subjectCode: 'MOD-25', profPhone: '76051476', dayOfWeek: 4, startTime: '07:30', endTime: '09:30' }, // Ibrahim Ag Mohamed
    { classroomId: class2E.id, subjectCode: 'MOD-26', profPhone: '73182933', dayOfWeek: 4, startTime: '09:30', endTime: '11:30' }, // Hawa Idrissa
    { classroomId: class2E.id, subjectCode: 'MOD-10', profPhone: '78746148', dayOfWeek: 4, startTime: '11:30', endTime: '13:30' }, // Abdrhamane Abdoulaye
    // Vendredi
    { classroomId: class2E.id, subjectCode: 'GEN-EPS', profPhone: '77414845', dayOfWeek: 5, startTime: '07:30', endTime: '09:30' }, // Souleymane Ongoiba
    { classroomId: class2E.id, subjectCode: 'GEN-ECM', profPhone: '79036755', dayOfWeek: 5, startTime: '09:30', endTime: '11:30' }, // Sekou Konta
    // Samedi
    { classroomId: class2E.id, subjectCode: 'MOD-18', profPhone: '79244239', dayOfWeek: 6, startTime: '08:00', endTime: '12:00' }, // Ousmane Alhassane (TP Pastorale)

    // ─── BT2 Entreprise Agricole ──────────────────────────────────────────────
    // Lundi
    { classroomId: classBT2.id, subjectCode: 'MOD-30', profPhone: '78883216', dayOfWeek: 1, startTime: '07:30', endTime: '09:30' }, // Sidi Kalane (Gestion ent.)
    { classroomId: classBT2.id, subjectCode: 'MOD-24', profPhone: '78883216', dayOfWeek: 1, startTime: '09:30', endTime: '11:30' }, // Sidi Kalane (Compta)
    { classroomId: classBT2.id, subjectCode: 'MOD-21', profPhone: '76146167', dayOfWeek: 1, startTime: '11:30', endTime: '13:30' }, // Djibrilla Maiga (Récolte)
    // Mardi
    { classroomId: classBT2.id, subjectCode: 'MOD-27', profPhone: '75316181', dayOfWeek: 2, startTime: '07:30', endTime: '09:30' }, // Ibrahim Hamidou (GRH)
    { classroomId: classBT2.id, subjectCode: 'MOD-28', profPhone: '75316181', dayOfWeek: 2, startTime: '09:30', endTime: '11:30' }, // Ibrahim Hamidou (Matériel)
    { classroomId: classBT2.id, subjectCode: 'MOD-29', profPhone: '78883216', dayOfWeek: 2, startTime: '11:30', endTime: '13:30' }, // Sidi Kalane (Projet)
    // Mercredi
    { classroomId: classBT2.id, subjectCode: 'MOD-12', profPhone: '93235544', dayOfWeek: 3, startTime: '07:30', endTime: '09:30' }, // Ahmaou Aliou Maiga (Prot. végétaux)
    { classroomId: classBT2.id, subjectCode: 'MOD-11', profPhone: '78746148', dayOfWeek: 3, startTime: '09:30', endTime: '11:30' }, // Abdrhamane Abdoulaye (Sols)
    { classroomId: classBT2.id, subjectCode: 'MOD-04', profPhone: '76051476', dayOfWeek: 3, startTime: '11:30', endTime: '13:30' }, // Ibrahim Ag Mohamed (Topo)
    // Jeudi
    { classroomId: classBT2.id, subjectCode: 'MOD-31', profPhone: '75316181', dayOfWeek: 4, startTime: '07:30', endTime: '09:30' }, // Ibrahim Hamidou (Emploi)
    { classroomId: classBT2.id, subjectCode: 'MOD-25', profPhone: '76051476', dayOfWeek: 4, startTime: '09:30', endTime: '11:30' }, // Ibrahim Ag Mohamed (Info)
    { classroomId: classBT2.id, subjectCode: 'GEN-FR', profPhone: '76051693', dayOfWeek: 4, startTime: '11:30', endTime: '13:30' }, // Yacouba Alassane
    // Vendredi
    { classroomId: classBT2.id, subjectCode: 'GEN-ANG', profPhone: '75731855', dayOfWeek: 5, startTime: '07:30', endTime: '09:30' }, // Aguissa Issoufi
    { classroomId: classBT2.id, subjectCode: 'MOD-22', profPhone: '75203130', dayOfWeek: 5, startTime: '09:30', endTime: '11:30' }, // Alkassou Youssouf
    // Samedi
    { classroomId: classBT2.id, subjectCode: 'MOD-32', profPhone: '78883216', dayOfWeek: 6, startTime: '08:00', endTime: '12:00' }  // Sidi Kalane (Stage)
  ];

  let ttCount = 0;
  for (const item of timetableEntries) {
    const sId = subjectByCode.get(item.subjectCode);
    const pId = getProfId(item.profPhone, ttCount % teachers.length);
    if (!sId || !pId) continue;

    await prisma.timetable.create({
      data: {
        tenantId: school.id,
        classroomId: item.classroomId,
        subjectId: sId,
        employeeId: pId,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime
      }
    });
    ttCount++;
  }
  console.log(`✅ ${ttCount} créneaux d'emplois du temps insérés !`);

  // 6. Insertion d'une promotion complète d'élèves
  console.log('🧑‍🎓 Insertion des promotions d\'élèves réels de Gao...');

  const realStudentsList = [
    // 1ère A
    { classId: class1A.id, fn: 'Hamidou', ln: 'Maïga', g: Gender.MALE, dob: '2006-03-14', p: 'Aliou Maïga', ph: '76112233' },
    { classId: class1A.id, fn: 'Aïchata', ln: 'Touré', g: Gender.FEMALE, dob: '2006-07-22', p: 'Ousmane Touré', ph: '76112234' },
    { classId: class1A.id, fn: 'Mahamane', ln: 'Cissé', g: Gender.MALE, dob: '2005-11-05', p: 'Boubacar Cissé', ph: '76112235' },
    { classId: class1A.id, fn: 'Fadimata', ln: 'Walet Mohamed', g: Gender.FEMALE, dob: '2006-01-18', p: 'Mohamed Ag Rhissa', ph: '76112236' },
    { classId: class1A.id, fn: 'Issa', ln: 'Diallo', g: Gender.MALE, dob: '2005-09-30', p: 'Amadou Diallo', ph: '76112237' },
    { classId: class1A.id, fn: 'Mariam', ln: 'Traoré', g: Gender.FEMALE, dob: '2006-04-12', p: 'Bakary Traoré', ph: '76112238' },
    { classId: class1A.id, fn: 'Harouna', ln: 'Konta', g: Gender.MALE, dob: '2005-12-08', p: 'Sekou Konta', ph: '76112239' },
    { classId: class1A.id, fn: 'Zeinabou', ln: 'Almoustapha', g: Gender.FEMALE, dob: '2006-06-25', p: 'Almoustapha Touré', ph: '76112240' },
    { classId: class1A.id, fn: 'Abdoulaye', ln: 'Sangaré', g: Gender.MALE, dob: '2005-08-19', p: 'Modibo Sangaré', ph: '76112241' },
    { classId: class1A.id, fn: 'Fatoumata', ln: 'Dembélé', g: Gender.FEMALE, dob: '2006-02-14', p: 'Salif Dembélé', ph: '76112242' },

    // 2ème E (Élevage)
    { classId: class2E.id, fn: 'Moussa', ln: 'Alhassane', g: Gender.MALE, dob: '2004-10-10', p: 'Alhassane Agaly', ph: '77223344' },
    { classId: class2E.id, fn: 'Aminata', ln: 'Bocoum', g: Gender.FEMALE, dob: '2005-05-17', p: 'Ibrahima Bocoum', ph: '77223345' },
    { classId: class2E.id, fn: 'Oumar', ln: 'Dicko', g: Gender.MALE, dob: '2004-12-21', p: 'Hamidou Dicko', ph: '77223346' },
    { classId: class2E.id, fn: 'Nana', ln: 'Maïga', g: Gender.FEMALE, dob: '2005-03-03', p: 'Soumeylou Maïga', ph: '77223347' },
    { classId: class2E.id, fn: 'Bakary', ln: 'Coulibaly', g: Gender.MALE, dob: '2004-07-15', p: 'Drissa Coulibaly', ph: '77223348' },
    { classId: class2E.id, fn: 'Kadiatou', ln: 'Sidibé', g: Gender.FEMALE, dob: '2005-08-09', p: 'Makan Sidibé', ph: '77223349' },
    { classId: class2E.id, fn: 'Mohamed', ln: 'Ag Ibrahim', g: Gender.MALE, dob: '2004-02-28', p: 'Ibrahim Ag Rhissa', ph: '77223350' },
    { classId: class2E.id, fn: 'Safiatou', ln: 'Koné', g: Gender.FEMALE, dob: '2005-11-12', p: 'Adama Koné', ph: '77223351' },

    // BT2 Entreprise Agricole
    { classId: classBT2.id, fn: 'Abdoulaye', ln: 'Touré', g: Gender.MALE, dob: '2002-04-10', p: 'Youssouf Touré', ph: '78334455' },
    { classId: classBT2.id, fn: 'Ramatou', ln: 'Maïga', g: Gender.FEMALE, dob: '2003-09-14', p: 'Mahamane Maïga', ph: '78334456' },
    { classId: classBT2.id, fn: 'Alassane', ln: 'Ibrahim', g: Gender.MALE, dob: '2002-12-05', p: 'Ibrahim Alassane', ph: '78334457' },
    { classId: classBT2.id, fn: 'Halimatou', ln: 'Cissé', g: Gender.FEMALE, dob: '2003-06-20', p: 'Amadou Cissé', ph: '78334458' },
    { classId: classBT2.id, fn: 'Cheick Oumar', ln: 'Diallo', g: Gender.MALE, dob: '2002-01-30', p: 'Mamadou Diallo', ph: '78334459' },
    { classId: classBT2.id, fn: 'Bintou', ln: 'Diarra', g: Gender.FEMALE, dob: '2003-08-16', p: 'Sekou Diarra', ph: '78334460' }
  ];

  let studentIdx = 1;
  for (const s of realStudentsList) {
    const studentNum = `STU-CFP-2025-${String(studentIdx + 15).padStart(3, '0')}`;
    let student = await prisma.student.findUnique({ where: { studentNumber: studentNum } });

    if (!student) {
      student = await prisma.student.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          studentNumber: studentNum,
          firstName: s.fn,
          lastName: s.ln,
          gender: s.g,
          dateOfBirth: new Date(s.dob),
          nationalId: `NIN-GAO-${studentIdx + 1000}`,
          parentName: s.p,
          parentPhone: `+223 ${s.ph.replace(/(\d{2})/g, '$1 ').trim()}`,
          parentEmail: `parent.${s.ln.toLowerCase().replace(/[^a-z]/g, '')}@example.ml`,
          parentRelationship: 'Parent',
          isActive: true
        }
      });

      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classroomId: s.classId,
          academicYearId: academicYear.id,
          status: EnrollmentStatus.ACTIVE
        }
      });

      // Création de facture de scolarité
      const invoiceNumber = `FAC-2025-${String(studentIdx + 15).padStart(4, '0')}`;
      const tuitionFee = 150000; // 150 000 FCFA / an
      const isPaid = studentIdx % 2 === 0;

      const inv = await prisma.invoice.create({
        data: {
          tenantId: school.id,
          studentId: student.id,
          invoiceNumber,
          title: `Frais de scolarité 2025-2026 - ${s.fn} ${s.ln}`,
          amount: tuitionFee,
          status: isPaid ? 'PAID' : 'PARTIAL',
          dueDate: new Date('2026-03-31'),
          paidDate: isPaid ? new Date('2025-10-15') : null,
          paymentMethod: 'ESPECES'
        }
      });

      // Paiement enregistré
      await prisma.payment.create({
        data: {
          tenantId: school.id,
          invoiceId: inv.id,
          amount: isPaid ? tuitionFee : 75000,
          method: 'ESPECES',
          reference: `REC-${invoiceNumber}`,
          notes: isPaid ? 'Règlement total scolarité' : '1ère tranche scolarité'
        }
      });

      studentIdx++;
    }
  }
  console.log(`✅ ${studentIdx - 1} élèves créés avec inscriptions et factures !`);

  // 7. Cahier de textes (LessonLog) pour nourrir le tableau utilitaire des heures
  console.log('📖 Remplissage des cours effectués (Cahier de textes / LessonLog)...');
  const pastLessons = [
    { classId: class1A.id, sCode: 'GEN-FR', pPhone: '76051693', h: 2, title: 'Techniques de communication écrite', content: 'Rédaction du rapport de stage et correspondance administrative.' },
    { classId: class1A.id, sCode: 'MOD-03', pPhone: '74737548', h: 2, title: 'Anatomie végétale comparée', content: 'Structure tissulaire et appareils reproducteurs des spermatophytes.' },
    { classId: class1A.id, sCode: 'MOD-06', pPhone: '78746148', h: 2, title: 'Granulométrie des sols du Sahel', content: 'Analyse physique et perméabilité des sols alluvionnaires de Gao.' },
    { classId: class1A.id, sCode: 'MOD-13', pPhone: '76146167', h: 2, title: 'Préparation des planches de semis', content: 'Semis en ligne et dosage des engrais organiques compostés.' },
    { classId: class2E.id, sCode: 'MOD-18', pPhone: '79244239', h: 3, title: 'Embouche bovine intensive', content: 'Rationnement alimentaire à base de fanes d\'arachide et tourteaux de coton.' },
    { classId: class2E.id, sCode: 'MOD-09', pPhone: '93235544', h: 2, title: 'Sécurité d\'épandage des pesticides', content: 'Normes de protection individuelle EPI et délais avant récolte.' },
    { classId: classBT2.id, sCode: 'MOD-30', pPhone: '78883216', h: 2, title: 'Calcul des marges brutes de campagne', content: 'Comptabilité analytique d\'exploitation maraîchère sur 1 hectare.' },
    { classId: classBT2.id, sCode: 'MOD-27', pPhone: '75316181', h: 2, title: 'Contrat saisonnier agricole', content: 'Législation du travail malien et gestion des ouvriers saisonniers.' }
  ];

  for (let i = 0; i < pastLessons.length; i++) {
    const l = pastLessons[i];
    const sId = subjectByCode.get(l.sCode);
    const pId = getProfId(l.pPhone, i % teachers.length);
    if (!sId || !pId) continue;

    const lessonDate = new Date();
    lessonDate.setDate(lessonDate.getDate() - (i + 1));

    await prisma.lessonLog.create({
      data: {
        tenantId: school.id,
        classroomId: l.classId,
        subjectId: sId,
        employeeId: pId,
        date: lessonDate,
        title: l.title,
        content: l.content,
        homework: 'Compte-rendu de séance à rendre au cours suivant.',
        hoursCount: l.h,
        status: 'COMPLETED'
      }
    });
  }
  console.log(`✅ ${pastLessons.length} séances de cours inscrites au cahier de textes !`);

  console.log('🎉 Synchronisation globale des données de base CFP-PAS terminée avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'intégration :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
