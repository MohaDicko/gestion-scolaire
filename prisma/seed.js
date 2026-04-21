const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Démarrage du Seeding de la base de données (Norme Malienne)...');

    // 1. Création de l'Etablissement par défaut
    const school = await prisma.school.upsert({
        where: { code: 'SCH-001' },
        update: {},
        create: {
            name: 'Lycée d\'Excellence Bamako',
            code: 'SCH-001',
            address: 'ACI 2000',
            city: 'Bamako',
            country: 'Mali',
            phoneNumber: '+223 20 00 00 00',
            email: 'contact@lycee-excellence.ml',
            type: 'LYCEE',
            drenCode: 'DREN-BKO-RG',
            isActive: true,
            isSetupComplete: true,
        },
    });
    console.log('✅ École créée:', school.name);

    // 2. Création du Campus Principal
    const campus = await prisma.campus.create({
        data: {
            tenantId: school.id,
            name: 'Campus Principal ACI',
            address: 'Rue 123, Porte 45',
            city: 'Bamako',
            region: 'District de Bamako',
            phoneNumber: '+223 20 00 00 01',
        }
    });
    console.log('✅ Campus créé:', campus.name);

    // 3. Création de l'Année Académique Active
    const academicYear = await prisma.academicYear.create({
        data: {
            tenantId: school.id,
            name: '2024-2025',
            startDate: new Date('2024-10-01T00:00:00Z'),
            endDate: new Date('2025-06-30T23:59:59Z'),
            isActive: true,
        }
    });
    console.log('✅ Année académique créée:', academicYear.name);

    // 4. Création du compte Admin (Directeur / Proviseur)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@schoolerp.com' },
        update: {},
        create: {
            tenantId: school.id,
            email: 'admin@schoolerp.com',
            password: adminPassword,
            firstName: 'Amadou',
            lastName: 'Coulibaly',
            role: 'SCHOOL_ADMIN',
            isActive: true,
        },
    });
    console.log('✅ Compte Administrateur créé:');
    console.log(`   📧 Email: admin@schoolerp.com`);
    console.log(`   🔑 Mot de passe: admin123`);

    // 5. Création de Classes (Exemples Lycée)
    await prisma.classroom.createMany({
        data: [
            { tenantId: school.id, campusId: campus.id, academicYearId: academicYear.id, name: 'Terminale Sciences Exactes 1', level: 'Terminale', stream: 'Série Sciences Exactes', maxCapacity: 45 },
            { tenantId: school.id, campusId: campus.id, academicYearId: academicYear.id, name: '11ème Lettres', level: '11ème', stream: 'Série Lettres', maxCapacity: 50 },
            { tenantId: school.id, campusId: campus.id, academicYearId: academicYear.id, name: '10ème Commune', level: '10ème', stream: 'Tronc Commun', maxCapacity: 60 }
        ]
    });
    console.log('✅ Classes générées avec succès !');

    // 6. Création de Matières
    await prisma.subject.createMany({
        data: [
            { tenantId: school.id, name: 'Mathématiques', code: 'MATH', coefficient: 4 },
            { tenantId: school.id, name: 'Physique-Chimie', code: 'PC', coefficient: 4 },
            { tenantId: school.id, name: 'Français', code: 'FRA', coefficient: 2 },
            { tenantId: school.id, name: 'Anglais', code: 'ANG', coefficient: 2 }
        ]
    });
    console.log('✅ Matières générées avec succès !');

    console.log('🎉 Seeding terminé. Le système est prêt à être testé !');
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
