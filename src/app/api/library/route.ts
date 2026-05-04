import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const books = await prisma.book.findMany({
      where: { tenantId: session.tenantId },
      include: {
        _count: { select: { loans: { where: { status: 'BORROWED' } } } }
      },
      orderBy: { title: 'asc' }
    });
    return NextResponse.json(books);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, author, isbn, category, totalCopies, shelfLocation } = body;

    const book = await prisma.book.create({
      data: {
        tenantId: session.tenantId,
        title,
        author,
        isbn,
        category,
        totalCopies: parseInt(totalCopies) || 1,
        availableCopies: parseInt(totalCopies) || 1,
        shelfLocation
      }
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
