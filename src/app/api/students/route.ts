import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { getStudentLimit } from '@/lib/plans';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('pageNumber') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);

  try {
    const whereClause = {
      tenantId: session.tenantId,
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { studentNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {})
    };

    const [items, totalCount] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      items,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      pageNumber: page,
    });
  } catch (error) {
    console.error('Students GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const school = await prisma.school.findUnique({ where: { id: session.tenantId } });
    if (!school) return NextResponse.json({ error: 'École non trouvée' }, { status: 404 });

    const currentStudentCount = await prisma.student.count({ where: { tenantId: session.tenantId } });
    const limit = getStudentLimit(school.plan);
    
    if (currentStudentCount >= limit) {
      return NextResponse.json({ error: `Le plan ${school.plan} est limité à ${limit} élèves. Veuillez passer au niveau supérieur.` }, { status: 403 });
    }

    const body = await request.json();
    const { 
      firstName, lastName, dateOfBirth, gender, nationalId, 
      parentName, parentPhone, parentEmail, parentRelationship, campusId,
      createStudentAccount, studentEmail, studentPassword,
      createParentAccount, parentAccountPassword
    } = body;

    const uniqueNumber = `STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Student record
      const student = await tx.student.create({
        data: {
          tenantId: session.tenantId,
          studentNumber: uniqueNumber,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender: gender.toUpperCase(),
          nationalId: nationalId || '',
          parentName,
          parentPhone,
          parentEmail: parentEmail || '',
          parentRelationship,
          campusId,
        },
      });

      // 2. Create Student User account
      if (createStudentAccount) {
        const pass = await bcrypt.hash(studentPassword || uniqueNumber, 10);
        await tx.user.create({
          data: {
            tenantId: session.tenantId,
            email: studentEmail ? studentEmail.toLowerCase().trim() : `${uniqueNumber.toLowerCase()}@erp.ml`,
            password: pass,
            firstName,
            lastName,
            role: 'STUDENT',
          }
        });
      }

      // 3. Create Parent User account
      if (createParentAccount && parentEmail) {
        const pPass = await bcrypt.hash(parentAccountPassword || 'parent123', 10);
        const pNames = parentName.split(' ');
        await tx.user.create({
          data: {
            tenantId: session.tenantId,
            email: parentEmail.toLowerCase().trim(),
            password: pPass,
            firstName: pNames[0] || 'Parent',
            lastName: pNames.slice(1).join(' ') || lastName,
            role: 'PARENT',
          }
        });
      }

      return student;
    });

    return NextResponse.json({ id: result.id, studentNumber: result.studentNumber }, { status: 201 });
  } catch (error: any) {
    console.error('Students POST Error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cet email est déjà utilisé pour un compte.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Error creating student' }, { status: 400 });
  }
}
