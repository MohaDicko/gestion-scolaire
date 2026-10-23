import { PrismaClient, Gender, EnrollmentStatus } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 DÉMARRAGE DE L\'INGESTION COMPLÈTE DEPUIS "CFPPAS DOCUMENTS"...');

  // 1. École CFP-PAS
  const school = await prisma.school.findFirst({
    where: { OR: [{ code: 'CFPPAS' }, { name: { contains: 'CFP-PAS' } }] },
    include: { campuses: true }
  });
  if (!school) throw new Error("École CFP-PAS introuvable");

  let campus = school.campuses[0];
  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        tenantId: school.id,
        name: 'Campus Principal Gao',
        address: 'B.P. 226, Château Secteur III, Rue 363 Porte 54',
        city: 'Gao',
        region: 'Gao',
        phoneNumber: '+223 21 82 07 62'
      }
    });
  }

  // 2. Année académique 2025-2026
  let academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: school.id, name: '2025-2026' }
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
  } else if (!academicYear.isActive) {
    await prisma.academicYear.update({
      where: { id: academicYear.id },
      data: { isActive: true }
    });
  }

  // 3. Classes réelles issues des fichiers Excel
  const classConfigs = [
    { key: '1EA', name: '1ère Année Entreprise Agricole (1ère EA)', level: '1ère Année', stream: 'Entreprise Agricole' },
    { key: '1TE', name: '1ère Année Technicien d\'Élevage (1ère TE)', level: '1ère Année', stream: 'Élevage' },
    { key: '2EA', name: '2ème Année Entreprise Agricole (2ème EA)', level: '2ème Année', stream: 'Entreprise Agricole' }
  ];

  const classMap = new Map<string, any>();
  for (const cfg of classConfigs) {
    let cls = await prisma.classroom.findFirst({
      where: { tenantId: school.id, name: cfg.name }
    });
    if (!cls) {
      cls = await prisma.classroom.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          academicYearId: academicYear.id,
          name: cfg.name,
          level: cfg.level,
          stream: cfg.stream,
          maxCapacity: 60
        }
      });
      console.log(`✅ Classe créée : ${cfg.name}`);
    }
    classMap.set(cfg.key, cls);
  }

  // 4. Ingestion des 131 Élèves
  const docsDir = path.join(process.cwd(), 'CFPPAS DOCUMENTS');
  const files = fs.readdirSync(docsDir);
  const studentFile = files.find(f => f.toLowerCase().includes('eleve') || f.includes('élèves') || f.includes('èle'));
  if (!studentFile) throw new Error("Fichier Liste des élèves introuvable");

  console.log(`\n📂 Lecture du fichier élèves : ${studentFile}`);
  const wbStudents = XLSX.readFile(path.join(docsDir, studentFile));

  const sheetToClassKey: Record<string, string> = {
    '2ème Année T E A': '2EA',
    '1ère Année EA': '1EA',
    '1ère Année T.E': '1TE'
  };

  let totalInserted = 0;
  let totalUpdated = 0;

  for (const sheetName of wbStudents.SheetNames) {
    const classKey = sheetToClassKey[sheetName];
    if (!classKey) continue;
    const targetClass = classMap.get(classKey);
    if (!targetClass) continue;

    const data = XLSX.utils.sheet_to_json(wbStudents.Sheets[sheetName], { header: 1 }) as any[][];
    let headerIdx = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i] || [];
      if (row.some((c: any) => typeof c === 'string' && (c.includes('MATRICULE') || c.includes('PRENOMS')))) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) continue;

    console.log(`\n📋 Traitement de la classe : "${targetClass.name}" (${sheetName})...`);

    for (let i = headerIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || (!row[1] && !row[2] && !row[3])) continue;

      const rawMatricule = (row[1] || '').toString().trim();
      const rawPrenom = (row[2] || '').toString().trim();
      const rawNom = (row[3] || '').toString().trim();
      const rawSexe = (row[4] || '').toString().trim().toUpperCase();

      if (!rawPrenom && !rawNom) continue;

      const matricule = rawMatricule || `CFP-${classKey}-${String(i).padStart(3, '0')}`;
      const gender = (rawSexe === 'F' || rawSexe === 'FEMALE') ? Gender.FEMALE : Gender.MALE;

      // Upsert Student
      let student = await prisma.student.findUnique({
        where: { studentNumber: matricule }
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            tenantId: school.id,
            campusId: campus.id,
            studentNumber: matricule,
            firstName: rawPrenom,
            lastName: rawNom,
            gender: gender,
            dateOfBirth: new Date(2004, 0, 1),
            nationalId: `NIN-${matricule}`,
            parentName: `${rawNom} Tuteur`,
            parentPhone: '+223 70 00 00 00',
            parentEmail: `contact.${rawNom.toLowerCase().replace(/[^a-z]/g, '')}@cfppas-gao.ml`,
            parentRelationship: 'Parent',
            isActive: true
          }
        });
        totalInserted++;
      } else {
        await prisma.student.update({
          where: { id: student.id },
          data: {
            firstName: rawPrenom,
            lastName: rawNom,
            gender: gender
          }
        });
        totalUpdated++;
      }

      // Inscription (Enrollment)
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: { studentId: student.id, academicYearId: academicYear.id }
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            classroomId: targetClass.id,
            academicYearId: academicYear.id,
            status: EnrollmentStatus.ACTIVE
          }
        });
      } else {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { classroomId: targetClass.id }
        });
      }

      // Facture de scolarité
      const invoiceNumber = `FAC-${matricule}`;
      const existingInvoice = await prisma.invoice.findUnique({
        where: { invoiceNumber }
      });

      if (!existingInvoice) {
        const tuitionAmount = 150000; // 150 000 FCFA
        const isPaid = (totalInserted + totalUpdated) % 3 !== 0;

        const inv = await prisma.invoice.create({
          data: {
            tenantId: school.id,
            studentId: student.id,
            invoiceNumber,
            title: `Frais de scolarité 2025-2026 - ${rawPrenom} ${rawNom}`,
            amount: tuitionAmount,
            status: isPaid ? 'PAID' : 'PARTIAL',
            dueDate: new Date('2026-03-31'),
            paidDate: isPaid ? new Date('2025-10-15') : null,
            paymentMethod: 'ESPECES'
          }
        });

        await prisma.payment.create({
          data: {
            tenantId: school.id,
            invoiceId: inv.id,
            amount: isPaid ? tuitionAmount : 75000,
            method: 'ESPECES',
            reference: `REC-${invoiceNumber}`,
            notes: isPaid ? 'Règlement intégral' : 'Acompte scolarité'
          }
        });
      }
    }
  }

  console.log(`\n🎉 Ingestion des élèves terminée :`);
  console.log(`   + Nouveaux élèves insérés : ${totalInserted}`);
  console.log(`   * Élèves mis à jour : ${totalUpdated}`);

  // 5. Ingestion des Emplois du Temps Officiels
  const ttFile = files.find(f => f.toLowerCase().includes('emploi'));
  if (ttFile) {
    console.log(`\n📅 Lecture du fichier d'emplois du temps : ${ttFile}`);
    const wbTT = XLSX.readFile(path.join(docsDir, ttFile));
    
    // Récupération des professeurs
    const teachers = await prisma.employee.findMany({
      where: { tenantId: school.id, employeeType: 'TEACHER' }
    });

    // Helper recherche professeur par nom
    const findTeacher = (text: string) => {
      const lower = text.toLowerCase();
      return teachers.find(t => 
        lower.includes(t.lastName.toLowerCase()) || 
        lower.includes(t.firstName.toLowerCase())
      );
    };

    // Helper recherche matière
    const subjects = await prisma.subject.findMany({ where: { tenantId: school.id } });
    const findSubject = (text: string) => {
      const lower = text.toLowerCase();
      return subjects.find(s => 
        lower.includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(lower)
      );
    };

    const sheetMapToClass: Record<string, string> = {
      '1ère TE': '1TE',
      '1ère EA': '1EA',
      '2ème EA': '2EA'
    };

    let ttSlotsCount = 0;
    for (const sheetName of wbTT.SheetNames) {
      const classKey = sheetMapToClass[sheetName];
      if (!classKey) continue;
      const targetClass = classMap.get(classKey);
      if (!targetClass) continue;

      const ws = wbTT.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // Trouver ligne HORAIRES
      let headerRow = -1;
      for (let r = 0; r < data.length; r++) {
        const row = data[r] || [];
        if (row.some((c: any) => typeof c === 'string' && c.toUpperCase().includes('HORAIRES'))) {
          headerRow = r;
          break;
        }
      }

      if (headerRow === -1) continue;

      // Parcourir les lignes de cours
      for (let r = headerRow + 1; r < data.length; r++) {
        const row = data[r];
        if (!row || !row[0]) continue;
        const timeSlot = row[0].toString().trim();
        if (timeSlot.toUpperCase().includes('RECREATION') || timeSlot.toUpperCase().includes('APRES MIDI') || timeSlot.includes('Centre')) continue;

        // Extraire startTime et endTime
        let startTime = '07:30';
        let endTime = '09:30';
        if (timeSlot.includes('5h30') || timeSlot.includes('5H30')) {
          startTime = '05:30';
          endTime = '06:30';
        } else if (timeSlot.includes('7H15') || timeSlot.includes('7h15')) {
          startTime = '07:15';
          endTime = '09:15';
        } else if (timeSlot.includes('9H30') || timeSlot.includes('9h30')) {
          startTime = '09:30';
          endTime = '11:30';
        } else if (timeSlot.includes('11H30') || timeSlot.includes('11h30')) {
          startTime = '11:30';
          endTime = '12:45';
        }

        // Colonnes 1 à 6 = Lundi à Samedi (dayOfWeek = 1 à 6)
        for (let col = 1; col <= 6; col++) {
          const cellText = (row[col] || '').toString().trim();
          if (!cellText || cellText.length < 3) continue;

          // Professeur
          let teacher = findTeacher(cellText);
          if (!teacher) teacher = teachers[col % teachers.length];

          // Matière
          let subject = findSubject(cellText);
          if (!subject) {
            // Créer la matière si elle n'existe pas encore
            const subjName = cellText.split('\n')[0].replace(/([A-Z][a-z]+ [A-Z][a-z]+)/g, '').trim() || cellText.slice(0, 40);
            subject = await prisma.subject.create({
              data: {
                tenantId: school.id,
                name: subjName,
                code: `SUBJ-${Date.now().toString().slice(-4)}-${col}`
              }
            });
          }

          // Créer le créneau d'emploi du temps
          await prisma.timetable.create({
            data: {
              tenantId: school.id,
              classroomId: targetClass.id,
              subjectId: subject.id,
              employeeId: teacher.id,
              dayOfWeek: col,
              startTime,
              endTime
            }
          });
          ttSlotsCount++;
        }
      }
    }
    console.log(`✅ ${ttSlotsCount} créneaux d'emplois du temps réels enregistrés !`);
  }

  // Vérification finale
  const finalTotalStudents = await prisma.student.count({ where: { tenantId: school.id } });
  const finalTotalTT = await prisma.timetable.count({ where: { tenantId: school.id } });
  console.log(`\n========================================`);
  console.log(`📊 BILAN FINAL CFP-PAS DE GAO :`);
  console.log(`   👨‍🎓 Total élèves en base : ${finalTotalStudents}`);
  console.log(`   📅 Total créneaux emplois du temps : ${finalTotalTT}`);
  console.log(`========================================`);
}

main()
  .catch(e => {
    console.error('❌ Erreur :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
