import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id: session.id } },
        tenantId: session.tenantId || 'SYSTEM'
      },
      include: {
        participants: {
          select: { id: true, firstName: true, lastName: true, role: true, email: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { participantIds } = await request.json();
    
    // Ensure current user is in participants
    const allIds = Array.from(new Set([...participantIds, session.id]));

    const conversation = await prisma.conversation.create({
      data: {
        tenantId: session.tenantId || 'SYSTEM',
        participants: { connect: allIds.map(id => ({ id })) }
      },
      include: {
        participants: true
      }
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
