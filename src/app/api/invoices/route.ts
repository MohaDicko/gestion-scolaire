import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { studentId, amount, dueDate, status } = await request.json();
    
    // Simulate generation of unique invoice number if schema had one. For now we use the ID or implicitly track it.

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: '1',
        studentId,
        amount: parseFloat(amount),
        status: status || 'UNPAID',
        dueDate: new Date(dueDate),
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Invoice POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
