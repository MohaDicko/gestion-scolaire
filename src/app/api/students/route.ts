import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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
    const body = await request.json();
    const uniqueNumber = `STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newStudent = await prisma.student.create({
      data: {
        tenantId: session.tenantId,
        studentNumber: uniqueNumber,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: new Date(body.dateOfBirth),
        gender: body.gender.toUpperCase(),
        nationalId: body.nationalId,
        parentName: body.parentName,
        parentPhone: body.parentPhone,
        parentEmail: body.parentEmail || '',
        parentRelationship: body.parentRelationship,
        campusId: body.campusId,
      },
    });

    return NextResponse.json({ id: newStudent.id, studentNumber: newStudent.studentNumber }, { status: 201 });
  } catch (error: any) {
    console.error('Students POST Error:', error);
    return NextResponse.json({ error: error.message || 'Error creating student' }, { status: 400 });
  }
}
