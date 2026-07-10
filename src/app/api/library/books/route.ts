import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUniversal } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionUniversal(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');

    const books = await prisma.book.findMany({
      where: {
        tenantId: session.tenantId,
        isActive: true,
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
            { isbn: { contains: search, mode: 'insensitive' } }
          ]
        } : {})
      },
      orderBy: { title: 'asc' }
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error('[LIBRARY BOOKS GET]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUniversal(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    
    if (!data.title || !data.author) {
      return NextResponse.json({ error: 'Le titre et l\'auteur sont requis' }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        tenantId: session.tenantId,
        title: data.title,
        author: data.author,
        isbn: data.isbn || null,
        category: data.category || 'Non classé',
        totalCopies: Number(data.totalCopies) || 1,
        availableCopies: Number(data.totalCopies) || 1, // Au début, tout est dispo
        shelfLocation: data.shelfLocation || null
      }
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    console.error('[LIBRARY BOOKS POST]', error);
    return NextResponse.json({ error: 'Erreur lors de la création du livre' }, { status: 500 });
  }
}
