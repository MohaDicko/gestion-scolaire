import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Administrateur' }, { status: 403 });
  }

  try {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: { campuses: true, academicYears: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(schools);
  } catch (error) {
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
    const { name, code, type, email, phoneNumber, address, city, country, motto } = body;

    if (!name || !code || !type) {
      return NextResponse.json({ error: 'Nom, code et type sont obligatoires' }, { status: 400 });
    }

    const school = await prisma.school.create({
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
        isSetupComplete: false,
      }
    });

    return NextResponse.json(school);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ce code d\'établissement existe déjà' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
