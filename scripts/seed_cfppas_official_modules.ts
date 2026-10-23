import { PrismaClient, Gender, EmployeeType, ContractType, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du peuplement du référentiel officiel CFPPAS...');

  // 1. Trouver l'école CFPPAS
  const school = await prisma.school.findFirst({
    where: { OR: [{ code: 'CFPPAS' }, { name: { contains: 'CFP-PAS' } }] },
    include: { campuses: true }
  });

  if (!school) {
    console.error('❌ École CFPPAS introuvable.');
    return;
  }
  console.log(`✅ École trouvée : ${school.name} (${school.id})`);

  let campus = school.campuses[0];
  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        tenantId: school.id,
        name: 'Campus Principal Gao',
        address: 'Quartier Château, Route de Bourem',
        city: 'Gao',
        region: 'Gao',
        phoneNumber: '+223 70 12 34 56',
        managerName: 'Ousmane Maïga'
      }
    });
  }

  // 2. Année académique
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

  // 3. Départements
  let deptPedago = await prisma.department.findFirst({
    where: { tenantId: school.id, code: 'PED' }
  });
  if (!deptPedago) {
    deptPedago = await prisma.department.create({
      data: { tenantId: school.id, name: 'Pédagogie Agro-Pastorale', code: 'PED' }
    });
  }

  // 4. Classes réelles (Photo 2) : 1ère A (Agro-Pastorale) et 2ème E (Élevage)
  const realClasses = [
    { name: '1ère Année Agro-Pastorale (1ère A)', level: '1ère Année', stream: 'Agro-Pastorale', code: '1A' },
    { name: '2ème Année Élevage (2ème E)', level: '2ème Année', stream: 'Élevage', code: '2E' },
  ];

  const classroomMap = new Map<string, any>();
  for (const c of realClasses) {
    let cls = await prisma.classroom.findFirst({
      where: { tenantId: school.id, name: c.name }
    });
    if (!cls) {
      cls = await prisma.classroom.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          academicYearId: academicYear.id,
          name: c.name,
          level: c.level,
          stream: c.stream,
          maxCapacity: 35
        }
      });
      console.log(`✅ Classe créée : ${c.name}`);
    }
    classroomMap.set(c.code, cls);
  }

  // 5. Modules réels d'après les intercalaires (Photo 3/4)
  const realModules = [
    { name: "Soins d'hygiène et de santé aux animaux", code: 'SHSA', coefficient: 2.5 },
    { name: 'Gestion de Pâturage', code: 'GPAT', coefficient: 2.0 },
    { name: 'Biosécurité en élevage', code: 'BIOSEC', coefficient: 2.0 },
    { name: 'Les pesticides et leurs utilisations', code: 'PEST', coefficient: 1.5 },
    { name: 'Facteurs socio-économiques des productions animales', code: 'FSEPA', coefficient: 1.5 },
    { name: 'Protection de l\'environnement', code: 'PENV', coefficient: 1.0 },
    { name: 'Informatique à la ferme & données numériques', code: 'INF', coefficient: 1.0 },
    { name: 'Anglais technique', code: 'ANG-TECH', coefficient: 1.0 },
    { name: 'Éducation civique et morale', code: 'ECM', coefficient: 1.0 },
    { name: 'Semis et techniques culturales', code: 'STC', coefficient: 2.0 }
  ];

  const subjectMap = new Map<string, any>();
  for (const m of realModules) {
    let sub = await prisma.subject.findFirst({
      where: { tenantId: school.id, code: m.code }
    });
    if (!sub) {
      sub = await prisma.subject.create({
        data: {
          tenantId: school.id,
          name: m.name,
          code: m.code,
          coefficient: m.coefficient
        }
      });
      console.log(`✅ Module créé : ${m.name} (${m.code})`);
    }
    subjectMap.set(m.code, sub);
  }

  // 6. Formateurs réels avec taux horaire vacataire officiel de 1 750 FCFA
  const realTeachers = [
    {
      firstName: 'Aguissa',
      lastName: 'Touré',
      email: 'aguissa.toure@cfppas-gao.ml',
      phone: '70110001',
      subjectCode: 'ANG-TECH'
    },
    {
      firstName: 'Mamadou Aliou',
      lastName: 'Maïga',
      email: 'mamadou.aliou@cfppas-gao.ml',
      phone: '70110002',
      subjectCode: 'PEST'
    },
    {
      firstName: 'Abdoulaye',
      lastName: 'Maïga',
      email: 'abdoulaye.maiga@cfppas-gao.ml',
      phone: '70110003',
      subjectCode: 'ECM'
    },
    {
      firstName: 'Djibrilla',
      lastName: 'Cissé',
      email: 'djibrilla.cisse@cfppas-gao.ml',
      phone: '70110004',
      subjectCode: 'STC'
    },
    {
      firstName: 'Dr. Ousmane',
      lastName: 'Sissoko',
      email: 'dr.sissoko@cfppas-gao.ml',
      phone: '70110005',
      subjectCode: 'SHSA'
    }
  ];

  const teacherMap = new Map<string, any>();
  for (const t of realTeachers) {
    let emp = await prisma.employee.findFirst({
      where: { tenantId: school.id, email: t.email }
    });
    if (!emp) {
      emp = await prisma.employee.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          departmentId: deptPedago.id,
          employeeNumber: `VAC-CFP-${Math.floor(100 + Math.random() * 900)}`,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
          phoneNumber: t.phone,
          dateOfBirth: new Date(1985, 4, 12),
          gender: Gender.MALE,
          hireDate: new Date('2025-10-01'),
          employeeType: EmployeeType.TEACHER,
          isActive: true
        }
      });

      // Contrat Vacataire avec taux horaire 1 750 FCFA/heure
      await prisma.contract.create({
        data: {
          tenantId: school.id,
          employeeId: emp.id,
          contractType: ContractType.TEMPORARY,
          startDate: new Date('2025-10-01'),
          baseSalary: 0,
          hourlyRate: 1750, // 1 750 FCFA / h selon document officiel
          status: ContractStatus.ACTIVE
        }
      });
      console.log(`✅ Formateur vacataire créé : ${t.firstName} ${t.lastName} (1 750 FCFA/h)`);
    }
    teacherMap.set(t.subjectCode, emp);
  }

  // 7. Enregistrement des séances réelles du cahier de texte (Photo 2 & Photo 4)
  const class1A = classroomMap.get('1A');
  const class2E = classroomMap.get('2E');

  const realLogs = [
    // Photo 4 : Santé animale (Dr. Sissoko)
    {
      cls: class1A,
      sub: subjectMap.get('SHSA'),
      teacher: teacherMap.get('SHSA'),
      date: new Date('2025-10-06T10:00:00Z'),
      title: 'Soins d\'hygiène et de santé aux animaux — Énoncé de la compétence : Soin',
      content: 'Les soins préventifs, les soins curatifs, les soins palliatifs.',
      hours: 2,
      status: 'COMPLETED'
    },
    {
      cls: class1A,
      sub: subjectMap.get('SHSA'),
      teacher: teacherMap.get('SHSA'),
      date: new Date('2025-10-07T07:45:00Z'),
      title: 'Hygiène : corporelle, alimentaire, de vie, publique et environnementale',
      content: 'Principes d\'hygiène fondamentale en milieu d\'élevage sahélien.',
      hours: 2,
      status: 'COMPLETED'
    },
    {
      cls: class1A,
      sub: subjectMap.get('SHSA'),
      teacher: teacherMap.get('SHSA'),
      date: new Date('2025-10-07T15:00:00Z'),
      title: 'La Santé, la maladie, ses dimensions principales',
      content: 'Approche globale de l\'état de santé du cheptel et détection précoce.',
      hours: 2,
      status: 'COMPLETED'
    },
    {
      cls: class1A,
      sub: subjectMap.get('SHSA'),
      teacher: teacherMap.get('SHSA'),
      date: new Date('2025-10-12T07:45:00Z'),
      title: 'Maladie Aiguë, Maladie Chronique — La biosécurité en élevage',
      content: 'Différenciation des pathologies et mesures de prophylaxie.',
      hours: 2,
      status: 'COMPLETED'
    },
    {
      cls: class1A,
      sub: subjectMap.get('SHSA'),
      teacher: teacherMap.get('SHSA'),
      date: new Date('2025-10-12T15:00:00Z'),
      title: 'Les éléments de la biosécurité',
      content: 'Protocoles de désinfection, quarantaine et gestion des effluents.',
      hours: 2,
      status: 'COMPLETED'
    },
    // Photo 2 : Aguissa (Anglais technique) - Exécuté
    {
      cls: class1A,
      sub: subjectMap.get('ANG-TECH'),
      teacher: teacherMap.get('ANG-TECH'),
      date: new Date('2025-10-13T07:45:00Z'),
      title: 'Anglais technique : Vocabulaire agro-pastoral de base',
      content: 'Terminology of veterinary tools and livestock breeding in English.',
      hours: 2,
      status: 'COMPLETED'
    },
    // Photo 2 : Abdoulaye Maïga (ECM) - Absent
    {
      cls: class1A,
      sub: subjectMap.get('ECM'),
      teacher: teacherMap.get('ECM'),
      date: new Date('2025-10-13T10:00:00Z'),
      title: 'Réévaluation : Éducation civique et morale',
      content: 'Séance programmée — Enseignant absent (P) Absent.',
      hours: 0, // Absent -> 0h comptabilisée
      status: 'ABSENT'
    },
    // Photo 2 : Mamadou Aliou Maïga (Pesticides) - Exécuté
    {
      cls: class2E,
      sub: subjectMap.get('PEST'),
      teacher: teacherMap.get('PEST'),
      date: new Date('2025-10-28T07:45:00Z'),
      title: 'Les pesticides et leurs utilisations sécurisées',
      content: 'Dosage, Equipements de Protection Individuelle (EPI) et délais avant récolte.',
      hours: 2,
      status: 'COMPLETED'
    },
    // Photo 2 : Djibrilla (Semis) - Absent
    {
      cls: class1A,
      sub: subjectMap.get('STC'),
      teacher: teacherMap.get('STC'),
      date: new Date('2025-10-28T10:00:00Z'),
      title: 'Techniques de semis en zone semi-aride',
      content: 'Séance programmée — Enseignant absent (P) Absent.',
      hours: 0,
      status: 'ABSENT'
    }
  ];

  for (const log of realLogs) {
    if (!log.cls || !log.sub || !log.teacher) continue;
    
    // Vérifier si la séance existe déjà
    const existing = await prisma.lessonLog.findFirst({
      where: {
        tenantId: school.id,
        classroomId: log.cls.id,
        subjectId: log.sub.id,
        employeeId: log.teacher.id,
        date: log.date
      }
    });

    if (!existing) {
      await prisma.lessonLog.create({
        data: {
          tenantId: school.id,
          classroomId: log.cls.id,
          subjectId: log.sub.id,
          employeeId: log.teacher.id,
          date: log.date,
          title: log.title,
          content: log.content,
          hoursCount: log.hours,
          status: log.status
        }
      });
      console.log(`  📝 Séance enregistrée : ${log.title} (${log.hours}h - ${log.status})`);
    }
  }

  console.log('🎉 Référentiel officiel du CFPPAS injecté avec succès !');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
