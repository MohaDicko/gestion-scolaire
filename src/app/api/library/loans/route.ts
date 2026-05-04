import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // RBAC: Library management restricted to Staff and Admins
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  try {
    const { bookId, studentId, employeeId, dueDate } = await request.json();

    if (!bookId || (!studentId && !employeeId) || !dueDate) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check availability
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book || book.availableCopies <= 0) {
        throw new Error('Livre non disponible');
      }

      // 2. Create loan
      const loan = await tx.loan.create({
        data: {
          tenantId: session.tenantId!,
          bookId,
          studentId,
          employeeId,
          dueDate: new Date(dueDate),
          status: 'BORROWED'
        }
      });

      // 3. Decrement available copies
      await tx.book.update({
        where: { id: bookId },
        data: { availableCopies: { decrement: 1 } }
      });

      return loan;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // RBAC: Library returns restricted to Staff and Admins
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STAFF'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  try {
    const { loanId, status } = await request.json(); // status: RETURNED, LOST, etc.

    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      if (!loan || loan.status !== 'BORROWED') throw new Error('Prêt invalide ou déjà retourné');

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: { status, returnDate: status === 'RETURNED' ? new Date() : null }
      });

      // If returned, increment available copies
      if (status === 'RETURNED') {
        await tx.book.update({
          where: { id: loan.bookId },
          data: { availableCopies: { increment: 1 } }
        });
      }

      return updatedLoan;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
