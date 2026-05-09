import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Administrateur' }, { status: 403 });
  }

  try {
    const schools = await prisma.school.findMany({
      include: {
        campuses: {
          include: {
            _count: { select: { students: true, classrooms: true } }
          }
        },
        _count: { select: { campuses: true, academicYears: true } },
        academicYears: { where: { isActive: true }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = await Promise.all(schools.map(async (school) => {
      const campusIds = school.campuses.map(c => c.id);
      const [studentCount, employeeCount, financialData] = await Promise.all([
        prisma.student.count({ where: { campusId: { in: campusIds } } }),
        prisma.employee.count({ where: { tenantId: school.id } }),
        prisma.invoice.groupBy({
          by: ['status'],
          where: { tenantId: school.id },
          _sum: { amount: true },
          _count: true
        })
      ]);

      const totalInvoiced = financialData.reduce((s, g) => s + (g._sum.amount || 0), 0);
      const totalPaid = financialData.find(g => g.status === 'PAID')?._sum.amount || 0;

      return {
        ...school,
        stats: {
          studentCount,
          employeeCount,
          classroomCount: school.campuses.reduce((s, c) => s + c._count.classrooms, 0),
          activeYear: school.academicYears[0]?.name || null,
          collectionRate: totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0,
          totalInvoiced,
          totalPaid
        }
      };
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('[SCHOOLS_GET]', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des écoles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name, code, type, email, phoneNumber, address, city, country, motto, plan,
      adminEmail, adminPassword, adminFirstName, adminLastName
    } = body;

    if (!name || !code || !type || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Nom, code, type et informations admin sont obligatoires' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name,
          code,
          type,
          email: email || '',
          phoneNumber: phoneNumber || '',
          address: address || '',
          city: city || '',
          country: country || 'Mali',
          motto,
          plan: plan || 'STARTER',
          isSetupComplete: false,
        }
      });

      await tx.user.create({
        data: {
          tenantId: school.id,
          email: adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          firstName: adminFirstName || 'Admin',
          lastName: adminLastName || name,
          role: 'SCHOOL_ADMIN',
          isActive: true
        }
      });

      return school;
    });

    // Send onboarding welcome email (non-blocking — if Resend is configured)
    try {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail({
        to: adminEmail.toLowerCase().trim(),
        subject: `Bienvenue sur SchoolERP Pro — ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: #0f172a; color: white; padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">🎓 Bienvenue sur SchoolERP Pro</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.7; font-size: 14px;">Votre établissement est prêt</p>
            </div>
            <div style="padding: 32px; line-height: 1.7; color: #334155;">
              <p>Bonjour <strong>${adminFirstName || 'Administrateur'} ${adminLastName || ''}</strong>,</p>
              <p>Votre compte administrateur pour <strong>${name}</strong> vient d'être créé sur SchoolERP Pro.</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e293b;">Vos identifiants de connexion :</p>
                <p style="margin: 4px 0;">📧 Email : <strong>${adminEmail}</strong></p>
                <p style="margin: 4px 0;">🔑 Mot de passe temporaire : <strong>${adminPassword}</strong></p>
              </div>
              <p style="color: #f43f5e; font-size: 13px;">⚠️ Pour des raisons de sécurité, veuillez changer votre mot de passe dès votre première connexion.</p>
              <div style="text-align: center; margin-top: 28px;">
                <a href="https://gestion-scolaire-livid.vercel.app/login" style="background: #4f8ef7; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder à mon espace →</a>
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
              © ${new Date().getFullYear()} SchoolERP Pro — Ne pas répondre à cet email
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.warn('[SCHOOLS_POST] Email onboarding non envoyé:', emailError);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[SCHOOLS_POST]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Ce code d'établissement ou email admin existe déjà" }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
