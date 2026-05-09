import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const SURNAMES = ['Traoré', 'Koné', 'Diarra', 'Keïta', 'Coulibaly', 'Sissoko', 'Sow', 'Diallo', 'Maïga', 'Sidibé', 'Touré', 'Dembélé', 'Haidara', 'Sangaré', 'Doumbia', 'Ballo', 'Cissé', 'Ndiaye', 'Tounkara', 'Kanté'];
const FIRSTNAMES_M = ['Moussa', 'Ibrahim', 'Oumar', 'Adama', 'Abdoulaye', 'Modibo', 'Amadou', 'Sekou', 'Bakary', 'Yaya', 'Issa', 'Boubacar', 'Mahamadou', 'Drissa', 'Cheick', 'Lamine', 'Seydou', 'Souleymane', 'Tiémoko', 'Harouna'];
const FIRSTNAMES_F = ['Fatoumata', 'Mariam', 'Awa', 'Kadidia', 'Oumou', 'Sali', 'Assétou', 'Rokia', 'Aminata', 'Djénéba', 'Fanta', 'Hawa', 'Kadiatou', 'Sira', 'Alimatou', 'Bintou', 'Safiatou', 'Rokiatou', 'Salimatou', 'Nana'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'sahel_prod_seed_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🚀 DÉMARRAGE DU PEUPLEMENT SERVEUR...');
    const pass = await bcrypt.hash('pass123', 10);

    // 1. Création des Écoles
    const schools = [];
    for (let i = 1; i <= 2; i++) {
      const s = await prisma.school.upsert({
        where: { code: `SCH-PROD-00${i}` },
        update: {},
        create: {
          name: i === 1 ? 'Lycée Technique de Bamako' : 'Groupe Scolaire Horizon',
          code: `SCH-PROD-00${i}`,
          address: `Quartier ${i === 1 ? 'du Fleuve' : 'Sébénikoro'}, Bamako`,
          city: 'Bamako',
          country: 'Mali',
          phoneNumber: `+223 20 22 00 0${i}`,
          email: `contact@school${i}.ml`,
          type: 'LYCEE',
          isSetupComplete: true,
          primaryColor: i === 1 ? '#4f8ef7' : '#10b981'
        }
      });
      schools.push(s);
    }

    for (const school of schools) {
      const campus = await prisma.campus.create({
        data: { tenantId: school.id, name: 'Campus Principal', address: 'Centre Ville', city: 'Bamako', region: 'Bamako', phoneNumber: school.phoneNumber }
      });

      const year = await prisma.academicYear.create({
        data: { tenantId: school.id, name: '2024-2025', startDate: new Date('2024-09-01'), endDate: new Date('2025-07-31'), isActive: true }
      });

      const levels = ['10ème', '11ème', '12ème'];
      for (const level of levels) {
        const cl = await prisma.classroom.create({
          data: { tenantId: school.id, campusId: campus.id, academicYearId: year.id, name: `${level} A`, level, maxCapacity: 50 }
        });

        // 10 élèves par classe
        for (let k = 0; k < 10; k++) {
            const isMale = Math.random() > 0.5;
            const firstName = isMale ? FIRSTNAMES_M[Math.floor(Math.random() * FIRSTNAMES_M.length)] : FIRSTNAMES_F[Math.floor(Math.random() * FIRSTNAMES_F.length)];
            const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
            
            await prisma.student.create({
              data: {
                tenantId: school.id, campusId: campus.id,
                studentNumber: `STU-${school.code}-${level}-${k}`,
                firstName, lastName, gender: isMale ? 'MALE' : 'FEMALE',
                dateOfBirth: new Date('2008-01-01'), nationalId: 'ML-' + Math.random().toString(36).substring(7).toUpperCase(),
                parentName: 'Parent Test', parentPhone: '+223 70000000', parentEmail: `p${k}@test.com`, parentRelationship: 'FATHER',
                enrollments: { create: { classroomId: cl.id, academicYearId: year.id } }
              }
            });
        }
      }
    }

    return NextResponse.json({ message: 'Peuplement de production terminé avec succès !' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
